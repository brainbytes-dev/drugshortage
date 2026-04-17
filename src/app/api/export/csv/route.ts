import { queryShortages } from '@/lib/db'
import type { ShortagesQuery, Shortage } from '@/lib/types'

function escapeCSV(value: string | number | boolean | null | undefined): string {
  const str = value == null ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function shortageToRow(s: Shortage): string {
  return [
    escapeCSV(s.bezeichnung),
    escapeCSV(s.firma),
    escapeCSV(s.atcCode),
    escapeCSV(s.statusText),
    escapeCSV(s.datumLieferfahigkeit),
    escapeCSV(s.datumLetzteMutation),
    escapeCSV(s.tageSeitMeldung),
    escapeCSV(s.gtin),
    escapeCSV(s.pharmacode),
    escapeCSV(s.firstSeenAt),
  ].join(',')
}

const HEADER = 'Bezeichnung,Firma,ATC-Code,Status,Lieferbar ab,Letzte Mutation,Tage seit Meldung,GTIN,Pharmacode,Erstmals gesehen'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const query: ShortagesQuery = {
    search: searchParams.get('search') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    firma: searchParams.get('firma') ?? undefined,
    atc: searchParams.get('atc') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
    perPage: 9999,
  }

  const { data } = await queryShortages(query)

  const rows = [HEADER, ...data.map(shortageToRow)]
  const csv = rows.join('\r\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="engpassradar-export.csv"',
    },
  })
}
