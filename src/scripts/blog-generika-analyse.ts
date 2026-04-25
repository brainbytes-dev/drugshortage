/**
 * Blog-Datenanalyse: Generika vs. Originale + Niedrigpreis-Korrelation
 * Für: generika-niedrigpreis-lieferengpass-analyse.mdx (Post #13)
 *
 * Run: npx tsx src/scripts/blog-generika-analyse.ts
 */
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

async function main() {
  const datenstand = new Date().toISOString().split('T')[0]
  console.log(`\n=== ENGPASSRADAR.CH — Generika & Niedrigpreis (Post #13) | Datenstand: ${datenstand} ===\n`)

  // 1. Top 20 Wirkstoffe (nach atcCode, Meldehäufigkeit) — mit PEXF aus ODDB
  console.log('--- TOP 20 WIRKSTOFFE NACH MELDEHÄUFIGKEIT (mit PEXF) ---')
  const top20 = await prisma.$queryRaw<{
    atcCode: string; anzahl: bigint; aktiv: bigint; pexf_median: number | null; pexf_min: number | null
  }[]>(Prisma.sql`
    SELECT
      s."atcCode",
      COUNT(*) AS anzahl,
      COUNT(*) FILTER (WHERE s."isActive" = true) AS aktiv,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.pexf) AS pexf_median,
      MIN(o.pexf) AS pexf_min
    FROM shortages s
    LEFT JOIN oddb_products o ON o.gtin = s.gtin AND o.pexf IS NOT NULL AND o.pexf > 0
    WHERE s."atcCode" IS NOT NULL AND s."atcCode" != ''
    GROUP BY s."atcCode"
    ORDER BY anzahl DESC
    LIMIT 20
  `)
  console.log('  Rang | ATC | Anzahl Meldungen | Aktiv | PEXF Median (CHF) | PEXF Min (CHF)')
  top20.forEach((r, i) => {
    const pexf = r.pexf_median != null ? `CHF ${r.pexf_median.toFixed(2)}` : 'k.A.'
    const pexfMin = r.pexf_min != null ? `CHF ${r.pexf_min.toFixed(2)}` : 'k.A.'
    console.log(`  ${i + 1}. ${r.atcCode}: ${r.anzahl} (${r.aktiv} aktiv) | Median: ${pexf} | Min: ${pexfMin}`)
  })

  // 2. PEXF-Preisklassen und Engpass-Häufigkeit
  console.log('\n--- PEXF-PREISKLASSEN vs. ENGPASS-HÄUFIGKEIT (alle Meldungen mit ODDB-Match) ---')
  const pexfAnalysis = await prisma.$queryRaw<{
    preisklasse: string; anzahl_faelle: bigint; anzahl_atc_codes: bigint
  }[]>(Prisma.sql`
    SELECT
      CASE
        WHEN o.pexf IS NULL      THEN '0. kein ODDB-Match'
        WHEN o.pexf < 5          THEN '1. < CHF 5'
        WHEN o.pexf < 20         THEN '2. CHF 5–20'
        WHEN o.pexf < 50         THEN '3. CHF 20–50'
        WHEN o.pexf < 100        THEN '4. CHF 50–100'
        WHEN o.pexf < 500        THEN '5. CHF 100–500'
        ELSE                          '6. > CHF 500'
      END AS preisklasse,
      COUNT(*) AS anzahl_faelle,
      COUNT(DISTINCT s."atcCode") AS anzahl_atc_codes
    FROM shortages s
    LEFT JOIN oddb_products o ON o.gtin = s.gtin
    GROUP BY 1
    ORDER BY 1
  `)
  const pfTotal = pexfAnalysis.reduce((sum, r) => sum + Number(r.anzahl_faelle), 0)
  console.log('  Preisklasse | Fälle | % | eindeutige ATC-Codes')
  for (const p of pexfAnalysis) {
    const pct = ((Number(p.anzahl_faelle) / pfTotal) * 100).toFixed(1)
    console.log(`  ${p.preisklasse}: ${p.anzahl_faelle} Fälle (${pct}%) | ${p.anzahl_atc_codes} ATC-Codes`)
  }

  // 3. Median-PEXF der häufigsten Engpass-ATC-Codes vs. Gesamtmarkt-Median
  console.log('\n--- VERGLEICH: Häufige Engpass-ATC vs. Gesamtmarkt PEXF ---')
  const comparison = await prisma.$queryRaw<{
    gruppe: string; pexf_median: number | null; pexf_avg: number | null; count: bigint
  }[]>(Prisma.sql`
    WITH frequent_atc AS (
      SELECT "atcCode" FROM shortages
      GROUP BY "atcCode" HAVING COUNT(*) >= 10
    )
    SELECT
      'Häufige Engpass-ATC (≥10 Meldungen)' AS gruppe,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.pexf) AS pexf_median,
      AVG(o.pexf) AS pexf_avg,
      COUNT(*) AS count
    FROM oddb_products o
    WHERE o."atcCode" IN (SELECT "atcCode" FROM frequent_atc) AND o.pexf > 0
    UNION ALL
    SELECT
      'Gesamtmarkt ODDB' AS gruppe,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY pexf) AS pexf_median,
      AVG(pexf) AS pexf_avg,
      COUNT(*) AS count
    FROM oddb_products
    WHERE pexf > 0
  `)
  for (const c of comparison) {
    const med = c.pexf_median != null ? `CHF ${c.pexf_median.toFixed(2)}` : 'k.A.'
    const avg = c.pexf_avg != null ? `CHF ${c.pexf_avg.toFixed(2)}` : 'k.A.'
    console.log(`  ${c.gruppe}: Median ${med} | Mittelwert ${avg} | n=${c.count}`)
  }

  // 4. Top 10 Wirkstoffe nach Bezeichnung (für direkten Artikel-Text)
  console.log('\n--- TOP 10 WIRKSTOFFE (nach Bezeichnungsstichwort) ---')
  const top10Name = await prisma.$queryRaw<{
    atcCode: string; bezeichnung_sample: string; anzahl: bigint; pexf_median: number | null
  }[]>(Prisma.sql`
    SELECT
      s."atcCode",
      MIN(s.bezeichnung) AS bezeichnung_sample,
      COUNT(*) AS anzahl,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.pexf) AS pexf_median
    FROM shortages s
    LEFT JOIN oddb_products o ON o.gtin = s.gtin AND o.pexf > 0
    WHERE s."atcCode" IS NOT NULL
    GROUP BY s."atcCode"
    ORDER BY anzahl DESC
    LIMIT 10
  `)
  console.log('  Rang | ATC | Beispiel-Bezeichnung | Meldungen | PEXF Median')
  top10Name.forEach((r, i) => {
    const pexf = r.pexf_median != null ? `CHF ${r.pexf_median.toFixed(2)}` : 'k.A.'
    console.log(`  ${i + 1}. ${r.atcCode} | ${r.bezeichnung_sample} | ${r.anzahl} | ${pexf}`)
  })

  // 5. Tatsächliche Generika/Original-Klassifikation via gengrp
  console.log('\n--- GENGRP-ANALYSE (Generika-Gruppen) ---')
  const gengrpStats = await prisma.$queryRaw<{ total: bigint; mit_gengrp: bigint; unique_gengrp: bigint }[]>(Prisma.sql`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE "gengrp" IS NOT NULL AND "gengrp" != '') AS mit_gengrp,
      COUNT(DISTINCT "gengrp") FILTER (WHERE "gengrp" IS NOT NULL AND "gengrp" != '') AS unique_gengrp
    FROM shortages
    WHERE "isActive" = true
  `)
  const g = gengrpStats[0]
  console.log(`  Aktive Engpässe total: ${g.total}`)
  console.log(`  Mit gengrp-Eintrag:   ${g.mit_gengrp}`)
  console.log(`  Eindeutige gengrp:    ${g.unique_gengrp}`)
  // gengrps mit >1 Mitglied = Generika-Markt
  const multiGengrp = await prisma.$queryRaw<{ count_multi: bigint }[]>(Prisma.sql`
    WITH grp AS (
      SELECT "gengrp", COUNT(*) AS members
      FROM shortages
      WHERE "isActive" = true AND "gengrp" != '' AND "gengrp" IS NOT NULL
      GROUP BY "gengrp"
    )
    SELECT COUNT(*) AS count_multi FROM grp WHERE members > 1
  `)
  console.log(`  Gengrp-Gruppen mit >1 Präparat (Generika-Markt): ${multiGengrp[0].count_multi}`)

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
