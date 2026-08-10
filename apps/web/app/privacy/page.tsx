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
