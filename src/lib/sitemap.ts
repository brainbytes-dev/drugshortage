import type { MetadataRoute } from 'next'
import { getCachedLRU } from './cache-lru'
import { prisma } from './prisma-optimized'
import { toSlug } from './slug'

export const SITEMAP_BASE_URL = 'https://engpassradar.ch'
export const SITEMAP_REVALIDATE_SECONDS = 86400
export const SITEMAP_URL_LIMIT = 50000

const SITEMAP_CACHE_TTL_SECONDS = 3600

const STATIC_PAGES = [
  { path: '/methodik', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/datenschutz', priority: 0.3, changeFrequency: 'monthly' as const },
  { path: '/nutzungsbedingungen', priority: 0.3, changeFrequency: 'monthly' as const },
  { path: '/api-docs', priority: 0.5, changeFrequency: 'monthly' as const },
]

type SitemapCounts = {
  drugs: number
  atcCodes: number
  firms: number
  gtins: number
}

type SectionSlice = {
  skip: number
  take: number
} | null

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function getSectionSlice(
  pageStart: number,
  pageEnd: number,
  sectionStart: number,
  sectionCount: number
): SectionSlice {
  const overlapStart = Math.max(pageStart, sectionStart)
  const overlapEnd = Math.min(pageEnd, sectionStart + sectionCount)

  if (overlapStart >= overlapEnd) return null

  return {
    skip: overlapStart - sectionStart,
    take: overlapEnd - overlapStart,
  }
}

async function getFirmaEntries(): Promise<Array<{ slug: string; firma: string }>> {
  return getCachedLRU(
    'sitemap:firms',
    async () => {
      const rows = await prisma.shortage.findMany({
        where: { isActive: true, statusCode: { gte: 1, lte: 5 } },
        select: { firma: true },
        distinct: ['firma'],
        orderBy: { firma: 'asc' },
      })

      const seen = new Set<string>()
      const result: Array<{ slug: string; firma: string }> = []

      for (const row of rows) {
        const slug = toSlug(row.firma)
        if (!slug || seen.has(slug)) continue
        seen.add(slug)
        result.push({ slug, firma: row.firma })
      }

      result.sort((a, b) => a.slug.localeCompare(b.slug))
      return result
    },
    SITEMAP_CACHE_TTL_SECONDS
  )
}

async function getSitemapCounts(): Promise<SitemapCounts> {
  return getCachedLRU(
    'sitemap:counts',
    async () => {
      const [drugs, atcGroups, firms, gtinGroups] = await Promise.all([
        prisma.shortage.count({
          where: { isActive: true, slug: { not: null } },
        }),
        prisma.shortage.groupBy({
          by: ['atcCode'],
          where: { isActive: true },
          orderBy: { atcCode: 'asc' },
        }),
        getFirmaEntries(),
        prisma.offMarketDrug.groupBy({
          by: ['gtin'],
          orderBy: { gtin: 'asc' },
        }),
      ])

      return {
        drugs,
        atcCodes: atcGroups.length,
        firms: firms.length,
        gtins: gtinGroups.length,
      }
    },
    SITEMAP_CACHE_TTL_SECONDS
  )
}

async function getDrugEntriesPage(skip: number, take: number) {
  return prisma.shortage.findMany({
    where: { isActive: true, slug: { not: null } },
    select: { slug: true, lastSeenAt: true },
    orderBy: { slug: 'asc' },
    skip,
    take,
  })
}

async function getAtcEntriesPage(skip: number, take: number) {
  return prisma.shortage.groupBy({
    by: ['atcCode'],
    where: { isActive: true },
    _max: { lastSeenAt: true },
    orderBy: { atcCode: 'asc' },
    skip,
    take,
  })
}

async function getGtinEntriesPage(skip: number, take: number) {
  return prisma.offMarketDrug.groupBy({
    by: ['gtin'],
    _max: { fetchedAt: true },
    orderBy: { gtin: 'asc' },
    skip,
    take,
  })
}

export async function getTotalSitemapUrlCount(): Promise<number> {
  const counts = await getSitemapCounts()
  return 1 + STATIC_PAGES.length + counts.drugs + counts.atcCodes + counts.firms + counts.gtins
}

export async function generateSitemapIds(): Promise<Array<{ id: number }>> {
  const totalUrls = await getTotalSitemapUrlCount()
  const pageCount = Math.max(1, Math.ceil(totalUrls / SITEMAP_URL_LIMIT))
  return Array.from({ length: pageCount }, (_, id) => ({ id }))
}

export function getSitemapPartUrl(id: number): string {
  return `${SITEMAP_BASE_URL}/sitemaps/sitemap/${id}.xml`
}

export async function buildSitemapPage(id: number): Promise<MetadataRoute.Sitemap> {
  if (!Number.isInteger(id) || id < 0) return []

  const counts = await getSitemapCounts()
  const totalUrls = 1 + STATIC_PAGES.length + counts.drugs + counts.atcCodes + counts.firms + counts.gtins
  const pageStart = id * SITEMAP_URL_LIMIT
  const pageEnd = pageStart + SITEMAP_URL_LIMIT

  if (pageStart >= totalUrls) return []

  let sectionStart = 0

  const homepageSlice = getSectionSlice(pageStart, pageEnd, sectionStart, 1)
  sectionStart += 1

  const staticSlice = getSectionSlice(pageStart, pageEnd, sectionStart, STATIC_PAGES.length)
  sectionStart += STATIC_PAGES.length

  const drugSlice = getSectionSlice(pageStart, pageEnd, sectionStart, counts.drugs)
  sectionStart += counts.drugs

  const atcSlice = getSectionSlice(pageStart, pageEnd, sectionStart, counts.atcCodes)
  sectionStart += counts.atcCodes

  const firmSlice = getSectionSlice(pageStart, pageEnd, sectionStart, counts.firms)
  sectionStart += counts.firms

  const gtinSlice = getSectionSlice(pageStart, pageEnd, sectionStart, counts.gtins)

  const [drugEntries, atcEntries, firmEntries, gtinEntries] = await Promise.all([
    drugSlice ? getDrugEntriesPage(drugSlice.skip, drugSlice.take) : Promise.resolve([]),
    atcSlice ? getAtcEntriesPage(atcSlice.skip, atcSlice.take) : Promise.resolve([]),
    firmSlice ? getFirmaEntries().then((rows) => rows.slice(firmSlice.skip, firmSlice.skip + firmSlice.take)) : Promise.resolve([]),
    gtinSlice ? getGtinEntriesPage(gtinSlice.skip, gtinSlice.take) : Promise.resolve([]),
  ])

  const now = new Date()
  const result: MetadataRoute.Sitemap = []

  if (homepageSlice) {
    result.push({
      url: SITEMAP_BASE_URL,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1,
    })
  }

  if (staticSlice) {
    for (const page of STATIC_PAGES.slice(staticSlice.skip, staticSlice.skip + staticSlice.take)) {
      result.push({
        url: `${SITEMAP_BASE_URL}${page.path}`,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      })
    }
  }

  for (const entry of drugEntries) {
    result.push({
      url: `${SITEMAP_BASE_URL}/medikament/${entry.slug}`,
      lastModified: entry.lastSeenAt ?? now,
      changeFrequency: 'daily',
      priority: 0.8,
    })
  }

  for (const entry of atcEntries) {
    result.push({
      url: `${SITEMAP_BASE_URL}/wirkstoff/${entry.atcCode}`,
      lastModified: entry._max.lastSeenAt ?? now,
      changeFrequency: 'daily',
      priority: 0.7,
    })
  }

  for (const entry of firmEntries) {
    result.push({
      url: `${SITEMAP_BASE_URL}/firma/${entry.slug}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.6,
    })
  }

  for (const entry of gtinEntries) {
    result.push({
      url: `${SITEMAP_BASE_URL}/gtin/${entry.gtin}`,
      lastModified: entry._max.fetchedAt ?? now,
      changeFrequency: 'weekly',
      priority: 0.5,
    })
  }

  return result
}

export async function buildSitemapIndexXml(): Promise<string> {
  const sitemapIds = await generateSitemapIds()
  const lastModified = new Date().toISOString()
  const body = sitemapIds
    .map(({ id }) => {
      const loc = escapeXml(getSitemapPartUrl(id))
      return `  <sitemap>\n    <loc>${loc}</loc>\n    <lastmod>${lastModified}</lastmod>\n  </sitemap>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`
}
