import type { Card } from '../card'
import { MAX_PLAYERS, MIN_PLAYERS } from '../card'
import { evaluateHand, isFlow } from '../hand'
import { resolveShowdown, type ShowdownEntry } from '../showdown'
import type {
  GameConfig,
  GameEvent,
  GameState,
  PlayerAction,
  PlayerId,
  PlayerStatus,
  RoundOutcome,
  RoundResult,
  RoundState,
} from './types'

type Hands = Readonly<Record<PlayerId, readonly [Card, Card]>>

/** 新しいゲームを作る。設定の妥当性はここで検証する */
export function createGame(config: GameConfig): GameState {
  const { players, initialChips, anteAmount } = config

  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
    throw new RangeError(
      `プレイヤー数は ${MIN_PLAYERS}〜${MAX_PLAYERS} 人である必要があります（指定: ${players.length}）`,
    )
  }
  if (new Set(players.map((p) => p.id)).size !== players.length) {
    throw new Error('プレイヤー ID が重複しています')
  }
  if (!Number.isInteger(initialChips) || initialChips <= 0) {
    throw new RangeError('初期チップは 1 以上の整数である必要があります')
  }
  if (!Number.isInteger(anteAmount) || anteAmount <= 0) {
    throw new RangeError('場代は 1 以上の整数である必要があります')
  }
  if (initialChips < anteAmount) {
    throw new RangeError('初期チップが場代を下回っています')
  }
  if (config.endCondition.type === 'ROUNDS' && config.endCondition.count <= 0) {
    throw new RangeError('ラウンド数は 1 以上である必要があります')
  }

  const chips: Record<PlayerId, number> = {}
  for (const p of players) chips[p.id] = initialChips

  return {
    config,
    chips,
    roundNo: 0,
    carryOver: 0,
    startPlayerId: players[0]!.id,
    phase: 'IDLE',
    round: null,
    history: [],
  }
}

export function reduce(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case 'START_ROUND':
      return startRound(state, event.hands)
    case 'PLAYER_ACTION':
      return applyAction(state, event.playerId, event.action)
    case 'NEXT_ROUND':
      return nextRound(state)
    case 'END_GAME':
      return { ...state, phase: 'GAME_END', round: null }
  }
}

/** 場代を払えるプレイヤー。払えない人はそのラウンドに参加できない */
export function eligiblePlayers(state: GameState): PlayerId[] {
  return state.config.players
    .filter((p) => get(state.chips, p.id) >= state.config.anteAmount)
    .map((p) => p.id)
}

// ---------------------------------------------------------------------------
// START_ROUND
// ---------------------------------------------------------------------------

function startRound(state: GameState, hands: Hands): GameState {
  if (state.phase !== 'IDLE') {
    throw new Error(`ラウンドを開始できない状態です（phase: ${state.phase}）`)
  }

  const participants = eligiblePlayers(state)
  if (participants.length < MIN_PLAYERS) {
    return { ...state, phase: 'GAME_END', round: null }
  }

  for (const id of participants) {
    if (!(id in hands)) throw new Error(`${id} の手札が渡されていません`)
  }

  const chips = { ...state.chips }
  const status: Record<PlayerId, PlayerStatus> = {}
  const bets: Record<PlayerId, number> = {}
  const chipsAtStart: Record<PlayerId, number> = { ...state.chips }

  // 場代を徴収する
  let pot = 0
  for (const id of participants) {
    chips[id] = get(chips, id) - state.config.anteAmount
    pot += state.config.anteAmount
    status[id] = 'PENDING'
    bets[id] = 0
  }

  const round: RoundState = {
    roundNo: state.roundNo + 1,
    hands: pick(hands, participants),
    order: orderFrom(state.config, participants, state.startPlayerId),
    turnIndex: 0,
    status,
    bets,
    pot,
    currentBet: 0,
    actedSinceRaise: [],
    chipsAtStart,
  }

  return {
    ...state,
    chips,
    roundNo: round.roundNo,
    phase: state.config.bettingMode === 'ANTE' ? 'DECIDE' : 'BET',
    round,
  }
}

/** 座順を保ったまま、開始プレイヤーの席から時計回りに参加者を並べる */
function orderFrom(
  config: GameConfig,
  participants: readonly PlayerId[],
  startPlayerId: PlayerId,
): PlayerId[] {
  const seats = config.players.map((p) => p.id)
  const set = new Set(participants)
  const from = Math.max(0, seats.indexOf(startPlayerId))
  const order: PlayerId[] = []
  for (let i = 0; i < seats.length; i++) {
    const id = seats[(from + i) % seats.length]!
    if (set.has(id)) order.push(id)
  }
  return order
}

// ---------------------------------------------------------------------------
// PLAYER_ACTION
// ---------------------------------------------------------------------------

function applyAction(state: GameState, playerId: PlayerId, action: PlayerAction): GameState {
  const round = state.round
  if (!round || (state.phase !== 'DECIDE' && state.phase !== 'BET')) {
    throw new Error(`行動を受け付けられない状態です（phase: ${state.phase}）`)
  }
  const expected = round.order[round.turnIndex]
  if (expected !== playerId) {
    throw new Error(`手番のプレイヤーではありません（手番: ${expected ?? 'なし'}）`)
  }

  return state.phase === 'DECIDE'
    ? applyAnteAction(state, round, playerId, action)
    : applyRaiseAction(state, round, playerId, action)
}

/**
 * アンティ方式。各プレイヤーは 1 度だけ「勝負」か「降り」を選ぶ。
 * 勝負を選んだ人は追加で場代 1 口を払うが、シロク（4-6）保持者は免除される。
 */
function applyAnteAction(
  state: GameState,
  round: RoundState,
  playerId: PlayerId,
  action: PlayerAction,
): GameState {
  if (action.type !== 'PLAY' && action.type !== 'FOLD') {
    throw new Error(`アンティ方式では ${action.type} を選べません`)
  }

  const chips = { ...state.chips }
  const status = { ...round.status }
  const bets = { ...round.bets }
  let pot = round.pot

  if (action.type === 'FOLD') {
    status[playerId] = 'FOLDED'
  } else {
    status[playerId] = 'PLAYING'
    const hand = evaluateHand(handOf(round, playerId), state.config.rules)
    if (!isFlow(hand)) {
      const paid = Math.min(state.config.anteAmount, get(chips, playerId))
      chips[playerId] = get(chips, playerId) - paid
      bets[playerId] = get(bets, playerId) + paid
      pot += paid
    }
  }

  const next: RoundState = { ...round, status, bets, pot, turnIndex: round.turnIndex + 1 }
  const advanced: GameState = { ...state, chips, round: next }

  // 全員が 1 度ずつ行動したら必ず決着する
  return next.turnIndex >= next.order.length ? settle(advanced, next) : advanced
}

/**
 * レイズ方式。全員のベット額が揃うまで端末が周回する。
 */
function applyRaiseAction(
  state: GameState,
  round: RoundState,
  playerId: PlayerId,
  action: PlayerAction,
): GameState {
  if (action.type === 'PLAY') {
    throw new Error('レイズ方式では PLAY を選べません')
  }

  const chips = { ...state.chips }
  const status = { ...round.status }
  const bets = { ...round.bets }
  let pot = round.pot
  let currentBet = round.currentBet
  let acted = [...round.actedSinceRaise]

  const owed = currentBet - get(bets, playerId)

  switch (action.type) {
    case 'FOLD':
      status[playerId] = 'FOLDED'
      acted.push(playerId)
      break

    case 'CALL': {
      // 手持ちが足りない場合はオールイン。サイドポットは扱わない
      const paid = Math.min(owed, get(chips, playerId))
      chips[playerId] = get(chips, playerId) - paid
      bets[playerId] = get(bets, playerId) + paid
      pot += paid
      status[playerId] = 'PLAYING'
      acted.push(playerId)
      break
    }

    case 'RAISE': {
      if (!Number.isInteger(action.amount) || action.amount <= 0) {
        throw new RangeError('レイズ額は 1 以上の整数である必要があります')
      }
      const required = owed + action.amount
      if (required > get(chips, playerId)) {
        throw new RangeError(
          `チップが足りません（必要: ${required}、所持: ${get(chips, playerId)}）`,
        )
      }
      chips[playerId] = get(chips, playerId) - required
      bets[playerId] = get(bets, playerId) + required
      pot += required
      currentBet = get(bets, playerId)
      status[playerId] = 'PLAYING'
      // レイズが入ったら、他の全員に再度行動の機会が回る
      acted = [playerId]
      break
    }
  }

  const interim: RoundState = { ...round, status, bets, pot, currentBet, actedSinceRaise: acted }
  const nextIndex = nextActorIndex(interim)
  const next: RoundState = { ...interim, turnIndex: nextIndex ?? interim.turnIndex }
  const advanced: GameState = { ...state, chips, round: next }

  return nextIndex === null ? settle(advanced, next) : advanced
}

/**
 * 次に行動すべきプレイヤーの手番位置。全員のベットが揃っていれば null。
 * オールイン（手持ち 0）のプレイヤーはこれ以上行動できないため飛ばす。
 */
function nextActorIndex(round: RoundState): number | null {
  const alive = round.order.filter((id) => round.status[id] !== 'FOLDED')
  if (alive.length <= 1) return null

  const acted = new Set(round.actedSinceRaise)
  for (let i = 1; i <= round.order.length; i++) {
    const index = (round.turnIndex + i) % round.order.length
    const id = round.order[index]!
    if (round.status[id] === 'FOLDED') continue
    if (acted.has(id) && get(round.bets, id) === round.currentBet) continue
    return index
  }
  return null
}

// ---------------------------------------------------------------------------
// 決着
// ---------------------------------------------------------------------------

function settle(state: GameState, round: RoundState): GameState {
  const config = state.config
  const contenders = round.order.filter((id) => round.status[id] === 'PLAYING')
  const folded = round.order.filter((id) => round.status[id] === 'FOLDED')

  // レイズ方式で残り 1 人になった場合、手札は公開せずに勝つ
  const winByFold = config.bettingMode === 'RAISE' && contenders.length === 1
  const outcome: RoundOutcome = winByFold
    ? { outcome: 'WIN_BY_FOLD', winner: contenders[0]! }
    : resolveShowdown(
        contenders.map<ShowdownEntry>((id) => ({
          playerId: id,
          hand: evaluateHand(handOf(round, id), config.rules),
        })),
      )

  // 手札を実際に公開した人。ブラフ勝ちのときは誰も公開しない
  const revealed = winByFold ? [] : contenders

  const chips = { ...state.chips }
  let pot = round.pot

  // バクダンの追加徴収。流局・引き分けでは発生しない
  let bombCharge = 0
  if (outcome.outcome === 'WIN' && outcome.bombPlayer !== null) {
    bombCharge = config.rules.bombExtraCharge
    // アンティ方式は勝負に残っている人のみ、レイズ方式は降りた人も支払う
    const targets = config.bettingMode === 'ANTE' ? contenders : [...contenders, ...folded]
    for (const id of targets) {
      if (id === outcome.bombPlayer) continue
      const paid = Math.min(bombCharge, get(chips, id))
      chips[id] = get(chips, id) - paid
      pot += paid
    }
  }

  // 配当。勝者がいなければ場のチップは次ラウンドへ持ち越す
  const winner =
    outcome.outcome === 'WIN'
      ? outcome.winner
      : outcome.outcome === 'WIN_BY_FOLD'
        ? outcome.winner
        : null

  let carryOver = state.carryOver
  let awarded = 0
  if (winner !== null) {
    awarded = pot + carryOver
    chips[winner] = get(chips, winner) + awarded
    carryOver = 0
  } else {
    carryOver += pot
  }

  const payouts: Record<PlayerId, number> = {}
  for (const p of config.players) {
    payouts[p.id] = get(chips, p.id) - get(round.chipsAtStart, p.id)
  }

  const result: RoundResult = {
    roundNo: round.roundNo,
    hands: round.hands,
    revealed,
    folded,
    outcome,
    pot: winner !== null ? awarded : pot,
    payouts,
    carryOverAfter: carryOver,
    bombCharge,
  }

  return {
    ...state,
    chips,
    carryOver,
    startPlayerId: winner ?? state.startPlayerId,
    phase: 'RESULT',
    round,
    history: [...state.history, result],
  }
}

// ---------------------------------------------------------------------------
// NEXT_ROUND
// ---------------------------------------------------------------------------

function nextRound(state: GameState): GameState {
  if (state.phase !== 'RESULT') {
    throw new Error(`次のラウンドへ進めない状態です（phase: ${state.phase}）`)
  }

  const end = state.config.endCondition
  const remaining = eligiblePlayers(state)

  // 場代を払える人が 2 人未満になったら、終了条件に関わらずゲームは続けられない
  const exhausted = remaining.length < MIN_PLAYERS
  const roundsDone = end.type === 'ROUNDS' && state.roundNo >= end.count
  const bankrupt = end.type === 'BANKRUPT' && remaining.length <= 1

  if (exhausted || roundsDone || bankrupt) {
    return { ...state, phase: 'GAME_END', round: null }
  }
  return { ...state, phase: 'IDLE', round: null }
}

// ---------------------------------------------------------------------------
// 内部ユーティリティ
// ---------------------------------------------------------------------------

function get<T>(record: Readonly<Record<string, T>>, key: string): T {
  const value = record[key]
  if (value === undefined) throw new Error(`キー ${key} の値がありません`)
  return value
}

function handOf(round: RoundState, playerId: PlayerId): readonly [Card, Card] {
  return get(round.hands, playerId)
}

function pick(hands: Hands, ids: readonly PlayerId[]): Hands {
  const picked: Record<PlayerId, readonly [Card, Card]> = {}
  for (const id of ids) picked[id] = get(hands, id)
  return picked
}
