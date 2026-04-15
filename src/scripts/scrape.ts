import { fetchAndParse, fetchAndParseCompleted } from '../lib/scraper'
import { upsertShortages, saveOverviewStats, upsertCompletedShortages } from '../lib/db'

async function main() {
  console.log('[scrape] Starting active shortages...')
  const { shortages, overview } = await fetchAndParse()
  console.log(`[scrape] Fetched ${shortages.length} active shortages`)
  const { newEntries, removedEntries } = await upsertShortages(shortages)
  await saveOverviewStats({ ...overview, scrapedAt: new Date().toISOString() })
  console.log(`[scrape] Active done. New: ${newEntries}, Removed: ${removedEntries}`)

  console.log('[scrape] Starting historical (completed) shortages...')
  const completed = await fetchAndParseCompleted()
  const { inserted } = await upsertCompletedShortages(completed)
  console.log(`[scrape] Historical done. Inserted/updated: ${inserted}`)
}

main().catch(err => {
  console.error('[scrape] Error:', err)
  process.exit(1)
})
