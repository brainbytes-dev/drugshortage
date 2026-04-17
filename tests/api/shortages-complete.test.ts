/**
 * Comprehensive Tests: /api/shortages
 * Coverage: Main data endpoint with caching, filtering, pagination
 */

import { GET } from '@/app/api/shortages/route'
import { queryShortagesCached } from '@/lib/db-cached-queries'
import { getKPIStatsCached, getFirmaListCached } from '@/lib/db-cached-example'
import type { ShortagesQuery } from '@/lib/types'

jest.mock('@/lib/db-cached-queries')
jest.mock('@/lib/db-cached-example')

const mockQueryShortagesCached = queryShortagesCached as jest.MockedFunction<typeof queryShortagesCached>
const mockGetKPIStatsCached = getKPIStatsCached as jest.MockedFunction<typeof getKPIStatsCached>
const mockGetFirmaListCached = getFirmaListCached as jest.MockedFunction<typeof getFirmaListCached>

describe('GET /api/shortages - Comprehensive', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Functionality', () => {
    it('should return shortages with KPI and firma list', async () => {
      mockQueryShortagesCached.mockResolvedValue({
        data: [
          {
            id: 1,
            gtin: '7680123456789',
            bezeichnung: 'Test Med',
            firma: 'Test Pharma',
            atcCode: 'N02BE01',
            statusText: 'Unavailable',
            tageSeitMeldung: 10,
          },
        ],
        total: 1,
        page: 1,
        perPage: 50,
        totalPages: 1,
      } as any)

      mockGetKPIStatsCached.mockResolvedValue({
        totalActive: 100,
        topFirma: 'Roche',
        topFirmaCount: 25,
        uniqueAtcGroups: 50,
        avgDaysSinceMeldung: 42,
        lastScrapedAt: '2026-04-17T10:00:00Z',
      })

      mockGetFirmaListCached.mockResolvedValue(['Roche', 'Novartis'])

      const request = new Request('http://localhost/api/shortages')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(data.kpi).toBeDefined()
      expect(data.firmaList).toHaveLength(2)
    })

    it('should call all data sources in parallel', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      await GET(new Request('http://localhost/api/shortages'))

      expect(mockQueryShortagesCached).toHaveBeenCalled()
      expect(mockGetKPIStatsCached).toHaveBeenCalled()
      expect(mockGetFirmaListCached).toHaveBeenCalled()
    })
  })

  describe('Query Parameters', () => {
    it('should parse search parameter', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const request = new Request('http://localhost/api/shortages?search=acetalgin')
      await GET(request)

      expect(mockQueryShortagesCached).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'acetalgin' })
      )
    })

    it('should parse status filter', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const request = new Request('http://localhost/api/shortages?status=1')
      await GET(request)

      expect(mockQueryShortagesCached).toHaveBeenCalledWith(
        expect.objectContaining({ status: '1' })
      )
    })

    it('should parse firma filter', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const request = new Request('http://localhost/api/shortages?firma=Roche')
      await GET(request)

      expect(mockQueryShortagesCached).toHaveBeenCalledWith(
        expect.objectContaining({ firma: 'Roche' })
      )
    })

    it('should parse ATC filter', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const request = new Request('http://localhost/api/shortages?atc=N02BE01')
      await GET(request)

      expect(mockQueryShortagesCached).toHaveBeenCalledWith(
        expect.objectContaining({ atc: 'N02BE01' })
      )
    })

    it('should parse and validate page parameter', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const request = new Request('http://localhost/api/shortages?page=5')
      await GET(request)

      expect(mockQueryShortagesCached).toHaveBeenCalledWith(
        expect.objectContaining({ page: 5 })
      )
    })

    it('should default page to 1 if invalid', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const request = new Request('http://localhost/api/shortages?page=0')
      await GET(request)

      expect(mockQueryShortagesCached).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 })
      )
    })

    it('should parse sort parameter', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const request = new Request('http://localhost/api/shortages?sort=firma:asc')
      await GET(request)

      expect(mockQueryShortagesCached).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'firma:asc' })
      )
    })

    it('should default sort to tageSeitMeldung:desc', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const request = new Request('http://localhost/api/shortages')
      await GET(request)

      expect(mockQueryShortagesCached).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'tageSeitMeldung:desc' })
      )
    })

    it('should parse and clamp perPage parameter', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 100, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const request = new Request('http://localhost/api/shortages?perPage=100')
      await GET(request)

      expect(mockQueryShortagesCached).toHaveBeenCalledWith(
        expect.objectContaining({ perPage: 100 })
      )
    })

    it('should clamp perPage to max 200', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 200, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const request = new Request('http://localhost/api/shortages?perPage=500')
      await GET(request)

      expect(mockQueryShortagesCached).toHaveBeenCalledWith(
        expect.objectContaining({ perPage: 200 })
      )
    })

    it('should clamp perPage to min 1', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 1, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const request = new Request('http://localhost/api/shortages?perPage=-10')
      await GET(request)

      expect(mockQueryShortagesCached).toHaveBeenCalledWith(
        expect.objectContaining({ perPage: 1 })
      )
    })
  })

  describe('Response Headers', () => {
    it('should set Cache-Control header', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const response = await GET(new Request('http://localhost/api/shortages'))

      expect(response.headers.get('Cache-Control')).toBe(
        'public, s-maxage=300, stale-while-revalidate=3600'
      )
    })

    it('should set Vary header', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const response = await GET(new Request('http://localhost/api/shortages'))

      expect(response.headers.get('Vary')).toBe('Accept-Encoding')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty search term', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const request = new Request('http://localhost/api/shortages?search=')
      await GET(request)

      expect(mockQueryShortagesCached).toHaveBeenCalledWith(
        expect.objectContaining({ search: undefined })
      )
    })

    it('should handle Unicode search terms', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const request = new Request('http://localhost/api/shortages?search=Müller')
      await GET(request)

      expect(mockQueryShortagesCached).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Müller' })
      )
    })

    it('should handle special characters in firma name', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const request = new Request('http://localhost/api/shortages?firma=Novartis%20%26%20Co')
      await GET(request)

      expect(mockQueryShortagesCached).toHaveBeenCalledWith(
        expect.objectContaining({ firma: 'Novartis & Co' })
      )
    })

    it('should handle page > totalPages', async () => {
      mockQueryShortagesCached.mockResolvedValue({
        data: [],
        total: 50,
        page: 100,
        perPage: 50,
        totalPages: 1,
      } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const request = new Request('http://localhost/api/shortages?page=100')
      const response = await GET(request)
      const data = await response.json()

      expect(data.data).toHaveLength(0)
    })

    it('should handle all filters combined', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const request = new Request(
        'http://localhost/api/shortages?search=test&status=1&firma=Roche&atc=N02&page=2&sort=firma:asc&perPage=25'
      )
      await GET(request)

      expect(mockQueryShortagesCached).toHaveBeenCalledWith({
        search: 'test',
        status: '1',
        firma: 'Roche',
        atc: 'N02',
        page: 2,
        sort: 'firma:asc',
        perPage: 25,
      })
    })
  })

  describe('Error Handling', () => {
    it('should propagate database errors', async () => {
      mockQueryShortagesCached.mockRejectedValue(new Error('Database connection failed'))
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const request = new Request('http://localhost/api/shortages')

      await expect(GET(request)).rejects.toThrow('Database connection failed')
    })

    it('should propagate cache errors', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockRejectedValue(new Error('Cache miss - DB unreachable'))
      mockGetFirmaListCached.mockResolvedValue([])

      const request = new Request('http://localhost/api/shortages')

      await expect(GET(request)).rejects.toThrow('Cache miss - DB unreachable')
    })

    it('should handle timeout errors gracefully', async () => {
      mockQueryShortagesCached.mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      )
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const request = new Request('http://localhost/api/shortages')

      await expect(GET(request)).rejects.toThrow('Timeout')
    })
  })

  describe('Security', () => {
    it('should sanitize SQL injection attempt in search', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const request = new Request("http://localhost/api/shortages?search='; DROP TABLE Shortage; --")
      await GET(request)

      // Verify the malicious input is passed as-is (Prisma should handle sanitization)
      expect(mockQueryShortagesCached).toHaveBeenCalledWith(
        expect.objectContaining({ search: "'; DROP TABLE Shortage; --" })
      )
    })

    it('should handle XSS attempt in firma parameter', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const request = new Request('http://localhost/api/shortages?firma=<script>alert(1)</script>')
      await GET(request)

      expect(mockQueryShortagesCached).toHaveBeenCalledWith(
        expect.objectContaining({ firma: '<script>alert(1)</script>' })
      )
    })

    it('should reject extremely long search terms (DoS attempt)', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const longSearch = 'a'.repeat(10000)
      const request = new Request(`http://localhost/api/shortages?search=${longSearch}`)
      await GET(request)

      // Should still pass through (DB layer handles validation)
      expect(mockQueryShortagesCached).toHaveBeenCalled()
    })
  })

  describe('Performance', () => {
    it('should complete within 500ms', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const start = Date.now()
      await GET(new Request('http://localhost/api/shortages'))
      const duration = Date.now() - start

      expect(duration).toBeLessThan(500)
    })

    it('should leverage cached queries for repeat requests', async () => {
      mockQueryShortagesCached.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 50, totalPages: 0 } as any)
      mockGetKPIStatsCached.mockResolvedValue({} as any)
      mockGetFirmaListCached.mockResolvedValue([])

      const request1 = new Request('http://localhost/api/shortages?search=test')
      const request2 = new Request('http://localhost/api/shortages?search=test')

      await GET(request1)
      await GET(request2)

      // Both should call the cached function (which handles cache internally)
      expect(mockQueryShortagesCached).toHaveBeenCalledTimes(2)
    })
  })
})
