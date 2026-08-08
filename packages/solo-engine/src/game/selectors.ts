import type { Card } from '../card'
import type { Hand } from '../hand'
import { evaluateHand } from '../hand'
import type { Rng } from '../rng'
import { dealHands } from '../deal'
import { eligiblePlayers } from './reducer'
import type { GameEvent, GameState, PlayerAction, PlayerId } from './types'

/** 手番のプレイヤー。入力待ちでなければ null */
export function currentPlayerId(state: GameState): PlayerId | null {
  if (state.phase !== 'DECIDE' && state.phase !== 'BET') return null
  return state.round?.order[state.round.turnIndex] ?? null
}

export function playerName(state: GameState, playerId: PlayerId): string {
  return state.config.players.find((p) => p.id === playerId)?.name ?? playerId
}

export function isCpu(state: GameState, playerId: PlayerId): boolean {
  return state.config.players.find((p) => p.id === playerId)?.isCpu ?? false
}

/** そのプレイヤーの手札。ラウンドに参加していなければ null */
export function handCardsOf(state: GameState, playerId: PlayerId): readonly [Card, Card] | null {
  return state.round?.hands[playerId] ?? null
}

/** そのプレイヤーの役。手札確認画面での常時表示に使う */
export function handOf(state: GameState, playerId: PlayerId): Hand | null {
  const cards = handCardsOf(state, playerId)
  return cards ? evaluateHand(cards, state.config.rules) : null
}

/** コールに必要な額。手持ちが足りなければオールイン額になる */
export function callAmount(state: GameState, playerId: PlayerId): number {
  const round = state.round
  if (!round) return 0
  const owed = round.currentBet - (round.bets[playerId] ?? 0)
  return Math.max(0, Math.min(owed, state.chips[playerId] ?? 0))
}

/** レイズできる最大の上乗せ額。0 ならレイズできない */
export function maxRaise(state: GameState, playerId: PlayerId): number {
  const round = state.round
  if (!round) return 0
  const owed = round.currentBet - (round.bets[playerId] ?? 0)
  return Math.max(0, (state.chips[playerId] ?? 0) - owed)
}

/** 手番のプレイヤーが選べる行動の種類 */
export function availableActions(state: GameState, playerId: PlayerId): PlayerAction['type'][] {
  if (state.phase === 'DECIDE') return ['PLAY', 'FOLD']
  if (state.phase !== 'BET') return []
  const actions: PlayerAction['type'][] = ['FOLD', 'CALL']
  if (maxRaise(state, playerId) > 0) actions.push('RAISE')
  return actions
}

export interface Standing {
  readonly playerId: PlayerId
  readonly name: string
  readonly chips: number
  readonly rank: number
}

/** チップの多い順の順位表。同数は同順位になる */
export function standings(state: GameState): Standing[] {
  const rows = state.config.players
    .map((p) => ({ playerId: p.id, name: p.name, chips: state.chips[p.id] ?? 0 }))
    .sort((a, b) => b.chips - a.chips)

  let rank = 0
  let previous: number | null = null
  return rows.map((row, i) => {
    if (previous === null || row.chips !== previous) rank = i + 1
    previous = row.chips
    return { ...row, rank }
  })
}

/**
 * 参加者に配札して START_ROUND イベントを作る。
 * reducer を純粋に保つため、乱数の消費はここで完結させる。
 */
export function dealForRound(state: GameState, rng: Rng): GameEvent {
  return {
    type: 'START_ROUND',
    hands: dealHands(eligiblePlayers(state), rng, state.deckColor),
  }
}
