import * as cheerio from 'cheerio'
import { NextResponse } from 'next/server'

export interface Alternative {
  bezeichnung: string
  firma: string
  gtin: string
  typ?: string // 'O' = Original, 'G' = Generikum
}

export interface AlternativesResponse {
  gleicheFirma: Alternative[]       // GridView3 — andere Packungsgrössen
  coMarketing: Alternative[]        // GridView2 — identische Co-Marketing-Präparate
  alleAlternativen: Alternative[]   // GridView1 — alle Alternativpräparate
}

const FETCH_HEADERS = {
  'User-Agent': 'drugshortage-dashboard/1.0 (+https://drugshortage-theta.vercel.app; contact: admin@proflowlabsai.com)',
}

function parseGrid(
  $: ReturnType<typeof cheerio.load>,
  id: string,
  withTyp = false,
): Alternative[] {
  const rows = $(`#${id} tr`).toArray().slice(1) // skip header
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gtin = searchParams.get('gtin')
  if (!gtin) return NextResponse.json({ error: 'gtin required' }, { status: 400 })

  const url = `https://www.drugshortage.ch/alternativen.aspx?GTIN=${encodeURIComponent(gtin)}`

  try {
    const res = await fetch(url, { headers: FETCH_HEADERS, next: { revalidate: 3600 } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()
    const $ = cheerio.load(html)

    const data: AlternativesResponse = {
      gleicheFirma: parseGrid($, 'GridView3'),
      coMarketing: parseGrid($, 'GridView2'),
      alleAlternativen: parseGrid($, 'GridView1', true),
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
