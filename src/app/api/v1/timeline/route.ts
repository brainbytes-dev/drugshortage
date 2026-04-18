import { getWeeklyTimelineWithActive } from '@/lib/db'
import { NextResponse } from 'next/server'

const HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const weeks = Math.min(260, Math.max(4, parseInt(searchParams.get('weeks') ?? '52', 10)))

    const rows = await getWeeklyTimelineWithActive(weeks)

    return NextResponse.json(
      {
        data: rows,
        meta: {
          weeks,
          generatedAt: new Date().toISOString(),
          source: 'engpassradar.ch',
          docsUrl: 'https://engpassradar.ch/api-docs',
        },
      },
      { headers: HEADERS }
    )
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: HEADERS }
    )
  }
}
