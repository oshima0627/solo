'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  createGame,
  currentPlayerId,
  dealForRound,
  decideCpuAction,
  defaultRng,
  isCpu,
  reduce,
  type GameConfig,
  type GameState,
  type PlayerAction,
} from '@solo/engine'
import { loadSession, saveSession } from './session'

/** CPU が考えているように見せるための待ち時間 */
const CPU_THINK_MS = 850

export function useSolo() {
  const [game, setGame] = useState<GameState | null>(null)
  /** パス回しの受け渡し中かどうか。true のあいだは手札を一切描画しない */
  const [shielded, setShielded] = useState(true)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setGame(loadSession())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveSession(game)
  }, [game, hydrated])

  // CPU の手番は自動で進める。判断は必ず最新の状態から取り直す
  useEffect(() => {
    if (!game) return
    if (game.phase !== 'DECIDE' && game.phase !== 'BET') return
    const playerId = currentPlayerId(game)
    if (!playerId || !isCpu(game, playerId)) return

    const timer = setTimeout(() => {
      setGame((current) => {
        if (!current) return current
        const actor = currentPlayerId(current)
        if (!actor || !isCpu(current, actor)) return current
        return reduce(current, {
          type: 'PLAYER_ACTION',
          playerId: actor,
          action: decideCpuAction(current, actor, defaultRng),
        })
      })
    }, CPU_THINK_MS)

    return () => clearTimeout(timer)
  }, [game])

  const startGame = useCallback((config: GameConfig) => {
    const created = createGame(config)
    setGame(reduce(created, dealForRound(created, defaultRng)))
    setShielded(true)
  }, [])

  const submitAction = useCallback((action: PlayerAction) => {
    setGame((current) => {
      if (!current) return current
      const playerId = currentPlayerId(current)
      if (!playerId) return current
      return reduce(current, { type: 'PLAYER_ACTION', playerId, action })
    })
    setShielded(true)
  }, [])

  const nextRound = useCallback(() => {
    setGame((current) => {
      if (!current) return current
      const advanced = reduce(current, { type: 'NEXT_ROUND' })
      // 終了条件を満たしていなければ、そのまま次の配札まで進める
      return advanced.phase === 'IDLE'
        ? reduce(advanced, dealForRound(advanced, defaultRng))
        : advanced
    })
    setShielded(true)
  }, [])

  const quitGame = useCallback(() => {
    setGame((current) => (current ? reduce(current, { type: 'END_GAME' }) : current))
  }, [])

  const clearGame = useCallback(() => setGame(null), [])

  return {
    game,
    hydrated,
    shielded,
    reveal: useCallback(() => setShielded(false), []),
    startGame,
    submitAction,
    nextRound,
    quitGame,
    clearGame,
  }
}
