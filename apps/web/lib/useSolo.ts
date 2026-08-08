'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  createGame,
  currentPlayerId,
  dealForRound,
  defaultRng,
  reduce,
  type GameConfig,
  type GameState,
  type PlayerAction,
} from '@solo/engine'
import { loadSession, saveSession } from './session'

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
