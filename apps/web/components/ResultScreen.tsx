'use client'

import { useEffect } from 'react'
import {
  deckColorLabel,
  evaluateHand,
  oppositeColor,
  playerName,
  type GameState,
  type RoundResult,
} from '@solo/engine'
import { playCue, type Cue } from '@/lib/sound'
import { HandRow } from './Cards'
import { SoundToggle } from './SoundToggle'
import { Button, Screen } from './ui'

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
        eyebrow: `${playerName(game, result.outcome.winner)} の勝ち`,
        callout: result.outcome.hand.name,
        note: null,
      }
    case 'WIN_BY_FOLD':
      return {
        eyebrow: `${playerName(game, result.outcome.winner)} の勝ち`,
        callout: '全員降り',
        note: '手札は公開されません',
      }
    case 'DRAW':
      return {
        eyebrow: '引き分け',
        callout: result.outcome.name,
        note: '場のチップは次の局へ持ち越します',
      }
    case 'FLOW':
      return {
        eyebrow: '流局',
        callout: 'シロクの流れ',
        note: '場のチップは次の局へ持ち越します',
      }
    case 'NO_CONTEST':
      return {
        eyebrow: '流局',
        callout: '全員降り',
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
  const bombPlayer = result.outcome.outcome === 'WIN' ? result.outcome.bombPlayer : null

  return (
    <Screen
      header={
        <header className="flex items-baseline justify-between border-b border-rule pb-3">
          <span className="label tnum">第 {result.roundNo} 局</span>
          <SoundToggle className="-mr-1.5" />
        </header>
      }
      footer={
        <>
          <p className="tnum flex items-baseline justify-between text-sm text-ink-soft">
            <span>場のチップ</span>
            <span className="font-bold text-ink">
              {result.pot}
              {result.carryOverAfter > 0 ? (
                <span className="ml-2 font-normal text-vermilion">
                  持ち越し {result.carryOverAfter}
                </span>
              ) : null}
            </span>
          </p>
          <Button onClick={onNext}>次の局へ</Button>
          <Button variant="quiet" onClick={onQuit}>
            ここで終わる
          </Button>
        </>
      }
    >
      <div className="shrink-0">
        <p className="text-sm text-ink-soft">{info.eyebrow}</p>
        <p
          className={`mt-2 font-serif text-6xl leading-none land:text-4xl ${
            isBomb ? 'animate-strike text-vermilion' : 'animate-rise'
          }`}
        >
          {info.callout}
        </p>
        {info.note ? <p className="mt-4 text-xs text-ink-faint land:mt-2">{info.note}</p> : null}
        {isBomb ? (
          <p className="tnum mt-4 text-sm text-ink-soft land:mt-2">
            1人あたり <span className="font-bold text-vermilion">{result.bombCharge}</span> を追加徴収
          </p>
        ) : null}
        {result.deckSwapped ? (
          <p className="animate-rise mt-4 border-t border-rule pt-3 text-sm land:mt-2 land:pt-2">
            山札を {deckColorLabel(result.deckColor)} から{' '}
            <span className="font-bold text-vermilion">
              {deckColorLabel(oppositeColor(result.deckColor))}
            </span>{' '}
            に入れ替えます
          </p>
        ) : null}
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto land:mt-3">
        {game.config.players.map((player) => {
          const cards = result.hands[player.id] ?? null
          const shown = revealed.has(player.id)
          const payout = result.payouts[player.id] ?? 0
          const hand = shown && cards ? evaluateHand(cards, game.config.rules) : null

          return (
            <div
              key={player.id}
              className="flex items-center gap-4 border-b border-rule py-3.5 first:border-t land:py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{player.name}</p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {hand ? hand.name : cards ? '降りた' : '不参加'}
                </p>
              </div>
              <div className="tnum text-right">
                <span
                  className={`block text-base font-bold ${
                    payout > 0 ? 'text-ink' : payout < 0 ? 'text-vermilion' : 'text-ink-faint'
                  }`}
                >
                  {payout > 0 ? `+${payout}` : payout}
                </span>
                <span className="block text-xs text-ink-faint">
                  {game.chips[player.id] ?? 0}
                </span>
              </div>
              {cards ? (
                <HandRow
                  cards={cards}
                  hidden={!shown}
                  size="sm"
                  animate={shown}
                  highlight={shown && player.id === bombPlayer}
                />
              ) : null}
            </div>
          )
        })}
      </div>
    </Screen>
  )
}
