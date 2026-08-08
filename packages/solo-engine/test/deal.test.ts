import { describe, expect, it } from 'vitest'
import { ALL_SUITS, BLACK_DECK_SIZE, cardId, createDeck, FULL_DECK_SIZE } from '../src/card'
import { dealHands, shuffle } from '../src/deal'
import { mulberry32 } from '../src/rng'
import { withRules } from '../src/rules'

describe('山札', () => {
  it('既定は黒 2 スートの 20 枚である', () => {
    expect(createDeck()).toHaveLength(BLACK_DECK_SIZE)
    expect(BLACK_DECK_SIZE).toBe(20)
    expect(createDeck().every((c) => c.suit === 'S' || c.suit === 'C')).toBe(true)
  })

  it('4 スート指定なら 40 枚になる', () => {
    expect(createDeck(ALL_SUITS)).toHaveLength(FULL_DECK_SIZE)
    expect(FULL_DECK_SIZE).toBe(40)
  })

  it('A〜10 が 2 枚ずつで、重複がない', () => {
    const ids = createDeck().map(cardId)
    expect(new Set(ids).size).toBe(20)
    for (let rank = 1; rank <= 10; rank++) {
      expect(createDeck().filter((c) => c.rank === rank)).toHaveLength(2)
    }
  })
})

describe('シャッフル', () => {
  it('元の配列を破壊せず、枚数と中身を保つ', () => {
    const deck = createDeck()
    const shuffled = shuffle(deck, mulberry32(1))
    expect(deck.map(cardId)).toEqual(createDeck().map(cardId))
    expect(shuffled).toHaveLength(BLACK_DECK_SIZE)
    expect(new Set(shuffled.map(cardId))).toEqual(new Set(deck.map(cardId)))
  })

  it('同じシードなら同じ結果になる', () => {
    const a = shuffle(createDeck(), mulberry32(42)).map(cardId)
    const b = shuffle(createDeck(), mulberry32(42)).map(cardId)
    expect(a).toEqual(b)
  })

  it('シードが違えば結果も変わる', () => {
    const a = shuffle(createDeck(), mulberry32(1)).map(cardId)
    const b = shuffle(createDeck(), mulberry32(2)).map(cardId)
    expect(a).not.toEqual(b)
  })
})

describe('配札', () => {
  it('各プレイヤーに 2 枚ずつ配る', () => {
    const hands = dealHands(['a', 'b', 'c'], mulberry32(7))
    expect(Object.keys(hands)).toEqual(['a', 'b', 'c'])
    for (const h of Object.values(hands)) {
      expect(h).toHaveLength(2)
    }
  })

  it('プレイヤー間でカードが重複しない', () => {
    for (let seed = 0; seed < 200; seed++) {
      const hands = dealHands(['a', 'b', 'c', 'd', 'e', 'f'], mulberry32(seed))
      const ids = Object.values(hands).flat().map(cardId)
      expect(new Set(ids).size).toBe(12)
    }
  })

  it('毎回 20 枚を戻して再シャッフルする（山札の引き継ぎはしない）', () => {
    // 6 人 × 2 枚 = 12 枚。山札を引き継いでいれば 2 回目は 8 枚しか残らず配れない。
    // 連続で配れること自体が、毎回山札を戻している証拠になる。
    const rng = mulberry32(3)
    const players = ['a', 'b', 'c', 'd', 'e', 'f']
    for (let round = 0; round < 5; round++) {
      const hands = dealHands(players, rng)
      expect(new Set(Object.values(hands).flat().map(cardId)).size).toBe(12)
    }
  })

  it('人数が範囲外なら例外を投げる', () => {
    expect(() => dealHands(['a'], mulberry32(1))).toThrow(RangeError)
    expect(() => dealHands(['a', 'b', 'c', 'd', 'e', 'f', 'g'], mulberry32(1))).toThrow(RangeError)
  })

  it('プレイヤー ID が重複していれば例外を投げる', () => {
    expect(() => dealHands(['a', 'a'], mulberry32(1))).toThrow()
  })

  it('40 枚構成では赤いカードも配られる', () => {
    const rules = withRules({ deck: 'FULL40' })
    let sawRed = false
    for (let seed = 0; seed < 50 && !sawRed; seed++) {
      const hands = dealHands(['a', 'b', 'c'], mulberry32(seed), rules)
      sawRed = Object.values(hands)
        .flat()
        .some((card) => card.suit === 'H' || card.suit === 'D')
    }
    expect(sawRed).toBe(true)
  })
})
