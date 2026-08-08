'use client'

import { useState } from 'react'
import {
  ALL_PIN_RANKS,
  DEFAULT_RULES,
  MAX_PLAYERS,
  MIN_PLAYERS,
  STANDARD_PIN_RANKS,
  type BettingMode,
  type EndCondition,
  type GameConfig,
} from '@solo/engine'
import { Button, Field, NumberInput, Panel, Screen, Segmented, Toggle } from './ui'

type EndType = EndCondition['type']

export function SetupScreen({
  onStart,
  onBack,
}: {
  onStart: (config: GameConfig) => void
  onBack: () => void
}) {
  const [mode, setMode] = useState<'PASS' | 'SOLO'>('PASS')
  const [playerCount, setPlayerCount] = useState(3)
  const [names, setNames] = useState<string[]>(() =>
    Array.from({ length: MAX_PLAYERS }, (_, i) => `プレイヤー${i + 1}`),
  )
  const [bettingMode, setBettingMode] = useState<BettingMode>('ANTE')
  const [endType, setEndType] = useState<EndType>('ROUNDS')
  const [rounds, setRounds] = useState(10)
  const [initialChips, setInitialChips] = useState(50)
  const [anteAmount, setAnteAmount] = useState(1)
  const [showRules, setShowRules] = useState(false)
  const [swapDeckOnBomb, setSwapDeckOnBomb] = useState(DEFAULT_RULES.swapDeckOnBomb)
  const [highPinzoro, setHighPinzoro] = useState(
    DEFAULT_RULES.pinzoroPosition === 'secondHighest',
  )
  const [allPins, setAllPins] = useState(false)
  const [gyakuSolo, setGyakuSolo] = useState(DEFAULT_RULES.gyakuSolo)
  const [shiroku, setShiroku] = useState(DEFAULT_RULES.shiroku)
  const [bombExtraCharge, setBombExtraCharge] = useState(DEFAULT_RULES.bombExtraCharge)

  const setName = (index: number, value: string) => {
    setNames((current) => current.map((name, i) => (i === index ? value : name)))
  }

  const submit = () => {
    const endCondition: EndCondition =
      endType === 'ROUNDS'
        ? { type: 'ROUNDS', count: rounds }
        : endType === 'BANKRUPT'
          ? { type: 'BANKRUPT' }
          : { type: 'FREE' }

    onStart({
      // ひとり練習では 1 人目だけが人間で、残りは CPU になる
      players: Array.from({ length: playerCount }, (_, i) => {
        const isCpu = mode === 'SOLO' && i > 0
        return {
          id: `p${i + 1}`,
          name: isCpu ? `CPU ${i}` : names[i]?.trim() || `プレイヤー${i + 1}`,
          isCpu,
        }
      }),
      bettingMode,
      endCondition,
      initialChips,
      anteAmount,
      rules: {
        swapDeckOnBomb,
        pinzoroPosition: highPinzoro ? 'secondHighest' : 'lowestSolo',
        pinRanks: allPins ? ALL_PIN_RANKS : STANDARD_PIN_RANKS,
        gyakuSolo,
        shiroku,
        bombExtraCharge,
      },
    })
  }

  return (
    <Screen>
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg px-2 py-1 text-sm text-foam-300"
        >
          ← 戻る
        </button>
        <h1 className="text-xl font-bold">ゲーム設定</h1>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        <Panel className="space-y-3">
          <Field
            label="遊び方"
            hint={
              mode === 'PASS'
                ? '1台の端末を回して、その場にいる人と遊びます。'
                : 'CPU を相手に1人で遊びます。ルールを覚えるのにも使えます。'
            }
          >
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: 'PASS', label: 'みんなで' },
                { value: 'SOLO', label: 'ひとり練習' },
              ]}
            />
          </Field>
        </Panel>

        <Panel className="space-y-4">
          <Field label={mode === 'SOLO' ? '人数（自分＋CPU）' : '人数'}>
            <NumberInput
              value={playerCount}
              min={MIN_PLAYERS}
              max={MAX_PLAYERS}
              onChange={setPlayerCount}
            />
          </Field>
          <div className="space-y-2">
            {Array.from({ length: mode === 'SOLO' ? 1 : playerCount }, (_, i) => (
              <input
                key={i}
                value={names[i] ?? ''}
                onChange={(e) => setName(i, e.target.value)}
                maxLength={12}
                aria-label={`${i + 1}人目の名前`}
                className="w-full rounded-xl bg-sea-800 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-coral-500"
              />
            ))}
            {mode === 'SOLO' ? (
              <p className="text-xs text-foam-500">
                相手は CPU 1 〜 CPU {playerCount - 1} になります
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel className="space-y-3">
          <Field
            label="ベット方式"
            hint={
              bettingMode === 'ANTE'
                ? '端末が必ず1周して決着します。速くて気軽。'
                : 'レイズのたびに端末が周回します。ブラフが効きます。'
            }
          >
            <Segmented
              value={bettingMode}
              onChange={setBettingMode}
              options={[
                { value: 'ANTE', label: 'アンティ（1周）' },
                { value: 'RAISE', label: 'レイズ（周回）' },
              ]}
            />
          </Field>
        </Panel>

        <Panel className="space-y-3">
          <Field label="終了条件">
            <Segmented
              value={endType}
              onChange={setEndType}
              options={[
                { value: 'ROUNDS', label: 'ラウンド数' },
                { value: 'BANKRUPT', label: '破産まで' },
                { value: 'FREE', label: 'フリー' },
              ]}
            />
          </Field>
          {endType === 'ROUNDS' ? (
            <Field label="ラウンド数">
              <NumberInput value={rounds} min={1} max={50} onChange={setRounds} />
            </Field>
          ) : null}
          <Field label="初期チップ">
            <NumberInput value={initialChips} min={5} max={500} step={5} onChange={setInitialChips} />
          </Field>
          <Field label="場代">
            <NumberInput value={anteAmount} min={1} max={10} onChange={setAnteAmount} />
          </Field>
        </Panel>

        <Panel className="space-y-3">
          <button
            type="button"
            onClick={() => setShowRules((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-sm font-bold text-foam-300">ローカルルール</span>
            <span className="text-foam-500">{showRules ? '閉じる' : '開く'}</span>
          </button>
          {showRules ? (
            <div className="space-y-2">
              <p className="text-xs leading-relaxed text-foam-500">
                ソロには公式ルールがなく、地域やグループごとに証言が分かれています。
                割れている箇所はここで切り替えられます。
              </p>
              <Toggle
                label="バクダンで山札を入れ替える"
                hint="♠♣ の20枚と ♥♦ の20枚を持ち替える。確率や役の強さは変わりません"
                checked={swapDeckOnBomb}
                onChange={setSwapDeckOnBomb}
              />
              <Toggle
                label="ピンゾロを2番目に強くする"
                hint="既定ではソロの中で最弱（多数派の証言）"
                checked={highPinzoro}
                onChange={setHighPinzoro}
              />
              <Toggle
                label="ピン役を全ランクに広げる"
                hint="既定はテンピン・クッピン・ゴピンの3種"
                checked={allPins}
                onChange={setAllPins}
              />
              <Toggle
                label="逆ソロ（9-6）"
                hint="オフにすると数字の5として扱う"
                checked={gyakuSolo}
                onChange={setGyakuSolo}
              />
              <Toggle
                label="シロクの流れ（4-6）"
                hint="オフにすると数字の0（ブタ）として扱う"
                checked={shiroku}
                onChange={setShiroku}
              />
              <Field label="バクダンの追加徴収">
                <NumberInput
                  value={bombExtraCharge}
                  min={0}
                  max={20}
                  onChange={setBombExtraCharge}
                />
              </Field>
            </div>
          ) : null}
        </Panel>
      </div>

      <Button onClick={submit}>はじめる</Button>
    </Screen>
  )
}
