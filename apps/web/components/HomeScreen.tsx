'use client'

import Link from 'next/link'
import { CardFace } from './Cards'
import { SoundToggle } from './SoundToggle'
import { Button, Screen } from './ui'

export function HomeScreen({
  hasSaved,
  onResume,
  onNew,
}: {
  hasSaved: boolean
  onResume: () => void
  onNew: () => void
}) {
  return (
    <Screen>
      <header className="flex items-center justify-between border-b border-rule pb-3">
        <span className="label">沖縄のトランプゲーム</span>
        <SoundToggle className="-mr-1.5" />
      </header>

      <div className="flex flex-1 flex-col justify-center gap-8">
        <div className="animate-rise">
          <h1 className="font-serif text-[5.5rem] leading-[0.85] tracking-[-0.02em]">ソロ</h1>
          <p className="mt-6 text-sm leading-[1.95] text-ink-soft">
            スマホ1台を回して遊ぶ、沖縄のローカルゲーム。
            A〜10の20枚だけを使い、配られた2枚の役の強さを競います。
          </p>
        </div>

        {/* バクダン。このゲームで一番強い手を静かに置いておく */}
        <div
          className="animate-rise flex justify-center py-2"
          style={{ animationDelay: '90ms' }}
          aria-hidden="true"
        >
          <div className="-mr-3 rotate-[-8deg]">
            <CardFace card={{ rank: 10, suit: 'S' }} size="lg" />
          </div>
          <div className="mt-4 rotate-[7deg]">
            <CardFace card={{ rank: 10, suit: 'C' }} size="lg" />
          </div>
        </div>

        <div
          className="animate-rise border-y border-rule py-3 text-center"
          style={{ animationDelay: '180ms' }}
        >
          <p className="text-sm tracking-[0.16em] text-ink-soft">
            ソロ　＞　逆ソロ　＞　ピン　＞　数字
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {hasSaved ? (
          <>
            <Button onClick={onResume}>続きから</Button>
            <Button variant="quiet" onClick={onNew}>
              新しいゲーム
            </Button>
          </>
        ) : (
          <Button onClick={onNew}>はじめる</Button>
        )}
        <Link href="/rules" className="block pt-1 text-center text-sm text-ink-soft underline underline-offset-4">
          ルールを読む
        </Link>
      </div>
    </Screen>
  )
}
