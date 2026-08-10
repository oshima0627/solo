import { standings, type GameConfig, type GameState } from '@solo/engine'

const HISTORY_KEY = 'solo:history:v1'
const MAX_ENTRIES = 50

export interface HistoryStanding {
  readonly name: string
  readonly chips: number
  readonly rank: number
}

export interface HistoryEntry {
  readonly id: string
  readonly finishedAt: number
  readonly roundNo: number
  readonly initialChips: number
  readonly standings: readonly HistoryStanding[]
  /** 「この設定で始める」で使う、対局開始時点の設定一式 */
  readonly config: GameConfig
}

function summarize(game: GameState): HistoryEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    finishedAt: Date.now(),
    roundNo: game.roundNo,
    initialChips: game.config.initialChips,
    standings: standings(game).map(({ name, chips, rank }) => ({ name, chips, rank })),
    config: game.config,
  }
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** 対局が終わるたびに1件追加する。直近 MAX_ENTRIES 件だけ残し、古いものから捨てる */
export function appendHistory(game: GameState): void {
  if (typeof window === 'undefined') return
  try {
    const next = [summarize(game), ...loadHistory()].slice(0, MAX_ENTRIES)
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  } catch {
    // 保存できなくても対局自体は続けられるので握りつぶす
  }
}
