import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

async function main() {
  // 1. How many shortages have a valid ersteMeldung vs not
  const coverage = await prisma.$queryRaw<{ valid: bigint; invalid: bigint; total: bigint }[]>(Prisma.sql`
    SELECT
      COUNT(*) FILTER (WHERE "ersteMeldung" ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$') AS valid,
      COUNT(*) FILTER (WHERE "ersteMeldung" !~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$' OR "ersteMeldung" IS NULL) AS invalid,
      COUNT(*) AS total
    FROM shortages
  `)
  console.log('Coverage:', coverage[0])

  // 2. Top 20 weeks by count
  const topWeeks = await prisma.$queryRaw<{ week: string; cnt: bigint }[]>(Prisma.sql`
    SELECT
      TO_CHAR(DATE_TRUNC('week', TO_DATE("ersteMeldung", 'DD.MM.YYYY')), 'IYYY-"KW"IW') AS week,
      COUNT(*) AS cnt
    FROM shortages
    WHERE "ersteMeldung" ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$'
    GROUP BY 1
    ORDER BY cnt DESC
    LIMIT 20
  `)
  console.log('\nTop 20 weeks by shortages reported:')
  topWeeks.forEach(r => console.log(`  ${r.week}: ${r.cnt}`))

  // 3. Sample of rows for the busiest week
  if (topWeeks.length > 0) {
    const busyWeek = topWeeks[0].week
    const sample = await prisma.$queryRaw<{ gtin: string; bezeichnung: string; firma: string; ersteMeldung: string }[]>(Prisma.sql`
      SELECT gtin, bezeichnung, firma, "ersteMeldung"
      FROM shortages
      WHERE "ersteMeldung" ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$'
        AND TO_CHAR(DATE_TRUNC('week', TO_DATE("ersteMeldung", 'DD.MM.YYYY')), 'IYYY-"KW"IW') = ${busyWeek}
      LIMIT 10
    `)
    console.log(`\nSample rows from busiest week (${busyWeek}):`)
    sample.forEach(r => console.log(`  ${r.ersteMeldung}  ${r.firma.padEnd(30)}  ${r.bezeichnung.substring(0, 50)}`))
  }

  // 4. Distribution of ersteMeldung values that look like an import artifact
  const dateDist = await prisma.$queryRaw<{ ersteMeldung: string; cnt: bigint }[]>(Prisma.sql`
    SELECT "ersteMeldung", COUNT(*) AS cnt
    FROM shortages
    WHERE "ersteMeldung" ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$'
    GROUP BY 1
    ORDER BY cnt DESC
    LIMIT 10
  `)
  console.log('\nTop 10 most common single ersteMeldung dates:')
  dateDist.forEach(r => console.log(`  ${r.ersteMeldung}: ${r.cnt} shortages`))
}

main().catch(console.error).finally(() => prisma.$disconnect())
