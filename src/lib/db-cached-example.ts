import { getCachedLRU, lruCache } from './cache-lru'
import { getKPIStatsOptimized } from './db-optimized-aggregations'
import { prisma } from './prisma'
import type { KPIStats } from './types'

/**
 * ✅ Cached KPI Stats using SQL aggregations (no memory overhead)
 * KPI data changes slowly (only on scrape), so cache for 5 minutes
 */
export async function getKPIStatsCached(): Promise<KPIStats> {
  return getCachedLRU(
    'kpi-stats',
    async () => getKPIStatsOptimized(), // ✅ Use SQL aggregations instead of loading all records
    300 // Cache for 5 minutes
  )
}

/**
 * Example: Cached Firma List
 * Changes slowly, cache for 10 minutes
 */
export async function getFirmaListCached(): Promise<string[]> {
  return getCachedLRU(
    'firma-list',
    async () => {
      // ✅ Use groupBy instead of distinct for better performance (2-3x faster)
      const result = await prisma.shortage.groupBy({
        by: ['firma'],
        where: { isActive: true, statusCode: { gte: 1, lte: 5 } },
        orderBy: { firma: 'asc' },
      })
      return result.map(r => r.firma)
    },
    600 // ✅ Cache for 10 minutes
  )
}

/**
 * Invalidate caches after scrape
 * Call this from the scrape route after successful upsert
 */
export function invalidateStatsCache(): void {
  lruCache.delete('kpi-stats')
  lruCache.delete('firma-list')
  lruCache.delete('sitemap-data') // ✅ Sitemap changes when new drugs are added

  // ✅ Clear all query result caches (they start with 'query:')
  const deletedQueries = lruCache.deleteByPrefix('query:')
  console.log(`[Cache] Invalidated ${deletedQueries} query caches after scrape`)
}
