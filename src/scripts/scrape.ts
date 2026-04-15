import { fetchAndParse } from '../lib/scraper'
import { upsertShortages, saveOverviewStats } from '../lib/db'

async function main() {
  console.log('[scrape] Starting...')
  const { shortages, overview } = await fetchAndParse()
  console.log(`[scrape] Fetched ${shortages.length} shortages`)
  const { newEntries, removedEntries } = await upsertShortages(shortages)
  await saveOverviewStats({ ...overview, scrapedAt: new Date().toISOString() })
  console.log(`[scrape] Done. New: ${newEntries}, Removed: ${removedEntries}`)
}

main().catch(err => {
  console.error('[scrape] Error:', err)
  process.exit(1)
})
