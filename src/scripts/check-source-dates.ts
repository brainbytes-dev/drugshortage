import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

async function main() {
  // Check: are the big-cluster dates spread across different firms/products, or are they artifacts?
  const clusters = await prisma.$queryRaw<{ date: string; cnt: bigint; firms: bigint; atcs: bigint }[]>(Prisma.sql`
    SELECT
      "ersteMeldung" AS date,
      COUNT(*) AS cnt,
      COUNT(DISTINCT firma) AS firms,
      COUNT(DISTINCT "atcCode") AS atcs
    FROM shortages
    WHERE "ersteMeldung" ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$'
      AND TO_DATE("ersteMeldung", 'DD.MM.YYYY') >= '2026-01-01'
    GROUP BY 1
    ORDER BY cnt DESC
    LIMIT 15
  `)
  console.log('Top cluster dates in 2026 (date, count, distinct firms, distinct ATC codes):')
  clusters.forEach(r =>
    console.log(`  ${r.date}  ${String(r.cnt).padStart(3)} Meldungen  ${String(r.firms).padStart(3)} Firmen  ${String(r.atcs).padStart(3)} ATC-Codes`)
  )

  // How does this compare to a known "real" historical week?
  const hist = await prisma.$queryRaw<{ date: string; cnt: bigint; firms: bigint }[]>(Prisma.sql`
    SELECT
      "ersteMeldung" AS date,
      COUNT(*) AS cnt,
      COUNT(DISTINCT firma) AS firms
    FROM shortages
    WHERE "ersteMeldung" ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$'
      AND TO_DATE("ersteMeldung", 'DD.MM.YYYY') >= '2022-12-15'
      AND TO_DATE("ersteMeldung", 'DD.MM.YYYY') <= '2023-01-07'
    GROUP BY 1
    ORDER BY cnt DESC
    LIMIT 10
  `)
  console.log('\nDec 2022 / Jan 2023 cluster dates for comparison:')
  hist.forEach(r =>
    console.log(`  ${r.date}  ${String(r.cnt).padStart(3)} Meldungen  ${String(r.firms).padStart(3)} Firmen`)
  )
}

main().catch(console.error).finally(() => prisma.$disconnect())
