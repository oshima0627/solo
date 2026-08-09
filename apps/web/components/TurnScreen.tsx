'use client'

import { useState } from 'react'
import {
  availableActions,
  callAmount,
  currentPlayerId,
  handCardsOf,
  handOf,
  isBomb,
  maxRaise,
  playerName,
  type GameState,
  type PlayerAction,
} from '@solo/engine'
import { HandRow } from './Cards'
import { Button, Screen, Stat, Stepper } from './ui'

const ACTION_LABEL: Record<PlayerAction['type'], string> = {
  PLAY: '勝負する',
  FOLD: '降りる',
  CALL: 'コール',
  RAISE: 'レイズ',
}

export function TurnScreen({
  game,
  onSubmit,
  alwaysVisible = false,
}: {
  game: GameState
  onSubmit: (action: PlayerAction) => void
  /** ひとり練習では隠す相手がいないので、手札を出しっぱなしにする */
  alwaysVisible?: boolean
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
  const shown = alwaysVisible || held

  // 確認画面。確定したら取り消せない
  if (pending) {
    return (
      <Screen
        header={
          <header className="border-b border-rule pb-3">
            <span className="label">確認</span>
          </header>
        }
        footer={
          <>
            <Button
              onClick={() => {
                setPending(null)
                setHeld(false)
                onSubmit(pending)
              }}
            >
              確定する
            </Button>
            <Button variant="quiet" onClick={() => setPending(null)}>
              選び直す
            </Button>
          </>
        }
      >
        <div className="flex flex-1 flex-col justify-center">
          <p className="text-sm text-ink-soft">{playerName(game, playerId)}</p>
          <p className="mt-3 font-serif text-6xl leading-tight land:mt-2 land:text-5xl">
            {ACTION_LABEL[pending.type]}
            {pending.type === 'RAISE' ? (
              <span className="tnum text-vermilion"> +{pending.amount}</span>
            ) : null}
            {pending.type === 'CALL' && toCall > 0 ? (
              <span className="tnum text-vermilion"> {toCall}</span>
            ) : null}
          </p>
          <div className="mt-6 h-px w-16 bg-vermilion land:mt-4" />
          <p className="mt-6 text-sm text-ink-soft land:mt-4">確定すると取り消せません。</p>
        </div>
      </Screen>
    )
  }

  return (
    <Screen
      header={
        <header className="space-y-3 border-b border-rule pb-3 land:space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="label">手札</span>
            <span className="text-sm font-bold">{playerName(game, playerId)}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="局" value={`第 ${game.roundNo} 局`} />
            <Stat
              label="場"
              value={
                <>
                  {game.round?.pot ?? 0}
                  {game.carryOver > 0 ? (
                    <span className="text-vermilion"> +{game.carryOver}</span>
                  ) : null}
                </>
              }
            />
            <Stat
              label={game.config.bettingMode === 'RAISE' ? 'コール額' : 'チップ'}
              value={game.config.bettingMode === 'RAISE' ? toCall : chips}
            />
          </div>
        </header>
      }
      footer={
        <>
          {actions.includes('RAISE') ? (
            <div className="space-y-2 border-t border-rule pt-4 land:border-none land:pt-0">
              <span className="label block">レイズ額</span>
              <Stepper
                value={Math.min(raiseAmount, raiseMax)}
                min={1}
                max={raiseMax}
                onChange={setRaiseAmount}
              />
            </div>
          ) : null}

          <div
            className={
              actions.length === 3
                ? 'space-y-2.5'
                : 'grid grid-cols-2 gap-2.5 land:grid-cols-1 land:space-y-0'
            }
          >
            {actions
              .filter((type) => type !== 'FOLD')
              .map((type) => (
                <Button
                  key={type}
                  variant={type === 'RAISE' ? 'secondary' : 'primary'}
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
            <Button variant="quiet" onClick={() => setPending({ type: 'FOLD' })}>
              降りる
            </Button>
          </div>
        </>
      }
    >
      {/* 長押ししているあいだだけ手札と役名を表示する。指を離せば即座に隠れる */}
      <div
        className="hold-area flex flex-1 flex-col items-center justify-center gap-7 land:gap-4"
        onPointerDown={alwaysVisible ? undefined : () => setHeld(true)}
        onPointerUp={alwaysVisible ? undefined : () => setHeld(false)}
        onPointerLeave={alwaysVisible ? undefined : () => setHeld(false)}
        onPointerCancel={alwaysVisible ? undefined : () => setHeld(false)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <HandRow
          cards={cards}
          hidden={!shown}
          size="lg"
          highlight={shown && hand !== null && isBomb(hand)}
        />
        {shown && hand ? (
          <div className="animate-rise text-center">
            <span className="label block">役</span>
            <p className="mt-2 font-serif text-4xl leading-none land:mt-1 land:text-3xl">
              {hand.name}
            </p>
          </div>
        ) : (
          <p className="text-sm tracking-[0.14em] text-ink-faint">長押しで手札を見る</p>
        )}
      </div>
    </Screen>
  )
}
