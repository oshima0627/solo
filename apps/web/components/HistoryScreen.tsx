'use client'

import { useEffect, useState } from 'react'
import type { GameConfig } from '@solo/engine'
import { loadHistory, type HistoryEntry } from '@/lib/history'
import { Button, Screen } from './ui'

function formatDate(timestamp: number): string {
  const d = new Date(timestamp)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function HistoryScreen({
  onBack,
  onUseConfig,
}: {
  onBack: () => void
  onUseConfig: (config: GameConfig) => void
}) {
  // localStorage はマウント後に読む（サーバー描画との食い違いを避けるため）
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null)

  useEffect(() => setEntries(loadHistory()), [])

  return (
    <Screen
      header={
        <header className="border-b border-rule pb-3">
          <span className="label">これまでの記録</span>
        </header>
      }
      footer={
        <Button variant="quiet" onClick={onBack}>
          戻る
        </Button>
      }
    >
      <div className="animate-rise shrink-0">
        <h1 className="font-serif text-6xl leading-none wide:text-7xl land:text-4xl">履歴</h1>
        <div className="mt-5 h-px w-16 bg-vermilion land:mt-3" />
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto land:mt-3">
        {entries === null ? (
          <p className="text-sm text-ink-faint">読み込み中</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-ink-faint">まだ対局の記録がありません。</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="border-b border-rule py-4 first:border-t">
              <div className="flex items-baseline justify-between">
                <span className="label tnum">{formatDate(entry.finishedAt)}</span>
                <span className="label tnum">全 {entry.roundNo} 局</span>
              </div>
              <div className="mt-3 space-y-1.5">
                {entry.standings.map((row, i) => {
                  const diff = row.chips - entry.initialChips
                  const top = row.rank === 1
                  return (
                    <div key={i} className="flex items-baseline gap-3 text-sm">
                      <span
                        className={`tnum w-5 shrink-0 ${top ? 'font-bold text-vermilion' : 'text-ink-faint'}`}
                      >
                        {row.rank}
                      </span>
                      <span className={`min-w-0 flex-1 truncate ${top ? 'font-bold' : ''}`}>
                        {row.name}
                      </span>
                      <span className="tnum text-right">{row.chips}</span>
                      <span
                        className={`tnum w-16 text-right text-xs ${
                          diff > 0 ? 'text-ink-soft' : diff < 0 ? 'text-vermilion' : 'text-ink-faint'
                        }`}
                      >
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    </div>
                  )
                })}
              </div>
              {entry.config ? (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onUseConfig(entry.config!)}
                    className="text-xs text-ink-soft underline underline-offset-4"
                  >
                    この設定で始める
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </Screen>
  )
}
