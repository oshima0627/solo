'use client'

import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react'

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

export function Stepper({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n))
  const arrow =
    'flex h-11 w-11 shrink-0 items-center justify-center border border-rule-strong text-lg text-ink transition-colors active:bg-paper-sunk disabled:border-rule disabled:text-rule-strong'

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        aria-label="減らす"
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        className={`${arrow} rounded-sm`}
      >
        −
      </button>
      <span className="tnum flex-1 text-center font-serif text-3xl leading-none">{value}</span>
      <button
        type="button"
        aria-label="増やす"
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        className={`${arrow} rounded-sm`}
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

export function Screen({ children }: { children: ReactNode }) {
  return <div className="flex min-h-dvh flex-col gap-6 px-5 pb-7 pt-6">{children}</div>
}
