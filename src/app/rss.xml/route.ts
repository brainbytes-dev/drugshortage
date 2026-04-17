import { queryShortages } from '@/lib/db'
import { shortageToItem, rssEnvelope, RSS_HEADERS } from '@/lib/rss'

export async function GET(): Promise<Response> {
  try {
    const { data } = await queryShortages({ perPage: 500, sort: 'tageSeitMeldung:asc' })
    const items = data.map(shortageToItem).join('')
    const xml = rssEnvelope(
      'engpass.radar — Schweizer Arzneimittel-Engpässe',
      'https://engpassradar.ch',
      'Aktuelle Lieferengpässe für Arzneimittel in der Schweiz',
      items
    )
    return new Response(xml, { headers: RSS_HEADERS })
  } catch {
    return new Response('Feed temporarily unavailable', { status: 503, headers: { 'Content-Type': 'text/plain' } })
  }
}
