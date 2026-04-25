/**
 * Blog-Datenanalyse: ATC-Gruppenanalyse (generisch)
 * Für: antibiotika-lieferengpass-schweiz.mdx (Post #3) — ATC J01/J02
 *      onkologika-zytostatika-lieferengpass-schweiz.mdx (Post #10) — ATC L01/L02/L03
 *
 * Run: npx tsx src/scripts/blog-atc-analyse.ts J01        (Antibiotika)
 *      npx tsx src/scripts/blog-atc-analyse.ts J01 J02    (Antibiotika + Antimykotika)
 *      npx tsx src/scripts/blog-atc-analyse.ts L01 L02 L03 (Onkologie)
 *
 * Ohne Argument: zeigt Ranking aller ATC-Hauptgruppen (A–Z)
 */
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

async function main() {
  const atcArgs = process.argv.slice(2).map(a => a.toUpperCase())
  const datenstand = new Date().toISOString().split('T')[0]
  console.log(`\n=== ENGPASSRADAR.CH — ATC-Analyse | Datenstand: ${datenstand} ===\n`)

  // 0. Ranking aller ATC-Hauptgruppen (immer ausgeben)
  console.log('--- RANKING ALLE ATC-HAUPTGRUPPEN (historisch + aktiv) ---')
  const ranking = await prisma.$queryRaw<{
    gruppe: string; label: string; total: bigint; aktiv: bigint
  }[]>(Prisma.sql`
    SELECT
      LEFT("atcCode", 1) AS gruppe,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE "isActive" = true) AS aktiv
    FROM shortages
    WHERE "atcCode" IS NOT NULL AND "atcCode" != ''
    GROUP BY 1
    ORDER BY total DESC
  `)

  const labels: Record<string, string> = {
    A: 'Verdauung & Stoffwechsel', B: 'Blut & blutbildende Organe',
    C: 'Kardiovaskulär', D: 'Dermatologika', G: 'Urogenital & Sexualhormone',
    H: 'Hormone (systemisch)', J: 'Antiinfektiva', L: 'Antineoplastika & Immunmodulatoren',
    M: 'Muskel & Skelett', N: 'Nervensystem', P: 'Antiparasitika',
    R: 'Respirationstrakt', S: 'Sinnesorgane', V: 'Verschiedenes',
  }

  let rank = 1
  for (const r of ranking) {
    const name = labels[r.gruppe] ?? r.gruppe
    console.log(`  ${rank++}. ${r.gruppe} — ${name}: ${r.total} Fälle total | ${r.aktiv} aktiv`)
  }

  if (atcArgs.length === 0) {
    await prisma.$disconnect()
    return
  }

  // 1. Für jeden angegebenen ATC-Präfix detaillierte Analyse
  for (const atc of atcArgs) {
    console.log(`\n--- ATC ${atc}: DETAILANALYSE ---`)

    const counts = await prisma.$queryRaw<{ total: bigint; aktiv: bigint }[]>(Prisma.sql`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE "isActive" = true) AS aktiv
      FROM shortages
      WHERE "atcCode" LIKE ${atc + '%'}
    `)
    console.log(`  Historisch gesamt: ${counts[0].total}`)
    console.log(`  Aktuell aktiv:     ${counts[0].aktiv}`)

    // Untergruppen (3-stellig)
    const sub = await prisma.$queryRaw<{ sub: string; total: bigint; aktiv: bigint }[]>(Prisma.sql`
      SELECT
        LEFT("atcCode", 3) AS sub,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE "isActive" = true) AS aktiv
      FROM shortages
      WHERE "atcCode" LIKE ${atc + '%'}
      GROUP BY 1
      ORDER BY total DESC
      LIMIT 10
    `)
    console.log(`\n  Top Untergruppen (${atc}xx):`)
    for (const s of sub) {
      console.log(`    ${s.sub}: ${s.total} gesamt | ${s.aktiv} aktiv`)
    }

    // Aktuelle Top-10 Präparate
    const top = await prisma.$queryRaw<{
      bezeichnung: string; firma: string; atcCode: string; tageSeitMeldung: number; firstSeenAt: Date
    }[]>(Prisma.sql`
      SELECT bezeichnung, firma, "atcCode", "tageSeitMeldung", "firstSeenAt"
      FROM shortages
      WHERE "isActive" = true AND "atcCode" LIKE ${atc + '%'}
      ORDER BY "tageSeitMeldung" DESC
      LIMIT 10
    `)
    console.log(`\n  Aktuell aktive Präparate (längste Laufzeit zuerst):`)
    console.log('  Bezeichnung | Firma | ATC | Tage aktiv | Seit')
    for (const p of top) {
      const seit = p.firstSeenAt.toISOString().split('T')[0]
      console.log(`  ${p.bezeichnung} | ${p.firma} | ${p.atcCode} | ${p.tageSeitMeldung} | ${seit}`)
    }

    // Mediandauer aktiv
    const dur = await prisma.$queryRaw<{ p50: number; avg: number }[]>(Prisma.sql`
      SELECT
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY "tageSeitMeldung") AS p50,
        AVG("tageSeitMeldung") AS avg
      FROM shortages
      WHERE "isActive" = true AND "atcCode" LIKE ${atc + '%'}
    `)
    console.log(`\n  Mediandauer aktiv: ${Math.round(dur[0].p50)} Tage | Mittelwert: ${Math.round(dur[0].avg)} Tage`)
  }

  // 2. Jahresvergleich für angegebene ATC-Gruppen (2022–2024 Jahresdurchschnitt aktiv)
  if (atcArgs.length > 0) {
    const whereClause = atcArgs.map(a => `"atcCode" LIKE '${a}%'`).join(' OR ')
    console.log(`\n--- JAHRESVERGLEICH (aktive Engpässe ${atcArgs.join('/')}) ---`)
    // Über OverviewStats haben wir keine ATC-Aufschlüsselung, daher über shortages firstSeenAt
    const yearly = await prisma.$queryRaw<{ jahr: number; neu: bigint }[]>(Prisma.sql`
      SELECT
        EXTRACT(YEAR FROM "firstSeenAt")::int AS jahr,
        COUNT(*) AS neu
      FROM shortages
      WHERE (${Prisma.raw(whereClause)})
        AND "firstSeenAt" >= '2015-01-01'
      GROUP BY 1
      ORDER BY 1
    `)
    for (const y of yearly) {
      console.log(`  ${y.jahr}: ${y.neu} neue Meldungen`)
    }
  }

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
