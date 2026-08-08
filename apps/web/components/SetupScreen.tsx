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
import { Button, Field, Screen, SectionHead, Segmented, Stepper, Toggle } from './ui'

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

  const input =
    'w-full border-b border-rule bg-transparent py-2.5 text-base outline-none transition-colors focus:border-vermilion'

  return (
    <Screen>
      <header className="flex items-baseline justify-between border-b border-rule pb-3">
        <h1 className="text-sm font-bold tracking-[0.1em]">ゲーム設定</h1>
        <button type="button" onClick={onBack} className="text-sm text-ink-soft underline underline-offset-4">
          戻る
        </button>
      </header>

      <div className="flex-1 space-y-9 overflow-y-auto">
        <section className="space-y-4">
          <SectionHead index="01">遊び方</SectionHead>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: 'PASS', label: 'みんなで' },
              { value: 'SOLO', label: 'ひとり練習' },
            ]}
          />
          <p className="text-xs leading-relaxed text-ink-soft">
            {mode === 'PASS'
              ? '1台の端末を回して、その場にいる人と遊びます。'
              : 'CPUを相手に1人で遊びます。ルールを覚えるのにも使えます。'}
          </p>

          <Field label={mode === 'SOLO' ? '人数（自分とCPU）' : '人数'}>
            <Stepper
              value={playerCount}
              min={MIN_PLAYERS}
              max={MAX_PLAYERS}
              onChange={setPlayerCount}
            />
          </Field>

          <div className="space-y-1">
            {Array.from({ length: mode === 'SOLO' ? 1 : playerCount }, (_, i) => (
              <div key={i} className="flex items-baseline gap-3">
                <span className="label tnum w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <input
                  value={names[i] ?? ''}
                  onChange={(e) => setName(i, e.target.value)}
                  maxLength={12}
                  aria-label={`${i + 1}人目の名前`}
                  className={input}
                />
              </div>
            ))}
            {mode === 'SOLO' ? (
              <p className="pt-2 text-xs text-ink-soft">
                相手は CPU 1 から CPU {playerCount - 1} になります
              </p>
            ) : null}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHead index="02">ベット方式</SectionHead>
          <Segmented
            value={bettingMode}
            onChange={setBettingMode}
            options={[
              { value: 'ANTE', label: 'アンティ' },
              { value: 'RAISE', label: 'レイズ' },
            ]}
          />
          <p className="text-xs leading-relaxed text-ink-soft">
            {bettingMode === 'ANTE'
              ? '端末が必ず1周して決着します。速くて気軽。'
              : 'レイズのたびに端末が周回します。降りても手札は公開されないので、ブラフが効きます。'}
          </p>
        </section>

        <section className="space-y-5">
          <SectionHead index="03">勝負の区切り</SectionHead>
          <Segmented
            value={endType}
            onChange={setEndType}
            options={[
              { value: 'ROUNDS', label: '局数' },
              { value: 'BANKRUPT', label: '破産まで' },
              { value: 'FREE', label: 'フリー' },
            ]}
          />
          {endType === 'ROUNDS' ? (
            <Field label="局数">
              <Stepper value={rounds} min={1} max={50} onChange={setRounds} />
            </Field>
          ) : null}
          <Field label="初期チップ">
            <Stepper value={initialChips} min={5} max={500} step={5} onChange={setInitialChips} />
          </Field>
          <Field label="場代">
            <Stepper value={anteAmount} min={1} max={10} onChange={setAnteAmount} />
          </Field>
        </section>

        <section className="space-y-4">
          <button
            type="button"
            onClick={() => setShowRules((v) => !v)}
            className="flex w-full items-baseline justify-between border-b border-rule pb-2 text-left"
          >
            <span className="flex items-baseline gap-3">
              <span className="label tnum">04</span>
              <span className="text-sm font-bold tracking-[0.1em]">ローカルルール</span>
            </span>
            <span className="text-sm text-ink-soft">{showRules ? '閉じる' : '開く'}</span>
          </button>

          {showRules ? (
            <div className="space-y-1">
              <p className="pb-2 text-xs leading-relaxed text-ink-soft">
                ソロには公式ルールがなく、地域やグループごとに証言が分かれています。
                割れている箇所はここで切り替えられます。
              </p>
              <Toggle
                label="バクダンで山札を入れ替える"
                hint="♠♣の20枚と♥♦の20枚を持ち替える。確率や役の強さは変わりません"
                checked={swapDeckOnBomb}
                onChange={setSwapDeckOnBomb}
              />
              <Toggle
                label="ピンゾロを2番目に強くする"
                hint="既定ではソロの中で最弱。多数派の証言に合わせています"
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
              <div className="pt-4">
                <Field label="バクダンの追加徴収">
                  <Stepper
                    value={bombExtraCharge}
                    min={0}
                    max={20}
                    onChange={setBombExtraCharge}
                  />
                </Field>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <Button onClick={submit}>はじめる</Button>
    </Screen>
  )
}
