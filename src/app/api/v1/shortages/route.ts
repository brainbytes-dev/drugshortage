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
      page: Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1),
      perPage: Math.min(200, Math.max(1, parseInt(searchParams.get('perPage') ?? '50', 10) || 50)),
      sort: searchParams.get('sort') ?? 'tageSeitMeldung:desc',
    }

    const response = await queryShortages(query)

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
