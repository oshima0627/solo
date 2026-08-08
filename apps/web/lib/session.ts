import type { GameState } from '@solo/engine'

const STORAGE_KEY = 'solo:session:v1'

/**
 * セッションは localStorage にのみ保存し、外部へは一切送信しない。
 * 保存形式が変わったときに壊れないよう、読み込みは常に失敗を許容する。
 */
export function loadSession(): GameState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GameState
    if (!parsed?.config?.players?.length || !parsed.phase) return null
    if (parsed.phase === 'GAME_END') return null
    return parsed
  } catch {
    return null
  }
}

export function saveSession(game: GameState | null): void {
  if (typeof window === 'undefined') return
  try {
    if (game === null || game.phase === 'GAME_END') {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
  } catch {
    // 保存できなくてもゲームは続行できるので握りつぶす
  }
}
