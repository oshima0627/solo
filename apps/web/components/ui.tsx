'use client'

import { useId, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'quiet'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-vermilion text-paper-raised active:bg-vermilion-deep disabled:bg-rule-strong',
  secondary: 'bg-ink text-paper-raised active:bg-ink-soft disabled:bg-rule-strong',
  quiet: 'border border-rule-strong text-ink active:bg-paper-sunk',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`w-full rounded-sm px-5 py-4 text-base font-bold tracking-[0.08em] transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
    />
  )
}

/** 章番号つきの小見出し。罫線で区切る */
export function SectionHead({ index, children }: { index: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-rule pb-2">
      <span className="label tnum">{index}</span>
      <h2 className="text-sm font-bold tracking-[0.1em]">{children}</h2>
    </div>
  )
}

/**
 * 見出し付きのまとまり。
 * 中身が複数のボタンになることがあるため label 要素では包まない。
 * label で包むと見出しのクリックが最初のボタンの操作として扱われてしまう。
 */
export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  const labelId = useId()
  return (
    <div role="group" aria-labelledby={labelId} className="space-y-2.5">
      <span id={labelId} className="label block">
        {label}
      </span>
      {children}
      {hint ? (
        <p className="text-xs leading-relaxed text-ink-soft">{hint}</p>
      ) : null}
    </div>
  )
}

/** 下線で選択を示すタブ。塗りつぶしのピルは使わない */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex border-b border-rule">
      {options.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`-mb-px flex-1 border-b-2 px-1 py-3 text-sm transition-colors ${
              active
                ? 'border-vermilion font-bold text-ink'
                : 'border-transparent text-ink-faint'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-4 border-b border-rule py-3.5 text-left"
    >
      <span className="min-w-0">
        <span className="block text-sm font-bold">{label}</span>
        {hint ? <span className="mt-1 block text-xs text-ink-soft">{hint}</span> : null}
      </span>
      <span
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors ${
          checked ? 'border-vermilion bg-vermilion' : 'border-rule-strong bg-paper-sunk'
        }`}
      >
        <span
          className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-paper-raised transition-all ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </span>
    </button>
  )
}

/**
 * 数値の増減。＋−で刻むだけでなく、直接打ち込んでも変えられる。
 * 打っている途中は下書きとして保持し、確定（Enter か離れたとき）に
 * はじめて範囲へ丸める。1文字打つたびに丸めると入力が壊れるため。
 */
export function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const clamp = (n: number) => Math.min(max, Math.max(min, n))

  const commit = () => {
    const parsed = Number.parseInt(draft ?? '', 10)
    if (Number.isFinite(parsed)) onChange(clamp(parsed))
    setDraft(null)
  }

  const nudge = (delta: number) => {
    setDraft(null)
    onChange(clamp(value + delta))
  }

  const arrow =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-rule-strong text-lg text-ink transition-colors active:bg-paper-sunk disabled:border-rule disabled:text-rule-strong'

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        aria-label={`${label}を減らす`}
        onClick={() => nudge(-step)}
        disabled={value <= min}
        className={arrow}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit()
            e.currentTarget.blur()
          }
        }}
        className="tnum w-full min-w-0 flex-1 border-b border-transparent bg-transparent text-center font-serif text-3xl leading-none outline-none transition-colors focus:border-vermilion"
      />
      <button
        type="button"
        aria-label={`${label}を増やす`}
        onClick={() => nudge(step)}
        disabled={value >= max}
        className={arrow}
      >
        ＋
      </button>
    </div>
  )
}

/** 局数・場・チップなど、横並びの小さな数値表示 */
export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <span className="label block">{label}</span>
      <span className="tnum mt-1 block truncate text-base font-bold">{value}</span>
    </div>
  )
}

/**
 * 画面の骨格。
 *
 * 見出し → 本文 → 操作 の 1 列。操作は常に下に置き、
 * 広い画面では横に広がりすぎないよう幅を絞って中央に寄せる。
 * 横持ちのスマホだけは高さが足りないので、本文と操作を左右に分ける。
 */
export function Screen({
  header,
  footer,
  children,
}: {
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    // 横持ちでは高さを画面ぴったりに固定する。そうしないと本文の伸びに合わせて
    // 全体が縦に伸び、右側の操作列が画面外へ出てしまう。
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-5 pb-7 pt-6 wide:max-w-3xl wide:gap-8 wide:px-10 wide:pb-14 wide:pt-10 land:h-dvh land:max-w-3xl land:gap-3 land:overflow-hidden land:pb-4 land:pt-3">
      {header}
      <div className="flex min-h-0 flex-1 flex-col gap-5 wide:gap-10 land:flex-row land:gap-7">
        <div className="flex min-h-0 flex-1 flex-col land:overflow-y-auto">{children}</div>
        {footer ? (
          <div className="flex w-full shrink-0 flex-col justify-end gap-2.5 wide:mx-auto wide:w-80 land:w-56 land:justify-center">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
