import { XMLParser } from 'fast-xml-parser'

const ODDB_PRODUCT_URL = 'https://download.hin.ch/download/oddb2xml/oddb_product.xml'

export interface OddbProductData {
  gtin: string
  prodno: string       // Swissmedic product number e.g. "0060201"
  bezeichnungDe: string
  atcCode: string
  substanz: string | null
  zusammensetzung: string | null
}

export async function fetchOddbProducts(): Promise<OddbProductData[]> {
  const response = await fetch(ODDB_PRODUCT_URL, {
    headers: { 'User-Agent': 'engpassradar.ch/1.0' },
  })
  if (!response.ok) throw new Error(`ODDB product fetch failed: ${response.status}`)

  const xml = await response.text()

  const parser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: true,
    trimValues: true,
  })

  const doc = parser.parse(xml)

  // Handle both single-element and array (fast-xml-parser normalises to non-array if only 1 entry)
  const raw = doc?.PRODUCT?.PRD
  const entries: Record<string, unknown>[] = Array.isArray(raw) ? raw : raw ? [raw] : []

  return entries
    .filter(p => p.GTIN)
    .map(p => ({
      gtin: String(p.GTIN).trim(),
      prodno: String(p.PRODNO ?? '').trim(),
      bezeichnungDe: String(p.DSCRD ?? '').trim(),
      atcCode: String(p.ATC ?? '').trim(),
      substanz: p.SubstanceSwissmedic ? String(p.SubstanceSwissmedic).trim() : null,
      zusammensetzung: p.CompositionSwissmedic ? String(p.CompositionSwissmedic).trim() : null,
    }))
}
