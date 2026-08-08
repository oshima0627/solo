'use client'

import { useState } from 'react'
import {
  availableActions,
  callAmount,
  currentPlayerId,
  handCardsOf,
  handOf,
  maxRaise,
  playerName,
  type GameState,
  type PlayerAction,
} from '@solo/engine'
import { HandRow } from './Cards'
import { Button, NumberInput, Panel, Screen } from './ui'

const ACTION_LABEL: Record<PlayerAction['type'], string> = {
  PLAY: '勝負する',
  FOLD: '降りる',
  CALL: 'コール',
  RAISE: 'レイズ',
}

export function TurnScreen({
  game,
  onSubmit,
}: {
  game: GameState
  onSubmit: (action: PlayerAction) => void
}) {
  const playerId = currentPlayerId(game)
  const [held, setHeld] = useState(false)
  const [pending, setPending] = useState<PlayerAction | null>(null)
  const [raiseAmount, setRaiseAmount] = useState(1)

  if (!playerId) return null

  const cards = handCardsOf(game, playerId)
  const hand = handOf(game, playerId)
  const chips = game.chips[playerId] ?? 0
  const actions = availableActions(game, playerId)
  const toCall = callAmount(game, playerId)
  const raiseMax = maxRaise(game, playerId)

  // 確認ダイアログ。確定したら取り消せない
  if (pending) {
    return (
      <Screen>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-foam-300">{playerName(game, playerId)} さん</p>
          <p className="text-4xl font-black text-foam-100">
            {ACTION_LABEL[pending.type]}
            {pending.type === 'RAISE' ? ` +${pending.amount}` : null}
            {pending.type === 'CALL' && toCall > 0 ? ` ${toCall}` : null}
          </p>
          <p className="text-sm text-foam-500">
            確定すると取り消せません
          </p>
        </div>
        <div className="space-y-3 pb-2">
          <Button
            onClick={() => {
              setPending(null)
              setHeld(false)
              onSubmit(pending)
            }}
          >
            確定する
          </Button>
          <Button variant="ghost" onClick={() => setPending(null)}>
            選び直す
          </Button>
        </div>
      </Screen>
    )
  }

  return (
    <Screen>
      <header className="flex items-center justify-between text-sm">
        <span className="text-foam-500">第 {game.roundNo} 局</span>
        <span className="font-bold text-coral-400">{playerName(game, playerId)}</span>
        <span className="tabular-nums text-foam-300">
          チップ <span className="font-bold text-foam-100">{chips}</span>
        </span>
      </header>

      <Panel className="flex items-center justify-between text-sm">
        <span className="text-foam-300">
          場 <span className="font-bold tabular-nums text-foam-100">{game.round?.pot ?? 0}</span>
        </span>
        {game.config.bettingMode === 'RAISE' ? (
          <span className="text-foam-300">
            コール額 <span className="font-bold tabular-nums text-foam-100">{toCall}</span>
          </span>
        ) : null}
        {game.carryOver > 0 ? (
          <span className="text-gold-400">持ち越し {game.carryOver}</span>
        ) : null}
      </Panel>

      {/* 長押ししているあいだだけ手札と役名を表示する。指を離せば即座に隠れる */}
      <div
        className="hold-area flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-sea-700 py-6"
        onPointerDown={() => setHeld(true)}
        onPointerUp={() => setHeld(false)}
        onPointerLeave={() => setHeld(false)}
        onPointerCancel={() => setHeld(false)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <HandRow cards={cards} hidden={!held} size="lg" />
        {held && hand ? (
          <p className="animate-pop text-3xl font-black text-gold-400">{hand.name}</p>
        ) : (
          <p className="text-sm text-foam-500">長押しで手札を見る</p>
        )}
      </div>

      <div className="space-y-3 pb-2">
        {actions.includes('RAISE') ? (
          <div className="space-y-2">
            <p className="text-xs text-foam-500">レイズ額（上乗せ）</p>
            <NumberInput
              value={Math.min(raiseAmount, raiseMax)}
              min={1}
              max={raiseMax}
              onChange={setRaiseAmount}
            />
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          {actions.map((type) => (
            <Button
              key={type}
              variant={type === 'FOLD' ? 'danger' : type === 'RAISE' ? 'secondary' : 'primary'}
              className={actions.length === 3 && type === 'FOLD' ? 'col-span-2' : ''}
              onClick={() =>
                setPending(
                  type === 'RAISE'
                    ? { type: 'RAISE', amount: Math.min(raiseAmount, raiseMax) }
                    : ({ type } as PlayerAction),
                )
              }
            >
              {ACTION_LABEL[type]}
              {type === 'CALL' && toCall > 0 ? ` ${toCall}` : null}
              {type === 'CALL' && toCall === 0 ? '（チェック）' : null}
            </Button>
          ))}
        </div>
      </div>
    </Screen>
  )
}
