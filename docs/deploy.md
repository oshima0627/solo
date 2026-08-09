# Cloudflare への公開手順

本アプリはバックエンドを持たず、`npm run build` で `apps/web/out/` に完全な静的サイトとして
書き出されます。ゲームの状態は端末の `localStorage` にのみ保存され、サーバーへは一切送信されません。

`wrangler.jsonc` は**リポジトリのルート**に置いています。Cloudflare Workers Builds は
リポジトリのルートでコマンドを実行するため、設定ファイルもそこに無いと見つけられないからです。

---

## 方法1: Workers Builds（GitHub 連携・推奨）

Cloudflare のダッシュボードで Workers & Pages → Create → Import a repository から
`oshima0627/solo` を選び、次のとおり設定します。

| 項目 | 値 |
|---|---|
| Project name | `solo` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

依存関係のインストールは Cloudflare 側が自動で行うため、ビルドコマンドに `npm install` は不要です。
もし `next: not found` で失敗する場合だけ `npm ci && npm run build` に変えてください。

**ビルド対象のブランチ**が、実際にコードのあるブランチになっているか確認してください。
Workers Builds は既定でリポジトリの既定ブランチをビルドします。

**環境変数**（ビルド設定から追加）

| 変数 | 値 | 理由 |
|---|---|---|
| `NODE_VERSION` | `22` | Next.js 16 が Node 20 以上を要求するため |

## 方法2: 手元から直接デプロイ

```bash
npm install
npx wrangler login    # 初回のみ
npm run deploy        # ビルドして wrangler deploy まで実行
```

公開先は `https://solo.<あなたのサブドメイン>.workers.dev` になります。
名前を変えたい場合は `wrangler.jsonc` の `name` を編集してください。

設定だけ検証したいときは、認証なしで次を実行できます。

```bash
npx wrangler deploy --dry-run
```

ローカルで本番と同じ配信を確認する場合:

```bash
npm run preview
```

---

## 補足

- **カスタムドメイン**: ダッシュボードから割り当てられます
- **リダイレクト/ヘッダ**: 追加が必要になったら `apps/web/public/_headers` や `_redirects` を
  置けば静的出力にそのまま含まれます
- **ルーティング**: `/rules` は `apps/web/out/rules.html` として書き出され、
  Cloudflare 側の自動処理でそのまま解決されます
- **404**: `not_found_handling: "404-page"` を指定しているため、
  存在しないパスでは `404.html` が返ります
