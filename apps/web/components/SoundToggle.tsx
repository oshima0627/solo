'use client'

import { useEffect, useState } from 'react'
import { vibrate } from '@/lib/native'
import { isMuted, playCue, setMuted } from '@/lib/sound'

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6.75h2.5L9 3.75v10.5L5.5 11.25H3z" />
      {muted ? (
        <path d="M12 6.5l3.5 5M15.5 6.5l-3.5 5" />
      ) : (
        <>
          <path d="M11.75 6.75a3 3 0 0 1 0 4.5" />
          <path d="M13.75 4.75a5.75 5.75 0 0 1 0 8.5" />
        </>
      )}
    </svg>
  )
}

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
        if (!next) {
          playCue('win')
          void vibrate('light')
        }
      }}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors active:bg-paper-sunk ${
        muted ? 'text-ink-faint' : 'text-ink-soft'
      } ${className}`}
    >
      <SpeakerIcon muted={muted} />
    </button>
  )
}
