/**
 * Blog-Datenanalyse: Engpass-Chronik 2024–2026
 * Für: engpass-chronik-2024-2026-schweiz.mdx (Post #14)
 *
 * Run: npx tsx src/scripts/blog-chronik-analyse.ts
 */
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

async function main() {
  const datenstand = new Date().toISOString().split('T')[0]
  console.log(`\n=== ENGPASSRADAR.CH — Chronik 2024–2026 (Post #14) | Datenstand: ${datenstand} ===\n`)

  // 1. Monatliche Zeitreihe aus OverviewStats (einen Wert pro Monat, immer der letzte des Monats)
  console.log('--- MONATLICHE ZEITREIHE (OverviewStats, je letzter Wert pro Monat) ---')
  const monthly = await prisma.$queryRaw<{
    jahr: number; monat: number; active_packungen: number; bwl: number; pflichtlager: number; scrapedAt: Date
  }[]>(Prisma.sql`
    SELECT DISTINCT ON (EXTRACT(YEAR FROM "scrapedAt")::int, EXTRACT(MONTH FROM "scrapedAt")::int)
      EXTRACT(YEAR FROM "scrapedAt")::int AS jahr,
      EXTRACT(MONTH FROM "scrapedAt")::int AS monat,
      "totalPackungen" AS active_packungen,
      bwl,
      pflichtlager,
      "scrapedAt"
    FROM overview_stats
    WHERE "scrapedAt" >= '2024-01-01'
    ORDER BY
      EXTRACT(YEAR FROM "scrapedAt")::int,
      EXTRACT(MONTH FROM "scrapedAt")::int,
      "scrapedAt" DESC
  `)

  const monate = ['', 'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
  console.log('  Periode | Aktive Engpässe | BWL | Pflichtlager | Datum')
  for (const m of monthly) {
    console.log(`  ${monate[m.monat]} ${m.jahr}: ${m.active_packungen} aktiv | BWL: ${m.bwl} | Pflichtlager: ${m.pflichtlager} | ${m.scrapedAt.toISOString().split('T')[0]}`)
  }

  // 2. Jahresvergleich April (selber Monat, Vorjahresvergleich)
  console.log('\n--- APRIL-VERGLEICH (Vorjahresvergleich) ---')
  const aprilComp = await prisma.$queryRaw<{ jahr: number; active: number; date: Date }[]>(Prisma.sql`
    SELECT DISTINCT ON (EXTRACT(YEAR FROM "scrapedAt")::int)
      EXTRACT(YEAR FROM "scrapedAt")::int AS jahr,
      "totalPackungen" AS active,
      "scrapedAt" AS date
    FROM overview_stats
    WHERE EXTRACT(MONTH FROM "scrapedAt") = 4
    ORDER BY EXTRACT(YEAR FROM "scrapedAt")::int, "scrapedAt" DESC
  `)
  for (const a of aprilComp) {
    console.log(`  April ${a.jahr}: ${a.active} aktive Engpässe (${a.date.toISOString().split('T')[0]})`)
  }

  // 3. Winter vs. Sommer Vergleich
  console.log('\n--- SAISON-VERGLEICH (Winter Dez–Feb vs. Sommer Jun–Aug) ---')
  const saison = await prisma.$queryRaw<{ saison: string; avg_active: number; count: bigint }[]>(Prisma.sql`
    SELECT
      CASE
        WHEN EXTRACT(MONTH FROM "scrapedAt") IN (12, 1, 2) THEN 'Winter (Dez–Feb)'
        WHEN EXTRACT(MONTH FROM "scrapedAt") IN (6, 7, 8)  THEN 'Sommer (Jun–Aug)'
        ELSE 'Übrige Monate'
      END AS saison,
      ROUND(AVG("totalPackungen")) AS avg_active,
      COUNT(*) AS count
    FROM overview_stats
    WHERE "scrapedAt" >= '2024-01-01'
    GROUP BY 1
    ORDER BY 2 DESC
  `)
  for (const s of saison) {
    console.log(`  ${s.saison}: Ø ${s.avg_active} aktiv (n=${s.count})`)
  }

  // 4. Min/Max und Peaks
  console.log('\n--- PEAKS & TIEFPUNKTE (2024–2026) ---')
  const peaks = await prisma.$queryRaw<{
    max_active: number; max_date: Date; min_active: number; min_date: Date
  }[]>(Prisma.sql`
    SELECT
      MAX("totalPackungen") AS max_active,
      (SELECT "scrapedAt" FROM overview_stats WHERE "totalPackungen" = MAX(o."totalPackungen") ORDER BY "scrapedAt" DESC LIMIT 1) AS max_date,
      MIN("totalPackungen") AS min_active,
      (SELECT "scrapedAt" FROM overview_stats WHERE "totalPackungen" = MIN(o."totalPackungen") ORDER BY "scrapedAt" DESC LIMIT 1) AS min_date
    FROM overview_stats o
    WHERE "scrapedAt" >= '2024-01-01'
  `)
  if (peaks[0]) {
    const pk = peaks[0]
    console.log(`  Peak:      ${pk.max_active} aktive Engpässe (${pk.max_date?.toISOString().split('T')[0] ?? 'unbekannt'})`)
    console.log(`  Tiefpunkt: ${pk.min_active} aktive Engpässe (${pk.min_date?.toISOString().split('T')[0] ?? 'unbekannt'})`)
  }

  // 5. Neue Meldungen pro Monat (firstSeenAt aus shortages)
  console.log('\n--- NEUE MELDUNGEN PRO MONAT (firstSeenAt, 2024–2026) ---')
  const newMonthly = await prisma.$queryRaw<{ jahr: number; monat: number; neu: bigint }[]>(Prisma.sql`
    SELECT
      EXTRACT(YEAR FROM "firstSeenAt")::int AS jahr,
      EXTRACT(MONTH FROM "firstSeenAt")::int AS monat,
      COUNT(*) AS neu
    FROM shortages
    WHERE "firstSeenAt" >= '2024-01-01'
    GROUP BY 1, 2
    ORDER BY 1, 2
  `)
  for (const m of newMonthly) {
    console.log(`  ${monate[m.monat]} ${m.jahr}: ${m.neu} neue Meldungen`)
  }

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
