'use client'

import type { Card } from '@solo/engine'

const SUIT_SYMBOL = { S: '♠', C: '♣' } as const

function rankLabel(card: Card): string {
  return card.rank === 1 ? 'A' : String(card.rank)
}

export function CardFace({ card, size = 'md' }: { card: Card; size?: 'sm' | 'md' | 'lg' }) {
  const box = {
    sm: 'h-20 w-14 text-xl',
    md: 'h-32 w-22 text-4xl',
    lg: 'h-40 w-28 text-5xl',
  }[size]

  return (
    <div
      className={`${box} flex flex-col items-center justify-center rounded-xl bg-card font-bold text-card-ink shadow-lg`}
      // 色だけに頼らず、スート記号とランクの両方で識別できるようにする
      aria-label={`${SUIT_SYMBOL[card.suit]}の${rankLabel(card)}`}
    >
      <span className="leading-none tabular-nums">{rankLabel(card)}</span>
      <span className="mt-1 text-[0.6em] leading-none opacity-70">{SUIT_SYMBOL[card.suit]}</span>
    </div>
  )
}

export function CardBack({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const box = {
    sm: 'h-20 w-14',
    md: 'h-32 w-22',
    lg: 'h-40 w-28',
  }[size]

  return (
    <div
      className={`${box} rounded-xl border-2 border-sea-600 bg-sea-800 shadow-lg`}
      style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 6px, transparent 6px 12px)',
      }}
      aria-label="伏せられたカード"
    />
  )
}

export function HandRow({
  cards,
  hidden = false,
  size = 'md',
}: {
  cards: readonly Card[] | null
  hidden?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <div className="flex justify-center gap-3">
      {hidden || !cards
        ? [0, 1].map((i) => <CardBack key={i} size={size} />)
        : cards.map((card) => <CardFace key={`${card.suit}${card.rank}`} card={card} size={size} />)}
    </div>
  )
}
