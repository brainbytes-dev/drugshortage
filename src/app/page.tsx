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
    <>
      {/* Hero — full viewport */}
      <section className="relative flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] text-center px-4 overflow-hidden">
        {/* Subtle radial gradient background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,hsl(var(--primary)/0.08),transparent)]"
        />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground bg-muted/50">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Letzte Aktualisierung: {lastUpdated}
          </span>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            Wissen, was fehlt.
            <br />
            <span className="text-muted-foreground font-normal">Bevor der Patient davorsteht.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Alle Medikamenten-Lieferengpässe der Schweiz — täglich aktualisiert,
            kostenlos, ohne Login.
          </p>

          {/* Use-case pills */}
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            {['Spitalapotheke', 'Offizinapotheke', 'Forschung & Medien'].map(label => (
              <span key={label} className="rounded-full border bg-muted/40 px-3 py-1 text-muted-foreground">
                {label}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="pt-2">
            <a
              href="#dashboard"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Engpässe prüfen
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          </div>

          {/* Source line */}
          <p className="text-xs text-muted-foreground pt-2">
            Daten aus{' '}
            <a href="https://www.drugshortage.ch" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">drugshortage.ch</a>
            {', '}
            <a href="https://www.bwl.admin.ch/de/meldestelle-heilmittel" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">BWL</a>
            {' und '}
            <a href="https://download.hin.ch/download/oddb2xml/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">HIN/ODDB</a>
          </p>
        </div>
      </section>

      {/* Dashboard */}
      <main id="dashboard" className="bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

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
    </>
  )
}
