'use client'

import { useEffect, useState } from 'react'
import { isMuted, playCue, setMuted } from '@/lib/sound'

export function SoundToggle({ className = '' }: { className?: string }) {
  const [muted, setMutedState] = useState(false)

  // localStorage は描画後に読む（サーバー描画との食い違いを避けるため）
  useEffect(() => setMutedState(isMuted()), [])

  return (
    <button
      type="button"
      aria-label={muted ? '効果音をオンにする' : '効果音をオフにする'}
      aria-pressed={!muted}
      onClick={() => {
        const next = !muted
        setMuted(next)
        setMutedState(next)
        if (!next) playCue('win')
      }}
      className={`rounded-xl px-3 py-2 text-lg text-foam-300 transition-colors active:bg-sea-800 ${className}`}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
