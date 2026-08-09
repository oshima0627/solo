import { describe, expect, it } from 'vitest'
import { availableActions, callAmount, currentPlayerId, maxRaise } from '../src/game/selectors'
import { act, CALL, FOLD, PLAY, raise, setup, start } from './gameHelpers'

const RAISE_MODE = { bettingMode: 'RAISE' } as const

describe('レイズ方式：ベットの周回', () => {
  it('レイズ・コール・降りで 1 周して決着する', () => {
    let s = start(setup(RAISE_MODE), { a: [1, 9], b: [1, 8], c: [3, 7] })
    expect(s.phase).toBe('BET')
    expect(s.round?.pot).toBe(3)

    s = act(s, 'a', raise(5))
    expect(s.round?.currentBet).toBe(5)
    expect(s.round?.pot).toBe(8)
    expect(currentPlayerId(s)).toBe('b')

    s = act(s, 'b', CALL)
    expect(s.round?.pot).toBe(13)
    expect(currentPlayerId(s)).toBe('c')

    s = act(s, 'c', FOLD)
    expect(s.phase).toBe('RESULT')

    // A（クッピン）が B（カブ）に勝つ
    expect(s.chips).toEqual({ a: 107, b: 94, c: 99 })
    expect(s.history.at(-1)!.payouts).toEqual({ a: 7, b: -6, c: -1 })
  })

  it('レイズが入ると、すでに行動した人にも手番が戻る', () => {
    let s = start(setup(RAISE_MODE), { a: [1, 9], b: [1, 8], c: [2, 2] })

    s = act(s, 'a', CALL) // チェック（差額 0）
    expect(s.round?.pot).toBe(3)
    expect(currentPlayerId(s)).toBe('b')

    s = act(s, 'b', raise(5))
    expect(currentPlayerId(s)).toBe('c')

    s = act(s, 'c', CALL)
    // 一度チェックした A にもう一度手番が回ってくる
    expect(currentPlayerId(s)).toBe('a')
    expect(s.phase).toBe('BET')

    s = act(s, 'a', CALL)
    expect(s.phase).toBe('RESULT')
    expect(s.round?.pot).toBe(18)
  })

  it('差額が 0 のコールはチェックとして機能する', () => {
    let s = start(setup(RAISE_MODE), { a: [1, 9], b: [1, 8], c: [3, 7] })
    s = act(s, 'a', CALL)
    s = act(s, 'b', CALL)
    s = act(s, 'c', CALL)
    expect(s.phase).toBe('RESULT')
    expect(s.round?.pot).toBe(3) // 場代のみ
  })
})

describe('レイズ方式：オールイン', () => {
  it('コール額に届かないオールインの後も周回が正しく終わる', () => {
    // 手持ちが足りない人はコール額に達しないまま行動済みになる。
    // これを飛ばさないと、同じプレイヤーに永久に手番が回り続ける。
    const base = setup({ ...RAISE_MODE, initialChips: 10 })
    let s = start({ ...base, chips: { a: 10, b: 2, c: 10 } }, {
      a: [1, 9],
      b: [3, 7],
      c: [1, 8],
    })

    s = act(s, 'a', raise(5))
    s = act(s, 'b', CALL) // 手持ち 1 しかないのでオールイン
    expect(s.chips.b).toBe(0)
    expect(s.round?.bets.b).toBe(1)
    expect(currentPlayerId(s)).toBe('c') // B に手番が戻らない

    s = act(s, 'c', CALL)
    expect(s.phase).toBe('RESULT')

    // サイドポットは扱わないので、オールインの B も全額を争う
    const held = Object.values(s.chips).reduce((x, y) => x + y, 0)
    expect(held).toBe(22)
  })
})

describe('レイズ方式：ブラフ勝ち', () => {
  it('残り 1 人になったら手札を公開せずに勝つ', () => {
    // A はブタだが、レイズで 2 人を降ろして勝つ
    let s = start(setup(RAISE_MODE), { a: [3, 7], b: [1, 9], c: [10, 10] })
    s = act(s, 'a', raise(5))
    s = act(s, 'b', FOLD)
    s = act(s, 'c', FOLD)

    const result = s.history.at(-1)!
    expect(result.outcome.outcome).toBe('WIN_BY_FOLD')
    if (result.outcome.outcome === 'WIN_BY_FOLD') {
      expect(result.outcome.winner).toBe('a')
    }
    // 誰も手札を公開していない
    expect(result.revealed).toEqual([])
    expect(s.chips).toEqual({ a: 102, b: 99, c: 99 })
  })

  it('自分の手番が来る前に全員が降りても勝てる', () => {
    // 一度も行動していないプレイヤーは PENDING のままなので、
    // 勝負に残っている人を 'PLAYING' だけで絞ると勝者がいなくなる
    let s = start(setup(RAISE_MODE), { a: [3, 7], b: [2, 8], c: [10, 10] })
    s = act(s, 'a', FOLD)
    s = act(s, 'b', FOLD)

    const result = s.history.at(-1)!
    expect(result.outcome.outcome).toBe('WIN_BY_FOLD')
    if (result.outcome.outcome === 'WIN_BY_FOLD') {
      expect(result.outcome.winner).toBe('c')
    }
    expect(s.chips).toEqual({ a: 99, b: 99, c: 102 })
    expect(s.carryOver).toBe(0)
  })

  it('2人でも、相手が降りればもう1人が勝つ', () => {
    let s = start(setup(RAISE_MODE, ['a', 'b']), { a: [3, 7], b: [1, 9] })
    s = act(s, 'a', FOLD)

    expect(s.history.at(-1)!.outcome.outcome).toBe('WIN_BY_FOLD')
    expect(s.chips).toEqual({ a: 99, b: 101 })
  })

  it('ブラフ勝ちではバクダンの追加徴収が起きない', () => {
    let s = start(setup(RAISE_MODE), { a: [10, 10], b: [1, 9], c: [1, 8] })
    s = act(s, 'a', raise(5))
    s = act(s, 'b', FOLD)
    s = act(s, 'c', FOLD)
    expect(s.history.at(-1)!.bombCharge).toBe(0)
  })
})

describe('レイズ方式：バクダンの追加徴収', () => {
  it('降りた人からも徴収する（アンティ方式との違い）', () => {
    let s = start(setup(RAISE_MODE), { a: [10, 10], b: [1, 9], c: [1, 8] })
    s = act(s, 'a', raise(5))
    s = act(s, 'b', CALL)
    s = act(s, 'c', FOLD)

    const result = s.history.at(-1)!
    expect(result.bombCharge).toBe(3)
    // 場代 3 + ベット 10 + 徴収 6 = 19
    expect(result.pot).toBe(19)
    // 降りた C も 3 を支払っている
    expect(s.chips).toEqual({ a: 113, b: 91, c: 96 })
  })
})

describe('レイズ方式：セレクタ', () => {
  it('コール額とレイズ上限を計算する', () => {
    let s = start(setup(RAISE_MODE), { a: [1, 9], b: [1, 8], c: [3, 7] })
    expect(callAmount(s, 'a')).toBe(0)
    expect(maxRaise(s, 'a')).toBe(99)

    s = act(s, 'a', raise(5))
    expect(callAmount(s, 'b')).toBe(5)
    expect(maxRaise(s, 'b')).toBe(94)
  })

  it('選べる行動を返す', () => {
    const s = start(setup(RAISE_MODE), { a: [1, 9], b: [1, 8], c: [3, 7] })
    expect(availableActions(s, 'a')).toEqual(['FOLD', 'CALL', 'RAISE'])
  })

  it('レイズできるチップがなければ RAISE が選択肢から外れる', () => {
    const base = setup({ ...RAISE_MODE, initialChips: 2, anteAmount: 1 })
    let s = start(base, { a: [1, 9], b: [1, 8], c: [3, 7] })
    s = act(s, 'a', raise(1)) // 残り 0
    expect(maxRaise(s, 'b')).toBe(0)
    expect(availableActions(s, 'b')).toEqual(['FOLD', 'CALL'])
  })
})

describe('レイズ方式：不正な操作', () => {
  it('手持ちを超えるレイズはできない', () => {
    const s = start(setup({ ...RAISE_MODE, initialChips: 10 }), {
      a: [1, 9],
      b: [1, 8],
      c: [3, 7],
    })
    expect(() => act(s, 'a', raise(100))).toThrow(RangeError)
  })

  it('レイズ額は 1 以上でなければならない', () => {
    const s = start(setup(RAISE_MODE), { a: [1, 9], b: [1, 8], c: [3, 7] })
    expect(() => act(s, 'a', raise(0))).toThrow(RangeError)
  })

  it('レイズ方式では PLAY を選べない', () => {
    const s = start(setup(RAISE_MODE), { a: [1, 9], b: [1, 8], c: [3, 7] })
    expect(() => act(s, 'a', PLAY)).toThrow()
  })

  it('手番でないプレイヤーは行動できない', () => {
    const s = start(setup(RAISE_MODE), { a: [1, 9], b: [1, 8], c: [3, 7] })
    expect(() => act(s, 'b', CALL)).toThrow()
  })
})

describe('アンティ方式の制約', () => {
  it('アンティ方式では CALL / RAISE を選べない', () => {
    const s = start(setup(), { a: [1, 9], b: [1, 8], c: [3, 7] })
    expect(() => act(s, 'a', CALL)).toThrow()
    expect(() => act(s, 'a', raise(3))).toThrow()
  })
})
