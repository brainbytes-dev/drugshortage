import { NextResponse } from 'next/server'
import { queryShortages, getKPIStats, getFirmaList, getAtcList } from '@/lib/db'
import type { ShortagesQuery } from '@/lib/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const query: ShortagesQuery = {
    search: searchParams.get('search') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    firma: searchParams.get('firma') ?? undefined,
    atc: searchParams.get('atc') ?? undefined,
    page: parseInt(searchParams.get('page') ?? '1', 10),
    sort: searchParams.get('sort') ?? 'tageSeitMeldung:desc',
    perPage: parseInt(searchParams.get('perPage') ?? '50', 10),
  }

  const [response, kpi, firmaList, atcList] = await Promise.all([
    queryShortages(query),
    getKPIStats(),
    getFirmaList(),
    getAtcList(),
  ])

  return NextResponse.json({ ...response, kpi, firmaList, atcList })
}
