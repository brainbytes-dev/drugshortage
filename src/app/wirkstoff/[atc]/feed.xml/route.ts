import { getShortagesByAtc } from '@/lib/db'
import { shortageToItem, rssEnvelope, RSS_HEADERS, escapeXml } from '@/lib/rss'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ atc: string }> }
): Promise<Response> {
  try {
    const { atc } = await params
    const shortages = await getShortagesByAtc(atc)
    const items = shortages.map(shortageToItem).join('')
    const xml = rssEnvelope(
      `engpass.radar — ATC ${atc} Engpässe`,
      `https://engpassradar.ch/wirkstoff/${atc}`,
      `Aktuelle Lieferengpässe für ATC-Gruppe ${atc} in der Schweiz`,
      items
    )
    return new Response(xml, { headers: RSS_HEADERS })
  } catch {
    return new Response('Feed temporarily unavailable', { status: 503, headers: { 'Content-Type': 'text/plain' } })
  }
}
