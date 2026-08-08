/**
 * ソロの山札は 1 色 2 スートの A〜10、計 20 枚。
 * J・Q・K・JOKER と、もう一方の色は使わない。
 *
 * ただし色は固定ではなく、バクダンが出たら黒（♠♣）と赤（♥♦）を入れ替える。
 * どちらの色でもランクの構成は同じなので、確率や役の強さには一切影響しない。
 * 「一番強いのは"黒の"10 のペア」という証言は、そのとき使っていた山札が
 * 黒だったことを指している。
 */

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

/** ♠ スペード / ♣ クラブ / ♥ ハート / ♦ ダイヤ */
export type Suit = 'S' | 'C' | 'H' | 'D'

export interface Card {
  readonly rank: Rank
  readonly suit: Suit
}

export const RANKS: readonly Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

/** 使用中の山札の色 */
export type DeckColor = 'BLACK' | 'RED'

export const BLACK_SUITS: readonly Suit[] = ['S', 'C']
export const RED_SUITS: readonly Suit[] = ['H', 'D']

/** 山札の枚数。色に関わらず常に 20 枚 */
export const DECK_SIZE = RANKS.length * BLACK_SUITS.length

export function suitsForColor(color: DeckColor): readonly Suit[] {
  return color === 'RED' ? RED_SUITS : BLACK_SUITS
}

export function oppositeColor(color: DeckColor): DeckColor {
  return color === 'BLACK' ? 'RED' : 'BLACK'
}

export function colorOfCard(card: Card): DeckColor {
  return isRedSuit(card.suit) ? 'RED' : 'BLACK'
}

/** 表示用の色名 */
export function deckColorLabel(color: DeckColor): string {
  return color === 'RED' ? '♥♦（赤）' : '♠♣（黒）'
}

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
