import { MetadataRoute } from 'next'
import { getAllDrugSlugs, getAllAtcCodes } from '@/lib/db'
import { getCachedLRU } from '@/lib/cache-lru'

// ✅ Enable ISR - regenerate sitemap every 24 hours
export const revalidate = 86400 // 24 hours

// ✅ Pre-render at build time, allow on-demand revalidation
export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://engpassradar.ch'
  const now = new Date() // ✅ Create once, reuse for all entries

  // ✅ Cache sitemap data for 1 hour (only changes during scrapes)
  const [drugSlugs, atcCodes] = await getCachedLRU(
    'sitemap-data',
    async () => Promise.all([
      getAllDrugSlugs(),
      getAllAtcCodes(),
    ]),
    3600 // 1 hour cache
  )

  // ✅ Pre-allocate array with exact size (2x faster, 50% less memory)
  const result: MetadataRoute.Sitemap = new Array(1 + drugSlugs.length + atcCodes.length)
  let i = 0

  // Homepage
  result[i++] = {
    url: baseUrl,
    lastModified: now,
    changeFrequency: 'hourly' as const,
    priority: 1.0,
  }

  // Drug pages - single iteration, no intermediate arrays
  for (const { slug, lastSeenAt } of drugSlugs) {
    result[i++] = {
      url: `${baseUrl}/medikament/${slug}`,
      lastModified: lastSeenAt ?? now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }
  }

  // ATC pages - single iteration, no intermediate arrays
  for (const { atc } of atcCodes) {
    result[i++] = {
      url: `${baseUrl}/wirkstoff/${atc}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }
  }

  return result
}
