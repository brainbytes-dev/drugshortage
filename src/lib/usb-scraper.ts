// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse') as (buffer: Buffer) => Promise<{ numpages: number; text: string }>

const USB_PDF_URL = 'https://www.spitalpharmazie-basel.ch/Lieferengpassbericht.pdf'

export interface UsbShortageEntry {
  beginn: string | null
  sapNr: string
  praeparat: string
  wirkstoffe: string
  hersteller: string
  infoBezueger: string
}

/**
 * Parse USB Basel Lieferengpassbericht PDF.
 *
 * The PDF contains a table with 6 columns per row:
 *   Beginn | SAP-Nr. | Präparat | Wirkstoff(e) | Hersteller | Info Bezüger
 *
 * pdf-parse returns all text as a single string with newlines.
 * Each row starts with a date (DD.MM.YY) or continuation of the previous row's Info column.
 * SAP numbers are 6-digit integers.
 */
export function parseUsbPdf(text: string): UsbShortageEntry[] {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  const entries: UsbShortageEntry[] = []

  // Date pattern: DD.MM.YY or DD.MM.YYYY at start of line
  const DATE_RE = /^\d{2}\.\d{2}\.\d{2,4}$/
  // SAP number: 6-digit integer on its own line
  const SAP_RE = /^\d{6}$/

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // Detect start of a new entry: date line followed by SAP number
    if (DATE_RE.test(line) && i + 1 < lines.length && SAP_RE.test(lines[i + 1])) {
      const beginn = line
      const sapNr = lines[i + 1]
      i += 2

      // Collect praeparat (next non-empty line)
      const praeparat = lines[i] ?? ''
      i++

      // Collect wirkstoffe (next non-empty line)
      const wirkstoffe = lines[i] ?? ''
      i++

      // Collect hersteller (next non-empty line)
      const hersteller = lines[i] ?? ''
      i++

      // Collect infoBezueger: everything until the next entry starts (date+SAP) or end
      const infoParts: string[] = []
      while (i < lines.length) {
        const peek = lines[i]
        const nextIsSAP = i + 1 < lines.length && SAP_RE.test(lines[i + 1])
        if (DATE_RE.test(peek) && nextIsSAP) break
        // Also stop if we hit what looks like a new SAP-Nr on the current line (no preceding date)
        if (SAP_RE.test(peek) && i > 0 && DATE_RE.test(lines[i - 1])) break
        infoParts.push(peek)
        i++
      }

      if (!sapNr) continue

      entries.push({
        beginn,
        sapNr,
        praeparat,
        wirkstoffe,
        hersteller,
        infoBezueger: infoParts.join(' ').trim(),
      })
    } else {
      i++
    }
  }

  return entries
}

export async function fetchAndParseUsbPdf(): Promise<UsbShortageEntry[]> {
  const res = await fetch(USB_PDF_URL, {
    headers: {
      'User-Agent': 'engpass-radar/1.0 (+https://engpassradar.ch; contact: info@engpassradar.ch)',
    },
  })

  if (!res.ok) {
    throw new Error(`USB Basel PDF fetch failed: ${res.status} ${res.statusText}`)
  }

  const buffer = await res.arrayBuffer()
  const data = await pdf(Buffer.from(buffer))

  console.log(`[usb-scraper] PDF pages: ${data.numpages}, raw text length: ${data.text.length}`)

  const entries = parseUsbPdf(data.text)
  console.log(`[usb-scraper] Parsed ${entries.length} entries from PDF`)

  return entries
}
