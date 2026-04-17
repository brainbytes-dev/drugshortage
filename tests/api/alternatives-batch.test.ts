import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/alternatives/batch/route'
import { prisma } from '@/lib/prisma-optimized'

vi.mock('@/lib/prisma-optimized', () => ({
  prisma: {
    alternativesCache: {
      findMany: vi.fn(),
    },
  },
}))

describe('/api/alternatives/batch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Input validation', () => {
    it('should reject missing gtins array', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const response = await POST(request)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('gtins array required')
    })

    it('should reject empty gtins array', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ gtins: [] }),
      })
      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should reject non-array gtins', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ gtins: '123456' }),
      })
      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should reject over 50 GTINs', async () => {
      const gtins = Array.from({ length: 51 }, (_, i) => `gtin-${i}`)
      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ gtins }),
      })
      const response = await POST(request)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Maximum 50 GTINs')
    })

    it('should accept exactly 50 GTINs', async () => {
      const gtins = Array.from({ length: 50 }, (_, i) => `gtin-${i}`)
      vi.mocked(prisma.alternativesCache.findMany).mockResolvedValue([])

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ gtins }),
      })
      const response = await POST(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Database operations', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(prisma.alternativesCache.findMany).mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ gtins: ['123'] }),
      })
      const response = await POST(request)
      expect(response.status).toBe(500)
    })

    it('should return results in same order as input', async () => {
      const gtins = ['gtin-2', 'gtin-1', 'gtin-3']
      vi.mocked(prisma.alternativesCache.findMany).mockResolvedValue([
        { gtin: 'gtin-1', data: { test: 'data1' }, fetchedAt: new Date() },
        { gtin: 'gtin-3', data: { test: 'data3' }, fetchedAt: new Date() },
      ])

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ gtins }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(data.map((r: any) => r.gtin)).toEqual(gtins)
    })

    it('should return null for missing GTINs', async () => {
      vi.mocked(prisma.alternativesCache.findMany).mockResolvedValue([])

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ gtins: ['missing-gtin'] }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(data[0].data).toBeNull()
    })
  })

  describe('Cache headers', () => {
    it('should set correct cache-control headers', async () => {
      vi.mocked(prisma.alternativesCache.findMany).mockResolvedValue([])

      const request = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ gtins: ['123'] }),
      })
      const response = await POST(request)

      const cacheControl = response.headers.get('Cache-Control')
      expect(cacheControl).toContain('public')
      expect(cacheControl).toContain('s-maxage=3600')
      expect(cacheControl).toContain('stale-while-revalidate=86400')
    })
  })
})
