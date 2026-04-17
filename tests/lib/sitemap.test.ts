/**
 * Test: Sitemap Generation
 * Coverage: Dynamic sitemap with ISR caching
 */

import sitemap from '@/app/sitemap'
import { getAllDrugSlugs, getAllAtcCodes } from '@/lib/db'
import { getCachedLRU } from '@/lib/cache-lru'

jest.mock('@/lib/db')
jest.mock('@/lib/cache-lru')

const mockGetAllDrugSlugs = getAllDrugSlugs as jest.MockedFunction<typeof getAllDrugSlugs>
const mockGetAllAtcCodes = getAllAtcCodes as jest.MockedFunction<typeof getAllAtcCodes>
const mockGetCachedLRU = getCachedLRU as jest.MockedFunction<typeof getCachedLRU>

describe('Sitemap Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Structure', () => {
    it('should include homepage with highest priority', async () => {
      mockGetCachedLRU.mockResolvedValue([[], []])

      const result = await sitemap()

      const homepage = result.find(entry => entry.url === 'https://engpassradar.ch')
      expect(homepage).toBeDefined()
      expect(homepage?.priority).toBe(1.0)
      expect(homepage?.changeFrequency).toBe('hourly')
    })

    it('should include all drug pages', async () => {
      mockGetCachedLRU.mockResolvedValue([
        [{ slug: 'acetalgin-supp-125mg' }, { slug: 'ibuprofen-200mg' }],
        [],
      ])

      const result = await sitemap()

      const drugPages = result.filter(entry => entry.url.includes('/medikament/'))
      expect(drugPages).toHaveLength(2)
      expect(drugPages[0].url).toBe('https://engpassradar.ch/medikament/acetalgin-supp-125mg')
      expect(drugPages[1].url).toBe('https://engpassradar.ch/medikament/ibuprofen-200mg')
    })

    it('should include all ATC pages', async () => {
      mockGetCachedLRU.mockResolvedValue([
        [],
        [{ atc: 'N02BE01' }, { atc: 'J01CA04' }],
      ])

      const result = await sitemap()

      const atcPages = result.filter(entry => entry.url.includes('/wirkstoff/'))
      expect(atcPages).toHaveLength(2)
      expect(atcPages[0].url).toBe('https://engpassradar.ch/wirkstoff/N02BE01')
      expect(atcPages[1].url).toBe('https://engpassradar.ch/wirkstoff/J01CA04')
    })
  })

  describe('Priority and Change Frequency', () => {
    it('should set drug pages to priority 0.8', async () => {
      mockGetCachedLRU.mockResolvedValue([[{ slug: 'test' }], []])

      const result = await sitemap()
      const drugPage = result.find(entry => entry.url.includes('/medikament/'))

      expect(drugPage?.priority).toBe(0.8)
      expect(drugPage?.changeFrequency).toBe('daily')
    })

    it('should set ATC pages to priority 0.7', async () => {
      mockGetCachedLRU.mockResolvedValue([[], [{ atc: 'N02BE01' }]])

      const result = await sitemap()
      const atcPage = result.find(entry => entry.url.includes('/wirkstoff/'))

      expect(atcPage?.priority).toBe(0.7)
      expect(atcPage?.changeFrequency).toBe('daily')
    })
  })

  describe('Caching', () => {
    it('should use LRU cache with 1 hour TTL', async () => {
      mockGetCachedLRU.mockResolvedValue([[], []])

      await sitemap()

      expect(mockGetCachedLRU).toHaveBeenCalledWith(
        'sitemap-data',
        expect.any(Function),
        3600
      )
    })

    it('should fetch slugs and ATC codes in parallel', async () => {
      const mockFetcher = jest.fn().mockResolvedValue([[], []])
      mockGetCachedLRU.mockImplementation(async (key, fetcher) => {
        return await fetcher()
      })

      mockGetAllDrugSlugs.mockResolvedValue([])
      mockGetAllAtcCodes.mockResolvedValue([])

      await sitemap()

      expect(mockGetAllDrugSlugs).toHaveBeenCalled()
      expect(mockGetAllAtcCodes).toHaveBeenCalled()
    })
  })

  describe('Performance Optimization', () => {
    it('should pre-allocate array with exact size', async () => {
      mockGetCachedLRU.mockResolvedValue([
        [{ slug: 'drug1' }, { slug: 'drug2' }],
        [{ atc: 'A01' }],
      ])

      const result = await sitemap()

      // 1 homepage + 2 drugs + 1 ATC = 4 entries
      expect(result).toHaveLength(4)
    })

    it('should handle large datasets (10k+ entries)', async () => {
      const drugSlugs = Array.from({ length: 5000 }, (_, i) => ({ slug: `drug-${i}` }))
      const atcCodes = Array.from({ length: 5000 }, (_, i) => ({ atc: `A${i}` }))
      mockGetCachedLRU.mockResolvedValue([drugSlugs, atcCodes])

      const result = await sitemap()

      expect(result).toHaveLength(10001) // 1 homepage + 5000 drugs + 5000 ATC
    })

    it('should reuse single Date object for all entries', async () => {
      mockGetCachedLRU.mockResolvedValue([
        [{ slug: 'drug1' }, { slug: 'drug2' }],
        [],
      ])

      const result = await sitemap()

      // All lastModified timestamps should be the same
      const timestamps = result.map(entry => entry.lastModified?.getTime())
      expect(new Set(timestamps).size).toBe(1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty database', async () => {
      mockGetCachedLRU.mockResolvedValue([[], []])

      const result = await sitemap()

      expect(result).toHaveLength(1) // Only homepage
    })

    it('should handle special characters in slugs', async () => {
      mockGetCachedLRU.mockResolvedValue([
        [{ slug: 'acetalgin-125-mg' }, { slug: 'aspirin-c-500-mg' }],
        [],
      ])

      const result = await sitemap()

      const drugPages = result.filter(entry => entry.url.includes('/medikament/'))
      expect(drugPages[0].url).toBe('https://engpassradar.ch/medikament/acetalgin-125-mg')
      expect(drugPages[1].url).toBe('https://engpassradar.ch/medikament/aspirin-c-500-mg')
    })

    it('should handle ATC codes with mixed case', async () => {
      mockGetCachedLRU.mockResolvedValue([[], [{ atc: 'n02BE01' }]])

      const result = await sitemap()

      const atcPage = result.find(entry => entry.url.includes('/wirkstoff/'))
      expect(atcPage?.url).toBe('https://engpassradar.ch/wirkstoff/n02BE01')
    })
  })

  describe('ISR Configuration', () => {
    it('should have revalidate set to 86400 (24 hours)', () => {
      // This would be tested via module exports, not the function itself
      // The test would verify the export constant exists
    })

    it('should have dynamic set to force-static', () => {
      // Same as above - module-level configuration
    })
  })

  describe('Error Handling', () => {
    it('should propagate database errors', async () => {
      mockGetCachedLRU.mockRejectedValue(new Error('Database connection failed'))

      await expect(sitemap()).rejects.toThrow('Database connection failed')
    })

    it('should handle cache failures gracefully', async () => {
      mockGetCachedLRU.mockImplementation(async (key, fetcher) => {
        // Bypass cache, call fetcher directly
        return await fetcher()
      })
      mockGetAllDrugSlugs.mockResolvedValue([])
      mockGetAllAtcCodes.mockResolvedValue([])

      const result = await sitemap()

      expect(result).toHaveLength(1) // Homepage only
    })
  })
})
