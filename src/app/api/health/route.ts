import { NextResponse } from 'next/server'
import { getPoolStats, checkDatabaseHealth } from '@/lib/db-monitoring'
import { getCacheStats } from '@/lib/cache-lru'

export async function GET() {
  const [poolStats, dbHealth, cacheStats] = await Promise.all([
    getPoolStats(),
    checkDatabaseHealth(),
    Promise.resolve(getCacheStats()),
  ])

  const overallHealthy =
    poolStats.healthStatus === 'healthy' &&
    dbHealth.healthy &&
    parseFloat(cacheStats.utilizationPercent) < 95

  return NextResponse.json(
    {
      status: overallHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      database: {
        healthy: dbHealth.healthy,
        latencyMs: dbHealth.latencyMs,
        error: dbHealth.error,
      },
      connectionPool: poolStats,
      cache: cacheStats,
    },
    {
      status: overallHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    }
  )
}
