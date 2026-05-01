/**
 * Blog-Datenanalyse: Insulin & Antidiabetika
 * Für: insulin-antidiabetika-lieferengpass-schweiz.mdx (Post #8)
 *
 * Run: npx tsx src/scripts/blog-insulin-analyse.ts
 */
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// ATC-Codes der Antidiabetika: A10 = Antidiabetika
// A10A = Insuline, A10B = orale Antidiabetika (inkl. GLP-1, SGLT-2, DPP-4, Metformin)

async function main() {
  const datenstand = new Date().toISOString().split('T')[0]
  console.log(`\n=== ENGPASSRADAR.CH — Insulin & Antidiabetika (Post #8) | Datenstand: ${datenstand} ===\n`)

  // 1. A10 Gesamt
  const base = await prisma.$queryRaw<{ total: bigint; aktiv: bigint }[]>(Prisma.sql`
    SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE "isActive" = true) AS aktiv
    FROM shortages
    WHERE "atcCode" LIKE 'A10%'
  `)
  console.log('--- A10 GESAMT ---')
  console.log(`  Historische Meldungen: ${base[0].total}`)
  console.log(`  Aktuell aktiv:         ${base[0].aktiv}`)

  // 2. Untergruppen
  console.log('\n--- UNTERGRUPPEN ---')
  const sub = await prisma.$queryRaw<{ sub: string; label: string; total: bigint; aktiv: bigint }[]>(Prisma.sql`
    SELECT
      LEFT("atcCode", 4) AS sub,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE "isActive" = true) AS aktiv
    FROM shortages
    WHERE "atcCode" LIKE 'A10%'
    GROUP BY 1
    ORDER BY total DESC
  `)
  const subLabels: Record<string, string> = {
    A10A: 'Insuline (Kurzwirksam & Langwirksam)',
    A10B: 'Orale/Injektable Antidiabetika (inkl. GLP-1)',
    A10X: 'Andere Antidiabetika',
  }
  for (const s of sub) {
    const lbl = subLabels[s.sub] ?? s.sub
    console.log(`  ${s.sub} (${lbl}): ${s.total} Fälle | ${s.aktiv} aktiv`)
  }

  // 3. Spezifische Wirkstoffe (ATC-5-stellig für Schlüsselsubstanzen)
  console.log('\n--- SCHLÜSSELSUBSTANZEN (aktuell aktiv) ---')
  const keyAtcs = [
    { code: 'A10BJ06', name: 'Semaglutid (Ozempic/Wegovy)' },
    { code: 'A10BJ02', name: 'Liraglutid (Victoza/Saxenda)' },
    { code: 'A10BJ05', name: 'Dulaglutid (Trulicity)' },
    { code: 'A10AE04', name: 'Insulin glargin (Lantus/Toujeo)' },
    { code: 'A10AE05', name: 'Insulin detemir (Levemir)' },
    { code: 'A10AE06', name: 'Insulin degludec (Tresiba)' },
    { code: 'A10BA02', name: 'Metformin' },
    { code: 'A10BH01', name: 'Sitagliptin (Januvia)' },
    { code: 'A10BK01', name: 'Dapagliflozin (Forxiga)' },
    { code: 'A10BK02', name: 'Canagliflozin (Invokana)' },
    { code: 'A10BK03', name: 'Empagliflozin (Jardiance)' },
  ]

  for (const k of keyAtcs) {
    const res = await prisma.$queryRaw<{
      count: bigint; aktiv: bigint; tage_median: number | null; erste_meldung: Date | null
    }[]>(Prisma.sql`
      SELECT
        COUNT(*) AS count,
        COUNT(*) FILTER (WHERE "isActive" = true) AS aktiv,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "tageSeitMeldung") FILTER (WHERE "isActive" = true) AS tage_median,
        MIN("firstSeenAt") AS erste_meldung
      FROM shortages
      WHERE "atcCode" = ${k.code}
    `)
    const r = res[0]
    if (Number(r.count) > 0) {
      const medStr = r.tage_median != null ? `${Math.round(r.tage_median)} Tage` : '—'
      const ersteStr = r.erste_meldung ? r.erste_meldung.toISOString().split('T')[0] : '—'
      console.log(`  ${k.code} ${k.name}: ${r.count} Fälle | ${r.aktiv} aktiv | Median: ${medStr} | Älteste Meldung: ${ersteStr}`)
    }
  }

  // 4. Konkrete aktive A10-Präparate (für Tabelle im Artikel)
  console.log('\n--- AKTIVE PRÄPARATE (Tabelle für Artikel) ---')
  const aktiv = await prisma.$queryRaw<{
    bezeichnung: string; firma: string; atcCode: string; tageSeitMeldung: number; firstSeenAt: Date
  }[]>(Prisma.sql`
    SELECT bezeichnung, firma, "atcCode", "tageSeitMeldung", "firstSeenAt"
    FROM shortages
    WHERE "isActive" = true AND "atcCode" LIKE 'A10%'
    ORDER BY "tageSeitMeldung" DESC
    LIMIT 15
  `)
  console.log('  Nr | Bezeichnung | Firma | ATC | Tage aktiv | Seit')
  aktiv.forEach((p, i) => {
    const seit = p.firstSeenAt.toISOString().split('T')[0]
    console.log(`  ${i + 1}. ${p.bezeichnung} | ${p.firma} | ${p.atcCode} | ${p.tageSeitMeldung} | ${seit}`)
  })

  // 5. Jahrestrend A10
  console.log('\n--- JAHRESTREND (neue A10-Meldungen pro Jahr) ---')
  const trend = await prisma.$queryRaw<{ jahr: number; neu: bigint }[]>(Prisma.sql`
    SELECT EXTRACT(YEAR FROM "firstSeenAt")::int AS jahr, COUNT(*) AS neu
    FROM shortages
    WHERE "atcCode" LIKE 'A10%' AND "firstSeenAt" >= '2015-01-01'
    GROUP BY 1 ORDER BY 1
  `)
  for (const t of trend) {
    console.log(`  ${t.jahr}: ${t.neu} neue Meldungen`)
  }

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
