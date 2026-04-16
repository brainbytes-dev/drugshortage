import * as cheerio from 'cheerio'
import type { Shortage } from './types'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BASE_URL = 'https://www.drugshortage.ch'
const DETAIL_CONCURRENCY = 10
const FETCH_HEADERS = {
  'User-Agent': 'engpass-radar/1.0 (+https://engpassradar.vercel.app; contact: info@engpassradar.ch)',
}

export function parseDetailFromHtml(html: string): Partial<Shortage> {
  const $ = cheerio.load(html)
  const fields: Record<string, string> = {}

  $('tr').each((_, row) => {
    const cells = $(row).find('td')
    if (cells.length < 2) return
    const label = $(cells[0]).text().trim()
    const value = $(cells[1]).text().replace(/\u00a0/g, '').trim()
    if (label && value && value !== '0') fields[label] = value
  })

  const statusRaw = fields['Status des Engpasses']
  const statusCode = statusRaw ? parseInt(statusRaw.charAt(0), 10) : undefined

  return {
    atcCode: fields['ATC-Code'] || undefined,
    ersteMeldung: fields['erste Meldung'] || undefined,
    ersteMeldungDurch: fields['erste Meldung durch'] || undefined,
    ersteInfoDurchFirma: fields['erste Info durch die Firma'] || undefined,
    artDerInfoDurchFirma: fields['Art der Info durch die Firma'] || undefined,
    voraussichtlicheDauer: fields['voraussichtliche Dauer'] || undefined,
    datumLieferfahigkeit: fields['ca. Datum der Wiederherstellung der Lieferfähigkeit'] || undefined,
    bemerkungen: fields['Bemerkungen'] || undefined,
    ...(statusRaw && !isNaN(statusCode!) ? { statusCode, statusText: statusRaw } : {}),
  }
}

/**
 * ✅ Memory-efficient detail enrichment using async generators
 * Processes shortages in streams to avoid loading all in memory
 */
async function* streamEnrichDetails(shortages: Shortage[]): AsyncGenerator<Shortage, void, unknown> {
  const withUrl = shortages.filter(s => s.detailUrl)

  for (let i = 0; i < withUrl.length; i += DETAIL_CONCURRENCY) {
    const batch = withUrl.slice(i, i + DETAIL_CONCURRENCY)

    const enrichedBatch = await Promise.all(
      batch.map(async (shortage) => {
        try {
          const res = await fetch(shortage.detailUrl, {
            headers: FETCH_HEADERS,
            signal: AbortSignal.timeout(5000), // ✅ Add timeout to prevent hanging
          })
          if (!res.ok) return shortage

          const html = await res.text()
          const detail = parseDetailFromHtml(html)

          // ✅ Create new object instead of mutating
          return { ...shortage, ...detail }
        } catch (err) {
          console.warn(`Failed to enrich ${shortage.gtin}:`, err)
          return shortage
        }
      })
    )

    // ✅ Yield batch results for streaming processing
    for (const enriched of enrichedBatch) {
      yield enriched
    }
  }
}

/**
 * ✅ Main enrichment function with memory limits
 */
export async function enrichWithDetails(shortages: Shortage[]): Promise<Shortage[]> {
  // ✅ For small datasets, use original approach
  if (shortages.length < 100) {
    const enriched: Shortage[] = []
    for await (const shortage of streamEnrichDetails(shortages)) {
      enriched.push(shortage)
    }
    return enriched
  }

  // ✅ For large datasets, process in chunks and collect results
  const results: Shortage[] = []
  const CHUNK_SIZE = 100

  for (let i = 0; i < shortages.length; i += CHUNK_SIZE) {
    const chunk = shortages.slice(i, i + CHUNK_SIZE)
    const enriched: Shortage[] = []

    for await (const shortage of streamEnrichDetails(chunk)) {
      enriched.push(shortage)
    }

    results.push(...enriched)

    // ✅ Allow garbage collection between chunks
    if (global.gc) global.gc()
  }

  return results
}
