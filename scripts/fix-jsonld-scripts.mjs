// One-shot helper: replace raw <script type="application/ld+json"> blocks with
// next/script <Script> components. React 19 / Next 16 warns on raw script tags.
// Also fixes the `replace(/</g, '<')` no-op (was < before i18n migration).
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const files = [
  ['src/app/[locale]/wirkstoff/[atc]/page.tsx', 'ld-wirkstoff'],
  ['src/app/[locale]/datenschutz/page.tsx', 'ld-datenschutz'],
  ['src/app/[locale]/medikament/[slug]/page.tsx', 'ld-medikament'],
  ['src/app/[locale]/nutzungsbedingungen/page.tsx', 'ld-nutzungsbedingungen'],
  ['src/app/[locale]/impressum/page.tsx', 'ld-impressum'],
  ['src/app/[locale]/methodik/page.tsx', 'ld-methodik'],
  ['src/app/[locale]/firma/[slug]/page.tsx', 'ld-firma'],
  ['src/app/[locale]/api-docs/page.tsx', 'ld-api-docs'],
  ['src/app/[locale]/gtin/[gtin]/page.tsx', 'ld-gtin'],
]

for (const [rel, ldId] of files) {
  const p = path.join(root, rel)
  let src = fs.readFileSync(p, 'utf8')
  const before = src

  // Add `import Script from 'next/script'` after the first import line if not present.
  if (!src.includes("from 'next/script'")) {
    // Insert after "import type { Metadata } from 'next'" or after first import
    const metaMatch = src.match(/^import type \{ Metadata \} from 'next'\n/m)
    if (metaMatch) {
      const idx = metaMatch.index + metaMatch[0].length
      src = src.slice(0, idx) + "import Script from 'next/script'\n" + src.slice(idx)
    } else {
      // Fallback: insert after the very first import statement
      const firstImport = src.match(/^import .*$/m)
      if (firstImport) {
        const idx = firstImport.index + firstImport[0].length
        src = src.slice(0, idx) + "\nimport Script from 'next/script'" + src.slice(idx)
      }
    }
  }

  // Replace the opening <script tag with <Script id="..." strategy="beforeInteractive"
  // Pattern: `<script\n        type="application/ld+json"` (multiline) OR
  // `<script type="application/ld+json"` (single line)
  src = src.replace(
    /<script(\s+)type="application\/ld\+json"/,
    `<Script$1id="${ldId}"$1type="application/ld+json"$1strategy="beforeInteractive"`
  )

  // Fix the no-op escape: replace(/</g, '<') → replace(/</g, '<')
  // (Original was < before i18n migration mangled the escape.)
  src = src.replaceAll("replace(/</g, '<')", "replace(/</g, '\\u003c')")

  if (src === before) {
    console.warn(`${rel}: NO CHANGE — pattern not matched`)
    continue
  }

  fs.writeFileSync(p, src, 'utf8')
  console.log(`${rel}: updated`)
}

console.log('\nDone.')
