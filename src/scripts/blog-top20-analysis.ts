/**
 * Blog-Datenanalyse: Top 20 häufigste Medikamente im Engpass
 * Für: haeufigste-lieferengpaesse-medikamente-schweiz.mdx
 *
 * Run: npx tsx src/scripts/blog-top20-analysis.ts
 */
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

async function main() {
  console.log('\n=== ENGPASSRADAR.CH — Blog-Datenanalyse Top 20 ===\n')

  // 0. Gesamtanzahl Episoden und Datenstand
  const meta = await prisma.$queryRaw<{ total: bigint; oldest: string; newest: string }[]>(Prisma.sql`
    SELECT
      COUNT(*) AS total,
      MIN("ersteMeldung") AS oldest,
      MAX("ersteMeldung") AS newest
    FROM shortages
    WHERE "ersteMeldung" ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$'
  `)
  console.log('Gesamtübersicht:')
  console.log(`  Erfasste Fälle: ${meta[0].total}`)
  console.log(`  Ältester Eintrag: ${meta[0].oldest}`)
  console.log(`  Neuester Eintrag: ${meta[0].newest}`)

  // 0b. Episoden-Tabelle falls vorhanden
  const episodeCount = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    SELECT COUNT(*) AS count FROM shortage_episodes
  `).catch(() => null)
  if (episodeCount) {
    console.log(`  Episoden (shortage_episodes): ${episodeCount[0].count}`)
  }

  // 1. Top 20 Präparate nach Anzahl Engpass-Einträge (Historisch)
  console.log('\n--- TOP 20 HÄUFIGSTE PRÄPARATE (nach Anzahl Einträge) ---\n')
  const top20 = await prisma.$queryRaw<{
    bezeichnung: string;
    firma: string;
    atc: string | null;
    anzahl_eintraege: bigint;
    aktiv_aktuell: bigint;
    erste_meldung: string;
    letzte_meldung: string;
  }[]>(Prisma.sql`
    SELECT
      s.bezeichnung,
      s.firma,
      s."atcCode" AS atc,
      COUNT(*) AS anzahl_eintraege,
      COUNT(*) FILTER (WHERE s."isActive" = true) AS aktiv_aktuell,
      MIN(s."ersteMeldung") AS erste_meldung,
      MAX(s."ersteMeldung") AS letzte_meldung
    FROM shortages s
    GROUP BY s.bezeichnung, s.firma, s."atcCode"
    ORDER BY anzahl_eintraege DESC
    LIMIT 20
  `)

  console.log('Rang | Bezeichnung | Firma | ATC | Einträge | Aktuell aktiv | Erste Meldung | Letzte Meldung')
  console.log('-----|-------------|-------|-----|----------|---------------|---------------|---------------')
  top20.forEach((r, i) => {
    console.log(`${i + 1}. | ${r.bezeichnung} | ${r.firma} | ${r.atc ?? '-'} | ${r.anzahl_eintraege} | ${r.aktiv_aktuell > 0 ? 'JA' : 'nein'} | ${r.erste_meldung} | ${r.letzte_meldung}`)
  })

  // 2. Top-20 via Episoden-Tabelle (wenn vorhanden — genauere Methode)
  const episodesExist = await prisma.$queryRaw<{ exists: boolean }[]>(Prisma.sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = 'shortage_episodes'
    ) AS exists
  `)

  if (episodesExist[0].exists) {
    console.log('\n--- TOP 20 VIA EPISODEN-TABELLE (genauere Methode) ---\n')
    const top20episodes = await prisma.$queryRaw<{
      bezeichnung: string;
      firma: string;
      atc: string | null;
      episoden_anzahl: bigint;
      kumulierte_dauer_tage: number | null;
      laengste_episode_tage: number | null;
      aktuell_offen: bigint;
    }[]>(Prisma.sql`
      SELECT
        s.bezeichnung,
        s.firma,
        s."atcCode" AS atc,
        COUNT(DISTINCT e.id) AS episoden_anzahl,
        COALESCE(
          SUM(e."durationDays") FILTER (WHERE e."durationDays" IS NOT NULL),
          ROUND(SUM(
            CASE
              WHEN e."endedAt" IS NOT NULL
              THEN EXTRACT(EPOCH FROM (e."endedAt" - e."startedAt")) / 86400
              ELSE EXTRACT(EPOCH FROM (NOW() - e."startedAt")) / 86400
            END
          )::numeric, 0)
        ) AS kumulierte_dauer_tage,
        ROUND(MAX(
          CASE
            WHEN e."durationDays" IS NOT NULL THEN e."durationDays"
            WHEN e."endedAt" IS NOT NULL
            THEN EXTRACT(EPOCH FROM (e."endedAt" - e."startedAt")) / 86400
            ELSE EXTRACT(EPOCH FROM (NOW() - e."startedAt")) / 86400
          END
        )::numeric, 0) AS laengste_episode_tage,
        COUNT(DISTINCT e.id) FILTER (WHERE e."endedAt" IS NULL) AS aktuell_offen
      FROM shortage_episodes e
      JOIN shortages s ON s.gtin = e.gtin
      GROUP BY s.bezeichnung, s.firma, s."atcCode"
      ORDER BY episoden_anzahl DESC, kumulierte_dauer_tage DESC
      LIMIT 20
    `)

    console.log('Rang | Bezeichnung | Firma | ATC | Episoden | Kum. Dauer (Tage) | Längste Episode | Aktuell offen')
    console.log('-----|-------------|-------|-----|----------|------------------|-----------------|---------------')
    top20episodes.forEach((r, i) => {
      console.log(`${i + 1}. | ${r.bezeichnung} | ${r.firma} | ${r.atc ?? '-'} | ${r.episoden_anzahl} | ${r.kumulierte_dauer_tage ?? '-'} | ${r.laengste_episode_tage ?? '-'} | ${r.aktuell_offen > 0 ? 'JA' : 'nein'}`)
    })
  }

  // 3. ATC-Gruppen-Verteilung der Top-20
  console.log('\n--- ATC-GRUPPEN-VERTEILUNG (Top 20) ---\n')
  const atcDistrib = await prisma.$queryRaw<{
    atc_gruppe: string;
    anzahl_praeparate: bigint;
    anteil_prozent: number;
  }[]>(Prisma.sql`
    WITH top20 AS (
      SELECT "atcCode", COUNT(*) AS cnt
      FROM shortages
      GROUP BY bezeichnung, firma, "atcCode"
      ORDER BY cnt DESC
      LIMIT 20
    )
    SELECT
      COALESCE(LEFT("atcCode", 1), 'unbekannt') AS atc_gruppe,
      COUNT(*) AS anzahl_praeparate,
      ROUND(COUNT(*) * 100.0 / 20, 1) AS anteil_prozent
    FROM top20
    GROUP BY 1
    ORDER BY anzahl_praeparate DESC
  `)
  atcDistrib.forEach(r => {
    console.log(`  ATC ${r.atc_gruppe}: ${r.anzahl_praeparate} Präparate (${r.anteil_prozent}%)`)
  })

  // 4. Gesamtstatistik für Artikel
  console.log('\n--- GESAMTSTATISTIK FÜR ARTIKEL ---\n')
  const stats = await prisma.$queryRaw<{
    total_shortages: bigint;
    active_shortages: bigint;
    unique_products: bigint;
    multi_episode_products: bigint;
  }[]>(Prisma.sql`
    SELECT
      COUNT(*) AS total_shortages,
      COUNT(*) FILTER (WHERE "isActive" = true) AS active_shortages,
      COUNT(DISTINCT bezeichnung || '|' || firma) AS unique_products,
      COUNT(DISTINCT bezeichnung || '|' || firma) FILTER (
        WHERE (SELECT COUNT(*) FROM shortages s2
               WHERE s2.bezeichnung = shortages.bezeichnung
               AND s2.firma = shortages.firma) > 1
      ) AS multi_episode_products
    FROM shortages
  `)
  const s = stats[0]
  console.log(`  Total Einträge: ${s.total_shortages}`)
  console.log(`  Aktuell aktiv: ${s.active_shortages}`)
  console.log(`  Eindeutige Präparate: ${s.unique_products}`)
  console.log(`  Präparate mit >1 Eintrag: ${s.multi_episode_products}`)
  console.log(`  Rezidivquote: ${Math.round(Number(s.multi_episode_products) / Number(s.unique_products) * 100)}%`)

  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
