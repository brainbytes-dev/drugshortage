import { NextResponse } from 'next/server'
import { fetchAndParseUsbPdf } from '@/lib/usb-scraper'
import { upsertUsbShortages } from '@/lib/db'

export const maxDuration = 120 // PDF fetch + parse is fast, 2 min is plenty

// Vercel Cron sends GET
export const GET = POST

export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const entries = await fetchAndParseUsbPdf()
    const { upserted } = await upsertUsbShortages(entries)

    return NextResponse.json({
      success: true,
      parsed: entries.length,
      upserted,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[scrape-usb] failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
