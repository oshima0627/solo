'use client'

import { currentPlayerId, deckColorLabel, playerName, type GameState } from '@solo/engine'
import { HandRow } from './Cards'
import { Screen, Stat } from './ui'

export function CpuTurnScreen({ game }: { game: GameState }) {
  const playerId = currentPlayerId(game)
  if (!playerId) return null

  return (
    <Screen>
      <header className="grid grid-cols-3 gap-4 border-b border-rule pb-3">
        <Stat label="局" value={`第 ${game.roundNo} 局`} />
        <Stat label="場" value={game.round?.pot ?? 0} />
        <Stat label="山札" value={deckColorLabel(game.deckColor)} />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <HandRow cards={null} hidden size="lg" />
        <div className="text-center">
          <p className="font-serif text-4xl leading-none">{playerName(game, playerId)}</p>
          <p className="mt-4 text-sm text-ink-soft">
            考えています
            <span className="animate-dot ml-0.5">.</span>
            <span className="animate-dot ml-0.5 [animation-delay:180ms]">.</span>
            <span className="animate-dot ml-0.5 [animation-delay:360ms]">.</span>
          </p>
        </div>
      </div>

      <p className="border-t border-rule pt-3 text-center text-xs text-ink-faint">
        CPUの手番は自動で進みます
      </p>
    </Screen>
  )
}
