import { describe, expect, it } from 'vitest'
import type { HandCategory } from '../src/hand.js'
import { evaluateHand } from '../src/hand.js'
import { ALL_PIN_RANKS, DEFAULT_RULES, withRules } from '../src/rules.js'
import type { RuleVariant } from '../src/rules.js'
import { allHandCombinations } from './helpers.js'

/**
 * 山札 20 枚から 2 枚を選ぶ組み合わせは C(20,2) = 190 通りしかないため、
 * 全パターンを網羅して検証する。
 */

const COMBOS = allHandCombinations()

function categoryCounts(rules: RuleVariant): Record<HandCategory, number> {
  const counts: Record<HandCategory, number> = {
    FLOW: 0,
    SOLO: 0,
    GYAKU_SOLO: 0,
    PIN: 0,
    NUMBER: 0,
  }
  for (const combo of COMBOS) {
    counts[evaluateHand(combo, rules).category]++
  }
  return counts
}

describe('全 190 通りの網羅検証', () => {
  it('組み合わせは 190 通りある', () => {
    expect(COMBOS).toHaveLength(190)
  })

  it('すべての組み合わせが例外なく評価できる', () => {
    for (const combo of COMBOS) {
      const h = evaluateHand(combo, DEFAULT_RULES)
      expect(h.name).not.toBe('')
      expect(Number.isInteger(h.score)).toBe(true)
    }
  })

  it('既定ルールでのカテゴリ内訳', () => {
    // ソロ: 各ランク 2 枚ずつなので 10 通り
    // シロク: 4×2枚 と 6×2枚 の組み合わせで 4 通り
    // 逆ソロ: 9×2枚 と 6×2枚 で 4 通り
    // ピン: A と 10/9/5 の 3 種 × 4 通り = 12 通り
    // 数字: 残り 160 通り
    expect(categoryCounts(DEFAULT_RULES)).toEqual({
      SOLO: 10,
      FLOW: 4,
      GYAKU_SOLO: 4,
      PIN: 12,
      NUMBER: 160,
    })
  })

  it('shiroku を off にするとシロク 4 通りが数字に移る', () => {
    const counts = categoryCounts(withRules({ shiroku: false }))
    expect(counts.FLOW).toBe(0)
    expect(counts.NUMBER).toBe(164)
  })

  it('gyakuSolo を off にすると逆ソロ 4 通りが数字に移る', () => {
    const counts = categoryCounts(withRules({ gyakuSolo: false }))
    expect(counts.GYAKU_SOLO).toBe(0)
    expect(counts.NUMBER).toBe(164)
  })

  it('pinRanks を all にするとピンが 36 通りになる', () => {
    const counts = categoryCounts(withRules({ pinRanks: ALL_PIN_RANKS }))
    // A と 2〜10 の 9 ランク × 4 通り
    expect(counts.PIN).toBe(36)
    expect(counts.NUMBER).toBe(136)
  })

  it('カテゴリの合計は常に 190 になる', () => {
    for (const rules of [
      DEFAULT_RULES,
      withRules({ shiroku: false }),
      withRules({ gyakuSolo: false }),
      withRules({ pinRanks: ALL_PIN_RANKS }),
      withRules({ pinzoroPosition: 'secondHighest' }),
    ]) {
      const counts = categoryCounts(rules)
      const total = Object.values(counts).reduce((a, b) => a + b, 0)
      expect(total).toBe(190)
    }
  })
})

describe('役の強さの全順序', () => {
  /** FLOW を除く全役を、強い順に並べた役名の一覧 */
  function rankingOf(rules: RuleVariant): string[] {
    const byName = new Map<string, number>()
    for (const combo of COMBOS) {
      const h = evaluateHand(combo, rules)
      if (h.category === 'FLOW') continue
      const known = byName.get(h.name)
      if (known !== undefined) {
        // 同じ役名なら必ず同じスコアでなければならない
        expect(known).toBe(h.score)
      }
      byName.set(h.name, h.score)
    }
    return [...byName.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name)
  }

  it('既定ルールの序列が調査結果どおりである', () => {
    expect(rankingOf(DEFAULT_RULES)).toEqual([
      // ソロ
      'バクダン',
      '9ソロ',
      '8ソロ',
      '7ソロ',
      '6ソロ',
      '5ソロ',
      '4ソロ',
      '3ソロ',
      '2ソロ',
      'ピンゾロ',
      // 逆ソロ
      '逆ソロ',
      // ピン
      'テンピン',
      'クッピン',
      'ゴピン',
      // 数字
      'カブ',
      '8',
      '7',
      '6',
      '5',
      '4',
      '3',
      '2',
      '1',
      'ブタ',
    ])
  })

  it('pinzoroPosition=secondHighest ではピンゾロだけが移動する', () => {
    const ranking = rankingOf(withRules({ pinzoroPosition: 'secondHighest' }))
    expect(ranking.slice(0, 4)).toEqual(['バクダン', 'ピンゾロ', '9ソロ', '8ソロ'])
    expect(ranking).toHaveLength(24)
  })

  it('異なる役名は必ず異なるスコアを持つ（同点は同一役に限られる）', () => {
    const scoreToNames = new Map<number, Set<string>>()
    for (const combo of COMBOS) {
      const h = evaluateHand(combo, DEFAULT_RULES)
      if (h.category === 'FLOW') continue
      const set = scoreToNames.get(h.score) ?? new Set<string>()
      set.add(h.name)
      scoreToNames.set(h.score, set)
    }
    for (const [, names] of scoreToNames) {
      expect(names.size).toBe(1)
    }
  })
})

describe('バクダンの一意性', () => {
  it('バクダンは 190 通り中ちょうど 1 通りしか存在しない', () => {
    // 10 は山札に 2 枚しかないため、バクダンを成立させられるのは常に 1 人だけ。
    // したがってバクダン同士の引き分けは原理的に起こらない。
    const bombs = COMBOS.filter((c) => evaluateHand(c, DEFAULT_RULES).name === 'バクダン')
    expect(bombs).toHaveLength(1)
  })

  it('ソロは各ランクちょうど 1 通りずつ存在する', () => {
    const soloCounts = new Map<number, number>()
    for (const combo of COMBOS) {
      const h = evaluateHand(combo, DEFAULT_RULES)
      if (h.category !== 'SOLO') continue
      soloCounts.set(h.rank, (soloCounts.get(h.rank) ?? 0) + 1)
    }
    expect(soloCounts.size).toBe(10)
    for (const [, count] of soloCounts) {
      expect(count).toBe(1)
    }
  })
})
