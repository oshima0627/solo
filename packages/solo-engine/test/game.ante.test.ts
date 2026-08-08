import { describe, expect, it } from 'vitest'
import { reduce } from '../src/game/reducer'
import { currentPlayerId } from '../src/game/selectors'
import { act, FOLD, PLAY, setup, start } from './gameHelpers'

describe('アンティ方式：基本の 1 周', () => {
  it('場代を徴収して DECIDE に入る', () => {
    const s = start(setup(), { a: [1, 9], b: [1, 8], c: [3, 7] })
    expect(s.phase).toBe('DECIDE')
    expect(s.round?.pot).toBe(3)
    expect(s.chips).toEqual({ a: 99, b: 99, c: 99 })
    expect(currentPlayerId(s)).toBe('a')
    expect(s.roundNo).toBe(1)
  })

  it('全員が 1 度ずつ行動すると必ず決着する', () => {
    let s = start(setup(), { a: [1, 9], b: [1, 8], c: [3, 7] })
    s = act(s, 'a', PLAY) // クッピン
    expect(s.phase).toBe('DECIDE')
    s = act(s, 'b', PLAY) // カブ
    expect(s.phase).toBe('DECIDE')
    s = act(s, 'c', FOLD) // ブタなので降りる
    expect(s.phase).toBe('RESULT')

    const result = s.history.at(-1)!
    expect(result.outcome.outcome).toBe('WIN')
    if (result.outcome.outcome === 'WIN') {
      expect(result.outcome.winner).toBe('a')
      expect(result.outcome.hand.name).toBe('クッピン')
    }
    expect(result.revealed).toEqual(['a', 'b'])
    expect(result.folded).toEqual(['c'])
  })

  it('勝負した人だけが追加の場代を払い、勝者が総取りする', () => {
    let s = start(setup(), { a: [1, 9], b: [1, 8], c: [3, 7] })
    s = act(s, 'a', PLAY)
    s = act(s, 'b', PLAY)
    s = act(s, 'c', FOLD)

    // 場代 3 + 追加 2 = 5 を A が獲得
    expect(s.chips).toEqual({ a: 103, b: 98, c: 99 })
    const result = s.history.at(-1)!
    expect(result.pot).toBe(5)
    expect(result.payouts).toEqual({ a: 3, b: -2, c: -1 })
  })

  it('収支の合計は常に 0 になる', () => {
    let s = start(setup(), { a: [1, 9], b: [1, 8], c: [3, 7] })
    s = act(s, 'a', PLAY)
    s = act(s, 'b', PLAY)
    s = act(s, 'c', PLAY)
    const total = Object.values(s.history.at(-1)!.payouts).reduce((x, y) => x + y, 0)
    expect(total).toBe(0)
  })

  it('勝者が次のラウンドの先頭になる', () => {
    let s = start(setup(), { a: [3, 7], b: [1, 9], c: [1, 8] })
    s = act(s, 'a', PLAY)
    s = act(s, 'b', PLAY)
    s = act(s, 'c', PLAY)
    expect(s.startPlayerId).toBe('b')

    s = reduce(s, { type: 'NEXT_ROUND' })
    s = start(s, { a: [2, 2], b: [3, 3], c: [4, 4] })
    expect(s.round?.order).toEqual(['b', 'c', 'a'])
  })
})

describe('シロクの流れ', () => {
  it('シロク保持者は追加の場代を免除される', () => {
    let s = start(setup(), { a: [4, 6], b: [1, 9], c: [1, 8] })
    s = act(s, 'a', PLAY)
    // A は追加を払っていない
    expect(s.chips.a).toBe(99)
    expect(s.round?.pot).toBe(3)
  })

  it('シロクが公開されると、バクダンがあっても流局して持ち越しになる', () => {
    let s = start(setup(), { a: [4, 6], b: [10, 10], c: [1, 9] })
    s = act(s, 'a', PLAY)
    s = act(s, 'b', PLAY)
    s = act(s, 'c', PLAY)

    const result = s.history.at(-1)!
    expect(result.outcome.outcome).toBe('FLOW')
    expect(result.bombCharge).toBe(0) // 流局なのでバクダンの追加徴収は発生しない
    expect(s.carryOver).toBe(5) // 場代 3 + B と C の追加 2
    expect(s.chips).toEqual({ a: 99, b: 98, c: 98 })
  })

  it('降りたシロクは公開されないので流局を起こさない', () => {
    let s = start(setup(), { a: [4, 6], b: [10, 10], c: [1, 9] })
    s = act(s, 'a', FOLD)
    s = act(s, 'b', PLAY)
    s = act(s, 'c', PLAY)
    expect(s.history.at(-1)!.outcome.outcome).toBe('WIN')
  })
})

describe('バクダンの追加徴収', () => {
  it('勝負に残っている人がバクダン保持者に追加を支払う', () => {
    let s = start(setup(), { a: [10, 10], b: [1, 9], c: [1, 8] })
    s = act(s, 'a', PLAY)
    s = act(s, 'b', PLAY)
    s = act(s, 'c', PLAY)

    const result = s.history.at(-1)!
    expect(result.bombCharge).toBe(3)
    // 場代 3 + 追加場代 3 + バクダン徴収 6 = 12
    expect(result.pot).toBe(12)
    expect(s.chips).toEqual({ a: 110, b: 95, c: 95 })
  })

  it('降りた人は支払わない', () => {
    let s = start(setup(), { a: [10, 10], b: [1, 9], c: [1, 8] })
    s = act(s, 'a', PLAY)
    s = act(s, 'b', PLAY)
    s = act(s, 'c', FOLD)
    // C は場代 1 だけ
    expect(s.chips.c).toBe(99)
  })
})

describe('引き分けと全員降り', () => {
  it('同じ役なら引き分けになり持ち越す', () => {
    let s = start(setup(), { a: [1, 10], b: [1, 10], c: [3, 7] })
    s = act(s, 'a', PLAY)
    s = act(s, 'b', PLAY)
    s = act(s, 'c', FOLD)

    const result = s.history.at(-1)!
    expect(result.outcome.outcome).toBe('DRAW')
    expect(s.carryOver).toBe(5)
    expect(s.chips).toEqual({ a: 98, b: 98, c: 99 })
  })

  it('全員が降りたら NO_CONTEST になり場代が持ち越される', () => {
    let s = start(setup(), { a: [3, 7], b: [2, 8], c: [4, 5] })
    s = act(s, 'a', FOLD)
    s = act(s, 'b', FOLD)
    s = act(s, 'c', FOLD)

    expect(s.history.at(-1)!.outcome.outcome).toBe('NO_CONTEST')
    expect(s.carryOver).toBe(3)
  })
})

describe('持ち越しの累積と清算', () => {
  it('持ち越しが累積し、次に勝った人がまとめて獲得する', () => {
    // 1 ラウンド目：全員降りて 3 が持ち越し
    let s = start(setup(), { a: [3, 7], b: [2, 8], c: [4, 5] })
    s = act(s, 'a', FOLD)
    s = act(s, 'b', FOLD)
    s = act(s, 'c', FOLD)
    expect(s.carryOver).toBe(3)

    // 2 ラウンド目：また全員降りて累積
    s = reduce(s, { type: 'NEXT_ROUND' })
    s = start(s, { a: [3, 7], b: [2, 8], c: [4, 5] })
    s = act(s, 'a', FOLD)
    s = act(s, 'b', FOLD)
    s = act(s, 'c', FOLD)
    expect(s.carryOver).toBe(6)

    // 3 ラウンド目：A が勝って持ち越しごと獲得
    s = reduce(s, { type: 'NEXT_ROUND' })
    s = start(s, { a: [1, 9], b: [3, 7], c: [2, 8] })
    s = act(s, 'a', PLAY)
    s = act(s, 'b', FOLD)
    s = act(s, 'c', FOLD)

    expect(s.carryOver).toBe(0)
    // 場代 3 + 追加 1 + 持ち越し 6 = 10
    expect(s.history.at(-1)!.pot).toBe(10)
    // A: 100 - 3ラウンド分の場代3 - 追加1 + 10 = 106
    expect(s.chips.a).toBe(106)
    expect(s.chips.b).toBe(97)
    expect(s.chips.c).toBe(97)
  })
})
