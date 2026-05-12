// One-shot helper: merge tasks/i18n-scratch/{A,B,C,D}-*-{locale}.json
// into messages/{locale}.json. Keeps existing namespaces, appends new ones,
// warns on collisions.
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const locales = ['de', 'en', 'fr', 'it']
const buckets = ['A-legal-info', 'B-pricing-product', 'C-home-detail', 'D-components-watchlist']

let collisions = 0

for (const locale of locales) {
  const existingPath = path.join(root, 'messages', `${locale}.json`)
  const existing = JSON.parse(fs.readFileSync(existingPath, 'utf8'))
  const merged = { ...existing }
  let added = 0

  for (const bucket of buckets) {
    const scratchPath = path.join(root, 'tasks', 'i18n-scratch', `${bucket}-${locale}.json`)
    const scratch = JSON.parse(fs.readFileSync(scratchPath, 'utf8'))
    for (const [ns, keys] of Object.entries(scratch)) {
      if (merged[ns]) {
        console.warn(`COLLISION [${locale}]: namespace "${ns}" already present (from existing or earlier bucket); ${bucket} will OVERWRITE`)
        collisions++
      }
      merged[ns] = keys
      added++
    }
  }

  fs.writeFileSync(existingPath, JSON.stringify(merged, null, 2) + '\n', 'utf8')
  console.log(`messages/${locale}.json: ${Object.keys(merged).length} namespaces total (+${added} from scratch)`)
}

if (collisions > 0) {
  console.error(`\n${collisions} collisions detected — review above.`)
  process.exit(1)
}
console.log('\nMerge complete, no collisions.')
