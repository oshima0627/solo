# Cloudflare への公開手順

本アプリはバックエンドを持たず、`next build` で `apps/web/out/` に完全な静的サイトとして書き出されます。
そのため Cloudflare のどの配信方法でもそのまま動きます。ゲームの状態は端末の `localStorage` にのみ保存され、
サーバーへは一切送信されません。

---

## 方法1: Cloudflare Workers（`wrangler deploy`）

リポジトリに `apps/web/wrangler.jsonc` を用意してあります。Worker のコードは持たず、
`out/` を静的アセットとして配信するだけの構成です。

```bash
npm install
npx wrangler login          # 初回のみ
npm run deploy              # next build → wrangler deploy
```

公開先は `https://solo.<あなたのサブドメイン>.workers.dev` になります。
名前を変えたい場合は `wrangler.jsonc` の `name` を編集してください。

ローカルで本番と同じ配信を確認する場合:

```bash
npm run preview -w @solo/web
```

## 方法2: Cloudflare Pages（GitHub 連携）

GitHub リポジトリを接続して自動デプロイする場合は、Pages のビルド設定を次のようにします。

| 項目 | 値 |
|---|---|
| フレームワークプリセット | None |
| ビルドコマンド | `npm install && npm run build` |
| ビルド出力ディレクトリ | `apps/web/out` |
| ルートディレクトリ | （空欄のまま） |

npm workspaces を使っているため、ビルドはリポジトリのルートで実行する必要があります。
ルートの `npm run build` が `@solo/web` のビルドに委譲されます。

---

## 補足

- **Node.js のバージョン**: 20 以上を想定しています。Pages では環境変数 `NODE_VERSION` に `20` 以上を設定してください
- **カスタムドメイン**: Workers・Pages いずれもダッシュボードから割り当てられます
- **リダイレクト/ヘッダ**: 追加が必要になったら `apps/web/public/_headers` や `_redirects` を置けば静的出力にそのまま含まれます
- **ルーティング**: `/rules` は `out/rules.html` として書き出され、Cloudflare 側の自動処理でそのまま解決されます
