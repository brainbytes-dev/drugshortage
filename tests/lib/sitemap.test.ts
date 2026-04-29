import {
  buildSitemapIndexXml,
  buildSitemapPage,
  generateSitemapIds,
  getSitemapPartUrl,
} from '@/lib/sitemap'
import { getCachedLRU } from '@/lib/cache-lru'
import { prisma } from '@/lib/prisma-optimized'

jest.mock('@/lib/cache-lru', () => ({
  getCachedLRU: jest.fn(),
}))

jest.mock('@/lib/prisma-optimized', () => ({
  prisma: {
    shortage: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    offMarketDrug: {
      groupBy: jest.fn(),
    },
  },
}))

describe('lib/sitemap', () => {
  const mockGetCachedLRU = getCachedLRU as jest.MockedFunction<typeof getCachedLRU>
  const mockShortageCount = prisma.shortage.count as jest.Mock
  const mockShortageGroupBy = prisma.shortage.groupBy as jest.Mock
  const mockShortageFindMany = prisma.shortage.findMany as jest.Mock
  const mockOffMarketGroupBy = prisma.offMarketDrug.groupBy as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCachedLRU.mockImplementation(async (_key, fetcher) => fetcher())
    mockShortageGroupBy.mockResolvedValue([])
    mockShortageFindMany.mockResolvedValue([])
    mockOffMarketGroupBy.mockResolvedValue([])
  })

  it('should split sitemap ids once the 50k URL limit is exceeded', async () => {
    mockShortageCount.mockResolvedValue(50010)

    await expect(generateSitemapIds()).resolves.toEqual([{ id: 0 }, { id: 1 }])
  })

  it('should keep homepage and static pages in the first sitemap chunk', async () => {
    const lastSeenAt = new Date('2026-04-29T10:00:00.000Z')
    mockShortageCount.mockResolvedValue(2)
    mockShortageFindMany.mockImplementation(async (args?: { select?: Record<string, unknown> }) => {
      if (args?.select?.slug) {
        return [
          { slug: 'aspirin-500mg', lastSeenAt },
          { slug: 'ibuprofen-400mg', lastSeenAt },
        ]
      }

      return []
    })

    const page = await buildSitemapPage(0)

    expect(page).toHaveLength(7)
    expect(page[0]).toMatchObject({
      url: 'https://engpassradar.ch',
      priority: 1,
      changeFrequency: 'hourly',
    })
    expect(page).toContainEqual(
      expect.objectContaining({
        url: 'https://engpassradar.ch/medikament/aspirin-500mg',
        priority: 0.8,
        changeFrequency: 'daily',
      })
    )
  })

  it('should continue drug URLs on later sitemap chunks without repeating static pages', async () => {
    mockShortageCount.mockResolvedValue(50010)
    mockShortageFindMany.mockImplementation(async (args?: { select?: Record<string, unknown>; skip?: number; take?: number }) => {
      if (args?.select?.slug) {
        expect(args.skip).toBe(49995)
        expect(args.take).toBe(15)

        return Array.from({ length: 15 }, (_, index) => ({
          slug: `drug-${49995 + index}`,
          lastSeenAt: new Date('2026-04-29T10:00:00.000Z'),
        }))
      }

      return []
    })

    const page = await buildSitemapPage(1)

    expect(page).toHaveLength(15)
    expect(page[0].url).toBe('https://engpassradar.ch/medikament/drug-49995')
    expect(page.some((entry) => entry.url === 'https://engpassradar.ch')).toBe(false)
  })

  it('should render a sitemap index that points to each child sitemap', async () => {
    mockShortageCount.mockResolvedValue(50010)

    const xml = await buildSitemapIndexXml()

    expect(xml).toContain('<sitemapindex')
    expect(xml).toContain(getSitemapPartUrl(0))
    expect(xml).toContain(getSitemapPartUrl(1))
  })
})
