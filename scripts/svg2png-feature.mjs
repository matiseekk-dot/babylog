import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const root = 'store-assets'

for (const lang of ['pl', 'en', 'de', 'fr', 'es']) {
  const src = `${root}/feature-graphic-${lang}-2026-09.svg`
  const dst = `${root}/feature-graphic-${lang}-2026-09.png`
  const svg = readFileSync(src)
  await sharp(svg, { density: 300 })
    .resize(1024, 500, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toFile(dst)
  console.log(`${lang}: OK → ${dst}`)
}
