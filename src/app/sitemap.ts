import { MetadataRoute } from 'next'
import { getAllDrugSlugs, getAllAtcCodes } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://engpassradar.ch'

  const [drugSlugs, atcCodes] = await Promise.all([
    getAllDrugSlugs(),
    getAllAtcCodes(),
  ])

  const drugUrls = drugSlugs.map(({ slug }) => ({
    url: `${baseUrl}/medikament/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  const atcUrls = atcCodes.map(({ atc }) => ({
    url: `${baseUrl}/wirkstoff/${atc}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 1.0,
    },
    ...drugUrls,
    ...atcUrls,
  ]
}
