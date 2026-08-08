'use client'

import Link from 'next/link'
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
      <div className="flex justify-end">
        <SoundToggle />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm tracking-[0.4em] text-foam-500">OKINAWA CARD GAME</p>
        <h1 className="text-6xl font-black tracking-tight text-foam-100">ソロ</h1>
        <p className="max-w-xs text-sm leading-relaxed text-foam-300">
          スマホ1台を回して遊ぶ、沖縄のトランプゲーム。
          <br />
          A〜10の20枚だけを使い、2枚の役の強さを競います。
        </p>
        <p className="mt-2 rounded-xl bg-sea-900 px-4 py-2 text-xs text-foam-500">
          ソロ ＞ 逆ソロ ＞ ピン ＞ 数字
        </p>
      </div>

      <div className="space-y-3 pb-2">
        {hasSaved ? (
          <Button onClick={onResume}>続きから</Button>
        ) : null}
        <Button variant={hasSaved ? 'secondary' : 'primary'} onClick={onNew}>
          新しいゲーム
        </Button>
        <Link href="/rules" className="block">
          <Button variant="ghost">ルールを見る</Button>
        </Link>
      </div>
    </Screen>
  )
}
