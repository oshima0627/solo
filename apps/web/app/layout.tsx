import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ソロ | 沖縄のトランプゲーム',
  description:
    '沖縄で遊ばれてきたローカルなトランプゲーム「ソロ」を、スマホ1台を回して遊べるアプリにしました。',
}

export const viewport: Viewport = {
  themeColor: '#04141c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-full antialiased">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">{children}</div>
      </body>
    </html>
  )
}
