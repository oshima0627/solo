'use client'

import { useEffect, useState } from 'react'
import { currentPlayerId, isCpu, type GameConfig } from '@solo/engine'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { CpuTurnScreen } from '@/components/CpuTurnScreen'
import { EndScreen } from '@/components/EndScreen'
import { HandoffScreen } from '@/components/HandoffScreen'
import { HomeScreen } from '@/components/HomeScreen'
import { ResultScreen } from '@/components/ResultScreen'
import { SetupScreen } from '@/components/SetupScreen'
import { TurnScreen } from '@/components/TurnScreen'
import { Screen } from '@/components/ui'
import { hideSplash, initStatusBar, onBackButton } from '@/lib/native'
import { useSolo } from '@/lib/useSolo'

export default function Page() {
  const solo = useSolo()
  const [setupOpen, setSetupOpen] = useState(false)
  const [resumed, setResumed] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    void initStatusBar()
  }, [])

  useEffect(() => {
    if (solo.hydrated) void hideSplash()
  }, [solo.hydrated])

  useEffect(() => {
    return onBackButton(() => {
      if (confirmOpen) {
        setConfirmOpen(false)
        return true
      }
      if (setupOpen) {
        setSetupOpen(false)
        return true
      }

      const game = solo.game
      const homeVisible = !game || (!resumed && game.phase !== 'GAME_END')
      if (homeVisible) return false
      if (!game) return false

      if (game.phase === 'GAME_END') {
        solo.clearGame()
        setResumed(false)
        return true
      }

      const actor = currentPlayerId(game)
      const soloPractice = game.config.players.filter((p) => !p.isCpu).length === 1
      const isTurnPhase = game.phase === 'DECIDE' || game.phase === 'BET'
      const showingHand =
        isTurnPhase && !soloPractice && actor !== null && !isCpu(game, actor) && !solo.shielded

      if (showingHand) {
        solo.conceal()
        return true
      }

      setConfirmOpen(true)
      return true
    })
  }, [confirmOpen, setupOpen, resumed, solo])

  const confirmDialog = (
    <ConfirmDialog
      open={confirmOpen}
      title="中断しますか？"
      message="ここまでの対局が終了します。"
      confirmLabel="終わる"
      cancelLabel="続ける"
      onConfirm={() => {
        solo.quitGame()
        setConfirmOpen(false)
      }}
      onCancel={() => setConfirmOpen(false)}
    />
  )

  if (!solo.hydrated) {
    return (
      <Screen>
        <div className="flex flex-1 items-center justify-center text-sm text-ink-faint">
          読み込み中
        </div>
      </Screen>
    )
  }

  const start = (config: GameConfig) => {
    solo.startGame(config)
    setSetupOpen(false)
    setResumed(true)
  }

  if (setupOpen) {
    return (
      <>
        <SetupScreen onStart={start} onBack={() => setSetupOpen(false)} />
        {confirmDialog}
      </>
    )
  }

  // 保存されたゲームがあっても、まずはトップから明示的に再開させる
  if (!solo.game || (!resumed && solo.game.phase !== 'GAME_END')) {
    return (
      <>
        <HomeScreen
          hasSaved={solo.game !== null}
          onResume={() => setResumed(true)}
          onNew={() => {
            solo.clearGame()
            setSetupOpen(true)
          }}
        />
        {confirmDialog}
      </>
    )
  }

  const game = solo.game

  const actor = currentPlayerId(game)
  // 人が 1 人だけなら受け渡しの必要がないので、シールドも長押しも省く
  const soloPractice = game.config.players.filter((p) => !p.isCpu).length === 1

  const screen = (() => {
    switch (game.phase) {
      case 'DECIDE':
      case 'BET':
        if (actor && isCpu(game, actor)) return <CpuTurnScreen game={game} />
        if (soloPractice) {
          return <TurnScreen game={game} onSubmit={solo.submitAction} alwaysVisible />
        }
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
            onHome={() => {
              solo.clearGame()
              setResumed(false)
            }}
          />
        )

      default:
        return (
          <Screen>
            <div className="flex flex-1 items-center justify-center text-sm text-ink-faint">
              準備中
            </div>
          </Screen>
        )
    }
  })()

  return (
    <>
      {screen}
      {confirmDialog}
    </>
  )
}
