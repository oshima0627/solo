import type { Card } from '../card.js'
import type { RuleVariant } from '../rules.js'
import type { ShowdownResult } from '../showdown.js'

export type PlayerId = string

export interface PlayerConfig {
  readonly id: PlayerId
  readonly name: string
  /** ひとり練習モードの CPU かどうか */
  readonly isCpu: boolean
}

/**
 * ベッティング方式。
 * - 'ANTE'  : 定額アンティ。端末を必ず 1 周して決着する
 * - 'RAISE' : ポーカー型レイズ。レイズのたびに端末が再周回する
 */
export type BettingMode = 'ANTE' | 'RAISE'

export type EndCondition =
  /** 規定ラウンド数を消化したら終了 */
  | { readonly type: 'ROUNDS'; readonly count: number }
  /** チップが尽きた人から脱落し、最後の 1 人が勝者 */
  | { readonly type: 'BANKRUPT' }
  /** 終了条件なし。いつでも中断できる */
  | { readonly type: 'FREE' }

export interface GameConfig {
  readonly players: readonly PlayerConfig[]
  readonly bettingMode: BettingMode
  readonly endCondition: EndCondition
  readonly initialChips: number
  readonly anteAmount: number
  readonly rules: RuleVariant
}

export type PlayerAction =
  /** アンティ方式：勝負する */
  | { readonly type: 'PLAY' }
  /** 降りる（両方式共通） */
  | { readonly type: 'FOLD' }
  /** レイズ方式：現在のベット額に合わせる。差額 0 ならチェック */
  | { readonly type: 'CALL' }
  /** レイズ方式：現在のベット額に amount を上乗せする */
  | { readonly type: 'RAISE'; readonly amount: number }

export type PlayerStatus =
  /** まだ行動していない */
  | 'PENDING'
  /** 勝負に残っている */
  | 'PLAYING'
  /** 降りた */
  | 'FOLDED'

export type Phase =
  /** ラウンド未開始。START_ROUND を待つ */
  | 'IDLE'
  /** アンティ方式の入力周回 */
  | 'DECIDE'
  /** レイズ方式の入力周回 */
  | 'BET'
  /** ラウンドの結果が確定した。NEXT_ROUND を待つ */
  | 'RESULT'
  /** ゲーム終了 */
  | 'GAME_END'

export interface RoundState {
  readonly roundNo: number
  readonly hands: Readonly<Record<PlayerId, readonly [Card, Card]>>
  /** このラウンドの手番順。先頭が最初に行動する */
  readonly order: readonly PlayerId[]
  readonly turnIndex: number
  readonly status: Readonly<Record<PlayerId, PlayerStatus>>
  /** 場代を除く、このラウンドで各自が出した額（レイズ方式で使用） */
  readonly bets: Readonly<Record<PlayerId, number>>
  readonly pot: number
  /** レイズ方式：現在のコール額 */
  readonly currentBet: number
  /** レイズ方式：最後のレイズ以降に行動済みのプレイヤー */
  readonly actedSinceRaise: readonly PlayerId[]
  /** ラウンド開始時点のチップ。収支計算に使う */
  readonly chipsAtStart: Readonly<Record<PlayerId, number>>
}

/**
 * ラウンドの決着。
 * レイズ方式で残り 1 人になった場合は手札を公開しないため、
 * 通常のショーダウンとは区別する。
 */
export type RoundOutcome =
  | ShowdownResult
  | { readonly outcome: 'WIN_BY_FOLD'; readonly winner: PlayerId }

export interface RoundResult {
  readonly roundNo: number
  /** 全員分の手札。UI 側で公開範囲を制御する */
  readonly hands: Readonly<Record<PlayerId, readonly [Card, Card]>>
  /** 実際に手札を公開したプレイヤー */
  readonly revealed: readonly PlayerId[]
  readonly folded: readonly PlayerId[]
  readonly outcome: RoundOutcome
  /** 分配された場のチップ（持ち越し分を含む） */
  readonly pot: number
  /** ラウンド全体の収支。正なら獲得、負なら支払い */
  readonly payouts: Readonly<Record<PlayerId, number>>
  /** 決着後の持ち越し額 */
  readonly carryOverAfter: number
  /** バクダンによる追加徴収の 1 人あたりの額。発生しなければ 0 */
  readonly bombCharge: number
}

export interface GameState {
  readonly config: GameConfig
  readonly chips: Readonly<Record<PlayerId, number>>
  readonly roundNo: number
  /** 流局・引き分けで次ラウンドへ繰り越されたチップ */
  readonly carryOver: number
  /** 次のラウンドで最初に行動するプレイヤー（前ラウンドの勝者） */
  readonly startPlayerId: PlayerId
  readonly phase: Phase
  readonly round: RoundState | null
  readonly history: readonly RoundResult[]
}

export type GameEvent =
  /** ラウンドを開始する。hands は参加者全員分を渡すこと */
  | {
      readonly type: 'START_ROUND'
      readonly hands: Readonly<Record<PlayerId, readonly [Card, Card]>>
    }
  | {
      readonly type: 'PLAYER_ACTION'
      readonly playerId: PlayerId
      readonly action: PlayerAction
    }
  /** 結果表示を終えて次のラウンドへ進む。終了条件を満たしていればゲーム終了になる */
  | { readonly type: 'NEXT_ROUND' }
  /** 中断してゲームを終了する */
  | { readonly type: 'END_GAME' }
