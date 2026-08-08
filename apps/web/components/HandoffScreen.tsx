'use client'

import { currentPlayerId, deckColorLabel, playerName, type GameState } from '@solo/engine'
import { Button, Screen, Stat } from './ui'

/**
 * 受け渡しシールド。
 * この画面が出ているあいだは手札を一切描画しない。
 */
export function HandoffScreen({ game, onReveal }: { game: GameState; onReveal: () => void }) {
  const playerId = currentPlayerId(game)
  if (!playerId) return null

  return (
    <Screen>
      <header className="grid grid-cols-3 gap-4 border-b border-rule pb-3">
        <Stat label="局" value={`第 ${game.roundNo} 局`} />
        <Stat label="場" value={game.round?.pot ?? 0} />
        <Stat label="山札" value={deckColorLabel(game.deckColor)} />
      </header>

      <div className="flex flex-1 flex-col justify-center">
        <div className="animate-rise">
          <p className="label">次の人</p>
          <p className="mt-4 font-serif text-6xl leading-tight tracking-[-0.01em]">
            {playerName(game, playerId)}
          </p>
          <div className="mt-6 h-px w-16 bg-vermilion" />
          <p className="mt-6 text-sm leading-relaxed text-ink-soft">
            端末を渡してください。
            <br />
            他の人に見られないように受け取ってください。
          </p>
        </div>

        {game.carryOver > 0 ? (
          <p className="tnum mt-10 border-t border-rule pt-3 text-sm text-ink-soft">
            前の局からの持ち越し{' '}
            <span className="font-bold text-vermilion">{game.carryOver}</span>
          </p>
        ) : null}
      </div>

      <Button onClick={onReveal}>手札を確認する</Button>
    </Screen>
  )
}
