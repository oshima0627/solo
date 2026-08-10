# ソロ Android アプリ（Capacitor ラップ）実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 既存の Next.js 静的サイト（`apps/web`）を Capacitor で Android アプリとして同梱し、ネイティブらしい挙動（戻るボタン・常時点灯・スプラッシュ・ハプティクス）を足したうえで、Google Play への公開準備を整える。

**Architecture:** `apps/web/out`（静的書き出し）を `webDir` として指す Capacitor プロジェクトを追加し、Android プロジェクト一式（`android/`）を solo リポジトリ内に生成する。Web 側のコード変更は `apps/web/lib/native.ts` という単一の橋渡し層に閉じ込め、ブラウザ実行時は全関数が no-op になるようにする。これにより既存の Web 版の挙動・ビルド・デプロイは無変更のまま保たれる。

**Tech Stack:** Capacitor 8系（`@capacitor/core` / `@capacitor/cli` / `@capacitor/android` / `@capacitor/app` / `@capacitor/haptics` / `@capacitor/splash-screen` / `@capacitor/status-bar` / `@capacitor-community/keep-awake`）、`@fontsource/noto-serif-jp`、素材生成に `sharp` + `glob`（Node スクリプト）。

## Global Constraints

- Web 版（`apps/web` のビルド・デプロイ・見た目）を壊さない。Capacitor 関連の分岐は必ず `apps/web/lib/native.ts` に閉じ込め、ブラウザでは no-op にする。
- `apps/web` には既存の単体テスト基盤が無い（`packages/solo-engine` にのみ vitest がある）。この計画で apps/web に新しいテストランナーを導入しない。apps/web の各タスクの検証は `npm run typecheck -w @solo/web` と `npm run build -w @solo/web` の成功、および指定した手動確認で行う。
- `packages/solo-engine` のロジックには一切手を入れない（既存139件のテストは無変更で通り続ける）。
- 署名鍵（`*.keystore` / `keystore.properties`）は絶対にコミットしない。
- applicationId は `io.github.oshima0627.solo` で固定する（後から変更不可のため）。
- フォントの `@font-face` を追加する際、`apps/web/app/globals.css` の `--font-serif` の候補順序は変更しない（Mac/Windows の見た目を変えないため）。

---

## ファイル構成

| ファイル | 種別 | 担当タスク |
|---|---|---|
| `package.json`（ルート） | 変更 | 1 |
| `capacitor.config.ts` | 新規 | 1 |
| `android/`（Capacitor 生成） | 新規 | 1, 8 |
| `.gitignore` | 変更 | 1, 10 |
| `apps/web/package.json` | 変更 | 1, 2 |
| `apps/web/app/globals.css` | 変更 | 2 |
| `apps/web/lib/native.ts` | 新規 | 3 |
| `apps/web/app/page.tsx` | 変更 | 4, 7 |
| `apps/web/lib/useSolo.ts` | 変更 | 5, 7 |
| `apps/web/components/EndScreen.tsx` | 変更 | 6 |
| `apps/web/components/ResultScreen.tsx` | 変更 | 6 |
| `apps/web/components/SoundToggle.tsx` | 変更 | 6 |
| `apps/web/components/ConfirmDialog.tsx` | 新規 | 7 |
| `scripts/generate-android-assets.mjs` | 新規 | 8 |
| `apps/web/app/privacy/page.tsx` | 新規 | 9 |
| `docs/deploy-android.md` | 新規 | 10 |
| `android/keystore.properties.example` | 新規 | 10 |

---

### Task 1: Capacitor 基盤の導入

**Files:**
- Modify: `package.json`（ルート）
- Modify: `apps/web/package.json`
- Modify: `.gitignore`
- Create: `capacitor.config.ts`
- Create: `android/`（`npx cap add android` により生成。手書きしない）

**Interfaces:**
- Consumes: なし
- Produces: `android/` ディレクトリ（以降の全タスクが前提とする）。ルート `npm run cap:sync` / `npm run android` スクリプト。

- [ ] **Step 1: Capacitor のコアパッケージをルートにインストールする**

```bash
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli
```

- [ ] **Step 2: apps/web に Capacitor のプラグイン群をインストールする**

`native.ts`（Task 3）が直接 import するため、`apps/web` のワークスペースにも依存として必要。

```bash
npm install @capacitor/core @capacitor/app @capacitor/haptics @capacitor/splash-screen @capacitor/status-bar @capacitor-community/keep-awake -w @solo/web
```

- [ ] **Step 3: capacitor.config.ts を作成する**

`capacitor.config.ts`（新規、リポジトリルート）:

```ts
import type { CapacitorConfig } from '@capacitor/core'

const config: CapacitorConfig = {
  appId: 'io.github.oshima0627.solo',
  appName: 'ソロ',
  webDir: 'apps/web/out',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#f2eee5',
    },
  },
}

export default config
```

（`StatusBar` はランタイムから呼ぶため、ここでは設定しない。Task 4 で扱う。）

- [ ] **Step 4: apps/web をビルドしてから Android プロジェクトを追加する**

`webDir`（`apps/web/out`）が存在しないと `cap add` が正しく初期化できないため、先にビルドする。

```bash
npm run build
npx cap add android
```

Expected: `android/` ディレクトリが生成され、`android/app/src/main/assets/public/` に `out/` の中身がコピーされている。

- [ ] **Step 5: 同期スクリプトを確認する**

```bash
npx cap sync android
```

Expected: エラーなく完了する。`android/app/src/main/assets/public/index.html` が存在することを確認する。

- [ ] **Step 6: ルート package.json にスクリプトを追加する**

`package.json`（ルート）の `scripts` を以下に置き換える:

```json
{
  "name": "solo",
  "version": "0.0.0",
  "private": true,
  "description": "沖縄のトランプゲーム「ソロ」のWebアプリ",
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "dev": "npm run dev -w @solo/web",
    "build": "npm run build -w @solo/web",
    "deploy": "npm run build && wrangler deploy",
    "preview": "npm run build && wrangler dev",
    "test": "npm run test --workspaces --if-present",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "cap:sync": "npm run build && npx cap sync android",
    "android": "npm run cap:sync && npx cap open android"
  }
}
```

- [ ] **Step 7: .gitignore に Android のビルド生成物を追加する**

`.gitignore` に以下を追記する（既存の内容はそのまま残す）:

```
android/app/build/
android/build/
android/.gradle/
android/local.properties
android/captures/
*.hprof
```

- [ ] **Step 8: 動作確認**

```bash
npm run typecheck
npm run cap:sync
```

Expected: どちらもエラーなく完了する。

- [ ] **Step 9: コミット**

```bash
git add package.json apps/web/package.json package-lock.json capacitor.config.ts android .gitignore
git commit -m "build: Capacitor で Android プロジェクトを追加する"
```

---

### Task 2: Noto Serif JP の同梱

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Consumes: なし
- Produces: なし（見た目のみの変更）

- [ ] **Step 1: パッケージを追加する**

```bash
npm install @fontsource/noto-serif-jp -w @solo/web
```

- [ ] **Step 2: globals.css で読み込む**

[apps/web/app/globals.css](../../apps/web/app/globals.css) の1行目 `@import 'tailwindcss';` の直後に追記する（`--font-serif` の候補順序 [globals.css:24](../../apps/web/app/globals.css#L24) は変更しない）:

```css
@import 'tailwindcss';
@import '@fontsource/noto-serif-jp/400.css';
@import '@fontsource/noto-serif-jp/700.css';
```

- [ ] **Step 3: ビルドで確認する**

```bash
npm run build -w @solo/web
```

Expected: エラーなく完了する。`apps/web/out/_next/static/media/` 配下に `noto-serif-jp` を含む woff2 ファイルが出力されていることを確認する。

- [ ] **Step 4: ブラウザで見た目が変わらないことを確認する**

```bash
npm run dev -w @solo/web
```

トップページを開き、見出しの書体が今までと変わっていないことを目視確認する（Mac/Windows では Hiragino/Yu Mincho が優先されるため、これらの環境では無変化のはず）。

- [ ] **Step 5: コミット**

```bash
git add apps/web/package.json package-lock.json apps/web/app/globals.css
git commit -m "feat(web): Noto Serif JP を同梱し Android でも明朝体を効かせる"
```

---

### Task 3: native.ts ブリッジ層の作成

**Files:**
- Create: `apps/web/lib/native.ts`

**Interfaces:**
- Consumes: Task 1 でインストールした `@capacitor/core` / `@capacitor/app` / `@capacitor/haptics` / `@capacitor/splash-screen` / `@capacitor/status-bar` / `@capacitor-community/keep-awake`
- Produces:
  - `isNative(): boolean`
  - `hideSplash(): Promise<void>`
  - `initStatusBar(): Promise<void>`
  - `setKeepAwake(on: boolean): Promise<void>`
  - `vibrate(kind: 'light' | 'bomb'): Promise<void>`
  - `onBackButton(handler: () => boolean): () => void` — `handler` が `false` を返すとアプリを終了する。戻り値は登録解除関数。

- [ ] **Step 1: ファイルを作成する**

`apps/web/lib/native.ts`（新規）:

```ts
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
    await StatusBar.setStyle({ style: Style.Dark })
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
    void listenerPromise.then((listener) => listener.remove())
  }
}
```

- [ ] **Step 2: 型チェックで確認する**

```bash
npm run typecheck -w @solo/web
```

Expected: エラーなく完了する（`apps/web/tsconfig.json` の `include` は `**/*.ts` を含むため、まだどこからも import していなくても `native.ts` 自体が型チェックされる）。

- [ ] **Step 3: コミット**

```bash
git add apps/web/lib/native.ts
git commit -m "feat(web): Capacitor 向けのネイティブ橋渡し層を追加する"
```

---

### Task 4: スプラッシュとステータスバーの初期化

**Files:**
- Modify: `apps/web/app/page.tsx`

**Interfaces:**
- Consumes: Task 3 の `hideSplash()`, `initStatusBar()`
- Produces: なし

- [ ] **Step 1: page.tsx を修正する**

[apps/web/app/page.tsx](../../apps/web/app/page.tsx) の先頭 import 部分を変更する。

変更前:

```tsx
'use client'

import { useState } from 'react'
import { currentPlayerId, isCpu, type GameConfig } from '@solo/engine'
```

変更後:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { currentPlayerId, isCpu, type GameConfig } from '@solo/engine'
```

さらに `import { useSolo } from '@/lib/useSolo'` の行の直前に以下を追加する:

```tsx
import { hideSplash, initStatusBar } from '@/lib/native'
```

`export default function Page() {` の本体、`const [resumed, setResumed] = useState(false)` の直後・`if (!solo.hydrated)` の早期 return より前に、以下の2つの `useEffect` を追加する:

```tsx
useEffect(() => {
  void initStatusBar()
}, [])

useEffect(() => {
  if (solo.hydrated) void hideSplash()
}, [solo.hydrated])
```

- [ ] **Step 2: 動作確認する**

```bash
npm run typecheck -w @solo/web
npm run build -w @solo/web
```

Expected: どちらもエラーなく完了する。

- [ ] **Step 3: コミット**

```bash
git add apps/web/app/page.tsx
git commit -m "feat(web): 起動時にスプラッシュを隠しステータスバーを初期化する"
```

---

### Task 5: 画面常時点灯

**Files:**
- Modify: `apps/web/lib/useSolo.ts`

**Interfaces:**
- Consumes: Task 3 の `setKeepAwake(on: boolean)`
- Produces: なし（`useSolo()` の返り値の形は変わらない）

- [ ] **Step 1: useSolo.ts を修正する**

[apps/web/lib/useSolo.ts](../../apps/web/lib/useSolo.ts) の import 部分を変更する。

変更前:

```ts
import { loadSession, saveSession } from './session'
```

変更後:

```ts
import { setKeepAwake } from './native'
import { loadSession, saveSession } from './session'
```

CPU の手番を自動で進める `useEffect`（`if (game.phase !== 'DECIDE' && game.phase !== 'BET') return` を含むブロック）の直後・`const startGame = useCallback(...)` の直前に、以下を追加する:

```ts
// ゲームが進行中のあいだは画面を消灯させない
useEffect(() => {
  if (!hydrated) return
  void setKeepAwake(game !== null && game.phase !== 'GAME_END')
}, [game, hydrated])
```

- [ ] **Step 2: 動作確認する**

```bash
npm run typecheck -w @solo/web
npm run build -w @solo/web
```

Expected: どちらもエラーなく完了する。

- [ ] **Step 3: コミット**

```bash
git add apps/web/lib/useSolo.ts
git commit -m "feat(web): 対局中は画面が消灯しないようにする"
```

---

### Task 6: ハプティクスの統合

**Files:**
- Modify: `apps/web/components/EndScreen.tsx`
- Modify: `apps/web/components/ResultScreen.tsx`
- Modify: `apps/web/components/SoundToggle.tsx`

**Interfaces:**
- Consumes: Task 3 の `vibrate(kind: 'light' | 'bomb')`
- Produces: なし

- [ ] **Step 1: EndScreen.tsx を修正する**

[apps/web/components/EndScreen.tsx](../../apps/web/components/EndScreen.tsx) の import に追加する。

変更前:

```tsx
import { playCue } from '@/lib/sound'
```

変更後:

```tsx
import { vibrate } from '@/lib/native'
import { playCue } from '@/lib/sound'
```

`useEffect(() => playCue('end'), [])` を以下に置き換える:

```tsx
useEffect(() => {
  playCue('end')
  void vibrate('light')
}, [])
```

- [ ] **Step 2: ResultScreen.tsx を修正する**

[apps/web/components/ResultScreen.tsx](../../apps/web/components/ResultScreen.tsx) の import に追加する。

変更前:

```tsx
import { playCue, type Cue } from '@/lib/sound'
```

変更後:

```tsx
import { vibrate } from '@/lib/native'
import { playCue, type Cue } from '@/lib/sound'
```

以下のブロックを:

```tsx
  useEffect(() => {
    if (result) playCue(cueFor(result))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundNo])
```

以下に置き換える:

```tsx
  useEffect(() => {
    if (result) {
      const cue = cueFor(result)
      playCue(cue)
      void vibrate(cue === 'bomb' ? 'bomb' : 'light')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundNo])
```

- [ ] **Step 3: SoundToggle.tsx を修正する**

[apps/web/components/SoundToggle.tsx](../../apps/web/components/SoundToggle.tsx) の import を:

```tsx
import { isMuted, playCue, setMuted } from '@/lib/sound'
```

以下に置き換える:

```tsx
import { vibrate } from '@/lib/native'
import { isMuted, playCue, setMuted } from '@/lib/sound'
```

以下のブロックを:

```tsx
      onClick={() => {
        const next = !muted
        setMuted(next)
        setMutedState(next)
        if (!next) playCue('win')
      }}
```

以下に置き換える:

```tsx
      onClick={() => {
        const next = !muted
        setMuted(next)
        setMutedState(next)
        if (!next) {
          playCue('win')
          void vibrate('light')
        }
      }}
```

- [ ] **Step 4: 動作確認する**

```bash
npm run typecheck -w @solo/web
npm run build -w @solo/web
```

Expected: どちらもエラーなく完了する。

- [ ] **Step 5: コミット**

```bash
git add apps/web/components/EndScreen.tsx apps/web/components/ResultScreen.tsx apps/web/components/SoundToggle.tsx
git commit -m "feat(web): 効果音に合わせてハプティクスを鳴らす"
```

---

### Task 7: 戻るボタン制御と中断確認ダイアログ

**Files:**
- Create: `apps/web/components/ConfirmDialog.tsx`
- Modify: `apps/web/lib/useSolo.ts`
- Modify: `apps/web/app/page.tsx`

**Interfaces:**
- Consumes: Task 3 の `onBackButton(handler)`。Task 5 で変更済みの `useSolo.ts`。
- Produces: `useSolo()` の返り値に `conceal: () => void` を追加する。`ConfirmDialog` コンポーネント（props: `open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel`）。

- [ ] **Step 1: ConfirmDialog.tsx を作成する**

`apps/web/components/ConfirmDialog.tsx`（新規）:

```tsx
'use client'

import { Button } from './ui'

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-5 wide:items-center"
      onClick={onCancel}
    >
      <div
        className="animate-rise w-full max-w-sm rounded-sm border border-rule-strong bg-paper-raised p-5 shadow-[0_4px_16px_rgba(25,23,19,0.24)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-2xl leading-tight">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{message}</p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Button variant="primary" onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button variant="quiet" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: useSolo.ts に conceal を追加する**

[apps/web/lib/useSolo.ts](../../apps/web/lib/useSolo.ts) の return 文（Task 5 で `setKeepAwake` の effect を追加した後の状態）を以下に置き換える:

```ts
  return {
    game,
    hydrated,
    shielded,
    reveal: useCallback(() => setShielded(false), []),
    conceal: useCallback(() => setShielded(true), []),
    startGame,
    submitAction,
    nextRound,
    quitGame,
    clearGame,
  }
```

- [ ] **Step 3: page.tsx を書き換える**

[apps/web/app/page.tsx](../../apps/web/app/page.tsx)（Task 4 の変更を含む現在の状態）を、以下の内容で完全に置き換える:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { currentPlayerId, isCpu, type GameConfig } from '@solo/engine'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { CpuTurnScreen } from '@/components/CpuTurnScreen'
import { EndScreen } from '@/components/EndScreen'
import { HandoffScreen } from '@/components/HandoffScreen'
import { HomeScreen } from '@/components/HomeScreen'
import { ResultScreen } from '@/components/ResultScreen'
import { SetupScreen } from '@/components/SetupScreen'
import { TurnScreen } from '@/components/TurnScreen'
import { Screen } from '@/components/ui'
import { hideSplash, initStatusBar, onBackButton } from '@/lib/native'
import { useSolo } from '@/lib/useSolo'

export default function Page() {
  const solo = useSolo()
  const [setupOpen, setSetupOpen] = useState(false)
  const [resumed, setResumed] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    void initStatusBar()
  }, [])

  useEffect(() => {
    if (solo.hydrated) void hideSplash()
  }, [solo.hydrated])

  useEffect(() => {
    return onBackButton(() => {
      if (confirmOpen) {
        setConfirmOpen(false)
        return true
      }
      if (setupOpen) {
        setSetupOpen(false)
        return true
      }

      const game = solo.game
      const homeVisible = !game || (!resumed && game.phase !== 'GAME_END')
      if (homeVisible) return false
      if (!game) return false

      if (game.phase === 'GAME_END') {
        solo.clearGame()
        setResumed(false)
        return true
      }

      const actor = currentPlayerId(game)
      const soloPractice = game.config.players.filter((p) => !p.isCpu).length === 1
      const isTurnPhase = game.phase === 'DECIDE' || game.phase === 'BET'
      const showingHand =
        isTurnPhase && !soloPractice && actor !== null && !isCpu(game, actor) && !solo.shielded

      if (showingHand) {
        solo.conceal()
        return true
      }

      setConfirmOpen(true)
      return true
    })
  }, [confirmOpen, setupOpen, resumed, solo])

  const confirmDialog = (
    <ConfirmDialog
      open={confirmOpen}
      title="中断しますか？"
      message="ここまでの対局が終了します。"
      confirmLabel="終わる"
      cancelLabel="続ける"
      onConfirm={() => {
        solo.quitGame()
        setConfirmOpen(false)
      }}
      onCancel={() => setConfirmOpen(false)}
    />
  )

  if (!solo.hydrated) {
    return (
      <Screen>
        <div className="flex flex-1 items-center justify-center text-sm text-ink-faint">
          読み込み中
        </div>
      </Screen>
    )
  }

  const start = (config: GameConfig) => {
    solo.startGame(config)
    setSetupOpen(false)
    setResumed(true)
  }

  if (setupOpen) {
    return (
      <>
        <SetupScreen onStart={start} onBack={() => setSetupOpen(false)} />
        {confirmDialog}
      </>
    )
  }

  // 保存されたゲームがあっても、まずはトップから明示的に再開させる
  if (!solo.game || (!resumed && solo.game.phase !== 'GAME_END')) {
    return (
      <>
        <HomeScreen
          hasSaved={solo.game !== null}
          onResume={() => setResumed(true)}
          onNew={() => {
            solo.clearGame()
            setSetupOpen(true)
          }}
        />
        {confirmDialog}
      </>
    )
  }

  const game = solo.game

  const actor = currentPlayerId(game)
  // 人が 1 人だけなら受け渡しの必要がないので、シールドも長押しも省く
  const soloPractice = game.config.players.filter((p) => !p.isCpu).length === 1

  const screen = (() => {
    switch (game.phase) {
      case 'DECIDE':
      case 'BET':
        if (actor && isCpu(game, actor)) return <CpuTurnScreen game={game} />
        if (soloPractice) {
          return <TurnScreen game={game} onSubmit={solo.submitAction} alwaysVisible />
        }
        return solo.shielded ? (
          <HandoffScreen game={game} onReveal={solo.reveal} />
        ) : (
          <TurnScreen game={game} onSubmit={solo.submitAction} />
        )

      case 'RESULT':
        return <ResultScreen game={game} onNext={solo.nextRound} onQuit={solo.quitGame} />

      case 'GAME_END':
        return (
          <EndScreen
            game={game}
            onRestart={() => {
              solo.clearGame()
              setResumed(false)
              setSetupOpen(true)
            }}
          />
        )

      default:
        return (
          <Screen>
            <div className="flex flex-1 items-center justify-center text-sm text-ink-faint">
              準備中
            </div>
          </Screen>
        )
    }
  })()

  return (
    <>
      {screen}
      {confirmDialog}
    </>
  )
}
```

（戻るボタンはネイティブ（`isNative()` が true）のときだけ動作する。設定画面・受け渡し・CPU 手番・結果画面・ソロ練習中の手番中は中断確認ダイアログを、手札を表示中は手札を伏せる `conceal()` を、ホームでは終了を、終了画面ではホームへの遷移を行う。）

- [ ] **Step 4: 動作確認する**

```bash
npm run typecheck -w @solo/web
npm run build -w @solo/web
```

Expected: どちらもエラーなく完了する。

- [ ] **Step 5: ブラウザで中断確認ダイアログの見た目を確認する**

```bash
npm run dev -w @solo/web
```

一局進めて「次の局へ」を待つ結果画面を開いた状態で、ブラウザの開発者ツールから `document.querySelector('button').click()` 等を使わず、まずは通常のプレイで到達できることを確認する程度でよい（ダイアログの表示トリガーはネイティブの戻るボタンのみのため、Web 上では見た目のスタイル崩れがないことの目視確認にとどめる。実際の開閉確認は Task 11 の実機検証で行う）。

- [ ] **Step 6: コミット**

```bash
git add apps/web/components/ConfirmDialog.tsx apps/web/lib/useSolo.ts apps/web/app/page.tsx
git commit -m "feat(web): 戻るボタンの制御と中断確認ダイアログを追加する"
```

---

### Task 8: Android アイコン・スプラッシュ素材の生成

**Files:**
- Create: `scripts/generate-android-assets.mjs`
- Modify: `android/app/src/main/res/mipmap-*/ic_launcher.png`（スクリプトが上書き）
- Modify: `android/app/src/main/res/mipmap-*/ic_launcher_round.png`（スクリプトが上書き）
- Modify: `android/app/src/main/res/mipmap-*/ic_launcher_foreground.png`（スクリプトが上書き）
- Modify: `android/app/src/main/res/mipmap-*/ic_launcher_background.png`（スクリプトが上書き）
- Modify: `android/app/src/main/res/drawable*/splash.png`（スクリプトが上書き）
- Create: `docs/store-assets/icon-512.png`

**Interfaces:**
- Consumes: Task 1 で生成済みの `android/`。[apps/web/app/icon.svg](../../apps/web/app/icon.svg)
- Produces: Play ストア掲載用の 512×512 アイコン（`docs/store-assets/icon-512.png`）

このタスクは Capacitor がデフォルトで生成した青いプレースホルダー画像を、`icon.svg` を元にした紙色・カードの意匠で上書きする。ファイルの探索は決め打ちの解像度ではなく、`cap add android` が実際に生成した各ファイルの寸法を読み取ってそれに合わせてリサイズする方式にする（Capacitor のバージョンによって生成物の解像度構成が変わっても壊れないようにするため）。

- [ ] **Step 1: 依存パッケージを追加する**

```bash
npm install -D sharp glob
```

- [ ] **Step 2: スクリプトを作成する**

`scripts/generate-android-assets.mjs`（新規）:

```js
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { globSync } from 'glob'
import sharp from 'sharp'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const PAPER = '#f2eee5'
const MASTER_SIZE = 1024
const SPLASH_SIZE = 2732

const iconSvg = readFileSync(join(ROOT, 'apps/web/app/icon.svg'), 'utf8')

// icon.svg のカードの図形だけを取り出し、アダプティブアイコンのセーフゾーン
// （中心 66% 程度）に収まるよう縮小して中央に配置する。
const foregroundSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <g transform="translate(32 32) scale(0.62) translate(-32 -32)">
    <g transform="rotate(-8 21 33)">
      <rect x="9" y="15" width="23" height="34" rx="3" fill="#fbf9f4" stroke="#b8af99" stroke-width="1.5" />
      <text x="20.5" y="39" font-family="Georgia, serif" font-size="20" fill="#191713" text-anchor="middle">10</text>
    </g>
    <g transform="rotate(8 43 35)">
      <rect x="32" y="17" width="23" height="34" rx="3" fill="#fbf9f4" stroke="#b8af99" stroke-width="1.5" />
      <text x="43.5" y="41" font-family="Georgia, serif" font-size="20" fill="#c0402a" text-anchor="middle">10</text>
    </g>
  </g>
</svg>
`

async function buildMasters() {
  const legacy = await sharp(Buffer.from(iconSvg)).resize(MASTER_SIZE, MASTER_SIZE).png().toBuffer()

  const foreground = await sharp(Buffer.from(foregroundSvg))
    .resize(MASTER_SIZE, MASTER_SIZE)
    .png()
    .toBuffer()

  const background = await sharp({
    create: { width: MASTER_SIZE, height: MASTER_SIZE, channels: 4, background: PAPER },
  })
    .png()
    .toBuffer()

  const splashMark = await sharp(Buffer.from(foregroundSvg))
    .resize(Math.round(SPLASH_SIZE * 0.4), Math.round(SPLASH_SIZE * 0.4))
    .png()
    .toBuffer()

  const splash = await sharp({
    create: { width: SPLASH_SIZE, height: SPLASH_SIZE, channels: 4, background: PAPER },
  })
    .composite([{ input: splashMark, gravity: 'center' }])
    .png()
    .toBuffer()

  return { legacy, foreground, background, splash }
}

async function overwriteMatching(pattern, master, label) {
  const files = globSync(pattern, { cwd: ROOT, absolute: true })
  if (files.length === 0) {
    console.warn(
      `[skip] ${label}: パターンに一致するファイルがありません（先に npx cap add android を実行してください）: ${pattern}`,
    )
    return
  }
  for (const file of files) {
    const { width, height } = await sharp(file).metadata()
    if (!width || !height) continue
    const resized = await sharp(master).resize(width, height).png().toBuffer()
    writeFileSync(file, resized)
    console.log(`[write] ${label} ${file} (${width}x${height})`)
  }
}

const { legacy, foreground, background, splash } = await buildMasters()

await overwriteMatching('android/app/src/main/res/mipmap-*/ic_launcher.png', legacy, 'legacy icon')
await overwriteMatching(
  'android/app/src/main/res/mipmap-*/ic_launcher_round.png',
  legacy,
  'legacy icon (round)',
)
await overwriteMatching(
  'android/app/src/main/res/mipmap-*/ic_launcher_foreground.png',
  foreground,
  'adaptive foreground',
)
await overwriteMatching(
  'android/app/src/main/res/mipmap-*/ic_launcher_background.png',
  background,
  'adaptive background',
)
await overwriteMatching('android/app/src/main/res/drawable*/splash.png', splash, 'splash')

const storeAssetsDir = join(ROOT, 'docs/store-assets')
mkdirSync(storeAssetsDir, { recursive: true })
const storeIcon = await sharp(legacy).resize(512, 512).png().toBuffer()
writeFileSync(join(storeAssetsDir, 'icon-512.png'), storeIcon)
console.log('[write] docs/store-assets/icon-512.png (512x512) — Play ストア掲載用')
```

- [ ] **Step 3: ルート package.json にスクリプトを登録する**

`package.json`（ルート）の `scripts` に以下を追加する:

```json
"assets:android": "node scripts/generate-android-assets.mjs"
```

- [ ] **Step 4: 実行して確認する**

```bash
npm run assets:android
```

Expected: `[write]` ログが `ic_launcher.png` / `ic_launcher_round.png` / `ic_launcher_foreground.png` / `ic_launcher_background.png` / `splash.png` それぞれについて1件以上出力される。`[skip]` が出た場合は Task 1 の `npx cap add android` が完了しているか確認する。`docs/store-assets/icon-512.png` が生成されていることを確認する。

- [ ] **Step 5: コミット**

```bash
git add scripts/generate-android-assets.mjs package.json android docs/store-assets
git commit -m "feat: Android のアイコン・スプラッシュ素材を icon.svg から生成する"
```

---

### Task 9: プライバシーポリシーページ

**Files:**
- Create: `apps/web/app/privacy/page.tsx`

**Interfaces:**
- Consumes: `apps/web/components/ui.tsx` の `Screen`
- Produces: `/privacy` ルート（静的書き出しで `apps/web/out/privacy/index.html` になる）

- [ ] **Step 1: ページを作成する**

`apps/web/app/privacy/page.tsx`（新規）:

```tsx
import type { Metadata } from 'next'
import { Screen } from '@/components/ui'

export const metadata: Metadata = {
  title: 'プライバシーポリシー | ソロ',
}

export default function PrivacyPage() {
  return (
    <Screen>
      <div className="animate-rise">
        <h1 className="font-serif text-4xl leading-tight wide:text-5xl">プライバシーポリシー</h1>
        <div className="mt-4 h-px w-16 bg-vermilion" />
      </div>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-ink-soft">
        <section>
          <h2 className="label mb-2 text-ink">収集する情報</h2>
          <p>
            本アプリは、名前・対局設定・チップの残高などのゲームの進行状況を、この端末の中
            （ブラウザの localStorage、Android 版では端末内のアプリデータ）にのみ保存します。
            これらの情報が外部のサーバーへ送信されることはありません。
          </p>
        </section>

        <section>
          <h2 className="label mb-2 text-ink">アカウント・通信</h2>
          <p>
            アカウント登録や通信を必要とする機能はありません。本アプリはオフラインで動作します。
          </p>
        </section>

        <section>
          <h2 className="label mb-2 text-ink">チップについて</h2>
          <p>アプリ内のチップは仮想のポイントであり、現金・換金・課金の要素は一切ありません。</p>
        </section>

        <section>
          <h2 className="label mb-2 text-ink">お問い合わせ</h2>
          <p>
            本ポリシーについてのお問い合わせは、
            <a
              href="https://github.com/oshima0627/solo/issues"
              className="text-vermilion underline"
            >
              GitHub リポジトリの Issues
            </a>
            までお願いします。
          </p>
        </section>
      </div>
    </Screen>
  )
}
```

- [ ] **Step 2: 動作確認する**

```bash
npm run typecheck -w @solo/web
npm run build -w @solo/web
```

Expected: どちらもエラーなく完了する。`apps/web/out/privacy/index.html` が生成されていることを確認する。

- [ ] **Step 3: ブラウザで見た目を確認する**

```bash
npm run dev -w @solo/web
```

`http://localhost:3000/privacy` を開き、他の画面と同じ「紙・墨・朱」の見た目になっていることを確認する。

- [ ] **Step 4: コミット**

```bash
git add apps/web/app/privacy
git commit -m "feat(web): プライバシーポリシーページを追加する"
```

---

### Task 10: 署名と Google Play 公開手順ドキュメント

**Files:**
- Create: `docs/deploy-android.md`
- Create: `android/keystore.properties.example`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: Task 9 の `/privacy` ページ、Task 8 の `docs/store-assets/icon-512.png`
- Produces: なし（ドキュメントのみ）

- [ ] **Step 1: .gitignore に署名鍵関連を追加する**

`.gitignore` に以下を追記する:

```
android/release.keystore
android/keystore.properties
```

- [ ] **Step 2: keystore.properties のテンプレートを作成する**

`android/keystore.properties.example`（新規、コミット対象）:

```properties
storeFile=../release.keystore
storePassword=CHANGE_ME
keyAlias=solo-release
keyPassword=CHANGE_ME
```

- [ ] **Step 3: 手順書を作成する**

`docs/deploy-android.md`（新規）:

```markdown
# Android 版の署名と Google Play 公開手順

## ビルド

\`\`\`bash
npm run android    # build → cap sync → Android Studio を開く
\`\`\`

Android Studio 側で実機・エミュレータへの実行、リリースビルドの作成ができる。

## 署名鍵の生成（初回のみ）

\`\`\`bash
keytool -genkeypair -v \
  -keystore android/release.keystore \
  -alias solo-release \
  -keyalg RSA -keysize 2048 -validity 10000
\`\`\`

対話式でパスワードと組織情報を入力する。

**`android/release.keystore` は絶対にコミットしない。** この鍵を紛失すると、
一度公開したアプリのアップデートを二度と配布できなくなる（別アプリとして
再公開するしかなくなる）。鍵はリポジトリの外（パスワードマネージャーや
オフラインのバックアップなど）に必ず保管しておくこと。

## keystore.properties の作成

`android/keystore.properties.example` を `android/keystore.properties` にコピーし、
実際のパスワードを入力する（このファイルは `.gitignore` 済み）。

\`\`\`bash
cp android/keystore.properties.example android/keystore.properties
\`\`\`

## build.gradle への組み込み

`android/app/build.gradle` の先頭付近（`apply plugin: 'com.android.application'` の直後）に追加する:

\`\`\`groovy
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
\`\`\`

`android { ... }` ブロックの中に `signingConfigs` を追加し、既存の `buildTypes.release` に
`signingConfig signingConfigs.release` を指定する:

\`\`\`groovy
signingConfigs {
    release {
        if (keystorePropertiesFile.exists()) {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        // 既存の minifyEnabled 等はそのまま残す
    }
}
\`\`\`

## リリースビルドの作成

Android Studio の **Build > Generate Signed Bundle / APK** から Android App Bundle（.aab）
を作成する。Play へのアップロードには .aab を使う。

## Google Play Console でのアプリ作成

1. 新しいアプリを作成し、上記の .aab を最初のリリースとしてアップロードする。
2. アップロード時に Play App Signing への登録が案内されるので、そのまま登録する
   （Google 側が配布用の署名鍵を管理し、手元の `release.keystore` はアップロード鍵として使う）。

## コンテンツレーティング（IARC 質問票）

本アプリは実際の金銭のやり取りを一切行わないが、アンティ・レイズ・チップの奪い合いという
賭け事の構造を持つため、「シミュレートされたギャンブル」に関する設問には **該当あり** で
正直に回答する。虚偽の申告はアプリ削除の対象になるため、正確に答えること。

## データセーフティフォーム

- 収集する個人データ: **なし**
- 第三者との共有: **なし**
- 実際にゲームの状態は端末内（Web 版は `localStorage`、Android 版は端末内のアプリデータ）
  にのみ保存され、外部送信は一切行わない。この実装内容と申告内容が一致していることを確認する。

## ストア掲載情報

- アプリアイコン: `docs/store-assets/icon-512.png`（512×512）
- プライバシーポリシー URL: `https://solo.<デプロイ先ドメイン>/privacy`
  （Cloudflare へのデプロイ後の実際の URL に置き換える。[docs/deploy.md](./deploy.md) を参照）
```

- [ ] **Step 4: コミット**

```bash
git add docs/deploy-android.md android/keystore.properties.example .gitignore
git commit -m "docs: Android の署名と Google Play 公開手順を追加する"
```

---

### Task 11: 実機ビルドと最終検証

**Files:**
- なし（コード変更を伴わない検証タスク）

**Interfaces:**
- Consumes: Task 1〜10 の全成果物
- Produces: なし

- [ ] **Step 1: 実機（または実機相当のエミュレータ）で開発ビルドを実行する**

```bash
npm run android
```

Android Studio が開いたら、実機を USB 接続するか、エミュレータを起動して Run する。

- [ ] **Step 2: 機内モードで起動を確認する**

端末を機内モードにしてからアプリを起動する。

Expected: エラーなく起動し、ホーム画面が表示される（完全オフライン動作の確認）。

- [ ] **Step 3: 見出しの明朝体を確認する**

ホーム画面の「ソロ」の大見出し、結果画面の役名などが明朝体で表示されていることを確認する（[apps/web/app/globals.css](../../apps/web/app/globals.css) の `--font-serif` が効いているか）。

- [ ] **Step 4: 画面回転を確認する**

端末を縦・横に回転させ、レイアウトが崩れないことを確認する（既存の `wide:` / `land:` バリアントの挙動）。

- [ ] **Step 5: 戻るボタンの各画面での挙動を確認する**

以下を一通り確認する:

- ホーム画面で戻る → アプリが終了する
- 設定画面で戻る → ホームに戻る
- 手札を表示中に戻る → 手札が伏せられる（受け渡し画面に戻る）
- 受け渡し画面・CPU 手番・結果画面で戻る → 中断確認ダイアログが出る。「続ける」で閉じ、「終わる」で結果画面に遷移する
- 終了画面で戻る → ホームに戻る

- [ ] **Step 6: CPU の手番待ち中に画面が消灯しないことを確認する**

CPU 対戦を含む設定でゲームを開始し、CPU の手番中（`CPU_THINK_MS` の待機中）に何も操作せず、画面が暗くならないことを確認する。

- [ ] **Step 7: アプリ切り替え→復帰でのセッション保持を確認する**

対局中に端末のホームボタンでアプリをバックグラウンドに送り、再度開いて対局が継続していることを確認する。

- [ ] **Step 8: バクダン発生時の振動を確認する**

10-10 のバクダンが出るまでプレイを続け（または `packages/solo-engine` のシード付きテストの知見を参考に狙って出し）、結果画面遷移時に強めの振動が入ることを確認する。

- [ ] **Step 9: ステータスバー・スプラッシュを確認する**

アプリ起動直後のスプラッシュ画面が紙色 `#f2eee5` とアイコンで表示され、起動後のステータスバーも同色で暗い文字色になっていることを確認する。

- [ ] **Step 10: アイコンを確認する**

ホーム画面（ランチャー）上のアプリアイコンが、Capacitor のデフォルト（青いプレースホルダー）ではなく、`icon.svg` を元にしたカードの意匠になっていることを確認する。

- [ ] **Step 11: `packages/solo-engine` のテストに影響がないことを確認する**

```bash
npm test -w @solo/engine
```

Expected: 既存の139件のテストが全て通る（この計画でエンジンのコードは変更していないため、当然通るはずだが最終確認として実行する）。

- [ ] **Step 12: 気になった不具合を記録する**

上記の手動確認で見つかった問題は、この計画の対象外の追加タスクとして別途起票する（このタスク自体はチェックリストの実施が完了した時点で完了とする）。
