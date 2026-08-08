'use client'

import { isRedSuit, suitSymbol, type Card } from '@solo/engine'

type Size = 'sm' | 'md' | 'lg'

const BOX: Record<Size, string> = {
  sm: 'h-[4.5rem] w-[3.25rem] rounded-[3px]',
  md: 'h-28 w-20 rounded-[5px]',
  lg: 'h-40 w-[7rem] rounded-[6px]',
}

const RANK_SIZE: Record<Size, string> = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-5xl',
}

const SUIT_SIZE: Record<Size, string> = {
  sm: 'text-[0.6rem] left-1 top-1',
  md: 'text-sm left-2 top-1.5',
  lg: 'text-base left-2.5 top-2',
}

function rankLabel(card: Card): string {
  return card.rank === 1 ? 'A' : String(card.rank)
}

export function CardFace({
  card,
  size = 'md',
  highlight = false,
}: {
  card: Card
  size?: Size
  /** バクダンの札を目立たせる */
  highlight?: boolean
}) {
  const red = isRedSuit(card.suit)
  const tone = red ? 'text-vermilion' : 'text-ink'

  return (
    <div
      className={`${BOX[size]} relative flex items-center justify-center border shadow-[0_1px_2px_rgba(25,23,19,0.14)] ${
        highlight ? 'border-brass bg-[#f6edd6]' : 'border-rule-strong bg-paper-raised'
      }`}
      // 色だけに頼らず、スート記号とランクの両方で識別できるようにする
      aria-label={`${suitSymbol(card.suit)}の${rankLabel(card)}`}
    >
      <span className={`absolute ${SUIT_SIZE[size]} leading-none ${tone}`}>
        {suitSymbol(card.suit)}
      </span>
      <span className={`font-serif leading-none ${RANK_SIZE[size]} ${tone}`}>
        {rankLabel(card)}
      </span>
    </div>
  )
}

export function CardBack({ size = 'md' }: { size?: Size }) {
  return (
    <div
      className={`${BOX[size]} border border-rule-strong bg-paper-sunk`}
      style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(25,23,19,0.07) 0 2px, transparent 2px 7px)',
      }}
      aria-label="伏せられたカード"
    />
  )
}

export function HandRow({
  cards,
  hidden = false,
  size = 'md',
  animate = false,
  highlight = false,
}: {
  cards: readonly Card[] | null
  hidden?: boolean
  size?: Size
  /** 公開時にめくる演出を付ける */
  animate?: boolean
  highlight?: boolean
}) {
  const gap = size === 'sm' ? 'gap-1.5' : 'gap-2.5'

  return (
    <div className={`flex justify-center ${gap}`}>
      {hidden || !cards
        ? [0, 1].map((i) => <CardBack key={i} size={size} />)
        : cards.map((card, i) => (
            <div
              key={`${card.suit}${card.rank}`}
              className={animate ? 'animate-flip' : undefined}
              style={animate ? { animationDelay: `${i * 90}ms` } : undefined}
            >
              <CardFace card={card} size={size} highlight={highlight} />
            </div>
          ))}
    </div>
  )
}
