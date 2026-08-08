'use client'

import { useState } from 'react'
import type { GameConfig } from '@solo/engine'
import { EndScreen } from '@/components/EndScreen'
import { HandoffScreen } from '@/components/HandoffScreen'
import { HomeScreen } from '@/components/HomeScreen'
import { ResultScreen } from '@/components/ResultScreen'
import { SetupScreen } from '@/components/SetupScreen'
import { TurnScreen } from '@/components/TurnScreen'
import { Screen } from '@/components/ui'
import { useSolo } from '@/lib/useSolo'

export default function Page() {
  const solo = useSolo()
  const [setupOpen, setSetupOpen] = useState(false)
  const [resumed, setResumed] = useState(false)

  if (!solo.hydrated) {
    return (
      <Screen>
        <div className="flex flex-1 items-center justify-center text-foam-500">読み込み中…</div>
      </Screen>
    )
  }

  const start = (config: GameConfig) => {
    solo.startGame(config)
    setSetupOpen(false)
    setResumed(true)
  }

  if (setupOpen) {
    return <SetupScreen onStart={start} onBack={() => setSetupOpen(false)} />
  }

  // 保存されたゲームがあっても、まずはトップから明示的に再開させる
  if (!solo.game || (!resumed && solo.game.phase !== 'GAME_END')) {
    return (
      <HomeScreen
        hasSaved={solo.game !== null}
        onResume={() => setResumed(true)}
        onNew={() => {
          solo.clearGame()
          setSetupOpen(true)
        }}
      />
    )
  }

  const game = solo.game

  switch (game.phase) {
    case 'DECIDE':
    case 'BET':
      return solo.shielded ? (
        <HandoffScreen game={game} onReveal={solo.reveal} />
      ) : (
        <TurnScreen game={game} onSubmit={solo.submitAction} />
      )

    case 'RESULT':
      return <ResultScreen game={game} onNext={solo.nextRound} onQuit={solo.quitGame} />

    case 'GAME_END':
      return (
        <EndScreen
          game={game}
          onRestart={() => {
            solo.clearGame()
            setResumed(false)
            setSetupOpen(true)
          }}
        />
      )

    default:
      return (
        <Screen>
          <div className="flex flex-1 items-center justify-center text-foam-500">準備中…</div>
        </Screen>
      )
  }
}
