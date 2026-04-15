import * as cheerio from 'cheerio'
import type { Shortage, OverviewStats, FirmaRanking, AtcGruppeStats } from './types'

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
    if (isNaN(statusCode)) continue

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

/** Parse label→value pairs from a detail page (works for both active and completed) */
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

  // "Status des Engpasses" e.g. "9 abgeschlossen" → statusCode=9
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
        // Only assign defined values — undefined would overwrite existing fields
        const filtered = Object.fromEntries(Object.entries(detail).filter(([, v]) => v !== undefined))
        Object.assign(shortage, filtered)
      } catch {
        // silently skip failed detail fetches
      }
    }))
  }
}

/** Parse aggregate overview statistics from the main page */
export function parseOverviewStats(html: string): Omit<OverviewStats, 'scrapedAt'> {
  const $ = cheerio.load(html)

  const tableText = (tableIndex: number, row: number, col: number): string =>
    $('table').eq(tableIndex).find('tr').eq(row).find('td').eq(col).text().trim()

  const num = (s: string) => parseInt(s.replace(/[^0-9]/g, ''), 10) || 0

  // Table 0: Packungen / Produkte
  const totalPackungen = num(tableText(0, 1, 0))
  const totalProdukte = num(tableText(0, 1, 1))

  // Table 1: ATC-Gruppen
  const betroffeneAtcGruppen = num(tableText(1, 1, 0))

  // Table 2: Regulatory + duration (header row 0, data row 1)
  const reg = (col: number) => tableText(2, 1, col)
  const slRaw = reg(4) // "684 von total 9856"
  const slMatch = slRaw.match(/(\d+)\s*von\s*total\s*(\d+)/)

  // Table 3: Swissmedic
  const swissRaw = (col: number) => {
    const raw = tableText(3, 1, col) // "128 von 2942"
    const m = raw.match(/(\d+)\s*von\s*(\d+)/)
    return m ? [parseInt(m[1]), parseInt(m[2])] : [0, 0]
  }
  const [swA, swATotal] = swissRaw(0)
  const [swB, swBTotal] = swissRaw(1)
  const [swC, swCTotal] = swissRaw(2)
  const [swU, swUTotal] = swissRaw(3)

  // Table 5: Firmen-Ranking (header row 0, data from row 1)
  const firmenRanking: FirmaRanking[] = []
  $('table').eq(5).find('tr').slice(1).each((_, row) => {
    const cells = $(row).find('td')
    if (cells.length < 4) return
    const bewertung = parseInt($(cells[0]).text().trim(), 10)
    const firma = $(cells[1]).text().trim()
    const total = num($(cells[2]).text())
    const offen = num($(cells[3]).text())
    if (firma) firmenRanking.push({ bewertung, firma, anzahlProdukteTotal: total, anzahlOffeneEngpaesse: offen })
  })

  // Table 6: ATC-Gruppen Breakdown
  const atcGruppen: AtcGruppeStats[] = []
  $('table').eq(6).find('tr').slice(1).each((_, row) => {
    const cells = $(row).find('td')
    if (cells.length < 3) return
    const atcCode = $(cells[0]).text().trim()
    const bezeichnung = $(cells[1]).text().trim()
    const anzahl = num($(cells[2]).text())
    if (atcCode) atcGruppen.push({ atcCode, bezeichnung, anzahl })
  })

  return {
    totalPackungen,
    totalProdukte,
    betroffeneAtcGruppen,
    pflichtlager: num(reg(0)),
    bwl: num(reg(1)),
    bwlWho: num(reg(2)),
    who: num(reg(3)),
    kassenpflichtigSL: slMatch ? parseInt(slMatch[1]) : 0,
    kassenpflichtigSLTotal: slMatch ? parseInt(slMatch[2]) : 0,
    prozentSLNichtLieferbar: parseFloat(reg(5)) || 0,
    dauerUnter2Wochen: num(reg(6)),
    dauer2bis6Wochen: num(reg(7)),
    dauerUeber6WochenBis6Monate: num(reg(8)),
    dauerUeber6MonateBis1Jahr: num(reg(9)),
    dauerUeber1Bis2Jahre: num(reg(10)),
    dauerUeber2Jahre: num(reg(11)),
    swissmedicListeA: swA, swissmedicListeATotal: swATotal,
    swissmedicListeB: swB, swissmedicListeBTotal: swBTotal,
    swissmedicListeC: swC, swissmedicListeCTotal: swCTotal,
    swissmedicUebrige: swU, swissmedicUebrigeTotal: swUTotal,
    firmenRanking,
    atcGruppen,
  }
}

// The Abgeschlossen page embeds this iframe — direct ASPX URL has the data
const COMPLETED_URL = 'https://drugshortage.ch/abgeschlosseneLieferengpaesse.aspx'

/** Parse the completed-shortages page (6 columns: Bezeichnung|Firma|ErsteMeldung|LetzteMutation|Tage|GTIN) */
export function parseCompletedFromHtml(html: string): Shortage[] {
  const $ = cheerio.load(html)
  const rows = $('#GridView1 tr').toArray()
  const shortages: Shortage[] = []
  const now = new Date().toISOString()

  for (const row of rows.slice(1)) {
    const cells = $(row).find('td')
    if (cells.length < 6) continue

    const getText = (i: number) => $(cells[i]).text().trim()
    const detailHref = $(cells[0]).find('a').attr('href') ?? ''
    const detailUrl = detailHref
      ? `${BASE_URL}/${detailHref}`
      : ''

    const gtin = getText(5)
    if (!gtin) continue

    shortages.push({
      gtin,
      bezeichnung: getText(0),
      firma: getText(1),
      ersteMeldung: getText(2) || undefined,
      datumLetzteMutation: getText(3),
      tageSeitMeldung: parseInt(getText(4), 10) || 0,
      detailUrl,
      // Fields not on this page — enriched via detail pages for recent entries
      pharmacode: '',
      atcCode: '',
      gengrp: '',
      statusCode: 9,
      statusText: '9 abgeschlossen',
      datumLieferfahigkeit: '',
      firstSeenAt: now,
      lastSeenAt: now,
      isActive: false,
    })
  }

  return shortages
}

// Enrich the most recent completed entries with detail-page data (ATC, status, etc.)
// Older entries are stored as-is to avoid 24k+ HTTP requests on every run
const COMPLETED_ENRICH_LIMIT = 500

export async function fetchAndParseCompleted(): Promise<Shortage[]> {
  const res = await fetch(COMPLETED_URL, { headers: FETCH_HEADERS })
  if (!res.ok) {
    throw new Error(`Failed to fetch completed shortages: ${res.status} ${res.statusText}`)
  }

  const html = await res.text()
  const shortages = parseCompletedFromHtml(html)
  console.log(`[scraper] Fetched ${shortages.length} completed (historical) entries`)

  // Enrich only the most recent entries (list is newest-first)
  const toEnrich = shortages.slice(0, COMPLETED_ENRICH_LIMIT).filter(s => s.detailUrl)
  if (toEnrich.length > 0) {
    console.log(`[scraper] Enriching ${toEnrich.length} recent completed entries with detail data...`)
    await enrichWithDetails(toEnrich)
  }

  return shortages
}

export async function fetchAndParse(): Promise<{ shortages: Shortage[]; overview: Omit<OverviewStats, 'scrapedAt'> }> {
  const res = await fetch(SOURCE_URL, { headers: FETCH_HEADERS })
  if (!res.ok) {
    throw new Error(`Failed to fetch source: ${res.status} ${res.statusText}`)
  }

  const html = await res.text()
  const shortages = parseShortagesFromHtml(html)
  const overview = parseOverviewStats(html)

  console.log(`[scraper] Fetched ${shortages.length} entries, enriching with detail pages...`)
  await enrichWithDetails(shortages)
  console.log(`[scraper] Detail enrichment complete`)

  return { shortages, overview }
}
