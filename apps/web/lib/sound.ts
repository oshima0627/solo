'use client'

/**
 * 掛け声の効果音。
 *
 * 音声ファイルは持たず、Web Audio API で合成する。
 * 静的サイトのまま配信量を増やさずに済み、オフラインでも鳴る。
 */

export type Cue = 'win' | 'draw' | 'flow' | 'bomb' | 'end'

const MUTE_KEY = 'solo:muted:v1'

let context: AudioContext | null = null

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    context ??= new AudioContext()
    // 端末によっては最初のユーザー操作まで停止しているので都度起こす
    if (context.state === 'suspended') void context.resume()
    return context
  } catch {
    return null
  }
}

export function isMuted(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function setMuted(muted: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  } catch {
    // 保存できなくても音の再生自体には影響しない
  }
}

interface ToneOptions {
  freq: number
  /** 開始からの遅延（秒） */
  at?: number
  duration?: number
  type?: OscillatorType
  gain?: number
  /** 指定すると freq からこの周波数へ滑らかに変化する */
  slideTo?: number
}

function tone(ctx: AudioContext, options: ToneOptions): void {
  const { freq, at = 0, duration = 0.16, type = 'sine', gain = 0.12, slideTo } = options
  const start = ctx.currentTime + at

  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration)

  // クリックノイズが出ないよう、立ち上がりと減衰を必ず付ける
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.012)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  osc.connect(amp).connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

export function playCue(cue: Cue): void {
  if (isMuted()) return
  const ctx = ensureContext()
  if (!ctx) return

  switch (cue) {
    // 勝ち：明るい上昇アルペジオ
    case 'win':
      tone(ctx, { freq: 523.25, at: 0, duration: 0.13 })
      tone(ctx, { freq: 659.25, at: 0.09, duration: 0.13 })
      tone(ctx, { freq: 783.99, at: 0.18, duration: 0.24 })
      break

    // バクダン：低い炸裂音のあとに華やかな和音
    case 'bomb':
      tone(ctx, { freq: 140, slideTo: 45, duration: 0.4, type: 'sawtooth', gain: 0.22 })
      tone(ctx, { freq: 987.77, at: 0.12, duration: 0.3, type: 'triangle', gain: 0.14 })
      tone(ctx, { freq: 1318.51, at: 0.2, duration: 0.34, type: 'triangle', gain: 0.12 })
      break

    // 引き分け：同じ高さを2回、決着しない感じ
    case 'draw':
      tone(ctx, { freq: 440, duration: 0.12, type: 'triangle' })
      tone(ctx, { freq: 440, at: 0.16, duration: 0.18, type: 'triangle' })
      break

    // 流局：力が抜ける下降
    case 'flow':
      tone(ctx, { freq: 392, slideTo: 174.61, duration: 0.42, type: 'triangle', gain: 0.14 })
      break

    // 終局：締めの和音
    case 'end':
      tone(ctx, { freq: 523.25, duration: 0.5, gain: 0.1 })
      tone(ctx, { freq: 659.25, at: 0.06, duration: 0.5, gain: 0.1 })
      tone(ctx, { freq: 830.61, at: 0.12, duration: 0.55, gain: 0.1 })
      break
  }
}
