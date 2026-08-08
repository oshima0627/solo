'use client'

import { useEffect } from 'react'
import { standings, type GameState } from '@solo/engine'
import { playCue } from '@/lib/sound'
import { SoundToggle } from './SoundToggle'
import { Button, Panel, Screen } from './ui'

const MEDAL = ['🥇', '🥈', '🥉']

export function EndScreen({ game, onRestart }: { game: GameState; onRestart: () => void }) {
  const rows = standings(game)

  useEffect(() => playCue('end'), [])

  return (
    <Screen>
      <header className="relative text-center">
        <SoundToggle className="absolute right-0 top-0" />
        <p className="text-sm text-foam-500">全 {game.roundNo} 局</p>
        <h1 className="mt-1 animate-pop text-3xl font-black">結果</h1>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {rows.map((row) => {
          const start = game.config.initialChips
          const diff = row.chips - start
          return (
            <Panel
              key={row.playerId}
              className={`flex items-center gap-4 ${row.rank === 1 ? 'border-gold-400' : ''}`}
            >
              <span className="w-8 text-center text-2xl">
                {MEDAL[row.rank - 1] ?? row.rank}
              </span>
              <span className="min-w-0 flex-1 truncate font-bold">{row.name}</span>
              <span className="text-right">
                <span className="block text-xl font-black tabular-nums">{row.chips}</span>
                <span
                  className={`block text-xs tabular-nums ${
                    diff > 0 ? 'text-jade-400' : diff < 0 ? 'text-coral-400' : 'text-foam-500'
                  }`}
                >
                  {diff > 0 ? `+${diff}` : diff}
                </span>
              </span>
            </Panel>
          )
        })}
      </div>

      <Button onClick={onRestart}>もう一度遊ぶ</Button>
    </Screen>
  )
}
