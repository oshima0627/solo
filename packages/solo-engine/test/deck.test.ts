import { describe, expect, it } from 'vitest'
import {
  BLACK_SUITS,
  colorOfCard,
  createDeck,
  DECK_SIZE,
  oppositeColor,
  RED_SUITS,
  suitsForColor,
} from '../src/card'
import { dealHands } from '../src/deal'
import { evaluateHand, isBomb } from '../src/hand'
import { mulberry32 } from '../src/rng'
import { DEFAULT_RULES, withRules } from '../src/rules'
import { reduce } from '../src/game/reducer'
import { dealForRound } from '../src/game/selectors'
import { act, FOLD, PLAY, setup, start } from './gameHelpers'
import { hand } from './helpers'

/**
 * 山札は常に 1 色 20 枚。
 * バクダンが出たら黒（♠♣）と赤（♥♦）を入れ替える。
 */

describe('山札の色', () => {
  it('どちらの色でも 20 枚で、ランクの構成は同じ', () => {
    const black = createDeck(suitsForColor('BLACK'))
    const red = createDeck(suitsForColor('RED'))
    expect(black).toHaveLength(DECK_SIZE)
    expect(red).toHaveLength(DECK_SIZE)
    expect(black.map((c) => c.rank).sort()).toEqual(red.map((c) => c.rank).sort())
  })

  it('黒は ♠♣、赤は ♥♦ になる', () => {
    expect(suitsForColor('BLACK')).toEqual(BLACK_SUITS)
    expect(suitsForColor('RED')).toEqual(RED_SUITS)
    expect(createDeck(suitsForColor('RED')).every((c) => colorOfCard(c) === 'RED')).toBe(true)
  })

  it('色を反転できる', () => {
    expect(oppositeColor('BLACK')).toBe('RED')
    expect(oppositeColor('RED')).toBe('BLACK')
  })

  it('指定した色のカードだけが配られる', () => {
    const hands = dealHands(['a', 'b', 'c'], mulberry32(1), 'RED')
    expect(
      Object.values(hands)
        .flat()
        .every((card) => colorOfCard(card) === 'RED'),
    ).toBe(true)
  })
})

describe('バクダンは色に関わらず 10 のペア', () => {
  it('黒の 10 ペアはバクダン', () => {
    expect(isBomb(evaluateHand(hand(10, 10, ['S', 'C']), DEFAULT_RULES))).toBe(true)
  })

  it('赤の 10 ペアもバクダン', () => {
    expect(isBomb(evaluateHand(hand(10, 10, ['H', 'D']), DEFAULT_RULES))).toBe(true)
  })

  it('役名とスコアは色によって変わらない', () => {
    const black = evaluateHand(hand(10, 10, ['S', 'C']), DEFAULT_RULES)
    const red = evaluateHand(hand(10, 10, ['H', 'D']), DEFAULT_RULES)
    expect(black.name).toBe('バクダン')
    expect(red.name).toBe('バクダン')
    expect(black.score).toBe(red.score)
  })
})

describe('バクダンで山札を入れ替える', () => {
  it('開始時は黒の山札を使う', () => {
    const s = setup()
    expect(s.deckColor).toBe('BLACK')
    const dealt = start(s, { a: [1, 9], b: [1, 8], c: [3, 7] })
    expect(dealt.history).toHaveLength(0)
  })

  it('バクダンが公開されたら次のラウンドから赤になる', () => {
    let s = start(setup(), { a: [10, 10], b: [1, 9], c: [1, 8] })
    s = act(s, 'a', PLAY)
    s = act(s, 'b', PLAY)
    s = act(s, 'c', PLAY)

    const result = s.history.at(-1)!
    expect(result.deckColor).toBe('BLACK') // この局は黒で戦った
    expect(result.deckSwapped).toBe(true)
    expect(s.deckColor).toBe('RED') // 次の局から赤

    s = reduce(s, { type: 'NEXT_ROUND' })
    s = reduce(s, dealForRound(s, mulberry32(1)))
    const dealt = Object.values(s.round!.hands).flat()
    expect(dealt.every((card) => colorOfCard(card) === 'RED')).toBe(true)
  })

  it('もう一度バクダンが出れば黒に戻る', () => {
    let s = start(setup(), { a: [10, 10], b: [1, 9], c: [1, 8] })
    s = act(s, 'a', PLAY)
    s = act(s, 'b', PLAY)
    s = act(s, 'c', PLAY)
    expect(s.deckColor).toBe('RED')

    s = reduce(s, { type: 'NEXT_ROUND' })
    s = start(s, { a: [10, 10], b: [1, 9], c: [1, 8] })
    s = act(s, 'a', PLAY)
    s = act(s, 'b', PLAY)
    s = act(s, 'c', PLAY)
    expect(s.deckColor).toBe('BLACK')
  })

  it('バクダンが出なければ色は変わらない', () => {
    let s = start(setup(), { a: [1, 9], b: [1, 8], c: [3, 7] })
    s = act(s, 'a', PLAY)
    s = act(s, 'b', PLAY)
    s = act(s, 'c', PLAY)
    expect(s.history.at(-1)!.deckSwapped).toBe(false)
    expect(s.deckColor).toBe('BLACK')
  })

  it('バクダンを持っていても降りて公開しなければ入れ替わらない', () => {
    let s = start(setup(), { a: [10, 10], b: [1, 9], c: [1, 8] })
    s = act(s, 'a', FOLD)
    s = act(s, 'b', PLAY)
    s = act(s, 'c', PLAY)
    expect(s.history.at(-1)!.deckSwapped).toBe(false)
    expect(s.deckColor).toBe('BLACK')
  })

  it('レイズ方式のブラフ勝ちでは手札が公開されないので入れ替わらない', () => {
    let s = start(setup({ bettingMode: 'RAISE' }), { a: [10, 10], b: [1, 9], c: [1, 8] })
    s = act(s, 'a', { type: 'RAISE', amount: 5 })
    s = act(s, 'b', FOLD)
    s = act(s, 'c', FOLD)
    expect(s.history.at(-1)!.outcome.outcome).toBe('WIN_BY_FOLD')
    expect(s.history.at(-1)!.deckSwapped).toBe(false)
    expect(s.deckColor).toBe('BLACK')
  })

  it('流局でもバクダンが公開されていれば入れ替わる', () => {
    // シロクで流局しても、バクダンは場に出ている
    let s = start(setup(), { a: [4, 6], b: [10, 10], c: [1, 9] })
    s = act(s, 'a', PLAY)
    s = act(s, 'b', PLAY)
    s = act(s, 'c', PLAY)
    expect(s.history.at(-1)!.outcome.outcome).toBe('FLOW')
    expect(s.deckColor).toBe('RED')
  })

  it('設定を切ると入れ替わらない', () => {
    const rules = withRules({ swapDeckOnBomb: false })
    let s = start(setup({ rules }), { a: [10, 10], b: [1, 9], c: [1, 8] })
    s = act(s, 'a', PLAY)
    s = act(s, 'b', PLAY)
    s = act(s, 'c', PLAY)
    expect(s.history.at(-1)!.deckSwapped).toBe(false)
    expect(s.deckColor).toBe('BLACK')
  })
})

describe('色は勝敗に影響しない', () => {
  it('赤の山札でも役の判定はまったく同じ', () => {
    const pairs: [number, number][] = [
      [1, 9],
      [1, 8],
      [4, 6],
      [9, 6],
      [10, 10],
      [3, 7],
    ]
    for (const [x, y] of pairs) {
      const black = evaluateHand(hand(x as never, y as never, ['S', 'C']), DEFAULT_RULES)
      const red = evaluateHand(hand(x as never, y as never, ['H', 'D']), DEFAULT_RULES)
      expect(red.name).toBe(black.name)
      expect(red.score).toBe(black.score)
      expect(red.category).toBe(black.category)
    }
  })
})
