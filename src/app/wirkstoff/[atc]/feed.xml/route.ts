import { getShortagesByAtc } from '@/lib/db'
import { toSlug } from '@/lib/slug'
import type { Shortage } from '@/lib/types'

const BASE_URL = 'https://engpassradar.ch'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function shortageToItem(s: Shortage): string {
  const slug = toSlug(s.bezeichnung)
  const link = `${BASE_URL}/medikament/${slug}`
  const pubDate = new Date(Date.now() - s.tageSeitMeldung * 86400000).toUTCString()
  const title = escapeXml(`${s.bezeichnung} (${s.firma})`)
  const description = escapeXml(
    `Status ${s.statusCode} — Lieferbar ab: ${s.datumLieferfahigkeit} — ATC: ${s.atcCode}`
  )

  return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${link}</guid>
    </item>`
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ atc: string }> }
): Promise<Response> {
  const { atc } = await params
  const shortages = await getShortagesByAtc(atc)

  const items = shortages.map(shortageToItem).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(`engpass.radar — ATC ${atc} Engpässe`)}</title>
    <link>${BASE_URL}</link>
    <description>Aktuelle Lieferengpässe für Arzneimittel in der Schweiz</description>
    <language>de</language>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
