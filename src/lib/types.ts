export interface Shortage {
  id?: number
  gtin: string
  pharmacode: string
  bezeichnung: string
  firma: string
  atcCode: string
  gengrp: string
  statusCode: number          // 1–5
  statusText: string
  datumLieferfahigkeit: string // free text: "unbestimmt", "KW 17", or date string
  datumLetzteMutation: string  // "DD.MM.YYYY"
  tageSeitMeldung: number
  detailUrl: string
  alternativenUrl?: string     // link to alternatives page
  // Detail page fields (fetched separately)
  ersteMeldung?: string        // "DD.MM.YYYY" — date of first report
  ersteMeldungDurch?: string   // who reported it
  ersteInfoDurchFirma?: string // first info from the company
  artDerInfoDurchFirma?: string
  voraussichtlicheDauer?: string // e.g. "mittel langer Engpass (2 bis 6 Wochen)"
  bemerkungen?: string
  firstSeenAt: string          // ISO timestamp
  lastSeenAt: string           // ISO timestamp
  isActive: boolean
}

export interface ScrapeRun {
  id?: number
  scrapedAt: string
  totalCount: number
  newEntries: number
  removedEntries: number
  status: 'success' | 'error'
  errorMessage?: string
}

export interface ShortagesResponse {
  data: Shortage[]
  total: number
  page: number
  perPage: number
}

export interface ShortagesQuery {
  search?: string
  status?: string       // comma-separated codes e.g. "1,4"
  firma?: string
  atc?: string
  page?: number
  sort?: string         // e.g. "tageSeitMeldung:desc"
  perPage?: number
}

export interface KPIStats {
  totalActive: number
  topFirma: string
  topFirmaCount: number
  uniqueAtcGroups: number
  avgDaysSinceMeldung: number
  lastScrapedAt: string | null
}
