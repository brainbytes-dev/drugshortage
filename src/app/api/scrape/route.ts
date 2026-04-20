import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { fetchAndParse, fetchAndParseCompleted, fetchAndParseOffMarket } from '@/lib/scraper'
import { upsertShortagesOptimizedSafe as upsertShortages } from '@/lib/db-optimized-upsert-safe'
import { saveOverviewStats, saveScrapeRun, upsertCompletedShortages, upsertBwlShortages, upsertOffMarketDrugs, syncErloschenFromOddb } from '@/lib/db'
import { invalidateStatsCache } from '@/lib/db-cached-example'
import { fetchBwlData } from '@/lib/bwl-scraper'

export const maxDuration = 300 // 5 min — scrape + historical insert needs time

// Vercel Cron sends GET; keep POST for manual/internal calls
export const GET = POST

export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { shortages, overview } = await fetchAndParse()
    const { newEntries, removedEntries } = await upsertShortages(shortages)
    await saveOverviewStats({ ...overview, scrapedAt: new Date().toISOString() })

    // ✅ Record scrape run so lastScrapedAt timestamp stays current
    await saveScrapeRun({
      scrapedAt: new Date().toISOString(),
      totalCount: shortages.length,
      newEntries,
      removedEntries,
      status: 'success',
    })

    // ✅ Invalidate in-memory LRU caches and ISR page cache
    invalidateStatsCache()
    revalidatePath('/', 'layout') // bust entire layout tree, not just exact path

    let historicalInserted = 0
    try {
      const completedShortages = await fetchAndParseCompleted(false) // no enrichment in daily cron
      const result = await upsertCompletedShortages(completedShortages)
      historicalInserted = result.inserted
    } catch (histErr) {
      console.error('[scrape] Historical fetch failed (non-fatal):', histErr)
    }

    let bwlUpserted = 0
    try {
      const bwlData = await fetchBwlData()
      const result = await upsertBwlShortages(bwlData)
      bwlUpserted = result.upserted
    } catch (bwlErr) {
      console.error('[scrape] BWL fetch failed (non-fatal):', bwlErr)
    }

    let offMarketUpserted = 0
    let erloschenUpserted = 0
    try {
      const [offMarketEntries, erloschenResult] = await Promise.all([
        fetchAndParseOffMarket(),
        syncErloschenFromOddb().catch(erlErr => {
          console.error('[scrape] Erlöschen sync failed (non-fatal):', erlErr)
          return { upserted: 0 }
        }),
      ])
      const result = await upsertOffMarketDrugs(offMarketEntries)
      offMarketUpserted = result.upserted
      erloschenUpserted = erloschenResult.upserted
    } catch (offErr) {
      console.error('[scrape] Off-market fetch failed (non-fatal):', offErr)
    }

    return NextResponse.json({
      success: true,
      total: shortages.length,
      newEntries,
      removedEntries,
      historicalInserted,
      bwlUpserted,
      offMarketUpserted,
      erloschenUpserted,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
