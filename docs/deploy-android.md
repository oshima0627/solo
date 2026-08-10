# Android 版の署名と Google Play 公開手順

## ビルド

```bash
npm run android    # build → cap sync → Android Studio を開く
```

Android Studio 側で実機・エミュレータへの実行、リリースビルドの作成ができる。

## 署名鍵の生成（初回のみ）

```bash
keytool -genkeypair -v \
  -keystore android/release.keystore \
  -alias solo-release \
  -keyalg RSA -keysize 2048 -validity 10000
```

対話式でパスワードと組織情報を入力する。

**`android/release.keystore` は絶対にコミットしない。** この鍵を紛失すると、
一度公開したアプリのアップデートを二度と配布できなくなる（別アプリとして
再公開するしかなくなる）。鍵はリポジトリの外（パスワードマネージャーや
オフラインのバックアップなど）に必ず保管しておくこと。

## keystore.properties の作成

`android/keystore.properties.example` を `android/keystore.properties` にコピーし、
実際のパスワードを入力する（このファイルは `.gitignore` 済み）。

```bash
cp android/keystore.properties.example android/keystore.properties
```

## build.gradle への組み込み

`android/app/build.gradle` には `keystorePropertiesFile` の読み込みと `signingConfigs.release`
の定義、`buildTypes.release` への `signingConfig signingConfigs.release` の指定が**すでに組み込み
済み**（`keystorePropertiesFile.exists()` で守られているため、`keystore.properties` が存在しない
限り無害）。読者が手動で編集する必要はなく、上の「keystore.properties の作成」だけで署名の準備が
完了する。

`keystore.properties` を作成しないまま `assembleRelease` / `bundleRelease` を実行すると、
Gradle が `storeFile` プロパティ未設定のエラー（`SigningConfig "release" is missing required
property "storeFile"` 等）で失敗する。これは署名をまだ準備していない場合の正しい挙動であり、
デバッグビルド（`assembleDebug` 等）には影響しない。

## リリースビルドの作成

Android Studio の **Build > Generate Signed Bundle / APK** から Android App Bundle（.aab）
を作成する。Play へのアップロードには .aab を使う。

## バージョン番号の更新

Play へ新しいリリースをアップロードするたびに、`android/app/build.gradle` の
`defaultConfig.versionCode`（現在 `1`）を必ずインクリメントする（Play は同じ versionCode
の再アップロードを拒否する）。あわせて `versionName`（現在 `"1.0"`）も、ユーザーに見える
バージョン文字列としてわかりやすい値に更新する。

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
