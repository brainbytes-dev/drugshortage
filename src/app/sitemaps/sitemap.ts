import type { MetadataRoute } from 'next'
import {
  buildSitemapPage,
  generateSitemapIds,
} from '@/lib/sitemap'

export const revalidate = 86400

export async function generateSitemaps(): Promise<Array<{ id: number }>> {
  return generateSitemapIds()
}

export default async function sitemap(props: {
  id: Promise<string>
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id)

  if (!Number.isInteger(id) || id < 0) {
    return []
  }

  return buildSitemapPage(id)
}
