import { NextResponse } from 'next/server'
import { fetchOddbProducts } from '@/lib/oddb-scraper'
import { upsertOddbProducts } from '@/lib/db'

// Runs independently of the daily scrape — call weekly or on-demand
export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const products = await fetchOddbProducts()
    const { upserted } = await upsertOddbProducts(products)

    return NextResponse.json({ success: true, total: products.length, upserted })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
