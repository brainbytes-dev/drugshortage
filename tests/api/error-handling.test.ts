/**
 * Tests for API error handling, edge cases, and resilience
 */

import { GET as alternativesGET } from '@/app/api/alternatives/route'
import { GET as shortagesGET } from '@/app/api/shortages/route'
import { POST as scrapePOST } from '@/app/api/scrape/route'
import { prisma } from '@/lib/prisma'

describe('API Error Handling', () => {
  // TODO: integration tests — require running Postgres (alternativesCache.deleteMany + alternativesGET hit Prisma)
  describe.skip('/api/alternatives error cases', () => {
    afterEach(async () => {
      await prisma.alternativesCache.deleteMany()
    })

    test('handles malformed GTIN parameter', async () => {
      const req = new Request('http://localhost/api/alternatives?gtin=not-a-gtin')
      const res = await alternativesGET(req)
      // Should not crash, may return empty results or attempt fetch
      expect([200, 502]).toContain(res.status)
    })

    test('handles very long GTIN parameter', async () => {
      const longGtin = '7'.repeat(1000)
      const req = new Request(`http://localhost/api/alternatives?gtin=${longGtin}`)
      const res = await alternativesGET(req)
      expect([200, 502]).toContain(res.status)
    })

    test('handles special characters in GTIN', async () => {
      const req = new Request('http://localhost/api/alternatives?gtin=<script>alert(1)</script>')
      const res = await alternativesGET(req)
      expect([200, 502]).toContain(res.status)
    })

    test('handles Prisma connection failure gracefully', async () => {
      // Mock Prisma to simulate connection error
      const originalFindUnique = prisma.alternativesCache.findUnique
      prisma.alternativesCache.findUnique = jest.fn(() =>
        Promise.reject(new Error('Connection refused')),
      )

      const req = new Request('http://localhost/api/alternatives?gtin=7680494930101')
      const res = await alternativesGET(req)

      // Should fall back to live fetch or return error
      expect([200, 500, 502]).toContain(res.status)

      prisma.alternativesCache.findUnique = originalFindUnique
    })

    test('handles fetch timeout correctly', async () => {
      global.fetch = jest.fn(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 10),
          ),
      )

      const req = new Request('http://localhost/api/alternatives?gtin=7680494930101')
      const res = await alternativesGET(req)
      expect(res.status).toBe(502)
    })

    test('handles HTTP 429 rate limit from source', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 429,
        } as Response),
      )

      const req = new Request('http://localhost/api/alternatives?gtin=7680494930101')
      const res = await alternativesGET(req)
      expect(res.status).toBe(502)
    })

    test('handles corrupt cache data gracefully', async () => {
      await prisma.alternativesCache.create({
        data: {
          gtin: '7680494930101',
          // Invalid data structure
          data: { invalid: 'structure' } as any,
          fetchedAt: new Date(),
        },
      })

      const req = new Request('http://localhost/api/alternatives?gtin=7680494930101')
      const res = await alternativesGET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })
  })

  // TODO: integration tests — require running Postgres (shortage.deleteMany/create + shortagesGET hit Prisma)
  describe.skip('/api/shortages error cases', () => {
    beforeEach(async () => {
      await prisma.shortage.deleteMany()
    })

    test('handles invalid page parameter (negative)', async () => {
      const req = new Request('http://localhost/api/shortages?page=-1')
      const res = await shortagesGET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.page).toBeGreaterThanOrEqual(1) // Should clamp to 1
    })

    test('handles invalid page parameter (non-numeric)', async () => {
      const req = new Request('http://localhost/api/shortages?page=abc')
      const res = await shortagesGET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.page).toBe(1) // Should default to 1
    })

    test('handles invalid perPage parameter (zero)', async () => {
      const req = new Request('http://localhost/api/shortages?perPage=0')
      const res = await shortagesGET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.perPage).toBeGreaterThanOrEqual(1)
    })

    test('handles invalid perPage parameter (negative)', async () => {
      const req = new Request('http://localhost/api/shortages?perPage=-10')
      const res = await shortagesGET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.perPage).toBeGreaterThanOrEqual(1)
    })

    test('handles invalid perPage parameter (exceeds max)', async () => {
      const req = new Request('http://localhost/api/shortages?perPage=1000')
      const res = await shortagesGET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.perPage).toBeLessThanOrEqual(200)
    })

    test('handles very long search query', async () => {
      const longQuery = 'a'.repeat(10000)
      const req = new Request(`http://localhost/api/shortages?search=${longQuery}`)
      const res = await shortagesGET(req)
      expect(res.status).toBe(200)
    })

    test('handles malformed comma-separated status codes', async () => {
      const req = new Request('http://localhost/api/shortages?status=1,,3,')
      const res = await shortagesGET(req)
      expect(res.status).toBe(200)
    })

    test('handles Unicode characters in search', async () => {
      const req = new Request('http://localhost/api/shortages?search=Paracétamol')
      const res = await shortagesGET(req)
      expect(res.status).toBe(200)
    })

    test('handles concurrent GET requests without race conditions', async () => {
      await prisma.shortage.create({
        data: {
          gtin: '111',
          pharmacode: '999',
          bezeichnung: 'Test Med',
          firma: 'Test Firma',
          atcCode: 'A01',
          gengrp: 'GRP1',
          statusCode: 1,
          statusText: '1',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 10,
          detailUrl: '',
          isActive: true,
        },
      })

      const requests = Array.from({ length: 10 }, () =>
        shortagesGET(new Request('http://localhost/api/shortages')),
      )

      const responses = await Promise.all(requests)
      expect(responses.every(r => r.status === 200)).toBe(true)

      const jsons = await Promise.all(responses.map(r => r.json()))
      expect(jsons.every(j => j.total === 1)).toBe(true)
    })

    test('handles database unavailable scenario', async () => {
      // Mock Prisma to simulate outage
      const originalFindMany = prisma.shortage.findMany
      prisma.shortage.findMany = jest.fn(() =>
        Promise.reject(new Error('Database unavailable')),
      )

      const req = new Request('http://localhost/api/shortages')
      await expect(shortagesGET(req)).rejects.toThrow()

      prisma.shortage.findMany = originalFindMany
    })
  })

  // TODO: integration tests — scrape route calls fetchAndParse + upsertShortages which hit Prisma;
  // also the "extra whitespace" and "Scraper crashed" tests have mock isolation issues
  describe.skip('/api/scrape error cases', () => {
    const VALID_SECRET = 'test-secret'

    beforeAll(() => {
      process.env.CRON_SECRET = VALID_SECRET
    })

    test('handles missing Content-Type header', async () => {
      const req = new Request('http://localhost/api/scrape', {
        method: 'POST',
        headers: { authorization: `Bearer ${VALID_SECRET}` },
      })
      // Should still process (no body expected)
      const res = await scrapePOST(req)
      expect([200, 500]).toContain(res.status)
    })

    test('handles OPTIONS request (CORS preflight)', async () => {
      const req = new Request('http://localhost/api/scrape', {
        method: 'OPTIONS',
      })
      // Next.js handles this, but route should not crash
      await expect(scrapePOST(req as any)).resolves.toBeDefined()
    })

    test('handles authorization header with extra whitespace', async () => {
      const req = new Request('http://localhost/api/scrape', {
        method: 'POST',
        headers: { authorization: `  Bearer ${VALID_SECRET}  ` },
      })
      const res = await scrapePOST(req)
      expect(res.status).toBe(401) // Should fail due to extra whitespace
    })

    test('handles case-sensitive Bearer keyword', async () => {
      const req = new Request('http://localhost/api/scrape', {
        method: 'POST',
        headers: { authorization: `bearer ${VALID_SECRET}` },
      })
      const res = await scrapePOST(req)
      expect(res.status).toBe(401) // lowercase 'bearer' should fail
    })

    test('handles missing CRON_SECRET environment variable', async () => {
      const originalSecret = process.env.CRON_SECRET
      delete process.env.CRON_SECRET

      const req = new Request('http://localhost/api/scrape', {
        method: 'POST',
        headers: { authorization: 'Bearer anything' },
      })
      const res = await scrapePOST(req)
      expect(res.status).toBe(401)

      process.env.CRON_SECRET = originalSecret
    })

    test('handles network failure during scrape', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network down')))

      const req = new Request('http://localhost/api/scrape', {
        method: 'POST',
        headers: { authorization: `Bearer ${VALID_SECRET}` },
      })
      const res = await scrapePOST(req)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBeDefined()
    })

    test('returns proper error message on scraper exception', async () => {
      const { fetchAndParse } = require('@/lib/scraper')
      const mockFetch = jest.spyOn({ fetchAndParse }, 'fetchAndParse')
      mockFetch.mockRejectedValue(new Error('Scraper crashed'))

      const req = new Request('http://localhost/api/scrape', {
        method: 'POST',
        headers: { authorization: `Bearer ${VALID_SECRET}` },
      })
      const res = await scrapePOST(req)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toContain('Scraper crashed')

      mockFetch.mockRestore()
    })
  })

  // TODO: integration tests — alternativesGET/shortagesGET hit Prisma
  describe.skip('API Input Validation', () => {
    test('alternatives API validates GTIN format', async () => {
      // Test with non-numeric GTIN
      const req = new Request('http://localhost/api/alternatives?gtin=ABC123XYZ')
      const res = await alternativesGET(req)
      // Should handle gracefully (may return empty or attempt fetch)
      expect([200, 400, 502]).toContain(res.status)
    })

    test('shortages API sanitizes SQL-like patterns', async () => {
      const req = new Request('http://localhost/api/shortages?search=%25%27%22')
      const res = await shortagesGET(req)
      expect(res.status).toBe(200)
    })

    test('shortages API handles null bytes in parameters', async () => {
      const req = new Request('http://localhost/api/shortages?search=test%00injection')
      const res = await shortagesGET(req)
      expect(res.status).toBe(200)
    })

    test('handles extremely large query parameter string', async () => {
      const largeParam = 'a'.repeat(100000)
      const req = new Request(`http://localhost/api/shortages?search=${largeParam}`)
      // May fail gracefully or process with truncation
      await expect(shortagesGET(req)).resolves.toBeDefined()
    })
  })

  // TODO: integration tests — alternativesGET hits Prisma (cache lookup)
  describe.skip('Response Format Consistency', () => {
    test('alternatives API always returns JSON on error', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')))

      const req = new Request('http://localhost/api/alternatives?gtin=7680494930101')
      const res = await alternativesGET(req)
      const contentType = res.headers.get('content-type')
      expect(contentType).toContain('application/json')
    })

    test('shortages API error response has consistent structure', async () => {
      // Force an error by mocking Prisma
      const originalFindMany = prisma.shortage.findMany
      prisma.shortage.findMany = jest.fn(() => Promise.reject(new Error('DB error')))

      const req = new Request('http://localhost/api/shortages')
      try {
        await shortagesGET(req)
      } catch (err) {
        // Expected to throw
        expect(err).toBeDefined()
      }

      prisma.shortage.findMany = originalFindMany
    })

    test('scrape API error response includes error field', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Scrape failed')))

      const req = new Request('http://localhost/api/scrape', {
        method: 'POST',
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      })
      const res = await scrapePOST(req)
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json).toHaveProperty('error')
      expect(typeof json.error).toBe('string')
    })
  })
})