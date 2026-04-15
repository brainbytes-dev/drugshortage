import { fetchAndParse, fetchAndParseCompleted } from '../lib/scraper'
import { upsertShortages, saveOverviewStats, upsertCompletedShortages, saveScrapeRun } from '../lib/db'

async function main() {
  const scrapedAt = new Date().toISOString()

  console.log('[scrape] Starting active shortages...')
  const { shortages, overview } = await fetchAndParse()
  console.log(`[scrape] Fetched ${shortages.length} active shortages`)
  const { newEntries, removedEntries } = await upsertShortages(shortages)
  await saveOverviewStats({ ...overview, scrapedAt })
  console.log(`[scrape] Active done. New: ${newEntries}, Removed: ${removedEntries}`)

  console.log('[scrape] Starting historical (completed) shortages...')
  const completed = await fetchAndParseCompleted()
  const { inserted } = await upsertCompletedShortages(completed)
  console.log(`[scrape] Historical done. Inserted/updated: ${inserted}`)

  await saveScrapeRun({
    scrapedAt,
    totalCount: shortages.length,
    newEntries,
    removedEntries,
    status: 'success',
  })
  console.log('[scrape] ScrapeRun saved.')
}

main().catch(async err => {
  console.error('[scrape] Error:', err)
  await saveScrapeRun({
    scrapedAt: new Date().toISOString(),
    totalCount: 0,
    newEntries: 0,
    removedEntries: 0,
    status: 'error',
    errorMessage: String(err),
  }).catch(() => {})
  process.exit(1)
})
