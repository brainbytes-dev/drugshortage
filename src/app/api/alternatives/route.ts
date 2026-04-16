import * as cheerio from 'cheerio'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-optimized'

export interface Alternative {
  bezeichnung: string
  firma: string
  gtin: string
  typ?: string // 'O' = Original, 'G' = Generikum
}

export interface AlternativesResponse {
  gleicheFirma: Alternative[]
  coMarketing: Alternative[]
  alleAlternativen: Alternative[]
}

const FETCH_HEADERS = {
  'User-Agent': 'engpass-radar/1.0 (+https://engpassradar.vercel.app; contact: info@engpassradar.ch)',
}

// Re-fetch if cached data is older than 24h
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

function parseGrid(
  $: ReturnType<typeof cheerio.load>,
  id: string,
  withTyp = false,
): Alternative[] {
  const rows = $(`#${id} tr`).toArray().slice(1)
  return rows.flatMap(row => {
    const cells = $(row).find('td')
    const bezeichnung = $(cells[0]).text().trim()
    const firma = $(cells[1]).text().trim()
    const gtin = $(cells[2]).text().trim()
    if (!bezeichnung || bezeichnung.toLowerCase().startsWith('kein')) return []
    const alt: Alternative = { bezeichnung, firma, gtin }
    if (withTyp && cells.length >= 4) alt.typ = $(cells[3]).text().trim()
    return [alt]
  })
}

async function fetchFromSource(gtin: string): Promise<AlternativesResponse> {
  const url = `https://www.drugshortage.ch/alternativen.aspx?GTIN=${encodeURIComponent(gtin)}`
  const res = await fetch(url, { headers: FETCH_HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()
  const $ = cheerio.load(html)
  return {
    gleicheFirma: parseGrid($, 'GridView3'),
    coMarketing: parseGrid($, 'GridView2'),
    alleAlternativen: parseGrid($, 'GridView1', true),
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gtin = searchParams.get('gtin')
  if (!gtin) return NextResponse.json({ error: 'gtin required' }, { status: 400 })

  // 1. DB cache lookup
  const cached = await prisma.alternativesCache.findUnique({ where: { gtin } })
  if (cached) {
    const age = Date.now() - cached.fetchedAt.getTime()
    if (age < CACHE_TTL_MS) {
      return NextResponse.json(cached.data, {
        headers: {
          // Cache for 1 hour, since DB cache is valid for 24h
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      })
    }
  }

  // 2. Live fetch + store
  try {
    const data = await fetchFromSource(gtin)
    await prisma.alternativesCache.upsert({
      where: { gtin },
      create: { gtin, data: data as object },
      update: { data: data as object },
    })
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (err) {
    // On fetch error, return stale cache if available
    if (cached) return NextResponse.json(cached.data, {
      headers: {
        // Stale data - cache for 5 minutes only
        'Cache-Control': 'public, s-maxage=300',
      },
    })
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
