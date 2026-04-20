import { NextResponse } from 'next/server'
import { fetchOddbProducts, fetchOddbArticlePrices } from '@/lib/oddb-scraper'
import { upsertOddbProducts, upsertOddbPrices } from '@/lib/db'

// Runs independently of the daily scrape — call weekly or on-demand
// Vercel Cron sends GET; keep POST for manual/internal calls
export const GET = POST

export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const products = await fetchOddbProducts()
    const { upserted } = await upsertOddbProducts(products)

    let pricesUpserted = 0
    try {
      const prices = await fetchOddbArticlePrices()
      const result = await upsertOddbPrices(prices)
      pricesUpserted = result.upserted
    } catch (priceErr) {
      console.error('[scrape-oddb] Price fetch failed (non-fatal):', priceErr)
    }

    return NextResponse.json({ success: true, total: products.length, upserted, pricesUpserted })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
