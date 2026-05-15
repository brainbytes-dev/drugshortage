// One-shot regeneration of raster fallbacks from the freshly recolored SVGs.
// Keeps the original dimensions (256x256 favicon, 952x96 logo) so any existing
// references render identically.
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

async function svgToPng(svgPath, pngPath, width, height) {
  const svg = readFileSync(resolve(root, svgPath))
  const buffer = await sharp(svg, { density: 384 })
    .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  writeFileSync(resolve(root, pngPath), buffer)
  console.log(`wrote ${pngPath} (${width}x${height})`)
}

await svgToPng('public/favicon-light.svg', 'public/favicon-light.png', 256, 256)
await svgToPng('public/logo-transparent-light.svg', 'public/logo-transparent-light.png', 952, 96)
