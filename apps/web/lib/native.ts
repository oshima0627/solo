'use client'

/**
 * Capacitor への依存をこの1ファイルに閉じ込める。
 * ブラウザ実行時（Web 版）は isNative() が false になり、全関数が no-op になる。
 */

import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { KeepAwake } from '@capacitor-community/keep-awake'

export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

export async function hideSplash(): Promise<void> {
  if (!isNative()) return
  try {
    await SplashScreen.hide()
  } catch {
    // 失敗してもアプリの利用は継続できるので握りつぶす
  }
}

export async function initStatusBar(): Promise<void> {
  if (!isNative()) return
  try {
    await StatusBar.setBackgroundColor({ color: '#f2eee5' })
    await StatusBar.setStyle({ style: Style.Light })
  } catch {
    // 対応していない端末でも続行できるよう握りつぶす
  }
}

export async function setKeepAwake(on: boolean): Promise<void> {
  if (!isNative()) return
  try {
    if (on) {
      await KeepAwake.keepAwake()
    } else {
      await KeepAwake.allowSleep()
    }
  } catch {
    // 対応していない端末でも続行できるよう握りつぶす
  }
}

export async function vibrate(kind: 'light' | 'bomb'): Promise<void> {
  if (!isNative()) return
  try {
    await Haptics.impact({ style: kind === 'bomb' ? ImpactStyle.Heavy : ImpactStyle.Light })
  } catch {
    // 端末が振動に対応していなくても続行できるよう握りつぶす
  }
}

/**
 * 戻るボタンのハンドラを登録する。
 * handler が true を返せば画面内で処理済み（アプリは終了しない）。
 * false を返せばアプリを終了する。
 * 戻り値の関数を呼ぶと登録を解除する。
 */
export function onBackButton(handler: () => boolean): () => void {
  if (!isNative()) return () => {}

  const listenerPromise = App.addListener('backButton', () => {
    const shouldExit = !handler()
    if (shouldExit) void App.exitApp()
  })

  return () => {
    void listenerPromise.then((listener) => listener.remove()).catch(() => {})
  }
}
