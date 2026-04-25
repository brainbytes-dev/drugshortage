/**
 * Blog-Datenanalyse: Gesamtübersicht
 * Für: was-ist-medikamenten-lieferengpass-faq.mdx (Post #4)
 *      lieferengpass-medikamente-schweiz-uebersicht.mdx (Post #5)
 *
 * Run: npx tsx src/scripts/blog-overview-analyse.ts
 */
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

async function main() {
  const datenstand = new Date().toISOString().split('T')[0]
  console.log(`\n=== ENGPASSRADAR.CH — Gesamtübersicht | Datenstand: ${datenstand} ===\n`)

  // 1. Basiszahlen
  const base = await prisma.$queryRaw<{
    total: bigint; active: bigint; inactive: bigint; unique_atc: bigint; unique_firms: bigint
  }[]>(Prisma.sql`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE "isActive" = true) AS active,
      COUNT(*) FILTER (WHERE "isActive" = false) AS inactive,
      COUNT(DISTINCT "atcCode") FILTER (WHERE "isActive" = true) AS unique_atc,
      COUNT(DISTINCT firma) FILTER (WHERE "isActive" = true) AS unique_firms
    FROM shortages
  `)
  const b = base[0]
  console.log('--- BASISZAHLEN ---')
  console.log(`  Gesamtmeldungen:          ${b.total}`)
  console.log(`  Aktuell aktiv:            ${b.active}`)
  console.log(`  Historisch abgeschlossen: ${b.inactive}`)
  console.log(`  Betroffene ATC-Codes (aktiv): ${b.unique_atc}`)
  console.log(`  Zulassungsinhaber (aktiv): ${b.unique_firms}`)

  // 2. Min/Max aktive Engpässe aus OverviewStats (historische Bandbreite)
  const range = await prisma.$queryRaw<{
    min_active: number; max_active: number; latest_active: number; latest_date: Date
  }[]>(Prisma.sql`
    SELECT
      MIN("totalPackungen") AS min_active,
      MAX("totalPackungen") AS max_active,
      (SELECT "totalPackungen" FROM overview_stats ORDER BY "scrapedAt" DESC LIMIT 1) AS latest_active,
      (SELECT "scrapedAt" FROM overview_stats ORDER BY "scrapedAt" DESC LIMIT 1) AS latest_date
    FROM overview_stats
    WHERE "scrapedAt" >= NOW() - INTERVAL '2 years'
  `)
  const r = range[0]
  console.log('\n--- BANDBREITE (letzten 2 Jahre, aus OverviewStats) ---')
  console.log(`  Minimum aktive Packungen: ${r.min_active}`)
  console.log(`  Maximum aktive Packungen: ${r.max_active}`)
  console.log(`  Aktuell (${r.latest_date?.toISOString().split('T')[0]}): ${r.latest_active}`)

  // 3. Top-10 ATC-Hauptgruppen nach Fallzahl
  console.log('\n--- TOP ATC-HAUPTGRUPPEN (historisch) ---')
  const atcTop = await prisma.$queryRaw<{ gruppe: string; total: bigint; aktiv: bigint }[]>(Prisma.sql`
    SELECT
      LEFT("atcCode", 1) AS gruppe,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE "isActive" = true) AS aktiv
    FROM shortages
    WHERE "atcCode" IS NOT NULL AND "atcCode" != ''
    GROUP BY 1
    ORDER BY total DESC
    LIMIT 10
  `)
  const atcNames: Record<string, string> = {
    N: 'Nervensystem', C: 'Kardiovaskulär', A: 'Verdauung/Stoffwechsel',
    J: 'Antiinfektiva', L: 'Onkologie/Immunologie', R: 'Respirationstrakt',
    B: 'Blut', M: 'Muskel/Skelett', H: 'Hormone', G: 'Urogenital',
  }
  for (const a of atcTop) {
    console.log(`  ${a.gruppe} (${atcNames[a.gruppe] ?? '—'}): ${a.total} Fälle total | ${a.aktiv} aktiv`)
  }

  // 4. Top-5 ATC-3-Codes (spezifischer)
  console.log('\n--- TOP 10 ATC-3-CODES (nach aktiven Engpässen) ---')
  const atc3 = await prisma.$queryRaw<{ atc3: string; aktiv: bigint; total: bigint }[]>(Prisma.sql`
    SELECT
      LEFT("atcCode", 3) AS atc3,
      COUNT(*) FILTER (WHERE "isActive" = true) AS aktiv,
      COUNT(*) AS total
    FROM shortages
    WHERE "atcCode" IS NOT NULL AND LENGTH("atcCode") >= 3
    GROUP BY 1
    ORDER BY aktiv DESC
    LIMIT 10
  `)
  for (const a of atc3) {
    console.log(`  ${a.atc3}: ${a.aktiv} aktiv | ${a.total} total`)
  }

  // 5. Mediandauer und Rezidivquote
  console.log('\n--- DAUERN & REZIDIVE ---')
  const durStats = await prisma.$queryRaw<{ p50: number; avg: number }[]>(Prisma.sql`
    SELECT
      PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY "tageSeitMeldung") AS p50,
      AVG("tageSeitMeldung") AS avg
    FROM shortages
    WHERE "isActive" = true
  `)
  console.log(`  Mediandauer aktiv: ${Math.round(durStats[0].p50)} Tage (${(Math.round(durStats[0].p50) / 7).toFixed(0)} Wochen)`)
  console.log(`  Mitteldauer aktiv: ${Math.round(durStats[0].avg)} Tage`)

  // Rezidivquote: GTINs mit >1 Eintrag in ShortageEpisode
  const episodesExist = await prisma.$queryRaw<{ exists: boolean }[]>(Prisma.sql`
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shortage_episodes') AS exists
  `)
  if (episodesExist[0].exists) {
    const rezidiv = await prisma.$queryRaw<{ total_gtins: bigint; rezidiv_gtins: bigint }[]>(Prisma.sql`
      SELECT
        COUNT(DISTINCT gtin) AS total_gtins,
        COUNT(DISTINCT gtin) FILTER (WHERE episode_count > 1) AS rezidiv_gtins
      FROM (
        SELECT gtin, COUNT(*) AS episode_count FROM shortage_episodes GROUP BY gtin
      ) sub
    `)
    const rq = rezidiv[0]
    const pct = ((Number(rq.rezidiv_gtins) / Number(rq.total_gtins)) * 100).toFixed(0)
    console.log(`  Rezidivquote: ${rq.rezidiv_gtins} von ${rq.total_gtins} GTINs (${pct}%) hatten >1 Episode`)
  }

  // 6. Saisonalität: Monatsdurchschnitt aus OverviewStats
  console.log('\n--- SAISONALITÄT (Monats-Ø aktiver Packungen, letzten 2 Jahre) ---')
  const seasonal = await prisma.$queryRaw<{ monat: number; avg_active: number; count: bigint }[]>(Prisma.sql`
    SELECT
      EXTRACT(MONTH FROM "scrapedAt")::int AS monat,
      ROUND(AVG("totalPackungen")) AS avg_active,
      COUNT(*) AS count
    FROM overview_stats
    WHERE "scrapedAt" >= NOW() - INTERVAL '2 years'
    GROUP BY 1
    ORDER BY 1
  `)
  const monate = ['', 'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
  for (const s of seasonal) {
    console.log(`  ${monate[s.monat]}: Ø ${s.avg_active} aktive Engpässe (${s.count} Datenpunkte)`)
  }

  // 7. Preis-Analyse (Join mit ODDB für Generika-Hypothese)
  console.log('\n--- GENERIKA vs. ORIGINALE (top 50 Wirkstoffe nach ATC, PEXF-Vergleich) ---')
  const genoriProp = await prisma.$queryRaw<{
    bezeichnung: string; firma: string; atcCode: string
    anzahl_eintraege: bigint; pexf_median: number | null
  }[]>(Prisma.sql`
    SELECT
      s.bezeichnung,
      s.firma,
      s."atcCode",
      COUNT(*) AS anzahl_eintraege,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.pexf) AS pexf_median
    FROM shortages s
    LEFT JOIN oddb_products o ON o.gtin = s.gtin AND o.pexf IS NOT NULL
    GROUP BY s.bezeichnung, s.firma, s."atcCode"
    ORDER BY anzahl_eintraege DESC
    LIMIT 20
  `)
  console.log('  Rang | Bezeichnung | ATC | Einträge | PEXF-Median (CHF)')
  genoriProp.forEach((r, i) => {
    const pexf = r.pexf_median != null ? `CHF ${r.pexf_median.toFixed(2)}` : 'k.A.'
    console.log(`  ${i + 1}. ${r.bezeichnung} | ${r.atcCode} | ${r.anzahl_eintraege} | ${pexf}`)
  })

  // PEXF-Schwellenwert-Analyse
  const pexfBreakdown = await prisma.$queryRaw<{ tier: string; count: bigint }[]>(Prisma.sql`
    SELECT
      CASE
        WHEN o.pexf IS NULL THEN 'kein PEXF-Match'
        WHEN o.pexf < 10    THEN '< CHF 10'
        WHEN o.pexf < 50    THEN 'CHF 10–50'
        WHEN o.pexf < 200   THEN 'CHF 50–200'
        ELSE '> CHF 200'
      END AS tier,
      COUNT(*) AS count
    FROM shortages s
    LEFT JOIN oddb_products o ON o.gtin = s.gtin
    WHERE s."isActive" = true
    GROUP BY 1
    ORDER BY MIN(COALESCE(o.pexf, 999999))
  `)
  console.log('\n  PEXF-Preisklassen (aktive Engpässe):')
  const pexfTotal = pexfBreakdown.reduce((s, r) => s + Number(r.count), 0)
  for (const t of pexfBreakdown) {
    console.log(`    ${t.tier}: ${t.count} (${((Number(t.count) / pexfTotal) * 100).toFixed(1)}%)`)
  }

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
