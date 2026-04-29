import {
  buildSitemapIndexXml,
  SITEMAP_REVALIDATE_SECONDS,
} from '@/lib/sitemap'

const XML_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': `public, s-maxage=${SITEMAP_REVALIDATE_SECONDS}, stale-while-revalidate=${SITEMAP_REVALIDATE_SECONDS}`,
}

export async function GET(): Promise<Response> {
  try {
    const xml = await buildSitemapIndexXml()
    return new Response(xml, { headers: XML_HEADERS })
  } catch {
    return new Response('Sitemap temporarily unavailable', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
