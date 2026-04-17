import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

async function main() {
  // March 2026 shortages broken down
  const march = await prisma.$queryRaw<{ isactive: boolean; cnt: bigint; firstseenmin: string; firstseenmax: string }[]>(Prisma.sql`
    SELECT
      "isActive" AS isactive,
      COUNT(*) AS cnt,
      MIN("firstSeenAt"::text) AS firstseenmin,
      MAX("firstSeenAt"::text) AS firstseenmax
    FROM shortages
    WHERE "ersteMeldung" ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$'
      AND TO_DATE("ersteMeldung", 'DD.MM.YYYY') >= '2026-03-01'
      AND TO_DATE("ersteMeldung", 'DD.MM.YYYY') < '2026-04-01'
    GROUP BY "isActive"
  `)
  console.log('March 2026 shortages by isActive:')
  march.forEach(r => console.log(`  isActive=${r.isactive}: ${r.cnt} rows | firstSeenAt: ${r.firstseenmin} → ${r.firstseenmax}`))

  // Are the March 2026 entries genuinely new or re-dated?
  // Check: do they appear in the historical dataset (isActive=false) with old dates?
  const sample = await prisma.$queryRaw<{ gtin: string; bezeichnung: string; firma: string; ersteMeldung: string; firstSeenAt: string; isActive: boolean; tageSeitMeldung: number }[]>(Prisma.sql`
    SELECT gtin, bezeichnung, firma, "ersteMeldung", "firstSeenAt", "isActive", "tageSeitMeldung"
    FROM shortages
    WHERE "ersteMeldung" ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$'
      AND TO_DATE("ersteMeldung", 'DD.MM.YYYY') >= '2026-03-01'
      AND TO_DATE("ersteMeldung", 'DD.MM.YYYY') < '2026-04-01'
    ORDER BY "ersteMeldung"
    LIMIT 20
  `)
  console.log('\nSample March 2026 rows:')
  sample.forEach(r =>
    console.log(`  ${r.ersteMeldung}  active=${r.isActive}  tage=${r.tageSeitMeldung}  firstSeen=${r.firstSeenAt.substring(0,10)}  ${r.firma.substring(0,20).padEnd(20)}  ${r.bezeichnung.substring(0,45)}`)
  )

  // Check: tageSeitMeldung vs actual date diff — if mismatch, dates were re-stamped
  const mismatch = await prisma.$queryRaw<{ cnt: bigint }[]>(Prisma.sql`
    SELECT COUNT(*) AS cnt
    FROM shortages
    WHERE "ersteMeldung" ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$'
      AND "isActive" = true
      AND ABS(
        EXTRACT(EPOCH FROM (NOW() - TO_DATE("ersteMeldung", 'DD.MM.YYYY')::timestamp)) / 86400
        - "tageSeitMeldung"
      ) > 30
  `)
  console.log(`\nActive shortages where tageSeitMeldung deviates >30 days from ersteMeldung: ${mismatch[0].cnt}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
