import { prisma } from './prisma-optimized'
import type { KPIStats } from './types'

/**
 * Optimized KPI calculation using SQL aggregations instead of loading all records
 */
export async function getKPIStatsOptimized(): Promise<KPIStats> {
  // ✅ Use parallel queries with SQL aggregations
  const [
    totalActive,
    topFirmaData,
    uniqueAtcGroups,
    avgDaysData,
    lastRun,
  ] = await Promise.all([
    // Total active count
    prisma.shortage.count({ where: { isActive: true } }),

    // Top firma via groupBy
    prisma.shortage.groupBy({
      by: ['firma'],
      where: { isActive: true },
      _count: { firma: true },
      orderBy: { _count: { firma: 'desc' } },
      take: 1,
    }),

    // Unique ATC groups count
    prisma.shortage.findMany({
      where: { isActive: true },
      select: { atcCode: true },
      distinct: ['atcCode'],
    }).then(rows => rows.length),

    // Average days via findMany + JS avg (avoids raw SQL)
    prisma.shortage.findMany({
      where: { isActive: true },
      select: { tageSeitMeldung: true },
    }).then(rows =>
      rows.length > 0
        ? [{ avg: rows.reduce((s, r) => s + (r.tageSeitMeldung ?? 0), 0) / rows.length }]
        : [{ avg: 0 }]
    ),

    // Last scrape run
    prisma.scrapeRun.findFirst({
      where: { status: 'success' },
      orderBy: { scrapedAt: 'desc' },
      select: { scrapedAt: true },
    }),
  ])

  const topFirmaEntry = topFirmaData[0]
  const avgDays = Math.round(avgDaysData[0]?.avg ?? 0)

  return {
    totalActive,
    topFirma: topFirmaEntry?.firma ?? '-',
    topFirmaCount: topFirmaEntry?._count.firma ?? 0,
    uniqueAtcGroups,
    avgDaysSinceMeldung: avgDays,
    lastScrapedAt: lastRun?.scrapedAt.toISOString() ?? null,
  }
}
