import { NextResponse } from 'next/server'
import { queryShortages, getKPIStats, getFirmaList } from '@/lib/db'
import type { ShortagesQuery } from '@/lib/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const query: ShortagesQuery = {
    search: searchParams.get('search') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    firma: searchParams.get('firma') ?? undefined,
    atc: searchParams.get('atc') ?? undefined,
    page: Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1),
    sort: searchParams.get('sort') ?? 'tageSeitMeldung:desc',
    perPage: Math.min(200, Math.max(1, parseInt(searchParams.get('perPage') ?? '50', 10) || 50)),
  }

  const [response, kpi, firmaList] = await Promise.all([
    queryShortages(query),
    getKPIStats(),
    getFirmaList(),
  ])

  // ✅ Add cache headers
  return NextResponse.json(
    { ...response, kpi, firmaList },
    {
      headers: {
        // Cache for 5 minutes, serve stale for 1 hour while revalidating
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        // Vary by query params so each filter combo gets cached separately
        'Vary': 'Accept-Encoding',
      },
    }
  )
}
