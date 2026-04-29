import sitemap, { generateSitemaps, revalidate } from '@/app/sitemaps/sitemap'
import { buildSitemapPage, generateSitemapIds } from '@/lib/sitemap'

jest.mock('@/lib/sitemap', () => ({
  buildSitemapPage: jest.fn(),
  generateSitemapIds: jest.fn(),
  SITEMAP_REVALIDATE_SECONDS: 86400,
}))

describe('app/sitemaps/sitemap', () => {
  const mockBuildSitemapPage = buildSitemapPage as jest.MockedFunction<typeof buildSitemapPage>
  const mockGenerateSitemapIds = generateSitemapIds as jest.MockedFunction<typeof generateSitemapIds>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should revalidate every 24 hours', () => {
    expect(revalidate).toBe(86400)
  })

  it('should expose generated sitemap ids', async () => {
    mockGenerateSitemapIds.mockResolvedValue([{ id: 0 }, { id: 1 }])

    await expect(generateSitemaps()).resolves.toEqual([{ id: 0 }, { id: 1 }])
  })

  it('should delegate valid ids to the page builder', async () => {
    const page = [{ url: 'https://engpassradar.ch' }]
    mockBuildSitemapPage.mockResolvedValue(page)

    await expect(sitemap({ id: Promise.resolve('3') })).resolves.toEqual(page)
    expect(mockBuildSitemapPage).toHaveBeenCalledWith(3)
  })

  it('should return an empty sitemap for invalid ids', async () => {
    await expect(sitemap({ id: Promise.resolve('not-a-number') })).resolves.toEqual([])
    expect(mockBuildSitemapPage).not.toHaveBeenCalled()
  })
})
