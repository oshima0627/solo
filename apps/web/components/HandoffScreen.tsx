'use client'

import { currentPlayerId, playerName, type GameState } from '@solo/engine'
import { Button, Screen } from './ui'

/**
 * 受け渡しシールド。
 * この画面が出ているあいだは手札を一切描画しない。
 */
export function HandoffScreen({ game, onReveal }: { game: GameState; onReveal: () => void }) {
  const playerId = currentPlayerId(game)
  if (!playerId) return null

  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <p className="text-sm text-foam-500">第 {game.roundNo} 局</p>
        <div>
          <p className="text-sm text-foam-300">端末を渡してください</p>
          <p className="mt-3 text-5xl font-black text-coral-400">{playerName(game, playerId)}</p>
          <p className="mt-1 text-sm text-foam-300">さんの番です</p>
        </div>
        <p className="rounded-xl bg-sea-900 px-4 py-2 text-sm text-foam-300">
          場のチップ <span className="font-bold tabular-nums">{game.round?.pot ?? 0}</span>
          {game.carryOver > 0 ? (
            <span className="ml-2 text-gold-400">（持ち越し {game.carryOver}）</span>
          ) : null}
        </p>
      </div>

      <div className="pb-2">
        <Button onClick={onReveal}>手札を確認する</Button>
        <p className="mt-3 text-center text-xs text-foam-500">
          他の人に見られないように受け取ってください
        </p>
      </div>
    </Screen>
  )
}
