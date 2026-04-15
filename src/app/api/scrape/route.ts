import { NextResponse } from 'next/server'
import { fetchAndParse } from '@/lib/scraper'
import { upsertShortages } from '@/lib/db'

export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`

  if (auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const shortages = await fetchAndParse()
    const { newEntries, removedEntries } = await upsertShortages(shortages)
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
