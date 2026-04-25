/**
 * Blog-Datenanalyse: Historische Analyse
 * Für: historische-analyse-lieferengpass-schweiz.mdx (Post #6)
 *
 * Run: npx tsx src/scripts/blog-historisch-analyse.ts
 */
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

async function main() {
  const datenstand = new Date().toISOString().split('T')[0]
  console.log(`\n=== ENGPASSRADAR.CH — Historische Analyse (Post #6) | Datenstand: ${datenstand} ===\n`)

  // 1. Auflösungsrate
  console.log('--- AUFLÖSUNGSRATE ---')
  const aufloesung = await prisma.$queryRaw<{
    total: bigint; mit_enddatum: bigint; aktiv: bigint
  }[]>(Prisma.sql`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE "isActive" = false) AS mit_enddatum,
      COUNT(*) FILTER (WHERE "isActive" = true) AS aktiv
    FROM shortages
  `)
  const a = aufloesung[0]
  const auflRate = ((Number(a.mit_enddatum) / Number(a.total)) * 100).toFixed(1)
  console.log(`  Gesamtmeldungen:        ${a.total}`)
  console.log(`  Aufgelöst (isActive=false): ${a.mit_enddatum} (${auflRate}%)`)
  console.log(`  Noch aktiv:             ${a.aktiv}`)

  // 2. Mediandauer bis Auflösung (aus ShortageEpisode)
  const episodesExist = await prisma.$queryRaw<{ exists: boolean }[]>(Prisma.sql`
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shortage_episodes') AS exists
  `)

  if (episodesExist[0].exists) {
    console.log('\n--- MEDIANDAUER BIS AUFLÖSUNG (ShortageEpisode) ---')
    const epStats = await prisma.$queryRaw<{
      count: bigint; p25: number; p50: number; p75: number; avg: number
    }[]>(Prisma.sql`
      SELECT
        COUNT(*) AS count,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY "durationDays") AS p25,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY "durationDays") AS p50,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY "durationDays") AS p75,
        AVG("durationDays") AS avg
      FROM shortage_episodes
      WHERE "endedAt" IS NOT NULL AND "durationDays" IS NOT NULL
    `)
    const e = epStats[0]
    console.log(`  Abgeschlossene Episoden: ${e.count}`)
    console.log(`  P50 (Median):  ${Math.round(e.p50)} Tage = ${(Math.round(e.p50) / 7).toFixed(1)} Wochen`)
    console.log(`  Mittelwert:    ${Math.round(e.avg)} Tage`)
    console.log(`  P25: ${Math.round(e.p25)} Tage | P75: ${Math.round(e.p75)} Tage`)

    // Langzeitengpässe
    const langzeit = await prisma.$queryRaw<{ kat: string; count: bigint }[]>(Prisma.sql`
      SELECT
        CASE
          WHEN "durationDays" >= 365 THEN '>1 Jahr'
          WHEN "durationDays" >= 180 THEN '6–12 Monate'
          ELSE '<6 Monate'
        END AS kat,
        COUNT(*) AS count
      FROM shortage_episodes
      WHERE "endedAt" IS NOT NULL AND "durationDays" IS NOT NULL
      GROUP BY 1
      ORDER BY MIN("durationDays") DESC
    `)
    const epTotal = langzeit.reduce((s, r) => s + Number(r.count), 0)
    console.log('\n  Langzeitanteile (abgeschlossene Episoden):')
    for (const l of langzeit) {
      console.log(`    ${l.kat}: ${l.count} (${((Number(l.count) / epTotal) * 100).toFixed(1)}%)`)
    }

    // 3. Rezidivquote
    console.log('\n--- REZIDIVQUOTE ---')
    const rezidiv = await prisma.$queryRaw<{
      total_gtins: bigint; rezidiv1: bigint; rezidiv2: bigint; rezidiv3plus: bigint
    }[]>(Prisma.sql`
      SELECT
        COUNT(DISTINCT gtin) AS total_gtins,
        COUNT(DISTINCT gtin) FILTER (WHERE ecount > 1) AS rezidiv1,
        COUNT(DISTINCT gtin) FILTER (WHERE ecount > 2) AS rezidiv2,
        COUNT(DISTINCT gtin) FILTER (WHERE ecount > 3) AS rezidiv3plus
      FROM (
        SELECT gtin, COUNT(*) AS ecount FROM shortage_episodes GROUP BY gtin
      ) sub
    `)
    const rz = rezidiv[0]
    const rzPct = ((Number(rz.rezidiv1) / Number(rz.total_gtins)) * 100).toFixed(0)
    console.log(`  Total eindeutige GTINs: ${rz.total_gtins}`)
    console.log(`  Mit >1 Episode: ${rz.rezidiv1} (${rzPct}%)`)
    console.log(`  Mit >2 Episoden: ${rz.rezidiv2}`)
    console.log(`  Mit >3 Episoden: ${rz.rezidiv3plus}`)

    // Top-Rezidive
    const topRez = await prisma.$queryRaw<{ bezeichnung: string; firma: string; ecount: bigint }[]>(Prisma.sql`
      SELECT s.bezeichnung, s.firma, COUNT(e.id) AS ecount
      FROM shortage_episodes e
      JOIN shortages s ON s.gtin = e.gtin
      GROUP BY s.bezeichnung, s.firma
      ORDER BY ecount DESC
      LIMIT 10
    `)
    console.log('\n  Top Wirkstoffe nach Episodenzahl:')
    for (const t of topRez) {
      console.log(`    ${t.bezeichnung} (${t.firma}): ${t.ecount} Episoden`)
    }
  }

  // 4. 3-Jahres-Perioden-Vergleich (nach firstSeenAt)
  console.log('\n--- PERIODEN-VERGLEICH (nach Jahr, neue Meldungen) ---')
  const yearly = await prisma.$queryRaw<{ jahr: number; neu: bigint }[]>(Prisma.sql`
    SELECT
      EXTRACT(YEAR FROM "firstSeenAt")::int AS jahr,
      COUNT(*) AS neu
    FROM shortages
    WHERE "firstSeenAt" >= '2015-01-01'
    GROUP BY 1
    ORDER BY 1
  `)
  for (const y of yearly) {
    console.log(`  ${y.jahr}: ${y.neu} neue Meldungen`)
  }

  // 5. Langzeitengpässe aktiv
  console.log('\n--- AKTIVE LANGZEITENGPÄSSE (nach tageSeitMeldung) ---')
  const langzeitAktiv = await prisma.$queryRaw<{ kat: string; count: bigint }[]>(Prisma.sql`
    SELECT
      CASE
        WHEN "tageSeitMeldung" >= 730 THEN '>2 Jahre'
        WHEN "tageSeitMeldung" >= 365 THEN '1–2 Jahre'
        WHEN "tageSeitMeldung" >= 180 THEN '6–12 Monate'
        ELSE '<6 Monate'
      END AS kat,
      COUNT(*) AS count
    FROM shortages
    WHERE "isActive" = true
    GROUP BY 1
    ORDER BY MIN("tageSeitMeldung") DESC
  `)
  const aktivTotal = langzeitAktiv.reduce((s, r) => s + Number(r.count), 0)
  for (const l of langzeitAktiv) {
    console.log(`  ${l.kat}: ${l.count} (${((Number(l.count) / aktivTotal) * 100).toFixed(1)}%)`)
  }

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
