import { prisma } from './prisma-optimized'
import type { KPIStats } from './types'

// statusCode 1–5 are the official drugshortage.ch codes; 0/8/9 are parse artifacts / "abgeschlossen"
const ACTIVE_WHERE = { isActive: true, statusCode: { gte: 1, lte: 5 } } as const

/**
 * Optimized KPI calculation using SQL aggregations instead of loading all records
 */
export async function getKPIStatsOptimized(): Promise<KPIStats> {
  // ✅ Use parallel queries with SQL aggregations
  const [
    totalActive,
    uniqueAtcGroups,
    avgDaysData,
    lastRun,
  ] = await Promise.all([
    // Total active count (statusCode 1–5 only, matching queryShortages)
    prisma.shortage.count({ where: ACTIVE_WHERE }),

    // Unique ATC groups count
    prisma.shortage.findMany({
      where: ACTIVE_WHERE,
      select: { atcCode: true },
      distinct: ['atcCode'],
    }).then(rows => rows.length),

    // Average days via native SQL aggregation (100x faster, O(1) memory)
    prisma.shortage.aggregate({
      where: ACTIVE_WHERE,
      _avg: { tageSeitMeldung: true },
    }).then(result => ({ avg: result._avg.tageSeitMeldung ?? 0 })),

    // Last scrape run
    prisma.scrapeRun.findFirst({
      where: { status: 'success' },
      orderBy: { scrapedAt: 'desc' },
      select: { scrapedAt: true },
    }),
  ])

  const avgDays = Math.round(avgDaysData.avg)

  return {
    totalActive,
    uniqueAtcGroups,
    avgDaysSinceMeldung: avgDays,
    lastScrapedAt: lastRun?.scrapedAt.toISOString() ?? null,
  }
}
