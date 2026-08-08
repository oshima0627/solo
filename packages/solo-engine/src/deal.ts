import type { Card } from './card'
import { createDeck, DECK_SIZE, HAND_SIZE, MAX_PLAYERS, MIN_PLAYERS } from './card'
import type { Rng } from './rng'

/** Fisher-Yates。元の配列は破壊しない */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const a = result[i]!
    const b = result[j]!
    result[i] = b
    result[j] = a
  }
  return result
}

export type DealtHands<Id extends string = string> = Record<Id, readonly [Card, Card]>

/**
 * 毎ラウンド 20 枚すべてを戻して再シャッフルし、各プレイヤーに 2 枚ずつ配る。
 * 山札の引き継ぎは行わない。
 */
export function dealHands<Id extends string>(
  playerIds: readonly Id[],
  rng: Rng,
): DealtHands<Id> {
  if (playerIds.length < MIN_PLAYERS || playerIds.length > MAX_PLAYERS) {
    throw new RangeError(
      `プレイヤー数は ${MIN_PLAYERS}〜${MAX_PLAYERS} 人である必要があります（指定: ${playerIds.length}）`,
    )
  }
  if (new Set(playerIds).size !== playerIds.length) {
    throw new Error('プレイヤー ID が重複しています')
  }

  const needed = playerIds.length * HAND_SIZE
  if (needed > DECK_SIZE) {
    throw new RangeError(`山札 ${DECK_SIZE} 枚に対して ${needed} 枚を配ろうとしました`)
  }

  const deck = shuffle(createDeck(), rng)
  const hands = {} as Record<Id, readonly [Card, Card]>
  playerIds.forEach((id, i) => {
    hands[id] = [deck[i * HAND_SIZE]!, deck[i * HAND_SIZE + 1]!] as const
  })
  return hands
}
