import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '@/app/api/health/route'
import * as dbMonitoring from '@/lib/db-monitoring'
import * as cacheLru from '@/lib/cache-lru'

jest.mock('@/lib/db-monitoring')
jest.mock('@/lib/cache-lru')

describe('GET /api/health - Complete Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Healthy State', () => {
    it('should return 200 when all systems are healthy', async () => {
      vi.mocked(dbMonitoring.getPoolStats).mockResolvedValue({
        totalConnections: 5,
        idleConnections: 3,
        waitingClients: 0,
        healthStatus: 'healthy',
      })
      vi.mocked(dbMonitoring.checkDatabaseHealth).mockResolvedValue({
        healthy: true,
        latencyMs: 50,
      })
      vi.mocked(cacheLru.getCacheStats).mockReturnValue({
        entries: 10,
        currentSizeMB: '50.00',
        maxSizeMB: '100.00',
        utilizationPercent: '50.0',
      })

      const response = await GET()

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.status).toBe('healthy')
      expect(data.database.healthy).toBe(true)
      expect(data.connectionPool.healthStatus).toBe('healthy')
    })

    it('should include timestamp in response', async () => {
      const mockDate = new Date('2026-04-16T12:00:00Z')
      vi.useFakeTimers()
      vi.setSystemTime(mockDate)

      vi.mocked(dbMonitoring.getPoolStats).mockResolvedValue({
        totalConnections: 1,
        idleConnections: 1,
        waitingClients: 0,
        healthStatus: 'healthy',
      })
      vi.mocked(dbMonitoring.checkDatabaseHealth).mockResolvedValue({
        healthy: true,
        latencyMs: 10,
      })
      vi.mocked(cacheLru.getCacheStats).mockReturnValue({
        entries: 0,
        currentSizeMB: '0.00',
        maxSizeMB: '100.00',
        utilizationPercent: '0.0',
      })

      const response = await GET()
      const data = await response.json()

      vi.useRealTimers()
      expect(data.timestamp).toBe('2026-04-16T12:00:00.000Z')
    })

    it('should have no-cache headers', async () => {
      vi.mocked(dbMonitoring.getPoolStats).mockResolvedValue({
        totalConnections: 1,
        idleConnections: 1,
        waitingClients: 0,
        healthStatus: 'healthy',
      })
      vi.mocked(dbMonitoring.checkDatabaseHealth).mockResolvedValue({
        healthy: true,
        latencyMs: 10,
      })
      vi.mocked(cacheLru.getCacheStats).mockReturnValue({
        entries: 0,
        currentSizeMB: '0.00',
        maxSizeMB: '100.00',
        utilizationPercent: '0.0',
      })

      const response = await GET()

      expect(response.headers.get('Cache-Control')).toBe('no-store, must-revalidate')
    })
  })

  describe('Degraded State', () => {
    it('should return 503 when database is unhealthy', async () => {
      vi.mocked(dbMonitoring.getPoolStats).mockResolvedValue({
        totalConnections: 5,
        idleConnections: 3,
        waitingClients: 0,
        healthStatus: 'healthy',
      })
      vi.mocked(dbMonitoring.checkDatabaseHealth).mockResolvedValue({
        healthy: false,
        latencyMs: 5000,
        error: 'Connection timeout',
      })
      vi.mocked(cacheLru.getCacheStats).mockReturnValue({
        entries: 10,
        currentSizeMB: '50.00',
        maxSizeMB: '100.00',
        utilizationPercent: '50.0',
      })

      const response = await GET()

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data.status).toBe('degraded')
      expect(data.database.error).toBe('Connection timeout')
    })

    it('should return 503 when connection pool is degraded', async () => {
      vi.mocked(dbMonitoring.getPoolStats).mockResolvedValue({
        totalConnections: 18,
        idleConnections: 0,
        waitingClients: 0,
        healthStatus: 'degraded',
      })
      vi.mocked(dbMonitoring.checkDatabaseHealth).mockResolvedValue({
        healthy: true,
        latencyMs: 50,
      })
      vi.mocked(cacheLru.getCacheStats).mockReturnValue({
        entries: 10,
        currentSizeMB: '50.00',
        maxSizeMB: '100.00',
        utilizationPercent: '50.0',
      })

      const response = await GET()

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data.status).toBe('degraded')
    })

    it('should return 503 when cache utilization > 95%', async () => {
      vi.mocked(dbMonitoring.getPoolStats).mockResolvedValue({
        totalConnections: 5,
        idleConnections: 3,
        waitingClients: 0,
        healthStatus: 'healthy',
      })
      vi.mocked(dbMonitoring.checkDatabaseHealth).mockResolvedValue({
        healthy: true,
        latencyMs: 50,
      })
      vi.mocked(cacheLru.getCacheStats).mockReturnValue({
        entries: 1000,
        currentSizeMB: '96.00',
        maxSizeMB: '100.00',
        utilizationPercent: '96.0',
      })

      const response = await GET()

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data.status).toBe('degraded')
    })

    it('should treat exactly 95% cache utilization as degraded (boundary at <95)', async () => {
      // Production condition: parseFloat(utilizationPercent) < 95
      // 95.0 is NOT < 95, so status = degraded
      vi.mocked(dbMonitoring.getPoolStats).mockResolvedValue({
        totalConnections: 5,
        idleConnections: 3,
        waitingClients: 0,
        healthStatus: 'healthy',
      })
      vi.mocked(dbMonitoring.checkDatabaseHealth).mockResolvedValue({
        healthy: true,
        latencyMs: 50,
      })
      vi.mocked(cacheLru.getCacheStats).mockReturnValue({
        entries: 1000,
        currentSizeMB: '95.00',
        maxSizeMB: '100.00',
        utilizationPercent: '95.0',
      })

      const response = await GET()

      expect(response.status).toBe(503)
    })
  })

  describe('Critical State', () => {
    it('should return 503 when connection pool is critical', async () => {
      vi.mocked(dbMonitoring.getPoolStats).mockResolvedValue({
        totalConnections: 20,
        idleConnections: 0,
        waitingClients: 10,
        healthStatus: 'critical',
      })
      vi.mocked(dbMonitoring.checkDatabaseHealth).mockResolvedValue({
        healthy: true,
        latencyMs: 50,
      })
      vi.mocked(cacheLru.getCacheStats).mockReturnValue({
        entries: 10,
        currentSizeMB: '50.00',
        maxSizeMB: '100.00',
        utilizationPercent: '50.0',
      })

      const response = await GET()

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data.connectionPool.waitingClients).toBe(10)
    })

    it('should return 503 when multiple systems are degraded', async () => {
      vi.mocked(dbMonitoring.getPoolStats).mockResolvedValue({
        totalConnections: 18,
        idleConnections: 0,
        waitingClients: 5,
        healthStatus: 'degraded',
      })
      vi.mocked(dbMonitoring.checkDatabaseHealth).mockResolvedValue({
        healthy: false,
        latencyMs: 2000,
        error: 'Slow query',
      })
      vi.mocked(cacheLru.getCacheStats).mockReturnValue({
        entries: 2000,
        currentSizeMB: '98.00',
        maxSizeMB: '100.00',
        utilizationPercent: '98.0',
      })

      const response = await GET()

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data.database.healthy).toBe(false)
      expect(data.connectionPool.healthStatus).toBe('degraded')
    })
  })

  describe('Error Handling', () => {
    it('should handle getPoolStats failure', async () => {
      vi.mocked(dbMonitoring.getPoolStats).mockRejectedValue(new Error('Pool stats error'))
      vi.mocked(dbMonitoring.checkDatabaseHealth).mockResolvedValue({
        healthy: true,
        latencyMs: 50,
      })
      vi.mocked(cacheLru.getCacheStats).mockReturnValue({
        entries: 10,
        currentSizeMB: '50.00',
        maxSizeMB: '100.00',
        utilizationPercent: '50.0',
      })

      // Should not crash
      await expect(GET()).rejects.toThrow()
      // OR should handle gracefully:
      // const response = await GET()
      // expect(response.status).toBe(503)
    })

    it('should handle checkDatabaseHealth failure', async () => {
      vi.mocked(dbMonitoring.getPoolStats).mockResolvedValue({
        totalConnections: 5,
        idleConnections: 3,
        waitingClients: 0,
        healthStatus: 'healthy',
      })
      vi.mocked(dbMonitoring.checkDatabaseHealth).mockRejectedValue(new Error('DB check error'))
      vi.mocked(cacheLru.getCacheStats).mockReturnValue({
        entries: 10,
        currentSizeMB: '50.00',
        maxSizeMB: '100.00',
        utilizationPercent: '50.0',
      })

      await expect(GET()).rejects.toThrow()
    })

    it('should handle getCacheStats failure', async () => {
      vi.mocked(dbMonitoring.getPoolStats).mockResolvedValue({
        totalConnections: 5,
        idleConnections: 3,
        waitingClients: 0,
        healthStatus: 'healthy',
      })
      vi.mocked(dbMonitoring.checkDatabaseHealth).mockResolvedValue({
        healthy: true,
        latencyMs: 50,
      })
      vi.mocked(cacheLru.getCacheStats).mockImplementation(() => {
        throw new Error('Cache stats error')
      })

      await expect(GET()).rejects.toThrow()
    })
  })

  describe('Response Format', () => {
    it('should include all required fields in response', async () => {
      vi.mocked(dbMonitoring.getPoolStats).mockResolvedValue({
        totalConnections: 5,
        idleConnections: 3,
        waitingClients: 0,
        healthStatus: 'healthy',
      })
      vi.mocked(dbMonitoring.checkDatabaseHealth).mockResolvedValue({
        healthy: true,
        latencyMs: 50,
      })
      vi.mocked(cacheLru.getCacheStats).mockReturnValue({
        entries: 10,
        currentSizeMB: '50.00',
        maxSizeMB: '100.00',
        utilizationPercent: '50.0',
      })

      const response = await GET()
      const data = await response.json()

      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('database')
      expect(data).toHaveProperty('connectionPool')
      expect(data).toHaveProperty('cache')

      expect(data.database).toHaveProperty('healthy')
      expect(data.database).toHaveProperty('latencyMs')
      expect(data.connectionPool).toHaveProperty('totalConnections')
      expect(data.connectionPool).toHaveProperty('idleConnections')
      expect(data.connectionPool).toHaveProperty('waitingClients')
      expect(data.cache).toHaveProperty('entries')
    })
  })
})
