import type { Shortage } from './types'
import { toSlug } from './slug'

const BASE_URL = 'https://engpassradar.ch'

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function shortageToItem(s: Shortage): string {
  const slug = toSlug(s.bezeichnung) || s.gtin  // fallback to gtin if slug is empty
  const link = escapeXml(`${BASE_URL}/medikament/${slug}`)
  const pubDate = new Date(Date.now() - Math.max(0, s.tageSeitMeldung) * 86400000).toUTCString()
  return `
    <item>
      <title>${escapeXml(`${s.bezeichnung} (${s.firma})`)}</title>
      <link>${link}</link>
      <description>${escapeXml(`Status ${s.statusCode} — Lieferbar ab: ${s.datumLieferfahigkeit} — ATC: ${s.atcCode}`)}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${link}</guid>
    </item>`
}

export function rssEnvelope(title: string, link: string, description: string, items: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${link}</link>
    <description>${escapeXml(description)}</description>
    <language>de</language>
    ${items}
  </channel>
</rss>`
}

export const RSS_HEADERS = {
  'Content-Type': 'application/rss+xml; charset=utf-8',
}
