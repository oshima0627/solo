'use client'

import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-coral-500 text-white active:bg-coral-400 disabled:bg-sea-700',
  secondary: 'bg-sea-700 text-foam-100 active:bg-sea-600 disabled:opacity-40',
  ghost: 'bg-transparent text-foam-300 border border-sea-700 active:bg-sea-800',
  danger: 'bg-sea-800 text-foam-300 border border-sea-600 active:bg-sea-700',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`w-full rounded-2xl px-5 py-4 text-lg font-bold transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
    />
  )
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-sea-700 bg-sea-900 p-4 ${className}`}>
      {children}
    </div>
  )
}

/**
 * 見出し付きのまとまり。
 * 中身が複数のボタン（Segmented / NumberInput）になることがあるため、
 * label 要素では包まない。label で包むと見出しのクリックが
 * 最初のボタンの操作として扱われてしまう。
 */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  const labelId = useId()
  return (
    <div role="group" aria-labelledby={labelId} className="space-y-2">
      <span id={labelId} className="block text-sm font-bold text-foam-300">
        {label}
      </span>
      {children}
      {hint ? <span className="block text-xs leading-relaxed text-foam-500">{hint}</span> : null}
    </div>
  )
}

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
    <div className="flex gap-1 rounded-xl bg-sea-800 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`flex-1 rounded-lg px-2 py-2.5 text-sm font-bold transition-colors ${
            value === option.value ? 'bg-coral-500 text-white' : 'text-foam-300'
          }`}
        >
          {option.label}
        </button>
      ))}
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
      className="flex w-full items-center justify-between gap-3 rounded-xl bg-sea-800 px-4 py-3 text-left"
    >
      <span>
        <span className="block text-sm font-bold text-foam-100">{label}</span>
        {hint ? <span className="block text-xs text-foam-500">{hint}</span> : null}
      </span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-jade-400' : 'bg-sea-600'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </span>
    </button>
  )
}

export function NumberInput({
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
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="減らす"
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        className="h-12 w-12 shrink-0 rounded-xl bg-sea-700 text-2xl font-bold disabled:opacity-30"
      >
        −
      </button>
      <div className="flex-1 rounded-xl bg-sea-800 py-3 text-center text-xl font-bold tabular-nums">
        {value}
      </div>
      <button
        type="button"
        aria-label="増やす"
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        className="h-12 w-12 shrink-0 rounded-xl bg-sea-700 text-2xl font-bold disabled:opacity-30"
      >
        ＋
      </button>
    </div>
  )
}

export function Screen({ children }: { children: ReactNode }) {
  return <div className="flex min-h-dvh flex-col gap-4 p-4">{children}</div>
}
