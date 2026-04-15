import { NextResponse } from 'next/server'
import { fetchAndParse, fetchAndParseCompleted } from '@/lib/scraper'
import { upsertShortages, saveOverviewStats, upsertCompletedShortages } from '@/lib/db'

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

    let historicalInserted = 0
    try {
      const completedShortages = await fetchAndParseCompleted()
      const result = await upsertCompletedShortages(completedShortages)
      historicalInserted = result.inserted
    } catch (histErr) {
      console.error('[scrape] Historical fetch failed (non-fatal):', histErr)
    }

    return NextResponse.json({
      success: true,
      total: shortages.length,
      newEntries,
      removedEntries,
      historicalInserted,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
