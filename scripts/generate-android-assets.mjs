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

  return { legacy, foreground, splash }
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

const { legacy, foreground, splash } = await buildMasters()

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
await overwriteMatching('android/app/src/main/res/drawable*/splash.png', splash, 'splash')

const storeAssetsDir = join(ROOT, 'docs/store-assets')
mkdirSync(storeAssetsDir, { recursive: true })
const storeIcon = await sharp(legacy).resize(512, 512).png().toBuffer()
writeFileSync(join(storeAssetsDir, 'icon-512.png'), storeIcon)
console.log('[write] docs/store-assets/icon-512.png (512x512) — Play ストア掲載用')
