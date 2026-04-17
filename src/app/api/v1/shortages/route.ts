import { NextResponse } from 'next/server'
import { queryShortages } from '@/lib/db'
import type { ShortagesQuery } from '@/lib/types'

const HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const query: ShortagesQuery = {
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      firma: searchParams.get('firma') ?? undefined,
      atc: searchParams.get('atc') ?? undefined,
      neu: searchParams.get('neu') === '1',
      page: Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1),
      perPage: Math.min(200, Math.max(1, parseInt(searchParams.get('perPage') ?? '50', 10) || 50)),
    }

    const ALLOWED_SORT_FIELDS = new Set([
      'tageSeitMeldung', 'bezeichnung', 'firma', 'atcCode', 'statusCode',
    ])
    const rawSort = searchParams.get('sort') ?? 'tageSeitMeldung:desc'
    const [sortField] = rawSort.split(':')
    const sort = ALLOWED_SORT_FIELDS.has(sortField) ? rawSort : 'tageSeitMeldung:desc'

    const finalQuery: ShortagesQuery = {
      ...query,
      sort,
    }

    const response = await queryShortages(finalQuery)

    return NextResponse.json(
      {
        data: response.data,
        total: response.total,
        page: response.page,
        perPage: response.perPage,
        meta: {
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
