'use client'

import { useEffect } from 'react'
import { standings, type GameState } from '@solo/engine'
import { vibrate } from '@/lib/native'
import { playCue } from '@/lib/sound'
import { SoundToggle } from './SoundToggle'
import { Button, Screen } from './ui'

export function EndScreen({
  game,
  onRestart,
  onHome,
  onHistory,
}: {
  game: GameState
  onRestart: () => void
  onHome: () => void
  onHistory: () => void
}) {
  const rows = standings(game)

  useEffect(() => {
    playCue('end')
    void vibrate('light')
  }, [])

  return (
    <Screen
      header={
        <header className="flex items-baseline justify-between border-b border-rule pb-3">
          <span className="label tnum">全 {game.roundNo} 局</span>
          <SoundToggle className="-mr-1.5" />
        </header>
      }
      footer={
        <>
          <Button onClick={onRestart}>もう一度遊ぶ</Button>
          <Button variant="quiet" onClick={onHome}>
            ホームに戻る
          </Button>
          <Button variant="quiet" onClick={onHistory}>
            履歴を見る
          </Button>
        </>
      }
    >
      <div className="animate-rise shrink-0">
        <h1 className="font-serif text-6xl leading-none wide:text-7xl land:text-4xl">結果</h1>
        <div className="mt-5 h-px w-16 bg-vermilion land:mt-3" />
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto land:mt-3">
        {rows.map((row) => {
          const diff = row.chips - game.config.initialChips
          const top = row.rank === 1
          return (
            <div
              key={row.playerId}
              className="flex items-baseline gap-4 border-b border-rule py-4 first:border-t land:py-2.5"
            >
              <span
                className={`tnum w-8 shrink-0 font-serif text-2xl leading-none ${
                  top ? 'text-vermilion' : 'text-ink-faint'
                }`}
              >
                {row.rank}
              </span>
              <span className={`min-w-0 flex-1 truncate ${top ? 'font-bold' : ''}`}>
                {row.name}
              </span>
              <span className="tnum text-right">
                <span className="block font-serif text-2xl leading-none">{row.chips}</span>
                <span
                  className={`mt-1 block text-xs ${
                    diff > 0 ? 'text-ink-soft' : diff < 0 ? 'text-vermilion' : 'text-ink-faint'
                  }`}
                >
                  {diff > 0 ? `+${diff}` : diff}
                </span>
              </span>
            </div>
          )
        })}
      </div>
    </Screen>
  )
}
