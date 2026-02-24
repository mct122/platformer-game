/**
 * キャラクター画像の背景を自動除去してPNGで保存するスクリプト
 * 使い方: node scripts/remove-bg.mjs
 */
import { removeBackground } from '@imgly/background-removal-node'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname, basename, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const targets = [
  'public/chara/donko/normal.jpeg',
  'public/chara/donko/super.jpg',
  'public/chara/poon/normal.jpg',
  'public/chara/poon/super.jpg',
  'public/chara/ema/normal.jpg',
  'public/chara/ema/super.jpg',
]

async function main() {
  for (const rel of targets) {
    const src = resolve(root, rel)
    const outPath = src.replace(extname(src), '.png')

    console.log(`Processing: ${rel}`)
    try {
      const imgData = readFileSync(src)
      const blob = new Blob([imgData], { type: 'image/jpeg' })
      const result = await removeBackground(blob, {
        model: 'small',
        output: { format: 'image/png', quality: 1 }
      })
      const buf = Buffer.from(await result.arrayBuffer())
      writeFileSync(outPath, buf)
      console.log(`  → saved: ${outPath.replace(root, '.')}`)
    } catch (e) {
      console.error(`  ✗ failed: ${e.message}`)
    }
  }
  console.log('\nDone!')
}

main()
