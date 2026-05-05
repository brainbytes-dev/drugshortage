// Mock next-intl/routing before any imports to avoid ESM parse errors
jest.mock('@/i18n/routing', () => ({
  routing: {
    locales: ['de', 'en', 'fr', 'it'],
    defaultLocale: 'de',
    pathnames: {
      '/': '/',
      '/methodik': { de: '/methodik', en: '/methodology', fr: '/methodologie', it: '/metodologia' },
      '/api': { de: '/api', en: '/api', fr: '/api', it: '/api' },
      '/api-docs': { de: '/api-docs', en: '/api-docs', fr: '/api-docs', it: '/api-docs' },
      '/klinik-system': { de: '/klinik-system', en: '/hospital-system', fr: '/systeme-clinique', it: '/sistema-clinico' },
      '/spenden': { de: '/spenden', en: '/donate', fr: '/faire-un-don', it: '/donare' },
      '/medikament/[slug]': { de: '/medikament/[slug]', en: '/medication/[slug]', fr: '/medicament/[slug]', it: '/farmaco/[slug]' },
    },
  },
}))

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

    // 1 homepage + 5 static pages (methodik, api, api-docs, klinik-system, spenden) + 2 drugs = 8
    expect(page).toHaveLength(8)
    expect(page[0]).toMatchObject({
      url: 'https://engpassradar.ch/',
      priority: 1,
      changeFrequency: 'hourly',
    })
    // Each entry now carries alternates.languages for i18n
    expect(page[0]).toHaveProperty('alternates.languages')
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
        // Page 0 uses 6 slots (1 homepage + 5 static), leaving 49994 drug slots.
        // Page 1 drug section starts at skip=49994.
        expect(args.skip).toBe(49994)
        expect(args.take).toBe(16)

        return Array.from({ length: 16 }, (_, index) => ({
          slug: `drug-${49994 + index}`,
          lastSeenAt: new Date('2026-04-29T10:00:00.000Z'),
        }))
      }

      return []
    })

    const page = await buildSitemapPage(1)

    expect(page).toHaveLength(16)
    expect(page[0].url).toBe('https://engpassradar.ch/medikament/drug-49994')
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
