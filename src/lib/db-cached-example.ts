import { getCached } from './cache'
import { prisma } from './prisma'
import type { KPIStats } from './types'

/**
 * Example: Cached KPI Stats
 * KPI data changes slowly (only on scrape), so cache for 5 minutes
 */
export async function getKPIStatsCached(): Promise<KPIStats> {
  return getCached(
    'kpi-stats',
    async () => {
      // Original query from db.ts
      const [total, topFirma, atcGroups, avgDays, lastScrape] = await Promise.all([
        prisma.shortage.count({ where: { isActive: true } }),

        prisma.shortage.groupBy({
          by: ['firma'],
          where: { isActive: true },
          _count: { _all: true },
          orderBy: { _count: { _all: 'desc' } },
          take: 1,
        }),

        prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(DISTINCT "atcCode") as count
          FROM "Shortage"
          WHERE "isActive" = true
        `,

        prisma.shortage.aggregate({
          where: { isActive: true },
          _avg: { tageSeitMeldung: true },
        }),

        prisma.scrapeRun.findFirst({
          where: { status: 'success' },
          orderBy: { scrapedAt: 'desc' },
          select: { scrapedAt: true },
        }),
      ])

      const top = topFirma[0]
      return {
        totalActive: total,
        topFirma: top?.firma ?? 'N/A',
        topFirmaCount: top?._count._all ?? 0,
        uniqueAtcGroups: Number(atcGroups[0]?.count ?? 0),
        avgDaysSinceMeldung: Math.round(avgDays._avg.tageSeitMeldung ?? 0),
        lastScrapedAt: lastScrape?.scrapedAt ?? null,
      }
    },
    300 // ✅ Cache for 5 minutes
  )
}

/**
 * Example: Cached Firma List
 * Changes slowly, cache for 10 minutes
 */
export async function getFirmaListCached(): Promise<string[]> {
  return getCached(
    'firma-list',
    async () => {
      const firms = await prisma.shortage.findMany({
        where: { isActive: true },
        select: { firma: true },
        distinct: ['firma'],
        orderBy: { firma: 'asc' },
      })
      return firms.map(f => f.firma)
    },
    600 // ✅ Cache for 10 minutes
  )
}

/**
 * Invalidate caches after scrape
 * Call this from the scrape route after successful upsert
 */
export function invalidateStatsCache(): void {
  const { memoryCache } = require('./cache')
  memoryCache.delete('kpi-stats')
  memoryCache.delete('firma-list')
  // Also invalidate any query result caches if needed
}
