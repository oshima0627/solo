import type { Card, Rank } from './card'
import { formatCard } from './card'
import { soloOrder, type RuleVariant } from './rules'

/**
 * 手札 2 枚の役。
 *
 * 強さは  ソロ ＞ 逆ソロ ＞ ピン ＞ 数字。
 * FLOW（4-6 シロクの流れ）は勝敗を比較せず、その勝負自体を無効化する特殊役なので、
 * 役比較とは別のレイヤーで扱う（resolveShowdown を参照）。
 */
export type HandCategory = 'FLOW' | 'SOLO' | 'GYAKU_SOLO' | 'PIN' | 'NUMBER'

export interface Hand {
  readonly cards: readonly [Card, Card]
  readonly category: HandCategory
  /**
   * カテゴリ内での識別値。
   * SOLO なら揃ったランク、PIN なら A と組んだ数札のランク、
   * NUMBER なら合計の一の位、GYAKU_SOLO / FLOW なら 0。
   */
  readonly rank: number
  /** 比較用スコア。大きいほど強い */
  readonly score: number
  /** 役名（掛け声）。例: 'バクダン', 'クッピン', 'カブ' */
  readonly name: string
}

/** カテゴリごとのスコアの基準値 */
export const SCORE_BASE = {
  SOLO: 400,
  GYAKU_SOLO: 300,
  PIN: 200,
  NUMBER: 100,
  /** FLOW は比較対象外だが、万一比較された場合に必ず負けるよう最小値を与える */
  FLOW: 0,
} as const

const PIN_NAMES: Partial<Record<Rank, string>> = {
  10: 'テンピン',
  9: 'クッピン',
  5: 'ゴピン',
  4: 'シッピン',
}

/**
 * 手札 2 枚を評価する。
 *
 * 判定の順序は FLOW → SOLO → 逆ソロ → ピン → 数字。
 * FLOW を最初に見るのは、4-6 が「勝負を流す」特殊役であることを構造上明示するため。
 */
export function evaluateHand(cards: readonly [Card, Card], rules: RuleVariant): Hand {
  const [a, b] = cards
  const ranks = [a.rank, b.rank] as const
  const sum = a.rank + b.rank

  // シロクの流れ（4-6）: 本来は合計 10 でブタだが、特別に勝負を無効化する
  if (rules.shiroku && hasRanks(ranks, 4, 6)) {
    return { cards, category: 'FLOW', rank: 0, score: SCORE_BASE.FLOW, name: 'シロクの流れ' }
  }

  // ソロ（同じ数字 2 枚）
  if (a.rank === b.rank) {
    const order = soloOrder(rules)
    const index = order.indexOf(a.rank)
    return {
      cards,
      category: 'SOLO',
      rank: a.rank,
      score: SCORE_BASE.SOLO + (order.length - index),
      name: soloName(a.rank),
    }
  }

  // 逆ソロ（9-6）
  if (rules.gyakuSolo && hasRanks(ranks, 9, 6)) {
    return { cards, category: 'GYAKU_SOLO', rank: 0, score: SCORE_BASE.GYAKU_SOLO, name: '逆ソロ' }
  }

  // ピン（A + 特定の数札）。合計では弱くなる手を救済する役
  const pinRank = pinPartner(ranks, rules)
  if (pinRank !== null) {
    return {
      cards,
      category: 'PIN',
      rank: pinRank,
      score: SCORE_BASE.PIN + pinRank,
      name: PIN_NAMES[pinRank] ?? `${pinRank}ピン`,
    }
  }

  // 数字（2 枚の合計の一の位）
  const value = sum % 10
  return {
    cards,
    category: 'NUMBER',
    rank: value,
    score: SCORE_BASE.NUMBER + value,
    name: numberName(value),
  }
}

/**
 * 役の強さを比較する。a が強ければ正、b が強ければ負、同じ強さなら 0。
 * FLOW は比較前に取り除かれている前提だが、渡された場合は必ず負ける。
 */
export function compareHands(a: Hand, b: Hand): number {
  return a.score - b.score
}

/**
 * バクダン（10 のペア）かどうか。
 * 山札は常に 1 色なので、10 が 2 枚揃えばそれが必ずその色の 10 のペアになる。
 */
export function isBomb(hand: Hand): boolean {
  return hand.category === 'SOLO' && hand.rank === 10
}

export function isFlow(hand: Hand): boolean {
  return hand.category === 'FLOW'
}

/** '♠A ♣10（クッピン）' のような表示用文字列 */
export function formatHand(hand: Hand): string {
  const [a, b] = hand.cards
  return `${formatCard(a)} ${formatCard(b)}（${hand.name}）`
}

function hasRanks(ranks: readonly [Rank, Rank], x: Rank, y: Rank): boolean {
  const [a, b] = ranks
  return (a === x && b === y) || (a === y && b === x)
}

/** A と組んでピン役を成立させる相手のランク。成立しなければ null */
function pinPartner(ranks: readonly [Rank, Rank], rules: RuleVariant): Rank | null {
  const [a, b] = ranks
  let partner: Rank
  if (a === 1) partner = b
  else if (b === 1) partner = a
  else return null

  // A-A はソロとして先に判定済みなので、ここに 1 は来ない
  return rules.pinRanks.includes(partner) ? partner : null
}

function soloName(rank: Rank): string {
  if (rank === 10) return 'バクダン'
  if (rank === 1) return 'ピンゾロ'
  return `${rank}ソロ`
}

function numberName(value: number): string {
  if (value === 9) return 'カブ'
  if (value === 0) return 'ブタ'
  return String(value)
}
