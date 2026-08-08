import type { Card, Rank, Suit } from './card'
import { ALL_SUITS, BLACK_SUITS, createDeck } from './card'

/**
 * 山札の構成。
 * - 'BLACK20': 黒 2 スートの A〜10、計 20 枚
 * - 'FULL40' : 4 スートの A〜10、計 40 枚。バクダンは黒の 10 ペアに限られる
 */
export type DeckVariant = 'BLACK20' | 'FULL40'

/**
 * ソロには公式ルールが存在せず、証言によって内容が割れている箇所がある。
 * そうした箇所はハードコードせず、すべてここで設定可能にする。
 * 各項目の既定値は、調査で最も多数派だった記述に従っている。
 */
export interface RuleVariant {
  /** 山札の構成。20 枚（黒のみ）か 40 枚（4 スート）か */
  readonly deck: DeckVariant

  /**
   * ピンゾロ（A-A）の強さ。
   * - 'lowestSolo'   : ソロの中で最弱（10ソロ → … → 2ソロ → 1ソロ）※多数派
   * - 'secondHighest': バクダン（10-10）の次に強い
   */
  readonly pinzoroPosition: 'lowestSolo' | 'secondHighest'

  /**
   * ピン役として認める数札。A とこのランクの組み合わせがピン役になる。
   * 既定は 10（テンピン）・9（クッピン）・5（ゴピン）の 3 種。
   */
  readonly pinRanks: readonly Rank[]

  /** 逆ソロ（9-6）を採用するか。false なら数字の 5 として扱う */
  readonly gyakuSolo: boolean

  /** シロクの流れ（4-6）を採用するか。false なら数字の 0（ブタ）として扱う */
  readonly shiroku: boolean

  /** バクダン（10-10）出現時に、他のプレイヤーが追加で支払うチップ枚数 */
  readonly bombExtraCharge: number
}

/** ピン役の既定（テンピン・クッピン・ゴピン） */
export const STANDARD_PIN_RANKS: readonly Rank[] = [10, 9, 5]

/** ピン役を全ランクに広げる場合。A-A はソロなので 1 は含めない */
export const ALL_PIN_RANKS: readonly Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10]

export const DEFAULT_RULES: RuleVariant = {
  deck: 'BLACK20',
  pinzoroPosition: 'lowestSolo',
  pinRanks: STANDARD_PIN_RANKS,
  gyakuSolo: true,
  shiroku: true,
  bombExtraCharge: 3,
}

/** ソロ役の強さの並び（強い順）。既定は 10 が最強、A が最弱 */
const SOLO_ORDER_LOWEST_PINZORO: readonly Rank[] = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]

/** ピンゾロをバクダンの次に強いとする場合の並び */
const SOLO_ORDER_HIGH_PINZORO: readonly Rank[] = [10, 1, 9, 8, 7, 6, 5, 4, 3, 2]

export function soloOrder(rules: RuleVariant): readonly Rank[] {
  return rules.pinzoroPosition === 'secondHighest'
    ? SOLO_ORDER_HIGH_PINZORO
    : SOLO_ORDER_LOWEST_PINZORO
}

export function withRules(overrides: Partial<RuleVariant>): RuleVariant {
  return { ...DEFAULT_RULES, ...overrides }
}

export function suitsFor(rules: RuleVariant): readonly Suit[] {
  return rules.deck === 'FULL40' ? ALL_SUITS : BLACK_SUITS
}

/** そのルールでの山札。毎ラウンド全枚数を戻して使う */
export function deckFor(rules: RuleVariant): Card[] {
  return createDeck(suitsFor(rules))
}

export function deckSizeFor(rules: RuleVariant): number {
  return suitsFor(rules).length * 10
}
