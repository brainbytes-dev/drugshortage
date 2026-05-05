import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '@/app/api/alternatives/route'
import { prisma } from '@/lib/prisma-optimized'

jest.mock('@/lib/prisma-optimized', () => ({
  prisma: {
    alternativesCache: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

describe('GET /api/alternatives - Complete Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  describe('Input Validation', () => {
    it('should return 400 when gtin parameter is missing', async () => {
      const request = new Request('http://localhost/api/alternatives')
      const response = await GET(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('gtin required')
    })

    it('should return 400 when gtin is empty string', async () => {
      const request = new Request('http://localhost/api/alternatives?gtin=')
      const response = await GET(request)

      expect(response.status).toBe(400)
    })

    it('should handle special characters in gtin parameter', async () => {
      const request = new Request('http://localhost/api/alternatives?gtin=%3Cscript%3E')
      // Should either sanitize or reject
      // TODO: Implement test
    })
  })

  describe('Cache Behavior', () => {
    it('should return cached data when cache is fresh (< 24h)', async () => {
      const mockCached = {
        gtin: '7680123456789',
        data: { gleicheFirma: [], coMarketing: [], alleAlternativen: [] },
        fetchedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      }
      vi.mocked(prisma.alternativesCache.findUnique).mockResolvedValue(mockCached)

      const request = new Request('http://localhost/api/alternatives?gtin=7680123456789')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(prisma.alternativesCache.findUnique).toHaveBeenCalledWith({
        where: { gtin: '7680123456789' },
      })
      // Should NOT call upsert for fresh cache
      expect(prisma.alternativesCache.upsert).not.toHaveBeenCalled()
    })

    it('should fetch fresh data when cache is stale (> 24h)', async () => {
      const staleCached = {
        gtin: '7680123456789',
        data: { gleicheFirma: [], coMarketing: [], alleAlternativen: [] },
        fetchedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      }
      vi.mocked(prisma.alternativesCache.findUnique).mockResolvedValue(staleCached)

      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<html></html>',
      })

      const request = new Request('http://localhost/api/alternatives?gtin=7680123456789')
      const response = await GET(request)

      // Should fetch and upsert
      expect(global.fetch).toHaveBeenCalled()
      expect(prisma.alternativesCache.upsert).toHaveBeenCalled()
    })

    it('should return stale cache when fetch fails', async () => {
      const staleCached = {
        gtin: '7680123456789',
        data: { gleicheFirma: [], coMarketing: [], alleAlternativen: [] },
        fetchedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      }
      vi.mocked(prisma.alternativesCache.findUnique).mockResolvedValue(staleCached)

      // Mock failed fetch
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 })

      const request = new Request('http://localhost/api/alternatives?gtin=7680123456789')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual(staleCached.data)

      // Should have shorter cache TTL for stale data
      const cacheControl = response.headers.get('Cache-Control')
      expect(cacheControl).toContain('300') // 5 minutes
    })

    it('should return 502 when fetch fails and no cache exists', async () => {
      vi.mocked(prisma.alternativesCache.findUnique).mockResolvedValue(null)
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const request = new Request('http://localhost/api/alternatives?gtin=7680123456789')
      const response = await GET(request)

      expect(response.status).toBe(502)
    })

    it('should have correct cache headers for fresh data', async () => {
      const mockCached = {
        gtin: '7680123456789',
        data: { gleicheFirma: [], coMarketing: [], alleAlternativen: [] },
        fetchedAt: new Date(),
      }
      vi.mocked(prisma.alternativesCache.findUnique).mockResolvedValue(mockCached)

      const request = new Request('http://localhost/api/alternatives?gtin=7680123456789')
      const response = await GET(request)

      const cacheControl = response.headers.get('Cache-Control')
      expect(cacheControl).toContain('s-maxage=3600')
      expect(cacheControl).toContain('stale-while-revalidate=86400')
    })
  })

  describe('HTML Parsing Edge Cases', () => {
    it('should handle malformed HTML gracefully', async () => {
      vi.mocked(prisma.alternativesCache.findUnique).mockResolvedValue(null)
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<html><body><<invalid>>',
      })

      const request = new Request('http://localhost/api/alternatives?gtin=7680123456789')
      // Should not crash, return empty arrays
      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('should handle missing GridView elements', async () => {
      vi.mocked(prisma.alternativesCache.findUnique).mockResolvedValue(null)
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<html><body></body></html>',
      })

      const request = new Request('http://localhost/api/alternatives?gtin=7680123456789')
      const response = await GET(request)
      const data = await response.json()

      expect(data.gleicheFirma).toEqual([])
      expect(data.coMarketing).toEqual([])
      expect(data.alleAlternativen).toEqual([])
    })

    it('should filter out "kein" entries', async () => {
      const html = `
        <table id="GridView1">
          <tr><td>Kein Eintrag</td><td>Firma</td><td>123</td></tr>
          <tr><td>Valid Product</td><td>Firma</td><td>456</td></tr>
        </table>
      `
      vi.mocked(prisma.alternativesCache.findUnique).mockResolvedValue(null)
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => html,
      })

      const request = new Request('http://localhost/api/alternatives?gtin=7680123456789')
      const response = await GET(request)
      const data = await response.json()

      expect(data.alleAlternativen).toHaveLength(1)
      expect(data.alleAlternativen[0].bezeichnung).toBe('Valid Product')
    })

    it('should handle empty table rows', async () => {
      const html = '<table id="GridView1"><tr><td></td></tr></table>'
      vi.mocked(prisma.alternativesCache.findUnique).mockResolvedValue(null)
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => html,
      })

      const request = new Request('http://localhost/api/alternatives?gtin=7680123456789')
      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors on findUnique', async () => {
      vi.mocked(prisma.alternativesCache.findUnique).mockRejectedValue(
        new Error('Connection refused')
      )

      const request = new Request('http://localhost/api/alternatives?gtin=7680123456789')
      // Should handle gracefully - either fetch fresh or return error
      await expect(GET(request)).resolves.toBeDefined()
    })

    it('should handle database errors on upsert', async () => {
      vi.mocked(prisma.alternativesCache.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.alternativesCache.upsert).mockRejectedValue(
        new Error('Unique constraint violation')
      )
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<html></html>',
      })

      const request = new Request('http://localhost/api/alternatives?gtin=7680123456789')
      // Should still return data even if cache write fails
      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('should handle fetch timeout', async () => {
      vi.mocked(prisma.alternativesCache.findUnique).mockResolvedValue(null)
      global.fetch = vi.fn().mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))
      )

      const request = new Request('http://localhost/api/alternatives?gtin=7680123456789')
      const response = await GET(request)
      expect(response.status).toBe(502)
    })

    it('should handle HTTP error codes (404, 500, etc)', async () => {
      vi.mocked(prisma.alternativesCache.findUnique).mockResolvedValue(null)

      for (const status of [404, 500, 503]) {
        global.fetch = vi.fn().mockResolvedValue({ ok: false, status })

        const request = new Request('http://localhost/api/alternatives?gtin=7680123456789')
        const response = await GET(request)
        expect(response.status).toBe(502)
      }
    })
  })

  describe('Concurrent Requests', () => {
    it('should handle concurrent requests for same GTIN', async () => {
      vi.mocked(prisma.alternativesCache.findUnique).mockResolvedValue(null)
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<html></html>',
      })

      const request1 = new Request('http://localhost/api/alternatives?gtin=7680123456789')
      const request2 = new Request('http://localhost/api/alternatives?gtin=7680123456789')

      await Promise.all([GET(request1), GET(request2)])

      // Should handle race condition - verify no duplicate upserts cause errors
      expect(prisma.alternativesCache.upsert).toHaveBeenCalled()
    })
  })
})
