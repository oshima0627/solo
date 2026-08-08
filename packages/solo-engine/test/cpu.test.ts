import { describe, expect, it } from 'vitest'
import { decideCpuAction, estimateWinRate } from '../src/cpu'
import { availableActions, currentPlayerId } from '../src/game/selectors'
import { reduce } from '../src/game/reducer'
import { dealForRound } from '../src/game/selectors'
import { mulberry32 } from '../src/rng'
import { DEFAULT_RULES } from '../src/rules'
import { act, setup, start } from './gameHelpers'
import { hand } from './helpers'

const R = DEFAULT_RULES

describe('勝率の見積もり', () => {
  it('シロクは流局にできるので勝率 1 とみなす', () => {
    expect(estimateWinRate(hand(4, 6), R)).toBe(1)
  })

  it('バクダンは（シロクを除いて）ほぼすべてに勝つ', () => {
    expect(estimateWinRate(hand(10, 10, ['S', 'C']), R)).toBeGreaterThan(0.98)
  })

  it('ブタは勝率が低い', () => {
    expect(estimateWinRate(hand(3, 7), R)).toBeLessThan(0.15)
  })

  it('役が弱くなるほど勝率は下がる（同率はありうる）', () => {
    const ordered = [
      hand(10, 10, ['S', 'C']), // バクダン
      hand(9, 6), // 逆ソロ
      hand(1, 10), // テンピン
      hand(1, 9), // クッピン
      hand(1, 8), // カブ
      hand(3, 7), // ブタ
    ].map((cards) => estimateWinRate(cards, R))

    for (let i = 1; i < ordered.length; i++) {
      expect(ordered[i]!).toBeLessThanOrEqual(ordered[i - 1]!)
    }
    // 離れた役同士なら確実に差がつく
    expect(ordered[0]!).toBeGreaterThan(ordered[2]!)
    expect(ordered[2]!).toBeGreaterThan(ordered[4]!)
    expect(ordered[4]!).toBeGreaterThan(ordered[5]!)
  })

  it('自分が持っている札の分だけ相手の強い役が潰れる（ブロック効果）', () => {
    // 逆ソロ（9-6）は 9 と 6 を 1 枚ずつ使うため、相手は 9ソロ も 6ソロ も作れない。
    // 一方 2ソロ が潰すのは 2ソロ だけで、これは元から弱い役。
    // その結果、役の強さでは 2ソロ が上でも、勝率では逆ソロが上回る。
    expect(estimateWinRate(hand(9, 6), R)).toBeGreaterThan(
      estimateWinRate(hand(2, 2, ['S', 'C']), R),
    )
  })

  it('テンピンとクッピンの勝率はちょうど等しくなる', () => {
    // テンピン（A-10）が負ける相手は逆ソロ 4 通り。
    // クッピン（A-9）は 9 を 1 枚握るため逆ソロは 2 通りに減るが、
    // 代わりに上位のテンピン 2 通りに負ける。差し引きがぴたりと釣り合う。
    expect(estimateWinRate(hand(1, 10), R)).toBe(estimateWinRate(hand(1, 9), R))
  })

  it('クッピンはカブより勝率が高い（ピン役の救済が効いている）', () => {
    expect(estimateWinRate(hand(1, 9), R)).toBeGreaterThan(estimateWinRate(hand(1, 8), R))
  })
})

describe('CPU の判断', () => {
  it('アンティ方式でバクダンなら必ず勝負する', () => {
    const s = start(setup(), { a: [10, 10], b: [1, 9], c: [1, 8] })
    for (let seed = 0; seed < 30; seed++) {
      expect(decideCpuAction(s, 'a', mulberry32(seed)).type).toBe('PLAY')
    }
  })

  it('アンティ方式でブタなら必ず降りる', () => {
    const s = start(setup(), { a: [3, 7], b: [1, 9], c: [1, 8] })
    for (let seed = 0; seed < 30; seed++) {
      expect(decideCpuAction(s, 'a', mulberry32(seed)).type).toBe('FOLD')
    }
  })

  it('シロクは追加の場代が要らないので必ず勝負する', () => {
    const s = start(setup(), { a: [4, 6], b: [1, 9], c: [1, 8] })
    expect(decideCpuAction(s, 'a', mulberry32(1)).type).toBe('PLAY')
  })

  it('レイズ方式で強い手ならレイズする', () => {
    const s = start(setup({ bettingMode: 'RAISE' }), { a: [10, 10], b: [1, 9], c: [1, 8] })
    expect(decideCpuAction(s, 'a', mulberry32(1)).type).toBe('RAISE')
  })

  it('レイズ方式で追加の支払いがなければ降りない', () => {
    // 先頭は差額 0 なのでチェックできる
    const s = start(setup({ bettingMode: 'RAISE' }), { a: [3, 7], b: [1, 9], c: [1, 8] })
    expect(decideCpuAction(s, 'a', mulberry32(1)).type).toBe('CALL')
  })

  it('レイズ方式で弱い手にコール額が付いていれば降りる', () => {
    let s = start(setup({ bettingMode: 'RAISE' }), { a: [10, 10], b: [3, 7], c: [1, 8] })
    s = act(s, 'a', { type: 'RAISE', amount: 10 })
    expect(decideCpuAction(s, 'b', mulberry32(3)).type).toBe('FOLD')
  })

  it('常に選択可能な行動だけを返す', () => {
    for (const mode of ['ANTE', 'RAISE'] as const) {
      const rng = mulberry32(mode === 'ANTE' ? 7 : 8)
      let s = setup({ bettingMode: mode, endCondition: { type: 'ROUNDS', count: 30 } })
      while (s.phase !== 'GAME_END') {
        s = reduce(s, dealForRound(s, rng))
        if (s.phase === 'GAME_END') break
        while (s.phase === 'DECIDE' || s.phase === 'BET') {
          const playerId = currentPlayerId(s)!
          const action = decideCpuAction(s, playerId, rng)
          expect(availableActions(s, playerId)).toContain(action.type)
          s = act(s, playerId, action)
        }
        s = reduce(s, { type: 'NEXT_ROUND' })
      }
      expect(s.history.length).toBeGreaterThan(0)
    }
  })
})

describe('CPU 同士の通し対局', () => {
  for (const mode of ['ANTE', 'RAISE'] as const) {
    it(`${mode} 方式：最後まで進行し、チップの総量が保存される`, () => {
      const rng = mulberry32(mode === 'ANTE' ? 101 : 202)
      let s = setup(
        { bettingMode: mode, endCondition: { type: 'ROUNDS', count: 40 } },
        ['a', 'b', 'c', 'd'],
      )
      const total = s.config.players.length * s.config.initialChips

      while (s.phase !== 'GAME_END') {
        s = reduce(s, dealForRound(s, rng))
        if (s.phase === 'GAME_END') break
        while (s.phase === 'DECIDE' || s.phase === 'BET') {
          const playerId = currentPlayerId(s)!
          s = act(s, playerId, decideCpuAction(s, playerId, rng))
        }
        const held = Object.values(s.chips).reduce((x, y) => x + y, 0)
        expect(held + s.carryOver).toBe(total)
        s = reduce(s, { type: 'NEXT_ROUND' })
      }
      expect(s.roundNo).toBeGreaterThan(5)
    })
  }
})
