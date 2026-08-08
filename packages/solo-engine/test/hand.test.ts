import { describe, expect, it } from 'vitest'
import { evaluateHand, compareHands, isBomb, isFlow, formatHand } from '../src/hand.js'
import { ALL_PIN_RANKS, DEFAULT_RULES, withRules } from '../src/rules.js'
import { hand } from './helpers.js'

const R = DEFAULT_RULES

describe('ピン役は「弱い手の救済」として機能する', () => {
  // 調査で判明した、初見のプレイヤーが最も混乱する構造。
  // 合計では弱くなる手だけがピン役になり、合計が強い A-8 は救済されない。

  it('A-10 は合計 1 だがテンピンになる', () => {
    const h = evaluateHand(hand(1, 10), R)
    expect(h.category).toBe('PIN')
    expect(h.name).toBe('テンピン')
  })

  it('A-9 は合計 0（ブタ）だがクッピンになる', () => {
    const h = evaluateHand(hand(1, 9), R)
    expect(h.category).toBe('PIN')
    expect(h.name).toBe('クッピン')
  })

  it('A-5 は合計 6 だがゴピンになる', () => {
    const h = evaluateHand(hand(1, 5), R)
    expect(h.category).toBe('PIN')
    expect(h.name).toBe('ゴピン')
  })

  it('A-8 は合計 9（カブ）なので救済されずピンにならない', () => {
    const h = evaluateHand(hand(1, 8), R)
    expect(h.category).toBe('NUMBER')
    expect(h.rank).toBe(9)
    expect(h.name).toBe('カブ')
  })

  it('ピンはカブより強い', () => {
    const kuppin = evaluateHand(hand(1, 9), R)
    const kabu = evaluateHand(hand(1, 8), R)
    expect(compareHands(kuppin, kabu)).toBeGreaterThan(0)
  })
})

describe('シロクの流れ（4-6）', () => {
  it('4-6 は合計 10（ブタ）ではなく FLOW になる', () => {
    const h = evaluateHand(hand(4, 6), R)
    expect(h.category).toBe('FLOW')
    expect(h.name).toBe('シロクの流れ')
    expect(isFlow(h)).toBe(true)
  })

  it('順序が逆でも成立する', () => {
    expect(evaluateHand(hand(6, 4), R).category).toBe('FLOW')
  })

  it('shiroku を off にすると数字 0（ブタ）になる', () => {
    const h = evaluateHand(hand(4, 6), withRules({ shiroku: false }))
    expect(h.category).toBe('NUMBER')
    expect(h.name).toBe('ブタ')
  })
})

describe('逆ソロ（9-6）', () => {
  it('9-6 は数字 5 ではなく逆ソロになる', () => {
    const h = evaluateHand(hand(9, 6), R)
    expect(h.category).toBe('GYAKU_SOLO')
    expect(h.name).toBe('逆ソロ')
  })

  it('逆ソロはどのピンよりも強く、どのソロよりも弱い', () => {
    const gyaku = evaluateHand(hand(9, 6), R)
    const tenpin = evaluateHand(hand(1, 10), R)
    const weakestSolo = evaluateHand(hand(1, 1), R)
    expect(compareHands(gyaku, tenpin)).toBeGreaterThan(0)
    expect(compareHands(gyaku, weakestSolo)).toBeLessThan(0)
  })

  it('gyakuSolo を off にすると数字 5 になる', () => {
    const h = evaluateHand(hand(9, 6), withRules({ gyakuSolo: false }))
    expect(h.category).toBe('NUMBER')
    expect(h.rank).toBe(5)
  })
})

describe('ソロ', () => {
  it('10-10 はバクダン', () => {
    const h = evaluateHand(hand(10, 10, ['S', 'C']), R)
    expect(h.category).toBe('SOLO')
    expect(h.name).toBe('バクダン')
    expect(isBomb(h)).toBe(true)
  })

  it('A-A はピンゾロ', () => {
    expect(evaluateHand(hand(1, 1, ['S', 'C']), R).name).toBe('ピンゾロ')
  })

  it('バクダンはすべての役より強い', () => {
    const bomb = evaluateHand(hand(10, 10, ['S', 'C']), R)
    for (const other of [hand(9, 9, ['S', 'C']), hand(1, 10), hand(9, 6), hand(1, 8)]) {
      expect(compareHands(bomb, evaluateHand(other, R))).toBeGreaterThan(0)
    }
  })

  it('既定ではピンゾロがソロの中で最弱', () => {
    const pinzoro = evaluateHand(hand(1, 1, ['S', 'C']), R)
    const two = evaluateHand(hand(2, 2, ['S', 'C']), R)
    expect(compareHands(pinzoro, two)).toBeLessThan(0)
    // ただし逆ソロよりは強い
    expect(compareHands(pinzoro, evaluateHand(hand(9, 6), R))).toBeGreaterThan(0)
  })

  it('pinzoroPosition=secondHighest ではバクダンの次に強くなる', () => {
    const rules = withRules({ pinzoroPosition: 'secondHighest' })
    const pinzoro = evaluateHand(hand(1, 1, ['S', 'C']), rules)
    const bomb = evaluateHand(hand(10, 10, ['S', 'C']), rules)
    const nine = evaluateHand(hand(9, 9, ['S', 'C']), rules)
    expect(compareHands(pinzoro, bomb)).toBeLessThan(0)
    expect(compareHands(pinzoro, nine)).toBeGreaterThan(0)
  })
})

describe('数字', () => {
  it('合計の一の位を取る', () => {
    expect(evaluateHand(hand(9, 10), R).rank).toBe(9) // 19 → 9
    expect(evaluateHand(hand(2, 8), R).rank).toBe(0) // 10 → 0
    expect(evaluateHand(hand(5, 7), R).rank).toBe(2) // 12 → 2
  })

  it('9 はカブ、0 はブタと呼ばれる', () => {
    expect(evaluateHand(hand(9, 10), R).name).toBe('カブ')
    expect(evaluateHand(hand(3, 7), R).name).toBe('ブタ')
  })

  it('カブはブタより強い', () => {
    expect(
      compareHands(evaluateHand(hand(9, 10), R), evaluateHand(hand(3, 7), R)),
    ).toBeGreaterThan(0)
  })
})

describe('pinRanks のバリアント', () => {
  it('all にすると A-8 が 8 ピンになる', () => {
    const h = evaluateHand(hand(1, 8), withRules({ pinRanks: ALL_PIN_RANKS }))
    expect(h.category).toBe('PIN')
    expect(h.name).toBe('8ピン')
  })

  it('all にすると A-4 はおいちょかぶ由来のシッピンと呼ばれる', () => {
    expect(evaluateHand(hand(1, 4), withRules({ pinRanks: ALL_PIN_RANKS })).name).toBe('シッピン')
  })

  it('A-A は pinRanks に関わらずソロのまま', () => {
    const h = evaluateHand(hand(1, 1, ['S', 'C']), withRules({ pinRanks: ALL_PIN_RANKS }))
    expect(h.category).toBe('SOLO')
  })
})

describe('表示', () => {
  it('カードと役名を整形する', () => {
    expect(formatHand(evaluateHand(hand(1, 9), R))).toBe('♠A ♣9（クッピン）')
  })
})
