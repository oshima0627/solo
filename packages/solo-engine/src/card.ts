/**
 * ソロの山札は 20 枚固定。
 * トランプ 1 色 2 スート（♠／♣）の A〜10 のみを使い、J・Q・K・JOKER と
 * もう 1 色は使わない。これはカブ札（20枚構成）の代用であることに由来する。
 */

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

/** ♠ = スペード、♣ = クラブ */
export type Suit = 'S' | 'C'

export interface Card {
  readonly rank: Rank
  readonly suit: Suit
}

export const RANKS: readonly Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
export const SUITS: readonly Suit[] = ['S', 'C']

/** 山札の枚数（A〜10 × 2スート） */
export const DECK_SIZE = RANKS.length * SUITS.length

/** 1 人に配られる手札の枚数。本バージョンは 2 枚配り固定 */
export const HAND_SIZE = 2

export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 6

export function createCard(rank: Rank, suit: Suit): Card {
  return { rank, suit }
}

/** 20 枚の山札を生成する（順序は固定。シャッフルは shuffle() で行う） */
export function createDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit })
    }
  }
  return deck
}

/** カードを一意に識別する文字列。例: 'S10', 'C1' */
export function cardId(card: Card): string {
  return `${card.suit}${card.rank}`
}

const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', C: '♣' }

/** 表示用の文字列。A は 'A'、それ以外は数字。例: '♠A', '♣10' */
export function formatCard(card: Card): string {
  const rank = card.rank === 1 ? 'A' : String(card.rank)
  return `${SUIT_SYMBOL[card.suit]}${rank}`
}

export function isSameCard(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit
}
