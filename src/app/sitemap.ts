import { MetadataRoute } from 'next'
import { getAllDrugSlugs, getAllAtcCodes } from '@/lib/db'
import { getCachedLRU } from '@/lib/cache-lru'
import { getAllPosts } from '@/lib/blog'

// ✅ Enable ISR - regenerate sitemap every 24 hours
export const revalidate = 86400 // 24 hours

const STATIC_PAGES = [
  { path: '/blog',              priority: 0.8, changeFrequency: 'weekly'  as const },
  { path: '/methodik',          priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/datenschutz',       priority: 0.3, changeFrequency: 'monthly' as const },
  { path: '/nutzungsbedingungen', priority: 0.3, changeFrequency: 'monthly' as const },
  { path: '/api-docs',          priority: 0.5, changeFrequency: 'monthly' as const },
]

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

  const blogPosts = getAllPosts()

  // ✅ Pre-allocate array with exact size
  const result: MetadataRoute.Sitemap = new Array(
    1 + STATIC_PAGES.length + blogPosts.length + drugSlugs.length + atcCodes.length
  )
  let i = 0

  // Homepage
  result[i++] = {
    url: baseUrl,
    lastModified: now,
    changeFrequency: 'hourly' as const,
    priority: 1.0,
  }

  // Static pages
  for (const page of STATIC_PAGES) {
    result[i++] = {
      url: `${baseUrl}${page.path}`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    }
  }

  // Blog posts
  for (const post of blogPosts) {
    result[i++] = {
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : (post.date ? new Date(post.date) : now),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }
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
  for (const { atc, lastSeenAt } of atcCodes) {
    result[i++] = {
      url: `${baseUrl}/wirkstoff/${atc}`,
      lastModified: lastSeenAt ?? now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }
  }

  return result
}
