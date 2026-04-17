import { XMLParser } from 'fast-xml-parser'

const ODDB_PRODUCT_URL = 'https://download.hin.ch/download/oddb2xml/oddb_product.xml'
const ODDB_ARTICLE_URL = 'https://download.hin.ch/download/oddb2xml/oddb_article.xml'

export interface OddbProductData {
  gtin: string
  prodno: string       // Swissmedic product number e.g. "0060201"
  bezeichnungDe: string
  atcCode: string
  substanz: string | null
  zusammensetzung: string | null
  authStatus: string | null // Swissmedic AUTOSATP: 'A'=active, 'E'=erloschen, 'S'=sistiert, etc.
}

export interface OddbPriceData {
  gtin: string
  ppub: number | null // Publikumspreis in CHF
  pexf: number | null // Fabrikabgabepreis in CHF
}

/** Fetch and parse article-level prices (PPUB / PEXF) from oddb_article.xml (~80 MB).
 *
 * XML structure: <ARTICLE><ART><ARTBAR><CDTYP>E13</CDTYP><BC>07680...</BC></ARTBAR>
 *   <ARTPRI><PTYP>PPUB</PTYP><PRICE>12.35</PRICE></ARTPRI>...</ART></ARTICLE>
 *
 * GTIN: ARTBAR.BC where CDTYP=E13. BC is GTIN-14 (14 digits); Swiss GTIN-13 starts with 7680.
 * Strip leading 0 from GTIN-14 to get GTIN-13: "07680494930101" → "7680494930101".
 */
export async function fetchOddbArticlePrices(): Promise<OddbPriceData[]> {
  const response = await fetch(ODDB_ARTICLE_URL, {
    headers: { 'User-Agent': 'engpassradar.ch/1.0' },
  })
  if (!response.ok) throw new Error(`ODDB article fetch failed: ${response.status}`)

  const xml = await response.text()

  const parser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: true,
    trimValues: true,
    removeNSPrefix: true,
    isArray: (name) => ['ART', 'ARTBAR', 'ARTPRI'].includes(name),
  })

  const doc = parser.parse(xml)
  const raw = doc?.ARTICLE?.ART
  const entries: Record<string, unknown>[] = Array.isArray(raw) ? raw : raw ? [raw] : []

  const results: OddbPriceData[] = []
  for (const art of entries) {
    // Resolve GTIN from ARTBAR where CDTYP='E13'
    const artbars = (Array.isArray(art.ARTBAR) ? art.ARTBAR : art.ARTBAR ? [art.ARTBAR] : []) as Record<string, unknown>[]
    let gtin: string | null = null
    for (const bar of artbars) {
      if (String(bar.CDTYP ?? '').trim() === 'E13' && bar.BC) {
        const bc = String(bar.BC).trim().replace(/^0+(?=\d{13}$)/, '') // GTIN-14 → GTIN-13
        gtin = bc
        break
      }
    }
    if (!gtin) continue

    // Collect prices from ARTPRI entries
    const artpris = (Array.isArray(art.ARTPRI) ? art.ARTPRI : art.ARTPRI ? [art.ARTPRI] : []) as Record<string, unknown>[]
    let ppub: number | null = null
    let pexf: number | null = null
    for (const pri of artpris) {
      const ptyp = String(pri.PTYP ?? '').trim()
      const price = pri.PRICE != null ? parseFloat(String(pri.PRICE)) : NaN
      if (!isNaN(price)) {
        if (ptyp === 'PPUB') ppub = price
        else if (ptyp === 'PEXF') pexf = price
      }
    }

    if (ppub !== null || pexf !== null) {
      results.push({ gtin, ppub, pexf })
    }
  }
  return results
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
      authStatus: p.AUTOSATP ? String(p.AUTOSATP).trim() : null,
    }))
}
