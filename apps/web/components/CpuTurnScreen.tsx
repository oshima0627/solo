'use client'

import { currentPlayerId, playerName, type GameState } from '@solo/engine'
import { HandRow } from './Cards'
import { Panel, Screen } from './ui'

export function CpuTurnScreen({ game }: { game: GameState }) {
  const playerId = currentPlayerId(game)
  if (!playerId) return null

  return (
    <Screen>
      <header className="flex items-center justify-between text-sm">
        <span className="text-foam-500">第 {game.roundNo} 局</span>
        <span className="tabular-nums text-foam-300">
          場 <span className="font-bold text-foam-100">{game.round?.pot ?? 0}</span>
        </span>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <HandRow cards={null} hidden size="lg" />
        <div className="text-center">
          <p className="text-3xl font-black text-foam-100">{playerName(game, playerId)}</p>
          <p className="mt-2 text-sm text-foam-300">
            考えています
            <span className="animate-dot ml-0.5">.</span>
            <span className="animate-dot ml-0.5 [animation-delay:180ms]">.</span>
            <span className="animate-dot ml-0.5 [animation-delay:360ms]">.</span>
          </p>
        </div>
      </div>

      <Panel className="text-center text-xs text-foam-500">
        CPU の手番は自動で進みます
      </Panel>
    </Screen>
  )
}
