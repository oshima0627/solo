import type { Card, Rank, Suit } from '../src/card.js'
import { createDeck } from '../src/card.js'

/** 山札 20 枚から 2 枚を選ぶ組み合わせ全 190 通り */
export function allHandCombinations(): [Card, Card][] {
  const deck = createDeck()
  const combos: [Card, Card][] = []
  for (let i = 0; i < deck.length; i++) {
    for (let j = i + 1; j < deck.length; j++) {
      combos.push([deck[i]!, deck[j]!])
    }
  }
  return combos
}

/** テストを読みやすくするための手札生成。スートは既定で ♠♣ を 1 枚ずつ */
export function hand(a: Rank, b: Rank, suits: [Suit, Suit] = ['S', 'C']): [Card, Card] {
  return [
    { rank: a, suit: suits[0] },
    { rank: b, suit: suits[1] },
  ]
}
