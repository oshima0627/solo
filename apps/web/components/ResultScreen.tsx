'use client'

import { useEffect } from 'react'
import { evaluateHand, playerName, type GameState, type RoundResult } from '@solo/engine'
import { playCue, type Cue } from '@/lib/sound'
import { HandRow } from './Cards'
import { SoundToggle } from './SoundToggle'
import { Button, Panel, Screen } from './ui'

function cueFor(result: RoundResult): Cue {
  if (result.bombCharge > 0) return 'bomb'
  switch (result.outcome.outcome) {
    case 'WIN':
    case 'WIN_BY_FOLD':
      return 'win'
    case 'DRAW':
      return 'draw'
    default:
      return 'flow'
  }
}

function headline(game: GameState, result: RoundResult) {
  switch (result.outcome.outcome) {
    case 'WIN':
      return {
        title: `${playerName(game, result.outcome.winner)} の勝ち`,
        callout: result.outcome.hand.name,
        tone: 'text-gold-400',
        note: null,
      }
    case 'WIN_BY_FOLD':
      return {
        title: `${playerName(game, result.outcome.winner)} の勝ち`,
        callout: '全員が降りました',
        tone: 'text-jade-400',
        note: '手札は公開されません',
      }
    case 'DRAW':
      return {
        title: '引き分け',
        callout: result.outcome.name,
        tone: 'text-foam-100',
        note: '場のチップは次の局へ持ち越します',
      }
    case 'FLOW':
      return {
        title: '流局',
        callout: 'シロクの流れ',
        tone: 'text-coral-400',
        note: '場のチップは次の局へ持ち越します',
      }
    case 'NO_CONTEST':
      return {
        title: '流局',
        callout: '全員が降りました',
        tone: 'text-foam-300',
        note: '場のチップは次の局へ持ち越します',
      }
  }
}

export function ResultScreen({
  game,
  onNext,
  onQuit,
}: {
  game: GameState
  onNext: () => void
  onQuit: () => void
}) {
  const result = game.history.at(-1)
  const roundNo = result?.roundNo

  // 局が変わったときだけ鳴らす
  useEffect(() => {
    if (result) playCue(cueFor(result))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundNo])

  if (!result) return null

  const info = headline(game, result)
  const revealed = new Set(result.revealed)
  const isBomb = result.bombCharge > 0

  return (
    <Screen>
      <header className="relative text-center">
        <SoundToggle className="absolute right-0 top-0" />
        <p className="text-sm text-foam-500">第 {result.roundNo} 局</p>
        <h1 className="mt-1 text-2xl font-bold">{info.title}</h1>
        <p
          className={`mt-2 text-5xl font-black ${info.tone} ${
            isBomb ? 'animate-bomb' : 'animate-pop'
          }`}
        >
          {info.callout}
        </p>
        {info.note ? <p className="mt-2 text-xs text-foam-500">{info.note}</p> : null}
        {result.bombCharge > 0 ? (
          <p className="mt-2 text-sm text-gold-400">
            バクダン！ 1人あたり {result.bombCharge} を追加徴収
          </p>
        ) : null}
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {game.config.players.map((player) => {
          const cards = result.hands[player.id] ?? null
          const shown = revealed.has(player.id)
          const payout = result.payouts[player.id] ?? 0
          const hand = shown && cards ? evaluateHand(cards, game.config.rules) : null

          return (
            <Panel key={player.id} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{player.name}</p>
                <p className="text-xs text-foam-500">
                  {hand ? hand.name : cards ? '降りた' : '不参加'}
                </p>
                <p
                  className={`mt-1 text-sm font-bold tabular-nums ${
                    payout > 0 ? 'text-jade-400' : payout < 0 ? 'text-coral-400' : 'text-foam-500'
                  }`}
                >
                  {payout > 0 ? `+${payout}` : payout} → {game.chips[player.id] ?? 0}
                </p>
              </div>
              {cards ? <HandRow cards={cards} hidden={!shown} size="sm" animate={shown} /> : null}
            </Panel>
          )
        })}
      </div>

      <div className="space-y-3 pb-2">
        <p className="text-center text-sm text-foam-300">
          場のチップ <span className="font-bold tabular-nums">{result.pot}</span>
          {result.carryOverAfter > 0 ? (
            <span className="ml-2 text-gold-400">持ち越し {result.carryOverAfter}</span>
          ) : null}
        </p>
        <Button onClick={onNext}>次の局へ</Button>
        <Button variant="ghost" onClick={onQuit}>
          ここで終わる
        </Button>
      </div>
    </Screen>
  )
}
