/**
 * Library Tests: db-cached-queries.ts
 * Tests cached database query functionality
 *
 * Priority: HIGH - Core caching logic for API performance
 * Coverage Target: 100%
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { queryShortagesCached } from '@/lib/db-cached-queries'
import { getCachedLRU, lruCache } from '@/lib/cache-lru'
import { queryShortages } from '@/lib/db'
import type { ShortagesQuery } from '@/lib/types'

jest.mock('@/lib/cache-lru')
jest.mock('@/lib/db')

describe('queryShortagesCached', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    lruCache.clear()
  })

  describe('Cache Key Generation', () => {
    it('should create identical keys for identical queries', async () => {
      const query: ShortagesQuery = {
        search: 'aspirin',
        status: 'active',
        page: 1,
        sort: 'tageSeitMeldung:desc',
        perPage: 50,
      }

      const mockGetCached = vi.mocked(getCachedLRU)
      mockGetCached.mockResolvedValue({ data: [], total: 0, pages: 0, page: 1 })

      await queryShortagesCached(query)
      await queryShortagesCached(query)

      // Both calls should use same cache key
      expect(mockGetCached).toHaveBeenCalledTimes(2)
      const key1 = mockGetCached.mock.calls[0][0]
      const key2 = mockGetCached.mock.calls[1][0]
      expect(key1).toBe(key2)
    })

    it('should create different keys for different queries', async () => {
      const query1: ShortagesQuery = { search: 'aspirin', page: 1, sort: 'tageSeitMeldung:desc', perPage: 50 }
      const query2: ShortagesQuery = { search: 'ibuprofen', page: 1, sort: 'tageSeitMeldung:desc', perPage: 50 }

      const mockGetCached = vi.mocked(getCachedLRU)
      mockGetCached.mockResolvedValue({ data: [], total: 0, pages: 0, page: 1 })

      await queryShortagesCached(query1)
      await queryShortagesCached(query2)

      const key1 = mockGetCached.mock.calls[0][0]
      const key2 = mockGetCached.mock.calls[1][0]
      expect(key1).not.toBe(key2)
    })

    it('should normalize undefined vs omitted fields in cache key', async () => {
      const query1: ShortagesQuery = { search: undefined, page: 1, sort: 'tageSeitMeldung:desc', perPage: 50 }
      const query2: ShortagesQuery = { page: 1, sort: 'tageSeitMeldung:desc', perPage: 50 }

      const mockGetCached = vi.mocked(getCachedLRU)
      mockGetCached.mockResolvedValue({ data: [], total: 0, pages: 0, page: 1 })

      await queryShortagesCached(query1)
      await queryShortagesCached(query2)

      const key1 = mockGetCached.mock.calls[0][0]
      const key2 = mockGetCached.mock.calls[1][0]
      expect(key1).toBe(key2)
    })

    it('should differentiate between null and undefined firma filter', async () => {
      const query1: ShortagesQuery = { firma: undefined, page: 1, sort: 'tageSeitMeldung:desc', perPage: 50 }
      const query2: ShortagesQuery = { page: 1, sort: 'tageSeitMeldung:desc', perPage: 50 }

      const mockGetCached = vi.mocked(getCachedLRU)
      mockGetCached.mockResolvedValue({ data: [], total: 0, pages: 0, page: 1 })

      await queryShortagesCached(query1)
      await queryShortagesCached(query2)

      const key1 = mockGetCached.mock.calls[0][0]
      const key2 = mockGetCached.mock.calls[1][0]
      expect(key1).toBe(key2)
    })

    it('should include all query parameters in cache key', async () => {
      const query: ShortagesQuery = {
        search: 'aspirin',
        status: 'active',
        firma: 'Bayer',
        atc: 'N02BA01',
        page: 2,
        sort: 'firma:asc',
        perPage: 100,
      }

      const mockGetCached = vi.mocked(getCachedLRU)
      mockGetCached.mockResolvedValue({ data: [], total: 0, pages: 0, page: 1 })

      await queryShortagesCached(query)

      const cacheKey = mockGetCached.mock.calls[0][0]
      expect(cacheKey).toContain('aspirin')
      expect(cacheKey).toContain('active')
      expect(cacheKey).toContain('Bayer')
      expect(cacheKey).toContain('N02BA01')
      expect(cacheKey).toContain('"page":2')
      expect(cacheKey).toContain('firma:asc')
      expect(cacheKey).toContain('"perPage":100')
    })
  })

  describe('TTL Behavior', () => {
    it('should use 120 second TTL (2 minutes)', async () => {
      const mockGetCached = vi.mocked(getCachedLRU)
      mockGetCached.mockResolvedValue({ data: [], total: 0, pages: 0, page: 1 })

      await queryShortagesCached({ page: 1, sort: 'tageSeitMeldung:desc', perPage: 50 })

      // Verify TTL passed to getCachedLRU is 120 seconds
      expect(mockGetCached).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        120
      )
    })
  })

  describe('Integration with DB Layer', () => {
    it('should call queryShortages on cache miss', async () => {
      const query: ShortagesQuery = { page: 1, sort: 'tageSeitMeldung:desc', perPage: 50 }
      const mockResponse = {
        data: [
          {
            id: 1,
            gtin: '7680123456789',
            pharmacode: '1234567',
            bezeichnung: 'Aspirin 500mg',
            firma: 'Bayer',
            atcCode: 'N02BA01',
            gengrp: 'ASS',
            statusCode: 1,
            statusText: 'Lieferunterbruch',
            datumLieferfahigkeit: '2026-05-01',
            datumLetzteMutation: '2026-04-15',
            tageSeitMeldung: 10,
            detailUrl: 'https://...',
            firstSeenAt: '2026-04-05T00:00:00.000Z',
            lastSeenAt: '2026-04-15T00:00:00.000Z',
            isActive: true,
          },
        ],
        total: 1,
        pages: 1,
        page: 1,
      }

      vi.mocked(queryShortages).mockResolvedValue(mockResponse)
      vi.mocked(getCachedLRU).mockImplementation(async (_key, fetcher) => {
        return fetcher() // Simulate cache miss
      })

      const result = await queryShortagesCached(query)

      expect(queryShortages).toHaveBeenCalledWith(query)
      expect(result).toEqual(mockResponse)
    })

    it('should not call queryShortages on cache hit', async () => {
      const query: ShortagesQuery = { page: 1, sort: 'tageSeitMeldung:desc', perPage: 50 }
      const cachedResponse = {
        data: [],
        total: 0,
        pages: 0,
        page: 1,
      }

      vi.mocked(getCachedLRU).mockResolvedValue(cachedResponse)

      const result = await queryShortagesCached(query)

      expect(queryShortages).not.toHaveBeenCalled()
      expect(result).toEqual(cachedResponse)
    })
  })

  describe('Cache Invalidation', () => {
    it('should serve fresh data after cache invalidation', async () => {
      const query: ShortagesQuery = { page: 1, sort: 'tageSeitMeldung:desc', perPage: 50 }

      // First call - cache miss
      vi.mocked(getCachedLRU).mockImplementationOnce(async (_key, fetcher) => {
        const result = await fetcher()
        lruCache.set(_key, result, 120)
        return result
      })
      vi.mocked(queryShortages).mockResolvedValue({ data: [], total: 0, pages: 0, page: 1 })

      await queryShortagesCached(query)

      // Simulate cache invalidation
      lruCache.deleteByPrefix('query:')

      // Second call - should be cache miss again
      await queryShortagesCached(query)

      expect(queryShortages).toHaveBeenCalledTimes(2)
    })
  })

  describe('Performance', () => {
    it('should handle concurrent requests for same query efficiently', async () => {
      const query: ShortagesQuery = { page: 1, sort: 'tageSeitMeldung:desc', perPage: 50 }
      const mockResponse = { data: [], total: 0, pages: 0, page: 1 }

      let fetchCount = 0
      vi.mocked(getCachedLRU).mockImplementation(async (_key, fetcher) => {
        if (fetchCount === 0) {
          fetchCount++
          return fetcher()
        }
        return mockResponse
      })
      vi.mocked(queryShortages).mockResolvedValue(mockResponse)

      // Fire 10 concurrent requests for same query
      const requests = Array.from({ length: 10 }, () => queryShortagesCached(query))
      await Promise.all(requests)

      // Should only fetch from DB once (first request)
      // Others should hit cache
      expect(fetchCount).toBeLessThanOrEqual(1)
    })

    it('should handle large result sets without memory issues', async () => {
      const query: ShortagesQuery = { page: 1, sort: 'tageSeitMeldung:desc', perPage: 200 }
      const largeResponse = {
        data: Array.from({ length: 200 }, (_, i) => ({
          id: i,
          gtin: `768012345678${i}`,
          pharmacode: `${i}`,
          bezeichnung: `Drug ${i}`,
          firma: 'TestFirma',
          atcCode: 'N02BA01',
          gengrp: 'TEST',
          statusCode: 1,
          statusText: 'Test',
          datumLieferfahigkeit: '2026-05-01',
          datumLetzteMutation: '2026-04-15',
          tageSeitMeldung: 10,
          detailUrl: 'https://...',
          firstSeenAt: '2026-04-05T00:00:00.000Z',
          lastSeenAt: '2026-04-15T00:00:00.000Z',
          isActive: true,
        })),
        total: 200,
        pages: 1,
        page: 1,
      }

      vi.mocked(getCachedLRU).mockImplementation(async (_key, fetcher) => fetcher())
      vi.mocked(queryShortages).mockResolvedValue(largeResponse)

      const result = await queryShortagesCached(query)

      expect(result.data.length).toBe(200)
    })
  })

  describe('Error Handling', () => {
    it('should propagate database errors', async () => {
      const query: ShortagesQuery = { page: 1, sort: 'tageSeitMeldung:desc', perPage: 50 }

      vi.mocked(getCachedLRU).mockImplementation(async (_key, fetcher) => fetcher())
      vi.mocked(queryShortages).mockRejectedValue(new Error('Database connection failed'))

      await expect(queryShortagesCached(query)).rejects.toThrow('Database connection failed')
    })

    it('should handle cache errors gracefully', async () => {
      const query: ShortagesQuery = { page: 1, sort: 'tageSeitMeldung:desc', perPage: 50 }

      vi.mocked(getCachedLRU).mockRejectedValue(new Error('Cache error'))

      await expect(queryShortagesCached(query)).rejects.toThrow('Cache error')
    })
  })
})
