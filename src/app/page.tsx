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

        {/* Info Banner */}
        <div className="rounded-lg border bg-muted/40 px-5 py-4">
          <p className="text-sm font-semibold tracking-tight mb-1">
            Wissen, was fehlt. Bevor der Patient davorsteht.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mt-3">
            <div>
              <p className="text-xs font-medium text-foreground mb-0.5">Datenquelle</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Täglich aktualisiert aus{' '}
                <a href="https://www.drugshortage.ch" target="_blank" rel="noopener noreferrer"
                  className="underline hover:text-foreground">drugshortage.ch</a>
                {' '}— der offiziellen Schweizer Engpassliste. Keine Gewähr auf Vollständigkeit.
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground mb-0.5">Für wen</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Spitalapotheken, öffentliche Apotheken und Fachpersonen, die täglich prüfen müssen,
                welche Medikamente in der Schweiz nicht lieferbar sind.
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground mb-0.5">Open Source</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Kostenlos, Open Source, keine Registrierung.
              </p>
            </div>
          </div>
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
          <span className="text-xs text-muted-foreground ml-auto">
            Stand: {lastUpdated}
          </span>
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
