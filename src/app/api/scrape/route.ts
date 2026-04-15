import { NextResponse } from 'next/server'
import { fetchAndParse } from '@/lib/scraper'
import { upsertShortages, saveOverviewStats } from '@/lib/db'

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
    return NextResponse.json({
      success: true,
      total: shortages.length,
      newEntries,
      removedEntries,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
