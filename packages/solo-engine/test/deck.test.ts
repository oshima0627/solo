import { describe, expect, it } from 'vitest'
import type { Card, Rank, Suit } from '../src/card'
import { ALL_SUITS, createDeck } from '../src/card'
import { compareHands, evaluateHand, isBomb, type HandCategory } from '../src/hand'
import { DEFAULT_RULES, withRules } from '../src/rules'
import { resolveShowdown } from '../src/showdown'

/**
 * 40 枚構成（4 スート）の検証。
 * 20 枚構成では 10ソロ が必ず黒のペアになるためバクダンと一致するが、
 * 40 枚構成では赤の絡む 10ソロ が存在し、バクダンはそのひとつ上に置かれる。
 */

const FULL = withRules({ deck: 'FULL40' })

function card(rank: Rank, suit: Suit): Card {
  return { rank, suit }
}

function allCombinations(): [Card, Card][] {
  const deck = createDeck(ALL_SUITS)
  const combos: [Card, Card][] = []
  for (let i = 0; i < deck.length; i++) {
    for (let j = i + 1; j < deck.length; j++) {
      combos.push([deck[i]!, deck[j]!])
    }
  }
  return combos
}

const COMBOS = allCombinations()

describe('40 枚構成の全 780 通り', () => {
  it('組み合わせは 780 通りある', () => {
    expect(COMBOS).toHaveLength(780)
  })

  it('カテゴリの内訳', () => {
    const counts: Record<HandCategory, number> = {
      FLOW: 0,
      SOLO: 0,
      GYAKU_SOLO: 0,
      PIN: 0,
      NUMBER: 0,
    }
    for (const combo of COMBOS) counts[evaluateHand(combo, FULL).category]++

    expect(counts).toEqual({
      SOLO: 60, // 10ランク × 4枚から2枚を選ぶ6通り
      FLOW: 16, // 4と6が4枚ずつ
      GYAKU_SOLO: 16,
      PIN: 48, // A と 10/9/5 の3種 × 16通り
      NUMBER: 640,
    })
  })
})

describe('バクダンは黒の 10 のペアに限られる', () => {
  it('♠10 と ♣10 だけがバクダン', () => {
    const bomb = evaluateHand([card(10, 'S'), card(10, 'C')], FULL)
    expect(bomb.name).toBe('バクダン')
    expect(isBomb(bomb)).toBe(true)
  })

  it('赤が絡む 10 のペアは 10ソロ になる', () => {
    for (const pair of [
      [card(10, 'H'), card(10, 'D')],
      [card(10, 'S'), card(10, 'H')],
      [card(10, 'C'), card(10, 'D')],
    ] as [Card, Card][]) {
      const hand = evaluateHand(pair, FULL)
      expect(hand.name).toBe('10ソロ')
      expect(isBomb(hand)).toBe(false)
    }
  })

  it('バクダン ＞ 10ソロ ＞ 9ソロ の順になる', () => {
    const bomb = evaluateHand([card(10, 'S'), card(10, 'C')], FULL)
    const tenSolo = evaluateHand([card(10, 'H'), card(10, 'D')], FULL)
    const nineSolo = evaluateHand([card(9, 'S'), card(9, 'C')], FULL)
    expect(compareHands(bomb, tenSolo)).toBeGreaterThan(0)
    expect(compareHands(tenSolo, nineSolo)).toBeGreaterThan(0)
  })

  it('バクダンは 780 通り中ちょうど 1 通りしかなく、単独のままである', () => {
    const bombs = COMBOS.filter((combo) => isBomb(evaluateHand(combo, FULL)))
    expect(bombs).toHaveLength(1)
  })

  it('10ソロ 同士の引き分けが起こりうる（20 枚構成では起こらない）', () => {
    const result = resolveShowdown([
      { playerId: 'a', hand: evaluateHand([card(10, 'S'), card(10, 'H')], FULL) },
      { playerId: 'b', hand: evaluateHand([card(10, 'C'), card(10, 'D')], FULL) },
    ])
    expect(result.outcome).toBe('DRAW')
    if (result.outcome === 'DRAW') expect(result.name).toBe('10ソロ')
  })
})

describe('20 枚構成との整合', () => {
  it('20 枚構成では 10 のペアは必ずバクダンになる', () => {
    const hand = evaluateHand([card(10, 'S'), card(10, 'C')], DEFAULT_RULES)
    expect(hand.name).toBe('バクダン')
    expect(isBomb(hand)).toBe(true)
  })

  it('ピンやシロクなどの判定は枚数構成に影響されない', () => {
    for (const rules of [DEFAULT_RULES, FULL]) {
      expect(evaluateHand([card(1, 'S'), card(9, 'C')], rules).name).toBe('クッピン')
      expect(evaluateHand([card(1, 'S'), card(8, 'C')], rules).name).toBe('カブ')
      expect(evaluateHand([card(4, 'S'), card(6, 'C')], rules).category).toBe('FLOW')
      expect(evaluateHand([card(9, 'S'), card(6, 'C')], rules).name).toBe('逆ソロ')
    }
  })
})
