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
  neu?: boolean         // filter: tageSeitMeldung <= 7
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

/** Aggregate statistics scraped from the overview page */
export interface OverviewStats {
  scrapedAt: string
  // Summary counts
  totalPackungen: number          // "nicht lieferbare Packungen"
  totalProdukte: number           // "nicht lieferbare Produkte/Dosierungen"
  betroffeneAtcGruppen: number    // unique ATC groups
  // Regulatory flags (counts among shortages)
  pflichtlager: number
  bwl: number
  bwlWho: number
  who: number
  kassenpflichtigSL: number       // absolute count
  kassenpflichtigSLTotal: number  // total SL products
  prozentSLNichtLieferbar: number
  // Duration breakdown (counts)
  dauerUnter2Wochen: number
  dauer2bis6Wochen: number
  dauerUeber6WochenBis6Monate: number
  dauerUeber6MonateBis1Jahr: number
  dauerUeber1Bis2Jahre: number
  dauerUeber2Jahre: number
  // Swissmedic categories
  swissmedicListeA: number
  swissmedicListeATotal: number
  swissmedicListeB: number
  swissmedicListeBTotal: number
  swissmedicListeC: number
  swissmedicListeCTotal: number
  swissmedicUebrige: number
  swissmedicUebrigeTotal: number
  // Company rankings
  firmenRanking: FirmaRanking[]
  // ATC level-2 breakdown
  atcGruppen: AtcGruppeStats[]
}

export interface FirmaRanking {
  bewertung: number               // 1–4
  firma: string
  anzahlProdukteTotal: number
  anzahlOffeneEngpaesse: number
}

export interface AtcGruppeStats {
  atcCode: string                 // e.g. "C09"
  bezeichnung: string             // e.g. "Mittel mit Wirkung auf das Renin-Angiotensin-System"
  anzahl: number
}
