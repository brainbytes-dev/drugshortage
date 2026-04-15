import * as XLSX from 'xlsx'

const BWL_PAGE_URL = 'https://www.bwl.admin.ch/de/meldestelle-heilmittel'

export interface BwlShortageData {
  gtin: string
  atcCode: string
  bezeichnung: string
  eintrittsdatum: string | null
  voraussichtlicheDauer: string | null
  bemerkungen: string | null
  datumPublikation: string | null
  letzteAktualisierung: string | null
}

export async function fetchBwlData(): Promise<BwlShortageData[]> {
  const xlsxUrl = await findBwlXlsxUrl()

  const response = await fetch(xlsxUrl, {
    headers: { 'Accept-Language': 'de', 'User-Agent': 'engpassradar.ch/1.0' },
  })
  if (!response.ok) throw new Error(`BWL XLSX download failed: ${response.status} ${xlsxUrl}`)

  const buffer = Buffer.from(await response.arrayBuffer())
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

  return rows
    .filter(r => r['GTIN'])
    .map(r => ({
      gtin: String(r['GTIN']).trim(),
      atcCode: String(r['ATC-Code'] ?? '').trim(),
      bezeichnung: String(r['Produktebezeichnung'] ?? '').trim(),
      eintrittsdatum: r['Eintrittsdatum'] ? String(r['Eintrittsdatum']).trim() : null,
      voraussichtlicheDauer: r['Voraussichtliche Dauer'] ? String(r['Voraussichtliche Dauer']).trim() : null,
      bemerkungen: r['Bemerkungen'] ? String(r['Bemerkungen']).trim() : null,
      datumPublikation: r['Datum Publikation'] ? String(r['Datum Publikation']).trim() : null,
      letzteAktualisierung: r['Letzte Aktualisierung'] ? String(r['Letzte Aktualisierung']).trim() : null,
    }))
}

async function findBwlXlsxUrl(): Promise<string> {
  const response = await fetch(BWL_PAGE_URL, {
    headers: { 'Accept-Language': 'de', 'User-Agent': 'engpassradar.ch/1.0' },
  })
  if (!response.ok) throw new Error(`BWL page fetch failed: ${response.status}`)

  const html = await response.text()

  // Match href ending in .xlsx (relative or absolute)
  const match = html.match(/href="([^"]*Versorgungsst[^"]*\.xlsx[^"]*)"/i)
    ?? html.match(/href="([^"]*\.xlsx[^"]*)"/i)
  if (!match) throw new Error('No XLSX link found on BWL page')

  const href = match[1].replace(/&amp;/g, '&')
  if (href.startsWith('http')) return href
  return new URL(href, 'https://www.bwl.admin.ch').toString()
}
