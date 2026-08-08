import { describe, expect, it } from 'vitest'
import { evaluateHand } from '../src/hand'
import { DEFAULT_RULES } from '../src/rules'
import { isCarryOver, resolveShowdown, type ShowdownEntry } from '../src/showdown'
import { hand } from './helpers'
import type { Rank, Suit } from '../src/card'

const R = DEFAULT_RULES

function entry(playerId: string, a: Rank, b: Rank, suits: [Suit, Suit] = ['S', 'C']): ShowdownEntry {
  return { playerId, hand: evaluateHand(hand(a, b, suits), R) }
}

describe('シロクは役比較よりも先に処理される', () => {
  it('シロク保持者がいれば、バクダンがあっても流局する', () => {
    const result = resolveShowdown([
      entry('a', 10, 10),
      entry('b', 4, 6),
      entry('c', 1, 9),
    ])
    expect(result.outcome).toBe('FLOW')
    if (result.outcome === 'FLOW') {
      expect(result.flowPlayers).toEqual(['b'])
    }
  })

  it('シロクが複数いても流局する', () => {
    const result = resolveShowdown([
      entry('a', 4, 6, ['S', 'S']),
      entry('b', 4, 6, ['C', 'C']),
      entry('c', 9, 9),
    ])
    expect(result.outcome).toBe('FLOW')
    if (result.outcome === 'FLOW') {
      expect(result.flowPlayers).toEqual(['a', 'b'])
    }
  })

  it('流局は持ち越しになる', () => {
    expect(isCarryOver(resolveShowdown([entry('a', 4, 6), entry('b', 9, 9)]))).toBe(true)
  })
})

describe('勝敗の決定', () => {
  it('最も強い役の 1 人が勝つ', () => {
    const result = resolveShowdown([
      entry('a', 1, 8), // カブ
      entry('b', 1, 9), // クッピン
      entry('c', 3, 7), // ブタ
    ])
    expect(result.outcome).toBe('WIN')
    if (result.outcome === 'WIN') {
      expect(result.winner).toBe('b')
      expect(result.hand.name).toBe('クッピン')
      expect(result.bombPlayer).toBeNull()
    }
  })

  it('バクダンの保持者を報告する（追加徴収の判定用）', () => {
    const result = resolveShowdown([entry('a', 10, 10), entry('b', 9, 9)])
    expect(result.outcome).toBe('WIN')
    if (result.outcome === 'WIN') {
      expect(result.winner).toBe('a')
      expect(result.bombPlayer).toBe('a')
    }
  })

  it('公開者が 1 人だけならその人が勝つ', () => {
    const result = resolveShowdown([entry('a', 3, 7)])
    expect(result.outcome).toBe('WIN')
    if (result.outcome === 'WIN') expect(result.winner).toBe('a')
  })

  it('勝者が決まった場合は持ち越しにならない', () => {
    expect(isCarryOver(resolveShowdown([entry('a', 10, 10), entry('b', 9, 9)]))).toBe(false)
  })
})

describe('引き分け', () => {
  it('同じ役が並んだら引き分けになる（例: 両者テンピン）', () => {
    // A と 10 はそれぞれ 2 枚あるため、2 人が同時にテンピンを作れる
    const result = resolveShowdown([
      entry('a', 1, 10, ['S', 'S']),
      entry('b', 1, 10, ['C', 'C']),
      entry('c', 3, 7),
    ])
    expect(result.outcome).toBe('DRAW')
    if (result.outcome === 'DRAW') {
      expect(result.players).toEqual(['a', 'b'])
      expect(result.name).toBe('テンピン')
    }
  })

  it('同じ数字役でも引き分けになる', () => {
    const result = resolveShowdown([
      entry('a', 2, 8), // ブタ
      entry('b', 3, 7), // ブタ
    ])
    expect(result.outcome).toBe('DRAW')
  })

  it('引き分けは持ち越しになる', () => {
    expect(isCarryOver(resolveShowdown([entry('a', 2, 8), entry('b', 3, 7)]))).toBe(true)
  })
})

describe('全員降り', () => {
  it('公開者がいなければ NO_CONTEST になる', () => {
    const result = resolveShowdown([])
    expect(result.outcome).toBe('NO_CONTEST')
    expect(isCarryOver(result)).toBe(true)
  })
})
