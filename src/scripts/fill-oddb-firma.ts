/**
 * Fills oddb_products.firma using a cross-reference:
 * 1. Parses article XML: builds GTIN → COMPNO mapping
 * 2. Queries shortages: known GTIN → firma pairs
 * 3. Derives COMPNO → firma from the intersection
 * 4. Updates all oddb_products with matching COMPNO
 *
 * Coverage: all companies that appear in the shortages history.
 * Remaining gaps can be filled later via Swissmedic/GS1 lookup.
 */

import { XMLParser } from 'fast-xml-parser'
import { prisma } from '../lib/prisma'

const CHUNK = 500

async function main() {
  console.log('Step 1: Fetching article XML (~80MB) for GTIN → COMPNO mapping...')
  const r = await fetch('https://download.hin.ch/download/oddb2xml/oddb_article.xml', {
    headers: { 'User-Agent': 'engpassradar.ch/1.0' },
  })
  const xml = await r.text()

  const parser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: true,
    trimValues: true,
    removeNSPrefix: true,
    isArray: (n: string) => ['ART', 'ARTBAR', 'ARTCOMP'].includes(n),
  })
  const doc = parser.parse(xml)
  const arts: Record<string, unknown>[] = doc?.ARTICLE?.ART ?? []

  const gtinToCompno = new Map<string, string>()
  const compnoToGtins = new Map<string, string[]>()

  for (const art of arts) {
    const bars = (Array.isArray(art.ARTBAR) ? art.ARTBAR : art.ARTBAR ? [art.ARTBAR] : []) as Record<string, unknown>[]
    const comps = (Array.isArray(art.ARTCOMP) ? art.ARTCOMP : art.ARTCOMP ? [art.ARTCOMP] : []) as Record<string, unknown>[]

    let gtin: string | null = null
    for (const b of bars) {
      if (String(b.CDTYP ?? '').trim() === 'E13' && b.BC) {
        gtin = String(b.BC).trim().replace(/^0+(?=\d{13}$)/, '')
        break
      }
    }
    if (!gtin) continue

    for (const c of comps) {
      if (c.COMPNO) {
        const compno = String(c.COMPNO)
        gtinToCompno.set(gtin, compno)
        const list = compnoToGtins.get(compno) ?? []
        list.push(gtin)
        compnoToGtins.set(compno, list)
        break
      }
    }
  }

  console.log(`  GTIN→COMPNO entries: ${gtinToCompno.size.toLocaleString()}`)
  console.log(`  Unique COMPNOs: ${compnoToGtins.size}`)

  console.log('Step 2: Loading known firma values from shortages...')
  const knownShortages = await prisma.shortage.findMany({
    distinct: ['gtin'],
    where: { firma: { not: '' } },
    select: { gtin: true, firma: true },
  })
  console.log(`  Shortage GTINs with firma: ${knownShortages.length}`)

  // Build COMPNO → firma from shortages cross-referenced with article XML
  const compnoToFirma = new Map<string, string>()
  for (const s of knownShortages) {
    const compno = gtinToCompno.get(s.gtin)
    if (compno && !compnoToFirma.has(compno)) {
      compnoToFirma.set(compno, s.firma)
    }
  }
  console.log(`  COMPNOs resolved via shortages: ${compnoToFirma.size} of ${compnoToGtins.size}`)

  console.log('Step 3: Updating oddb_products.firma for all GTINs per COMPNO...')
  let totalUpdated = 0
  let totalCovered = 0

  for (const [compno, firma] of compnoToFirma) {
    const gtins = compnoToGtins.get(compno) ?? []
    totalCovered += gtins.length

    // Process in chunks to stay within statement size limits
    for (let i = 0; i < gtins.length; i += CHUNK) {
      const chunk = gtins.slice(i, i + CHUNK)
      const result = await prisma.oddbProduct.updateMany({
        where: { gtin: { in: chunk }, firma: null },
        data: { firma },
      })
      totalUpdated += result.count
    }
  }

  console.log(`  Products updated: ${totalUpdated.toLocaleString()}`)
  console.log(`  Products covered by known COMPNOs: ${totalCovered.toLocaleString()} of ${gtinToCompno.size.toLocaleString()}`)

  // Summary of gaps
  const remaining = await prisma.oddbProduct.count({ where: { firma: null } })
  const total = await prisma.oddbProduct.count()
  console.log(`\nResult: ${(total - remaining).toLocaleString()} / ${total.toLocaleString()} products have firma`)
  console.log(`Remaining gaps: ${remaining.toLocaleString()} products without firma`)
  console.log(`(${Math.round(((total - remaining) / total) * 100)}% coverage)`)

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
