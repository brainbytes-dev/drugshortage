/**
 * Database connection pool monitoring and health checks
 */

import { prisma } from './prisma-optimized'

export interface PoolStats {
  totalConnections: number
  idleConnections: number
  waitingClients: number
  healthStatus: 'healthy' | 'degraded' | 'critical'
}

/**
 * Get current connection pool statistics
 */
export async function getPoolStats(): Promise<PoolStats> {
  try {
    // @ts-expect-error - Accessing internal pool from adapter
    const pool = prisma._engineConfig?.adapter?.pool

    if (!pool) {
      return {
        totalConnections: 0,
        idleConnections: 0,
        waitingClients: 0,
        healthStatus: 'critical',
      }
    }

    const totalConnections = pool.totalCount
    const idleConnections = pool.idleCount
    const waitingClients = pool.waitingCount

    // Determine health status based on utilization
    const utilizationPercent = (totalConnections / 20) * 100
    let healthStatus: 'healthy' | 'degraded' | 'critical' = 'healthy'

    if (utilizationPercent > 90 || waitingClients > 5) {
      healthStatus = 'critical'
    } else if (utilizationPercent > 70 || waitingClients > 0) {
      healthStatus = 'degraded'
    }

    return {
      totalConnections,
      idleConnections,
      waitingClients,
      healthStatus,
    }
  } catch (error) {
    console.error('Failed to get pool stats:', error)
    return {
      totalConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      healthStatus: 'critical',
    }
  }
}

/**
 * Perform health check on database connection
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean
  latencyMs: number
  error?: string
}> {
  const start = Date.now()

  try {
    await prisma.$queryRaw`SELECT 1`
    const latencyMs = Date.now() - start

    return {
      healthy: latencyMs < 1000, // Consider unhealthy if query takes >1s
      latencyMs,
    }
  } catch (error) {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Log pool stats periodically (for debugging)
 */
export function startPoolMonitoring(intervalMs = 60000): NodeJS.Timeout {
  const interval = setInterval(async () => {
    const stats = await getPoolStats()
    const health = await checkDatabaseHealth()

    if (stats.healthStatus !== 'healthy' || !health.healthy) {
      console.warn('[DB Pool]', {
        ...stats,
        dbLatencyMs: health.latencyMs,
        dbHealthy: health.healthy,
      })
    }
  }, intervalMs)

  // ✅ Allow process to exit even if interval is running
  interval.unref()

  return interval
}

// ✅ Auto-start monitoring in production
if (process.env.NODE_ENV === 'production') {
  startPoolMonitoring()
}
