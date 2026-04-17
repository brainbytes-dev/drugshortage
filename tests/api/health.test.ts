import { GET } from '@/app/api/health/route'
import { getPoolStats, checkDatabaseHealth } from '@/lib/db-monitoring'
import { getCacheStats } from '@/lib/cache-lru'

// Mock dependencies
jest.mock('@/lib/db-monitoring')
jest.mock('@/lib/cache-lru')

const mockGetPoolStats = getPoolStats as jest.MockedFunction<typeof getPoolStats>
const mockCheckDatabaseHealth = checkDatabaseHealth as jest.MockedFunction<typeof checkDatabaseHealth>
const mockGetCacheStats = getCacheStats as jest.MockedFunction<typeof getCacheStats>

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return healthy status when all systems are healthy', async () => {
      mockGetPoolStats.mockResolvedValue({
        totalConnections: 5,
        idleConnections: 3,
        waitingClients: 0,
        healthStatus: 'healthy',
      })
      mockCheckDatabaseHealth.mockResolvedValue({
        healthy: true,
        latencyMs: 50,
      })
      mockGetCacheStats.mockReturnValue({
        entries: 100,
        currentSizeMB: '10.5',
        maxSizeMB: '100.0',
        utilizationPercent: '10.5',
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data.database.healthy).toBe(true)
      expect(data.connectionPool.healthStatus).toBe('healthy')
    })

    it('should return degraded status when cache utilization is high', async () => {
      mockGetPoolStats.mockResolvedValue({
        totalConnections: 5,
        idleConnections: 3,
        waitingClients: 0,
        healthStatus: 'healthy',
      })
      mockCheckDatabaseHealth.mockResolvedValue({
        healthy: true,
        latencyMs: 50,
      })
      mockGetCacheStats.mockReturnValue({
        entries: 10000,
        currentSizeMB: '96.0',
        maxSizeMB: '100.0',
        utilizationPercent: '96.0',
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('degraded')
    })

    it('should return degraded status when database is unhealthy', async () => {
      mockGetPoolStats.mockResolvedValue({
        totalConnections: 5,
        idleConnections: 3,
        waitingClients: 0,
        healthStatus: 'healthy',
      })
      mockCheckDatabaseHealth.mockResolvedValue({
        healthy: false,
        latencyMs: 5000,
        error: 'Connection timeout',
      })
      mockGetCacheStats.mockReturnValue({
        entries: 100,
        currentSizeMB: '10.5',
        maxSizeMB: '100.0',
        utilizationPercent: '10.5',
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('degraded')
      expect(data.database.error).toBe('Connection timeout')
    })

    it('should return degraded status when pool is in critical state', async () => {
      mockGetPoolStats.mockResolvedValue({
        totalConnections: 19,
        idleConnections: 0,
        waitingClients: 10,
        healthStatus: 'critical',
      })
      mockCheckDatabaseHealth.mockResolvedValue({
        healthy: true,
        latencyMs: 50,
      })
      mockGetCacheStats.mockReturnValue({
        entries: 100,
        currentSizeMB: '10.5',
        maxSizeMB: '100.0',
        utilizationPercent: '10.5',
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('degraded')
    })

    it('should include timestamp in response', async () => {
      mockGetPoolStats.mockResolvedValue({
        totalConnections: 5,
        idleConnections: 3,
        waitingClients: 0,
        healthStatus: 'healthy',
      })
      mockCheckDatabaseHealth.mockResolvedValue({
        healthy: true,
        latencyMs: 50,
      })
      mockGetCacheStats.mockReturnValue({
        entries: 100,
        currentSizeMB: '10.5',
        maxSizeMB: '100.0',
        utilizationPercent: '10.5',
      })

      const response = await GET()
      const data = await response.json()

      expect(data.timestamp).toBeDefined()
      expect(new Date(data.timestamp)).toBeInstanceOf(Date)
    })

    it('should set no-cache headers', async () => {
      mockGetPoolStats.mockResolvedValue({
        totalConnections: 5,
        idleConnections: 3,
        waitingClients: 0,
        healthStatus: 'healthy',
      })
      mockCheckDatabaseHealth.mockResolvedValue({
        healthy: true,
        latencyMs: 50,
      })
      mockGetCacheStats.mockReturnValue({
        entries: 100,
        currentSizeMB: '10.5',
        maxSizeMB: '100.0',
        utilizationPercent: '10.5',
      })

      const response = await GET()

      expect(response.headers.get('Cache-Control')).toBe('no-store, must-revalidate')
    })
  })
})
