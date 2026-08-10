# ソロ Android アプリ（Capacitor ラップ）設計

- バージョン: 1.0
- 最終更新: 2026-08-10
- ステータス: 承認済み（実装計画作成へ）

---

## 1. 背景と目的

「ソロ」は Next.js の完全静的サイト（`output: 'export'`）として実装済みで、バックエンドを持たず状態は `localStorage` にのみ保存される。この構成は Android アプリへのラップと相性がよく、ネイティブ再実装（Kotlin/Compose での全面書き直し）と比較して実装量が桁違いに小さい。

本設計は、既存の Web 版（`apps/web`）をビルド成果物ごと Android アプリに同梱し、Google Play で一般公開することを目的とする。

### 1.1 検討した代替案と不採用の理由

| 案 | 内容 | 不採用の理由 |
|---|---|---|
| ネイティブ再実装 | Kotlin/Compose でエンジン(1,333行)・UI(2,168行)を書き直す | 実装量が数百万トークン規模になり、見た目も「そっくり」止まりで完全一致しない |
| 素の WebView Activity | 依存ゼロで `WebViewAssetLoader` を自前実装 | スプラッシュ・戻るボタン・常時点灯等を全部自作することになり、Capacitor が用意済みのものの再実装に終わる |
| TWA（Bubblewrap） | Cloudflare 上のサイトを Chrome で全画面表示 | 初回にネットワーク必須。オフライン化には結局 Service Worker の自前実装が要る。パス回しで遊ぶ性質上、オフライン必須要件と噛み合わない |

### 1.2 スコープ外

- Android ネイティブでの UI 再実装
- オンライン対戦・課金・広告
- iOS 対応

---

## 2. 確定した基本方針

| 項目 | 決定内容 |
|---|---|
| 包み方 | **Capacitor**（`apps/web/out` を APK に同梱） |
| プロジェクト配置 | **solo リポジトリ内**（`android/`）。Android-solo リポジトリは使わない |
| Web 版との関係 | Android 版の中身は Web 版のビルド成果物そのもの。Web を直せば Android にも反映される |
| applicationId | `io.github.oshima0627.solo`（変更不可のため固定） |
| 配布先 | Google Play 一般公開 |
| 見た目 | Web 版を忠実にそのまま（紙・墨・朱のデザイン） |

---

## 3. 構成とビルドフロー

```
solo/
├─ apps/web/            既存の Next.js。out/ へ静的書き出し（変更なし）
├─ android/             Capacitor が生成する Android プロジェクト。Git 管理する
├─ capacitor.config.ts  新規。webDir: 'apps/web/out' を指す
└─ package.json         @capacitor/core, @capacitor/android, @capacitor/cli を追加
```

```bash
npm run build           # 既存。apps/web/out へ書き出し
npx cap sync android     # out/ を android/app/src/main/assets/public/ へコピー
npm run android          # 上記2つ＋ Android Studio を開く（新設スクリプト）
```

既存の `npm run deploy`（Cloudflare）は無変更。Web と Android は同一の `out/` から分岐するだけで、二重管理は発生しない。

---

## 4. Web 側の変更

### 4.1 明朝体の同梱

現在の `globals.css` のフォント指定は以下の通りで、`Noto Serif JP` は既に候補に入っているが実体を持たない。

```
--font-serif:
  'Hiragino Mincho ProN', 'Yu Mincho', YuMincho, 'Noto Serif JP', 'Times New Roman', serif;
```

Mac は Hiragino、Windows は Yu Mincho が使われるため問題は顕在化していないが、Android にはどちらも存在せず、明朝が効くべき箇所（見出し・カード数字など）がゴシックにフォールバックする。

`@fontsource/noto-serif-jp` を `apps/web` に追加し、`globals.css` で import する。**font stack の順序は変更しない** — Mac/Windows の見た目は現状のまま、Android だけ明朝が有効になる。fontsource は unicode-range で分割済みの woff2 を配布するため、Web 版の配信量増加は表示に必要な範囲に限られる。

### 4.2 ネイティブ橋渡し層

`apps/web/lib/native.ts` を新設する。Capacitor への依存をこの1ファイルに閉じ込め、ブラウザ環境では全関数が no-op になる。これにより Web 版のコードは Capacitor の存在を意識せず、`npm run dev` は現状のまま動作する。

```ts
isNative(): boolean
hideSplash(): void
setKeepAwake(on: boolean): void
vibrate(cue: 'light' | 'bomb'): void
onBackButton(handler: () => boolean): () => void  // handler が true を返せばアプリを閉じない
```

### 4.3 既存コードへのフック

| 変更内容 | 位置 |
|---|---|
| `hydrated` 成立時に `hideSplash()` | [apps/web/app/page.tsx:20](../../apps/web/app/page.tsx#L20) 相当のタイミング |
| `game` の有無で `setKeepAwake` を切替 | `apps/web/lib/useSolo.ts` 内 |
| `playCue` の4呼び出し箇所に `vibrate` を追加 | `EndScreen.tsx` / `ResultScreen.tsx` / `SoundToggle.tsx` |
| 手札を伏せる `conceal` を `reveal` の対として追加 | `apps/web/lib/useSolo.ts`（戻るボタン用） |
| 戻るボタンのハンドラ登録 | `apps/web/app/page.tsx` |

---

## 5. ネイティブ挙動の仕様

### 5.1 スプラッシュ画面
背景色を紙色 `#f2eee5` に揃え、アイコンを中央に配置。`hydrated` 成立（`localStorage` 読み込み完了）を待って隠す。

### 5.2 画面常時点灯
ゲームが進行中（`game !== null` かつ `phase !== 'GAME_END'`）のあいだ有効。ホーム画面・終了画面では解除する。

### 5.3 ハプティクス
`playCue` の発火に合わせて短い振動を付ける。`bomb` のみ強めのパターンにする。無音設定（`isMuted()`）とは独立に、振動は常時有効とする（音を切っても演出として振動は残す）。

### 5.4 ステータスバー
紙色 `#f2eee5` の背景に、暗い文字色（ライトモード相当）で固定する。

### 5.5 戻るボタン

| 画面（`page.tsx` の分岐に対応） | 挙動 |
|---|---|
| ホーム | アプリを終了する |
| 設定（`setupOpen`） | ホームへ戻る（既存の `onBack` を呼ぶ） |
| 手番中で手札を表示している（`!shielded`） | 手札を伏せる（`conceal`） |
| 受け渡し・CPU手番・結果画面 | 中断確認ダイアログを Web 側の意匠で出す（ネイティブダイアログは使わない） |
| 終了画面 | ホームへ戻る |

reducer に undo は存在しないため、戻るボタンでゲーム進行が壊れることはない。

---

## 6. Google Play 公開準備

### 6.1 署名
署名鍵（`*.jks`）を生成し Play App Signing に登録する。鍵ファイルと `keystore.properties` は `.gitignore` に追加し、リポジトリに含めない。鍵の保管場所を手順書（`docs/deploy-android.md` を新設）に明記する。

### 6.2 アイコン・スプラッシュ素材
[apps/web/app/icon.svg](../../apps/web/app/icon.svg) を元にアダプティブアイコン（foreground/background）を生成する。

### 6.3 コンテンツレーティング
本アプリは仮想チップのみでプレイし、現金・換金・課金要素は一切ないが、賭け事の構造（アンティ・レイズ・チップの奪い合い）を持つため IARC 質問票では「シミュレートされたギャンブル」に該当する項目を正直に申告する。結果として付与される年齢制限は受け入れる。

### 6.4 データセーフティ
収集データなし・第三者共有なしとして申告する。`localStorage` のみに状態を保存し外部送信は一切行わないため、申告内容は現状の実装と一致する。

### 6.5 プライバシーポリシー
収集データがなくても Play はポリシー URL を必須とする。Cloudflare 側の `apps/web` に `/privacy` ページを1つ追加し、そこを指す。

---

## 7. 検証方針

`packages/solo-engine` のテスト103件はロジックに変更を加えないため無影響。以下は実機での手動確認とする。

- 機内モードでの起動（オフライン完全動作の確認）
- 明朝体の表示（見出し・カード数字）
- 画面回転（縦・横）
- 戻るボタンの各画面での挙動
- CPU の手番待ち中に画面が消灯しないこと
- アプリ切り替え→復帰でのセッション保持
- バクダン発生時の振動
- ステータスバー・スプラッシュの表示

---

## 8. やらないこと（再掲）

- Android ネイティブでの UI 再実装
- オンライン対戦、アカウント、ランキング
- 課金・広告
- iOS 対応
