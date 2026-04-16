import { Suspense } from 'react'
import { queryShortages, getOverviewStats, getBwlGtins } from '@/lib/db'
import { getKPIStatsCached as getKPIStats, getFirmaListCached as getFirmaList } from '@/lib/db-cached-example'
import { KPICards } from '@/components/kpi-cards'
import { SearchBar } from '@/components/search-bar-optimized'
import { FilterBar } from '@/components/filter-bar'
import { ShortagesTable } from '@/components/shortages-table'
import { FirmaRankingSheet } from '@/components/firma-ranking-sheet-optimized'
import { AtcGruppenSheet } from '@/components/atc-gruppen-sheet-optimized'
import { ResetFiltersButton } from '@/components/reset-filters-button'
import Link from 'next/link'
import type { ShortagesQuery } from '@/lib/types'

interface PageProps {
  searchParams: Promise<Record<string, string>>
}

export const revalidate = 3600 // ISR: revalidate every hour

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const query: ShortagesQuery = {
    search: params.search,
    status: params.status,
    firma: params.firma,
    atc: params.atc,
    page: params.page ? parseInt(params.page, 10) : 1,
    sort: params.sort ?? 'tageSeitMeldung:desc',
    perPage: 50,
  }

  const [response, kpi, firmaList, overview, bwlGtins] = await Promise.all([
    queryShortages(query),
    getKPIStats(),
    getFirmaList(),
    getOverviewStats(),
    getBwlGtins().catch(() => [] as string[]),
  ])

  const lastUpdated = kpi.lastScrapedAt
    ? new Date(kpi.lastScrapedAt).toLocaleString('de-CH', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : 'noch nicht aktualisiert'

  return (
    <main className="bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Hero */}
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Wissen, was fehlt.{' '}
              <span className="text-muted-foreground font-normal">Bevor der Patient davorsteht.</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Alle Lieferengpässe der Schweiz auf einen Blick — täglich aktualisiert,
              kostenlos, ohne Login. Für Spital- und Offizinapotheken.
            </p>
          </div>

          {/* Use-case labels */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span><span className="font-medium text-foreground">Spitalapotheke</span> — Engpässe früh erkennen</span>
            <span><span className="font-medium text-foreground">Offizinapotheke</span> — Alternativen schnell finden</span>
            <span><span className="font-medium text-foreground">Forschung & Medien</span> — Versorgungslage analysieren</span>
          </div>

          <p className="text-xs text-muted-foreground">
            Daten aus{' '}
            <a href="https://www.drugshortage.ch" target="_blank" rel="noopener noreferrer"
              className="underline hover:text-foreground">drugshortage.ch</a>
            {', '}
            <a href="https://www.bwl.admin.ch/de/meldestelle-heilmittel" target="_blank" rel="noopener noreferrer"
              className="underline hover:text-foreground">BWL</a>
            {' und '}
            <a href="https://download.hin.ch/download/oddb2xml/" target="_blank" rel="noopener noreferrer"
              className="underline hover:text-foreground">HIN/ODDB</a>
            {' · Letzte Aktualisierung: '}{lastUpdated}
          </p>
        </div>

        {/* KPI Cards */}
        <KPICards stats={kpi} />

        {/* Overview Buttons + Stand */}
        <div className="flex flex-wrap items-center gap-2">
          {overview && overview.firmenRanking.length > 0 && (
            <FirmaRankingSheet firmenRanking={overview.firmenRanking} />
          )}
          {overview && overview.atcGruppen.length > 0 && (
            <AtcGruppenSheet atcGruppen={overview.atcGruppen} />
          )}
        </div>

        {/* Search + Filters */}
        <Suspense fallback={null}>
          <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
            <SearchBar />
            <FilterBar firmaList={firmaList} />
            <ResetFiltersButton />
          </div>
        </Suspense>

        {/* Table */}
        <Suspense fallback={null}>
          <ShortagesTable
            shortages={response.data}
            total={response.total}
            page={response.page}
            perPage={response.perPage}
            bwlGtins={bwlGtins}
          />
        </Suspense>

      </div>
    </main>
  )
}
