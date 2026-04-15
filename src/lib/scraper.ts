import * as cheerio from 'cheerio'
import type { Shortage } from './types'

const BASE_URL = 'https://www.drugshortage.ch'
const SOURCE_URL = `${BASE_URL}/UebersichtaktuelleLieferengpaesse2.aspx`
const DETAIL_CONCURRENCY = 10
const FETCH_HEADERS = { 'User-Agent': 'drugshortage-dashboard/1.0' }

export function parseShortagesFromHtml(html: string): Shortage[] {
  const $ = cheerio.load(html)
  const rows = $('#GridView1 tr').toArray()
  const shortages: Shortage[] = []
  const now = new Date().toISOString()

  for (const row of rows.slice(1)) {
    const cells = $(row).find('td')
    if (cells.length < 11) continue

    const getText = (i: number) => $(cells[i]).text().trim()
    const getHref = (i: number) => $(cells[i]).find('a').attr('href') ?? ''

    const gtin = getText(6)
    if (!gtin) continue

    const statusText = getText(3)
    const statusCode = parseInt(statusText.charAt(0), 10)
    if (isNaN(statusCode) || statusCode < 1 || statusCode > 5) continue

    const detailHref = getHref(0)
    const detailUrl = detailHref
      ? detailHref.startsWith('http') ? detailHref : `${BASE_URL}/${detailHref}`
      : ''

    const alternativenHref = getHref(2)
    const alternativenUrl = alternativenHref
      ? alternativenHref.startsWith('http') ? alternativenHref : `${BASE_URL}/${alternativenHref}`
      : undefined

    shortages.push({
      gtin,
      pharmacode: getText(7),
      bezeichnung: getText(0),
      firma: getText(5),
      atcCode: getText(9),
      gengrp: getText(10),
      statusCode,
      statusText,
      datumLieferfahigkeit: getText(1),
      datumLetzteMutation: getText(4),
      tageSeitMeldung: parseInt(getText(8), 10) || 0,
      detailUrl,
      alternativenUrl,
      firstSeenAt: now,
      lastSeenAt: now,
      isActive: true,
    })
  }

  return shortages
}

/** Parse label→value pairs from a detail page */
export function parseDetailFromHtml(html: string): Partial<Shortage> {
  const $ = cheerio.load(html)
  const fields: Record<string, string> = {}

  $('tr').each((_, row) => {
    const cells = $(row).find('td')
    if (cells.length < 2) return
    const label = $(cells[0]).text().trim()
    const value = $(cells[1]).text().replace(/\u00a0/g, '').trim() // strip &nbsp;
    if (label && value && value !== '0') fields[label] = value
  })

  return {
    ersteMeldung: fields['erste Meldung'] || undefined,
    ersteMeldungDurch: fields['erste Meldung durch'] || undefined,
    ersteInfoDurchFirma: fields['erste Info durch die Firma'] || undefined,
    artDerInfoDurchFirma: fields['Art der Info durch die Firma'] || undefined,
    voraussichtlicheDauer: fields['voraussichtliche Dauer'] || undefined,
    bemerkungen: fields['Bemerkungen'] || undefined,
  }
}

/** Fetch detail fields for a batch of shortages concurrently */
async function enrichWithDetails(shortages: Shortage[]): Promise<void> {
  const withUrl = shortages.filter(s => s.detailUrl)

  for (let i = 0; i < withUrl.length; i += DETAIL_CONCURRENCY) {
    const batch = withUrl.slice(i, i + DETAIL_CONCURRENCY)
    await Promise.all(batch.map(async (shortage) => {
      try {
        const res = await fetch(shortage.detailUrl, { headers: FETCH_HEADERS })
        if (!res.ok) return
        const html = await res.text()
        const detail = parseDetailFromHtml(html)
        Object.assign(shortage, detail)
      } catch {
        // silently skip failed detail fetches
      }
    }))
  }
}

export async function fetchAndParse(): Promise<Shortage[]> {
  const res = await fetch(SOURCE_URL, { headers: FETCH_HEADERS })
  if (!res.ok) {
    throw new Error(`Failed to fetch source: ${res.status} ${res.statusText}`)
  }

  const html = await res.text()
  const shortages = parseShortagesFromHtml(html)

  console.log(`[scraper] Fetched ${shortages.length} entries, enriching with detail pages...`)
  await enrichWithDetails(shortages)
  console.log(`[scraper] Detail enrichment complete`)

  return shortages
}
