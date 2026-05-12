import type { MetadataRoute } from 'next'
import { getCachedLRU } from './cache-lru'
import { prisma } from './prisma-optimized'
import { toSlug } from './slug'
import { buildLocaleUrl, LOCALE_HREFLANG, SITE_URL } from './i18n-meta'
import { routing } from '@/i18n/routing'

export const SITEMAP_BASE_URL = SITE_URL
export const SITEMAP_REVALIDATE_SECONDS = 86400
// Sitemap spec allows 50k URLs per file. With 4 hreflang alternates per
// URL each entry is ~5x larger, which pushes a 50k chunk over Vercel's
// 19 MB ISR fallback limit (was 31.88 MB → FALLBACK_BODY_TOO_LARGE).
// 10k URLs ≈ 6.4 MB per chunk — comfortable headroom for growth.
export const SITEMAP_URL_LIMIT = 10000

const SITEMAP_CACHE_TTL_SECONDS = 3600

type StaticHref =
  | '/'
  | '/methodik'
  | '/api-docs'
  | '/api'
  | '/klinik-system'
  | '/spenden'

// Only indexed pages belong in the sitemap. The legal pages (datenschutz,
// impressum, nutzungsbedingungen) and transactional pages (danke,
// subscription-confirmed, api-keys/success) are noindex and intentionally
// excluded.
const STATIC_PAGES: Array<{
  href: StaticHref
  priority: number
  changeFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
}> = [
  { href: '/methodik', priority: 0.7, changeFrequency: 'monthly' },
  { href: '/api', priority: 0.6, changeFrequency: 'monthly' },
  { href: '/api-docs', priority: 0.5, changeFrequency: 'monthly' },
  { href: '/klinik-system', priority: 0.6, changeFrequency: 'monthly' },
  { href: '/spenden', priority: 0.4, changeFrequency: 'monthly' },
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

/**
 * For a given canonical href, return the default-locale URL and the
 * `alternates.languages` map for all configured locales plus `x-default`.
 * Wrapper around the shared helper in `i18n-meta.ts`, kept here so the
 * sitemap call sites stay terse.
 */
function withAlternates(href: string, params?: Record<string, string>): {
  url: string
  alternates: Record<string, string>
} {
  const alternates: Record<string, string> = {}
  for (const locale of routing.locales) {
    alternates[LOCALE_HREFLANG[locale]] = buildLocaleUrl(href, locale, params)
  }
  const url = alternates[LOCALE_HREFLANG[routing.defaultLocale]]
  alternates['x-default'] = url
  return { url, alternates }
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
    const { url, alternates } = withAlternates('/')
    result.push({
      url,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1,
      alternates: { languages: alternates },
    })
  }

  if (staticSlice) {
    for (const page of STATIC_PAGES.slice(staticSlice.skip, staticSlice.skip + staticSlice.take)) {
      const { url, alternates } = withAlternates(page.href)
      result.push({
        url,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: { languages: alternates },
      })
    }
  }

  for (const entry of drugEntries) {
    if (!entry.slug) continue
    const { url, alternates } = withAlternates('/medikament/[slug]', { slug: entry.slug })
    result.push({
      url,
      lastModified: entry.lastSeenAt ?? now,
      changeFrequency: 'daily',
      priority: 0.8,
      alternates: { languages: alternates },
    })
  }

  for (const entry of atcEntries) {
    const { url, alternates } = withAlternates('/wirkstoff/[atc]', { atc: entry.atcCode })
    result.push({
      url,
      lastModified: entry._max.lastSeenAt ?? now,
      changeFrequency: 'daily',
      priority: 0.7,
      alternates: { languages: alternates },
    })
  }

  for (const entry of firmEntries) {
    const { url, alternates } = withAlternates('/firma/[slug]', { slug: entry.slug })
    result.push({
      url,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.6,
      alternates: { languages: alternates },
    })
  }

  for (const entry of gtinEntries) {
    const { url, alternates } = withAlternates('/gtin/[gtin]', { gtin: entry.gtin })
    result.push({
      url,
      lastModified: entry._max.fetchedAt ?? now,
      changeFrequency: 'weekly',
      priority: 0.5,
      alternates: { languages: alternates },
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
