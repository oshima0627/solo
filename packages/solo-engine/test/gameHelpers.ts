import type { Card, Rank, Suit } from '../src/card.js'
import { DEFAULT_RULES } from '../src/rules.js'
import { createGame, reduce } from '../src/game/reducer.js'
import type {
  GameConfig,
  GameState,
  PlayerAction,
  PlayerId,
} from '../src/game/types.js'

/**
 * ランクの組み合わせから手札を組み立てる。
 * スートは未使用のものから自動で割り当てるので、テストではランクだけ書けばよい。
 */
export function makeHands(
  spec: Record<PlayerId, [Rank, Rank]>,
): Record<PlayerId, readonly [Card, Card]> {
  const used = new Set<string>()
  const take = (rank: Rank): Card => {
    for (const suit of ['S', 'C'] as Suit[]) {
      const id = `${suit}${rank}`
      if (!used.has(id)) {
        used.add(id)
        return { rank, suit }
      }
    }
    throw new Error(`ランク ${rank} のカードは 2 枚しかありません`)
  }

  const hands: Record<PlayerId, readonly [Card, Card]> = {}
  for (const [id, [a, b]] of Object.entries(spec)) {
    hands[id] = [take(a), take(b)]
  }
  return hands
}

export function setup(overrides: Partial<GameConfig> = {}, ids: PlayerId[] = ['a', 'b', 'c']) {
  const config: GameConfig = {
    players: ids.map((id) => ({ id, name: id.toUpperCase(), isCpu: false })),
    bettingMode: 'ANTE',
    endCondition: { type: 'FREE' },
    initialChips: 100,
    anteAmount: 1,
    rules: DEFAULT_RULES,
    ...overrides,
  }
  return createGame(config)
}

/** 指定した手札でラウンドを開始する */
export function start(state: GameState, spec: Record<PlayerId, [Rank, Rank]>): GameState {
  return reduce(state, { type: 'START_ROUND', hands: makeHands(spec) })
}

/** 手番順に行動を適用する。キーは手番のプレイヤー ID */
export function act(state: GameState, playerId: PlayerId, action: PlayerAction): GameState {
  return reduce(state, { type: 'PLAYER_ACTION', playerId, action })
}

export const PLAY: PlayerAction = { type: 'PLAY' }
export const FOLD: PlayerAction = { type: 'FOLD' }
export const CALL: PlayerAction = { type: 'CALL' }
export const raise = (amount: number): PlayerAction => ({ type: 'RAISE', amount })
