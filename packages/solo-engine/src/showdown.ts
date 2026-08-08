import type { Hand } from './hand'
import { isBomb, isFlow } from './hand'

export interface ShowdownEntry<Id extends string = string> {
  readonly playerId: Id
  readonly hand: Hand
}

export type ShowdownResult<Id extends string = string> =
  /** 公開対象者がいない（全員降りた）。場のチップは次ラウンドへ持ち越す */
  | { readonly outcome: 'NO_CONTEST' }
  /** シロクの流れ（4-6）により流局。場のチップは次ラウンドへ持ち越す */
  | { readonly outcome: 'FLOW'; readonly flowPlayers: readonly Id[] }
  /** 単独の勝者が決まった */
  | {
      readonly outcome: 'WIN'
      readonly winner: Id
      readonly hand: Hand
      /** バクダン（10-10）の保持者。追加徴収の判定に使う。いなければ null */
      readonly bombPlayer: Id | null
    }
  /** 同点。場のチップは次ラウンドへ持ち越す */
  | {
      readonly outcome: 'DRAW'
      readonly players: readonly Id[]
      readonly score: number
      readonly name: string
    }

/**
 * 公開された手札から勝敗を決定する。
 *
 * 処理順序は厳守すること。シロク（4-6）の判定は**役比較よりも前**に行う。
 * 役比較と同じレイヤーに置くと必ずバグる。
 *
 * 引数には「実際に手札を公開したプレイヤー」だけを渡すこと。
 * レイズ方式で残り 1 人になり手札を公開せずに勝った場合は、この関数を呼ばない。
 */
export function resolveShowdown<Id extends string>(
  entries: readonly ShowdownEntry<Id>[],
): ShowdownResult<Id> {
  if (entries.length === 0) {
    return { outcome: 'NO_CONTEST' }
  }

  // 1. シロクの流れ。1 人でも保持者がいれば、他の役に関わらず流局
  const flowPlayers = entries.filter((e) => isFlow(e.hand)).map((e) => e.playerId)
  if (flowPlayers.length > 0) {
    return { outcome: 'FLOW', flowPlayers }
  }

  // 2. 最高スコアを求める
  let best = entries[0]!
  for (const entry of entries) {
    if (entry.hand.score > best.hand.score) best = entry
  }
  const top = entries.filter((e) => e.hand.score === best.hand.score)

  // 3. 同点なら引き分け（例: 両者ともテンピン）
  if (top.length > 1) {
    return {
      outcome: 'DRAW',
      players: top.map((e) => e.playerId),
      score: best.hand.score,
      name: best.hand.name,
    }
  }

  // 4. 単独勝者
  const bomb = entries.find((e) => isBomb(e.hand))
  return {
    outcome: 'WIN',
    winner: best.playerId,
    hand: best.hand,
    bombPlayer: bomb ? bomb.playerId : null,
  }
}

/** 勝負が成立せず、場のチップを次ラウンドへ持ち越す結果かどうか */
export function isCarryOver(result: ShowdownResult): boolean {
  return result.outcome !== 'WIN'
}
