/**
 * Blog-Datenanalyse: Engpass-Dauer Verteilung
 * Für: dauer-lieferengpass-medikamente-schweiz.mdx (Post #2)
 *
 * Run: npx tsx src/scripts/blog-dauer-analyse.ts
 */
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

async function main() {
  console.log('\n=== ENGPASSRADAR.CH — Dauer-Analyse (Post #2) ===\n')

  // 1. Neueste OverviewStats (hat vorberechnete Dauerkategorien)
  const latest = await prisma.overviewStats.findFirst({
    orderBy: { scrapedAt: 'desc' },
  })
  if (!latest) throw new Error('Keine OverviewStats vorhanden')

  const total =
    latest.dauerUnter2Wochen +
    latest.dauer2bis6Wochen +
    latest.dauerUeber6WochenBis6Monate +
    latest.dauerUeber6MonateBis1Jahr +
    latest.dauerUeber1Bis2Jahre +
    latest.dauerUeber2Jahre

  console.log(`Datenstand: ${latest.scrapedAt.toISOString().split('T')[0]}`)
  console.log(`Aktive Engpässe total: ${total}\n`)

  console.log('--- DAUERKATEGORIEN (aktive Engpässe) ---')
  const cats = [
    { label: '< 2 Wochen', val: latest.dauerUnter2Wochen },
    { label: '2–6 Wochen', val: latest.dauer2bis6Wochen },
    { label: '6 Wochen – 6 Monate', val: latest.dauerUeber6WochenBis6Monate },
    { label: '6 Monate – 1 Jahr', val: latest.dauerUeber6MonateBis1Jahr },
    { label: '1–2 Jahre', val: latest.dauerUeber1Bis2Jahre },
    { label: '> 2 Jahre', val: latest.dauerUeber2Jahre },
  ]
  for (const c of cats) {
    const pct = total > 0 ? ((c.val / total) * 100).toFixed(1) : '0'
    console.log(`  ${c.label}: ${c.val} (${pct}%)`)
  }

  const over6m = latest.dauerUeber6MonateBis1Jahr + latest.dauerUeber1Bis2Jahre + latest.dauerUeber2Jahre
  const over1y = latest.dauerUeber1Bis2Jahre + latest.dauerUeber2Jahre
  console.log(`\n  > 6 Monate (gesamt): ${over6m} (${total > 0 ? ((over6m / total) * 100).toFixed(1) : 0}%)`)
  console.log(`  > 1 Jahr (gesamt):   ${over1y} (${total > 0 ? ((over1y / total) * 100).toFixed(1) : 0}%)`)

  // 2. Perzentilen aus tageSeitMeldung (aktive Engpässe)
  console.log('\n--- PERZENTILEN (tageSeitMeldung, aktive Engpässe) ---')
  const percentiles = await prisma.$queryRaw<{ p25: number; p50: number; p75: number; p90: number; avg: number }[]>(Prisma.sql`
    SELECT
      PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY "tageSeitMeldung") AS p25,
      PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY "tageSeitMeldung") AS p50,
      PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY "tageSeitMeldung") AS p90,
      PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY "tageSeitMeldung") AS p75,
      AVG("tageSeitMeldung") AS avg
    FROM shortages
    WHERE "isActive" = true
  `)
  const p = percentiles[0]
  console.log(`  P25 (25. Perzentil):  ${Math.round(p.p25)} Tage`)
  console.log(`  P50 (Median):         ${Math.round(p.p50)} Tage  = ${(Math.round(p.p50) / 7).toFixed(1)} Wochen`)
  console.log(`  P75 (75. Perzentil):  ${Math.round(p.p75)} Tage`)
  console.log(`  P90 (90. Perzentil):  ${Math.round(p.p90)} Tage`)
  console.log(`  Mittelwert:           ${Math.round(p.avg)} Tage  = ${(Math.round(p.avg) / 7).toFixed(1)} Wochen`)

  // 3. Abgeschlossene Episoden (ShortageEpisode mit durationDays)
  const episodesExist = await prisma.$queryRaw<{ exists: boolean }[]>(Prisma.sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables WHERE table_name = 'shortage_episodes'
    ) AS exists
  `)

  if (episodesExist[0].exists) {
    console.log('\n--- ABGESCHLOSSENE EPISODEN (ShortageEpisode) ---')
    const epStats = await prisma.$queryRaw<{
      count: bigint; p25: number; p50: number; p75: number; p90: number; avg: number
    }[]>(Prisma.sql`
      SELECT
        COUNT(*) AS count,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY "durationDays") AS p25,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY "durationDays") AS p50,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY "durationDays") AS p75,
        PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY "durationDays") AS p90,
        AVG("durationDays") AS avg
      FROM shortage_episodes
      WHERE "endedAt" IS NOT NULL AND "durationDays" IS NOT NULL
    `)
    const e = epStats[0]
    console.log(`  Abgeschlossene Episoden: ${e.count}`)
    console.log(`  P50 (Median):  ${Math.round(e.p50)} Tage = ${(Math.round(e.p50) / 7).toFixed(1)} Wochen`)
    console.log(`  Mittelwert:    ${Math.round(e.avg)} Tage`)
    console.log(`  P25: ${Math.round(e.p25)} Tage | P75: ${Math.round(e.p75)} Tage | P90: ${Math.round(e.p90)} Tage`)

    const epCats = await prisma.$queryRaw<{ kat: string; anzahl: bigint }[]>(Prisma.sql`
      SELECT
        CASE
          WHEN "durationDays" < 14    THEN '< 2 Wochen'
          WHEN "durationDays" < 42    THEN '2–6 Wochen'
          WHEN "durationDays" < 180   THEN '6 Wo – 6 Monate'
          WHEN "durationDays" < 365   THEN '6 Monate – 1 Jahr'
          WHEN "durationDays" < 730   THEN '1–2 Jahre'
          ELSE '> 2 Jahre'
        END AS kat,
        COUNT(*) AS anzahl
      FROM shortage_episodes
      WHERE "endedAt" IS NOT NULL AND "durationDays" IS NOT NULL
      GROUP BY 1
      ORDER BY MIN("durationDays")
    `)
    const epTotal = epCats.reduce((s, r) => s + Number(r.anzahl), 0)
    console.log('\n  Kategorien abgeschlossene Episoden:')
    for (const c of epCats) {
      console.log(`    ${c.kat}: ${c.anzahl} (${((Number(c.anzahl) / epTotal) * 100).toFixed(1)}%)`)
    }
  }

  // 4. Totals für Methodiktabelle
  console.log('\n--- FÜR METHODIKTABELLE ---')
  const totals = await prisma.$queryRaw<{ total: bigint; active: bigint; inactive: bigint }[]>(Prisma.sql`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE "isActive" = true) AS active,
      COUNT(*) FILTER (WHERE "isActive" = false) AS inactive
    FROM shortages
  `)
  const t = totals[0]
  console.log(`  Gesamte Fälle:       ${t.total}`)
  console.log(`  Davon aktiv:         ${t.active}`)
  console.log(`  Davon abgeschlossen: ${t.inactive}`)

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
