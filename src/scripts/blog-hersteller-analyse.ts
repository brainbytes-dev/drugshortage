/**
 * Blog-Datenanalyse: Hersteller-Konzentration
 * Für: hersteller-konzentration-lieferengpass-schweiz.mdx (Post #11)
 *
 * Run: npx tsx src/scripts/blog-hersteller-analyse.ts
 */
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

async function main() {
  const datenstand = new Date().toISOString().split('T')[0]
  console.log(`\n=== ENGPASSRADAR.CH — Hersteller-Konzentration (Post #11) | Datenstand: ${datenstand} ===\n`)

  // 1. Gesamtbasis
  const base = await prisma.$queryRaw<{ total: bigint; unique_firms: bigint; unique_firms_aktiv: bigint }[]>(Prisma.sql`
    SELECT
      COUNT(*) AS total,
      COUNT(DISTINCT firma) AS unique_firms,
      COUNT(DISTINCT firma) FILTER (WHERE "isActive" = true) AS unique_firms_aktiv
    FROM shortages
  `)
  console.log('--- BASISZAHLEN ---')
  console.log(`  Gesamtmeldungen:              ${base[0].total}`)
  console.log(`  Eindeutige Firmen (gesamt):   ${base[0].unique_firms}`)
  console.log(`  Eindeutige Firmen (aktiv):    ${base[0].unique_firms_aktiv}`)

  // 2. Top 10 Firmen historisch (Gesamtfälle)
  console.log('\n--- TOP 10 FIRMEN (historisch gesamt) ---')
  const top10 = await prisma.$queryRaw<{
    firma: string; total: bigint; aktiv: bigint; pct_total: number
  }[]>(Prisma.sql`
    WITH totals AS (SELECT COUNT(*) AS t FROM shortages)
    SELECT
      firma,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE "isActive" = true) AS aktiv,
      ROUND(COUNT(*) * 100.0 / (SELECT t FROM totals), 1) AS pct_total
    FROM shortages
    GROUP BY firma
    ORDER BY total DESC
    LIMIT 10
  `)

  const top10Total = top10.reduce((s, r) => s + Number(r.total), 0)
  const allTotal = Number(base[0].total)
  const top10Pct = ((Number(top10Total) / allTotal) * 100).toFixed(1)

  console.log('  Rang | Firma | Gesamt | Aktiv | % aller Fälle')
  top10.forEach((f, i) => {
    console.log(`  ${i + 1}. ${f.firma}: ${f.total} Fälle (${f.pct_total}%) | ${f.aktiv} aktiv`)
  })
  console.log(`\n  Top-10 zusammen: ${top10Total} Fälle = ${top10Pct}% aller ${allTotal} Meldungen`)

  // 3. Top 10 Firmen aktuell aktiv
  console.log('\n--- TOP 10 FIRMEN (aktuell aktiv) ---')
  const top10aktiv = await prisma.$queryRaw<{ firma: string; aktiv: bigint }[]>(Prisma.sql`
    SELECT firma, COUNT(*) AS aktiv
    FROM shortages
    WHERE "isActive" = true
    GROUP BY firma
    ORDER BY aktiv DESC
    LIMIT 10
  `)
  top10aktiv.forEach((f, i) => {
    console.log(`  ${i + 1}. ${f.firma}: ${f.aktiv} aktive Engpässe`)
  })

  // 4. Konzentration: Top 3, 5, 10 Firmen (Lorenz-Analyse)
  console.log('\n--- KONZENTRATIONSMASS ---')
  const conc = await prisma.$queryRaw<{ rank_group: string; share_pct: number; cumulative_pct: number }[]>(Prisma.sql`
    WITH ranked AS (
      SELECT firma, COUNT(*) AS cnt,
        ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS rnk
      FROM shortages
      GROUP BY firma
    ),
    totals AS (SELECT COUNT(*) AS t FROM shortages),
    groups AS (
      SELECT
        CASE WHEN rnk <= 3 THEN 'Top 3' WHEN rnk <= 5 THEN 'Top 5' WHEN rnk <= 10 THEN 'Top 10' END AS rank_group,
        SUM(cnt) AS group_total
      FROM ranked
      WHERE rnk <= 10
      GROUP BY 1
    )
    SELECT
      rank_group,
      ROUND(group_total * 100.0 / (SELECT t FROM totals), 1) AS share_pct,
      ROUND(SUM(group_total) OVER (ORDER BY rank_group) * 100.0 / (SELECT t FROM totals), 1) AS cumulative_pct
    FROM groups
    WHERE rank_group IS NOT NULL
    ORDER BY share_pct DESC
  `)
  for (const c of conc) {
    console.log(`  ${c.rank_group}: ${c.share_pct}% der Meldungen`)
  }

  // 5. Rezidiv-Analyse pro Firma (wiederholt betroffene Firmen)
  const episodesExist = await prisma.$queryRaw<{ exists: boolean }[]>(Prisma.sql`
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shortage_episodes') AS exists
  `)
  if (episodesExist[0].exists) {
    console.log('\n--- FIRMEN MIT DEN MEISTEN LANGZEITENGPÄSSEN (>1 Jahr aktiv) ---')
    const longterm = await prisma.$queryRaw<{ firma: string; langzeit: bigint }[]>(Prisma.sql`
      SELECT firma, COUNT(*) AS langzeit
      FROM shortages
      WHERE "isActive" = true AND "tageSeitMeldung" >= 365
      GROUP BY firma
      ORDER BY langzeit DESC
      LIMIT 10
    `)
    for (const l of longterm) {
      console.log(`  ${l.firma}: ${l.langzeit} Langzeitengpässe (>1 Jahr)`)
    }
  }

  // 6. ATC-Diversität pro Top-Firma
  console.log('\n--- ATC-DIVERSITÄT TOP 5 FIRMEN ---')
  for (const f of top10.slice(0, 5)) {
    const atcDiv = await prisma.$queryRaw<{ atc1: string; count: bigint }[]>(Prisma.sql`
      SELECT LEFT("atcCode", 1) AS atc1, COUNT(*) AS count
      FROM shortages
      WHERE firma = ${f.firma}
      GROUP BY 1
      ORDER BY count DESC
      LIMIT 5
    `)
    const atcStr = atcDiv.map(a => `${a.atc1}:${a.count}`).join(', ')
    console.log(`  ${f.firma}: ${atcStr}`)
  }

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
