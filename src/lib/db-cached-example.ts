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
      // Mirror db.ts getKPIStats — no raw SQL
      const active = await prisma.shortage.findMany({
        where: { isActive: true },
        select: { firma: true, atcCode: true, tageSeitMeldung: true },
      })

      const firmaCounts = active.reduce<Record<string, number>>((acc, s) => {
        acc[s.firma] = (acc[s.firma] ?? 0) + 1
        return acc
      }, {})

      const topFirmaEntry = Object.entries(firmaCounts).sort((a, b) => b[1] - a[1])[0]
      const uniqueAtcGroups = new Set(active.map(s => s.atcCode)).size
      const avgDays =
        active.length > 0
          ? Math.round(active.reduce((sum, s) => sum + (s.tageSeitMeldung ?? 0), 0) / active.length)
          : 0

      const lastRun = await prisma.scrapeRun.findFirst({
        where: { status: 'success' },
        orderBy: { scrapedAt: 'desc' },
        select: { scrapedAt: true },
      })

      return {
        totalActive: active.length,
        topFirma: topFirmaEntry?.[0] ?? '-',
        topFirmaCount: topFirmaEntry?.[1] ?? 0,
        uniqueAtcGroups,
        avgDaysSinceMeldung: avgDays,
        lastScrapedAt: lastRun?.scrapedAt.toISOString() ?? null,
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
