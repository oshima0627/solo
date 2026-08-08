/**
 * 乱数源を注入可能にするための最小の抽象。
 * テストとリプレイのために、シード指定の決定的な擬似乱数を提供する。
 */

/** 0 以上 1 未満の数を返す関数 */
export type Rng = () => number

/**
 * mulberry32。32bit シードから決定的な擬似乱数列を生成する。
 * 暗号用途には使わないこと。
 */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 実プレイ用。Math.random をそのまま使う */
export const defaultRng: Rng = Math.random
