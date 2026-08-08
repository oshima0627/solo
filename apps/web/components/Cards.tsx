'use client'

import { isRedSuit, suitSymbol, type Card, type Rank } from '@solo/engine'

type Size = 'sm' | 'md' | 'lg'

/** 実際のトランプと同じ 2.5 : 3.5 の比率 */
const WIDTH: Record<Size, string> = {
  sm: 'w-[3.25rem]',
  md: 'w-[4.75rem]',
  lg: 'w-[6.75rem]',
}

const RADIUS: Record<Size, string> = {
  sm: 'rounded-[3px]',
  md: 'rounded-[4px]',
  lg: 'rounded-[6px]',
}

/**
 * ピップ（スート記号）の配置。
 * 英米式のトランプに倣った並びで、A〜10 まですべて実物と同じ位置に置く。
 * 座標は viewBox 100 × 140 の中の値。中心より下のピップは実物同様 180 度回す。
 */
const COL = { left: 32, center: 50, right: 68 }
const ROW = {
  top: 30,
  upper: 56.7,
  lower: 83.3,
  bottom: 110,
  middle: 70,
  /** 上段と中段のあいだ（7・8 の中央ピップ） */
  betweenUpper: 50,
  /** 中段と下段のあいだ */
  betweenLower: 90,
  /** 10 の中央ピップ。1段目と2段目、3段目と4段目のあいだ */
  tenUpper: 43.3,
  tenLower: 96.7,
}

const SIDE_THREE: [number, number][] = [
  [COL.left, ROW.top],
  [COL.right, ROW.top],
  [COL.left, ROW.middle],
  [COL.right, ROW.middle],
  [COL.left, ROW.bottom],
  [COL.right, ROW.bottom],
]

const SIDE_FOUR: [number, number][] = [
  [COL.left, ROW.top],
  [COL.right, ROW.top],
  [COL.left, ROW.upper],
  [COL.right, ROW.upper],
  [COL.left, ROW.lower],
  [COL.right, ROW.lower],
  [COL.left, ROW.bottom],
  [COL.right, ROW.bottom],
]

const PIPS: Record<Rank, [number, number][]> = {
  1: [[COL.center, ROW.middle]],
  2: [
    [COL.center, ROW.top],
    [COL.center, ROW.bottom],
  ],
  3: [
    [COL.center, ROW.top],
    [COL.center, ROW.middle],
    [COL.center, ROW.bottom],
  ],
  4: [
    [COL.left, ROW.top],
    [COL.right, ROW.top],
    [COL.left, ROW.bottom],
    [COL.right, ROW.bottom],
  ],
  5: [
    [COL.left, ROW.top],
    [COL.right, ROW.top],
    [COL.center, ROW.middle],
    [COL.left, ROW.bottom],
    [COL.right, ROW.bottom],
  ],
  6: SIDE_THREE,
  7: [...SIDE_THREE, [COL.center, ROW.betweenUpper]],
  8: [...SIDE_THREE, [COL.center, ROW.betweenUpper], [COL.center, ROW.betweenLower]],
  9: [...SIDE_FOUR, [COL.center, ROW.middle]],
  10: [...SIDE_FOUR, [COL.center, ROW.tenUpper], [COL.center, ROW.tenLower]],
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
  const label = rankLabel(card)
  const suit = suitSymbol(card.suit)
  const color = isRedSuit(card.suit) ? 'var(--color-vermilion)' : 'var(--color-ink)'
  const ace = card.rank === 1

  // 「10」だけ2桁ぶん詰める
  const indexSize = label.length > 1 ? 15 : 18

  const cornerIndex = (
    <g fill={color}>
      <text
        x="12"
        y="23"
        fontSize={indexSize}
        fontFamily="var(--font-serif)"
        textAnchor="middle"
        fontWeight="600"
      >
        {label}
      </text>
      <text x="12" y="37" fontSize="12" textAnchor="middle">
        {suit}
      </text>
    </g>
  )

  return (
    <div
      className={`${WIDTH[size]} ${RADIUS[size]} aspect-[5/7] overflow-hidden border shadow-[0_1px_3px_rgba(25,23,19,0.16)] ${
        highlight ? 'border-brass bg-[#f8f0da]' : 'border-rule-strong bg-[#fdfcf9]'
      }`}
      aria-label={`${suit}の${label}`}
    >
      <svg viewBox="0 0 100 140" className="h-full w-full" aria-hidden="true">
        {cornerIndex}
        {/* 実物と同じく、反対側の角にも上下逆さまの指標を入れる */}
        <g transform="rotate(180 50 70)">{cornerIndex}</g>

        {PIPS[card.rank].map(([x, y]) => (
          <text
            key={`${x}-${y}`}
            x={x}
            y={y}
            fill={color}
            fontSize={ace ? 44 : 20}
            textAnchor="middle"
            dominantBaseline="central"
            // 中心より下のピップは実物と同様に上下を逆にする
            transform={y > ROW.middle ? `rotate(180 ${x} ${y})` : undefined}
          >
            {suit}
          </text>
        ))}
      </svg>
    </div>
  )
}

export function CardBack({ size = 'md' }: { size?: Size }) {
  return (
    <div
      className={`${WIDTH[size]} ${RADIUS[size]} aspect-[5/7] overflow-hidden border border-rule-strong bg-[#fdfcf9] shadow-[0_1px_3px_rgba(25,23,19,0.16)]`}
      aria-label="伏せられたカード"
    >
      <svg viewBox="0 0 100 140" className="h-full w-full" aria-hidden="true">
        <defs>
          {/* 実物の裏面によくある斜めの網目 */}
          <pattern id="card-back" width="7" height="7" patternUnits="userSpaceOnUse">
            <path
              d="M0 7 L7 0 M0 0 L7 7"
              stroke="var(--color-vermilion)"
              strokeWidth="0.9"
              opacity="0.38"
            />
          </pattern>
        </defs>
        {/* 実物の裏面と同じく、外周に白い余白を残す */}
        <rect x="5" y="5" width="90" height="130" rx="3" fill="url(#card-back)" />
        <rect
          x="5"
          y="5"
          width="90"
          height="130"
          rx="3"
          fill="none"
          stroke="var(--color-vermilion)"
          strokeWidth="1.4"
          opacity="0.55"
        />
      </svg>
    </div>
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
