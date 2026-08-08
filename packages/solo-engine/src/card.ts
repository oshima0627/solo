/**
 * ソロの山札は A〜10 だけを使い、J・Q・K・JOKER は使わない。
 *
 * 枚数には説が 2 つある。
 * - 20 枚説: 1 色 2 スート（♠♣）のみ。「孤独のボドゲ」が明記している構成
 * - 40 枚説: 4 スートすべて。原型とされる株札が 40 枚であること、および
 *   「一番強いのは"黒の"10 のペア」という証言が、赤が混ざっていないと
 *   限定する意味を持たないことから支持される
 *
 * どちらが正しいか資料は割れているため、RuleVariant で切り替える。
 */

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

/** ♠ スペード / ♣ クラブ / ♥ ハート / ♦ ダイヤ */
export type Suit = 'S' | 'C' | 'H' | 'D'

export interface Card {
  readonly rank: Rank
  readonly suit: Suit
}

export const RANKS: readonly Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

/** 黒のみ（20 枚構成で使う） */
export const BLACK_SUITS: readonly Suit[] = ['S', 'C']
/** 4 スートすべて（40 枚構成で使う） */
export const ALL_SUITS: readonly Suit[] = ['S', 'C', 'H', 'D']

export const BLACK_DECK_SIZE = RANKS.length * BLACK_SUITS.length
export const FULL_DECK_SIZE = RANKS.length * ALL_SUITS.length

/** 1 人に配られる手札の枚数。本バージョンは 2 枚配り固定 */
export const HAND_SIZE = 2

export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 6

export function isRedSuit(suit: Suit): boolean {
  return suit === 'H' || suit === 'D'
}

export function isBlackSuit(suit: Suit): boolean {
  return !isRedSuit(suit)
}

export function createCard(rank: Rank, suit: Suit): Card {
  return { rank, suit }
}

/** 山札を生成する（順序は固定。シャッフルは shuffle() で行う） */
export function createDeck(suits: readonly Suit[] = BLACK_SUITS): Card[] {
  const deck: Card[] = []
  for (const suit of suits) {
    for (const rank of RANKS) {
      deck.push({ rank, suit })
    }
  }
  return deck
}

/** カードを一意に識別する文字列。例: 'S10', 'H1' */
export function cardId(card: Card): string {
  return `${card.suit}${card.rank}`
}

const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', C: '♣', H: '♥', D: '♦' }

export function suitSymbol(suit: Suit): string {
  return SUIT_SYMBOL[suit]
}

/** 表示用の文字列。A は 'A'、それ以外は数字。例: '♠A', '♣10' */
export function formatCard(card: Card): string {
  const rank = card.rank === 1 ? 'A' : String(card.rank)
  return `${SUIT_SYMBOL[card.suit]}${rank}`
}

export function isSameCard(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit
}
