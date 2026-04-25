/**
 * Blog-Datenanalyse: BWL Pflichtlager
 * Für: bwl-pflichtlager-lieferengpass-schweiz.mdx (Post #12)
 *
 * Run: npx tsx src/scripts/blog-bwl-analyse.ts
 */
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

async function main() {
  const datenstand = new Date().toISOString().split('T')[0]
  console.log(`\n=== ENGPASSRADAR.CH — BWL Pflichtlager (Post #12) | Datenstand: ${datenstand} ===\n`)

  // 1. BWL-Tabelle Bestand
  const bwlBase = await prisma.$queryRaw<{ total: bigint; mit_atc: bigint }[]>(Prisma.sql`
    SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE "atcCode" IS NOT NULL AND "atcCode" != '') AS mit_atc
    FROM bwl_shortages
  `)
  console.log('--- BWL-TABELLE (bwl_shortages) ---')
  console.log(`  Einträge total:   ${bwlBase[0].total}`)
  console.log(`  Mit ATC-Code:     ${bwlBase[0].mit_atc}`)

  // 2. Cross-Join: BWL-Präparate die AUCH im Shortage sind (aktiv)
  console.log('\n--- BWL-PRÄPARATE AKTUELL IM ENGPASS (aktive shortages) ---')
  const bwlImEngpass = await prisma.$queryRaw<{
    bezeichnung: string; firma: string; atcCode: string; tageSeitMeldung: number; firstSeenAt: Date
  }[]>(Prisma.sql`
    SELECT s.bezeichnung, s.firma, s."atcCode", s."tageSeitMeldung", s."firstSeenAt"
    FROM shortages s
    INNER JOIN bwl_shortages b ON b.gtin = s.gtin
    WHERE s."isActive" = true
    ORDER BY s."tageSeitMeldung" DESC
  `)
  console.log(`  Anzahl BWL-Präparate im aktiven Engpass: ${bwlImEngpass.length}`)
  console.log('\n  Bezeichnung | Firma | ATC | Tage aktiv | Seit')
  for (const p of bwlImEngpass) {
    const seit = p.firstSeenAt.toISOString().split('T')[0]
    console.log(`  ${p.bezeichnung} | ${p.firma} | ${p.atcCode} | ${p.tageSeitMeldung} | ${seit}`)
  }

  // 3. BWL-ATC-Verteilung
  console.log('\n--- BWL-ATC-GRUPPEN ---')
  const bwlAtc = await prisma.$queryRaw<{ atc1: string; count: bigint }[]>(Prisma.sql`
    SELECT LEFT("atcCode", 1) AS atc1, COUNT(*) AS count
    FROM bwl_shortages
    WHERE "atcCode" IS NOT NULL AND "atcCode" != ''
    GROUP BY 1
    ORDER BY count DESC
  `)
  for (const a of bwlAtc) {
    console.log(`  ATC ${a.atc1}: ${a.count} Präparate`)
  }

  // 4. Aktuelle OverviewStats: pflichtlager + bwl Felder
  console.log('\n--- OVERVIEW_STATS: pflichtlager + bwl (neuester Wert) ---')
  const latest = await prisma.overviewStats.findFirst({ orderBy: { scrapedAt: 'desc' } })
  if (latest) {
    console.log(`  Datenstand: ${latest.scrapedAt.toISOString().split('T')[0]}`)
    console.log(`  pflichtlager: ${latest.pflichtlager}`)
    console.log(`  bwl:          ${latest.bwl}`)
    console.log(`  bwlWho:       ${latest.bwlWho}`)
    console.log(`  kassenpflichtig SL: ${latest.kassenpflichtigSL} von ${latest.kassenpflichtigSLTotal} (${latest.prozentSLNichtLieferbar.toFixed(1)}%)`)
  }

  // 5. Zeitreihe pflichtlager (aus OverviewStats, letzten 12 Monate)
  console.log('\n--- PFLICHTLAGER-ZEITREIHE (letzten 12 Monate, monatlich) ---')
  const pflTimeline = await prisma.$queryRaw<{
    jahr: number; monat: number; pflichtlager: number; bwl: number
  }[]>(Prisma.sql`
    SELECT DISTINCT ON (EXTRACT(YEAR FROM "scrapedAt")::int, EXTRACT(MONTH FROM "scrapedAt")::int)
      EXTRACT(YEAR FROM "scrapedAt")::int AS jahr,
      EXTRACT(MONTH FROM "scrapedAt")::int AS monat,
      pflichtlager,
      bwl
    FROM overview_stats
    WHERE "scrapedAt" >= NOW() - INTERVAL '12 months'
    ORDER BY
      EXTRACT(YEAR FROM "scrapedAt")::int,
      EXTRACT(MONTH FROM "scrapedAt")::int,
      "scrapedAt" DESC
  `)
  const monate = ['', 'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
  for (const t of pflTimeline) {
    console.log(`  ${monate[t.monat]} ${t.jahr}: pflichtlager=${t.pflichtlager} | bwl=${t.bwl}`)
  }

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
