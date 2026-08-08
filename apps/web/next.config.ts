import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // バックエンドを持たないため、完全な静的サイトとして書き出す。
  // Cloudflare へはこの out/ をそのまま配信する。
  output: 'export',
  transpilePackages: ['@solo/engine'],
  images: { unoptimized: true },
}

export default nextConfig
