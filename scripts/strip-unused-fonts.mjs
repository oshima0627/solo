import { readdirSync, statSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const MEDIA_DIR = join(ROOT, 'apps/web/out/_next/static/media')

let removed = 0
let bytes = 0

try {
  for (const name of readdirSync(MEDIA_DIR)) {
    if (!name.endsWith('.woff') || name.endsWith('.woff2')) continue
    const path = join(MEDIA_DIR, name)
    bytes += statSync(path).size
    unlinkSync(path)
    removed++
  }
} catch (err) {
  if (err.code !== 'ENOENT') throw err
}

console.log(`[strip-unused-fonts] removed ${removed} unused .woff file(s), ${(bytes / 1024 / 1024).toFixed(1)} MB`)
