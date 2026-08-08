import { describe, expect, it } from 'vitest'
import { mulberry32 } from '../src/rng.js'
import { DEFAULT_RULES } from '../src/rules.js'
import { createGame, eligiblePlayers, reduce } from '../src/game/reducer.js'
import {
  availableActions,
  currentPlayerId,
  dealForRound,
  handOf,
  standings,
} from '../src/game/selectors.js'
import type { GameConfig, GameState, PlayerAction } from '../src/game/types.js'
import { act, FOLD, PLAY, setup, start } from './gameHelpers.js'

describe('設定の検証', () => {
  const base: GameConfig = {
    players: [
      { id: 'a', name: 'A', isCpu: false },
      { id: 'b', name: 'B', isCpu: false },
    ],
    bettingMode: 'ANTE',
    endCondition: { type: 'FREE' },
    initialChips: 100,
    anteAmount: 1,
    rules: DEFAULT_RULES,
  }

  it('1 人ではゲームを作れない', () => {
    expect(() => createGame({ ...base, players: [base.players[0]!] })).toThrow(RangeError)
  })

  it('7 人以上ではゲームを作れない', () => {
    const players = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => ({
      id,
      name: id,
      isCpu: false,
    }))
    expect(() => createGame({ ...base, players })).toThrow(RangeError)
  })

  it('プレイヤー ID の重複を弾く', () => {
    const players = [
      { id: 'a', name: 'A', isCpu: false },
      { id: 'a', name: 'A2', isCpu: false },
    ]
    expect(() => createGame({ ...base, players })).toThrow()
  })

  it('初期チップが場代を下回る設定を弾く', () => {
    expect(() => createGame({ ...base, initialChips: 1, anteAmount: 5 })).toThrow(RangeError)
  })

  it('ラウンド数 0 の終了条件を弾く', () => {
    expect(() =>
      createGame({ ...base, endCondition: { type: 'ROUNDS', count: 0 } }),
    ).toThrow(RangeError)
  })
})

describe('終了条件', () => {
  it('ROUNDS：規定ラウンドを消化したら終了する', () => {
    let s = setup({ endCondition: { type: 'ROUNDS', count: 2 } })

    s = start(s, { a: [1, 9], b: [1, 8], c: [3, 7] })
    s = act(s, 'a', PLAY)
    s = act(s, 'b', FOLD)
    s = act(s, 'c', FOLD)
    s = reduce(s, { type: 'NEXT_ROUND' })
    expect(s.phase).toBe('IDLE')

    s = start(s, { a: [1, 9], b: [1, 8], c: [3, 7] })
    s = act(s, 'a', PLAY)
    s = act(s, 'b', FOLD)
    s = act(s, 'c', FOLD)
    s = reduce(s, { type: 'NEXT_ROUND' })
    expect(s.phase).toBe('GAME_END')
  })

  it('FREE：終了条件がないので続けられる', () => {
    let s = setup({ endCondition: { type: 'FREE' } })
    for (let i = 0; i < 3; i++) {
      s = start(s, { a: [1, 9], b: [1, 8], c: [3, 7] })
      s = act(s, 'a', PLAY)
      s = act(s, 'b', FOLD)
      s = act(s, 'c', FOLD)
      s = reduce(s, { type: 'NEXT_ROUND' })
      expect(s.phase).toBe('IDLE')
    }
  })

  it('BANKRUPT：残り 1 人になったら終了する', () => {
    let s = setup(
      { endCondition: { type: 'BANKRUPT' }, initialChips: 2, anteAmount: 1 },
      ['a', 'b'],
    )
    s = start(s, { a: [1, 9], b: [3, 7] })
    s = act(s, 'a', PLAY)
    s = act(s, 'b', PLAY)

    expect(s.chips).toEqual({ a: 4, b: 0 })
    s = reduce(s, { type: 'NEXT_ROUND' })
    expect(s.phase).toBe('GAME_END')
  })
})

describe('チップ切れのプレイヤー', () => {
  it('場代を払えない人はそのラウンドに参加しない', () => {
    const base = setup()
    const broke: GameState = { ...base, chips: { a: 0, b: 100, c: 100 } }
    expect(eligiblePlayers(broke)).toEqual(['b', 'c'])

    let s = start(broke, { b: [1, 9], c: [1, 8] })
    expect(s.round?.order).toEqual(['b', 'c'])
    expect(s.chips.a).toBe(0)

    s = act(s, 'b', PLAY)
    s = act(s, 'c', PLAY)
    expect(s.history.at(-1)!.payouts.a).toBe(0)
  })

  it('参加できる人が 2 人未満ならゲームは終了する', () => {
    const base = setup()
    const broke: GameState = { ...base, chips: { a: 0, b: 0, c: 100 } }
    const s = reduce(broke, { type: 'START_ROUND', hands: {} })
    expect(s.phase).toBe('GAME_END')
  })
})

describe('フェーズの制約', () => {
  it('IDLE 以外ではラウンドを開始できない', () => {
    const s = start(setup(), { a: [1, 9], b: [1, 8], c: [3, 7] })
    expect(() => start(s, { a: [2, 2], b: [3, 3], c: [4, 4] })).toThrow()
  })

  it('RESULT 中は行動を受け付けない', () => {
    let s = start(setup(), { a: [1, 9], b: [1, 8], c: [3, 7] })
    s = act(s, 'a', PLAY)
    s = act(s, 'b', FOLD)
    s = act(s, 'c', FOLD)
    expect(s.phase).toBe('RESULT')
    expect(() => act(s, 'a', PLAY)).toThrow()
  })

  it('RESULT 以外では次のラウンドへ進めない', () => {
    const s = start(setup(), { a: [1, 9], b: [1, 8], c: [3, 7] })
    expect(() => reduce(s, { type: 'NEXT_ROUND' })).toThrow()
  })

  it('END_GAME はいつでもゲームを終了できる', () => {
    const s = start(setup(), { a: [1, 9], b: [1, 8], c: [3, 7] })
    const ended = reduce(s, { type: 'END_GAME' })
    expect(ended.phase).toBe('GAME_END')
    expect(ended.round).toBeNull()
  })
})

describe('セレクタ', () => {
  it('順位表はチップの多い順で、同数は同順位になる', () => {
    const base = setup()
    const s: GameState = { ...base, chips: { a: 103, b: 98, c: 98 } }
    expect(standings(s)).toEqual([
      { playerId: 'a', name: 'A', chips: 103, rank: 1 },
      { playerId: 'b', name: 'B', chips: 98, rank: 2 },
      { playerId: 'c', name: 'C', chips: 98, rank: 2 },
    ])
  })

  it('手札確認画面向けに役を返す', () => {
    const s = start(setup(), { a: [1, 9], b: [1, 8], c: [3, 7] })
    expect(handOf(s, 'a')?.name).toBe('クッピン')
    expect(handOf(s, 'b')?.name).toBe('カブ')
    expect(handOf(s, 'c')?.name).toBe('ブタ')
  })

  it('入力待ちでなければ手番のプレイヤーはいない', () => {
    const s = setup()
    expect(currentPlayerId(s)).toBeNull()
  })
})

describe('通しシミュレーション', () => {
  /** 手番のプレイヤーに、選択可能な行動からランダムに 1 つ選ばせる */
  function randomAction(state: GameState, rng: () => number): PlayerAction {
    const playerId = currentPlayerId(state)!
    const choices = availableActions(state, playerId)
    const pick = choices[Math.floor(rng() * choices.length)]!
    if (pick === 'RAISE') {
      const max = Math.min(3, state.chips[playerId] ?? 0)
      return max > 0 ? { type: 'RAISE', amount: max } : { type: 'CALL' }
    }
    return { type: pick } as PlayerAction
  }

  for (const mode of ['ANTE', 'RAISE'] as const) {
    it(`${mode} 方式：チップの総量が常に保存される`, () => {
      const rng = mulberry32(mode === 'ANTE' ? 11 : 22)
      let s = setup({ bettingMode: mode, endCondition: { type: 'ROUNDS', count: 60 } })
      const total = s.config.players.length * s.config.initialChips

      while (s.phase !== 'GAME_END') {
        s = reduce(s, dealForRound(s, rng))
        if (s.phase === 'GAME_END') break

        while (s.phase === 'DECIDE' || s.phase === 'BET') {
          const playerId = currentPlayerId(s)!
          s = act(s, playerId, randomAction(s, rng))
        }

        expect(s.phase).toBe('RESULT')
        const held = Object.values(s.chips).reduce((x, y) => x + y, 0)
        expect(held + s.carryOver).toBe(total)
        for (const amount of Object.values(s.chips)) {
          expect(amount).toBeGreaterThanOrEqual(0)
        }

        s = reduce(s, { type: 'NEXT_ROUND' })
      }

      expect(s.history.length).toBeGreaterThan(0)
    })
  }

  it('60 ラウンドを通しても履歴とラウンド番号が一致する', () => {
    const rng = mulberry32(5)
    let s = setup({ endCondition: { type: 'ROUNDS', count: 60 } })
    while (s.phase !== 'GAME_END') {
      s = reduce(s, dealForRound(s, rng))
      if (s.phase === 'GAME_END') break
      while (s.phase === 'DECIDE' || s.phase === 'BET') {
        s = act(s, currentPlayerId(s)!, randomAction(s, rng))
      }
      s = reduce(s, { type: 'NEXT_ROUND' })
    }
    expect(s.history.map((r) => r.roundNo)).toEqual(
      s.history.map((_, i) => i + 1),
    )
  })
})
