import { Suspense } from 'react'
import { queryShortages, getKPIStats, getFirmaList, getOverviewStats } from '@/lib/db'
import { KPICards } from '@/components/kpi-cards'
import { SearchBar } from '@/components/search-bar'
import { FilterBar } from '@/components/filter-bar'
import { ShortagesTable } from '@/components/shortages-table'
import { ThemeToggle } from '@/components/theme-toggle'
import { FirmaRankingSheet } from '@/components/firma-ranking-sheet'
import { AtcGruppenSheet } from '@/components/atc-gruppen-sheet'
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

  const [response, kpi, firmaList, overview] = await Promise.all([
    queryShortages(query),
    getKPIStats(),
    getFirmaList(),
    getOverviewStats(),
  ])

  const lastUpdated = kpi.lastScrapedAt
    ? new Date(kpi.lastScrapedAt).toLocaleString('de-CH', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : 'noch nicht aktualisiert'

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="group">
            <h1 className="text-xl font-semibold tracking-tight group-hover:opacity-80 transition-opacity">
              engpass<span className="text-primary">.radar</span>
            </h1>
          </Link>
          <ThemeToggle />
        </div>

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
          />
        </Suspense>

        {/* Footer */}
        <div className="text-xs text-muted-foreground text-center pt-4 border-t space-y-1">
          <p>
            Daten von{' '}
            <a href="https://www.drugshortage.ch" target="_blank" rel="noopener noreferrer"
              className="underline hover:text-foreground">
              drugshortage.ch
            </a>
            {' '}· täglich aktualisiert · keine Gewähr auf Vollständigkeit
          </p>
          <p className="flex items-center justify-center gap-3">
            <a href="/impressum" className="underline hover:text-foreground">Impressum</a>
            <span>·</span>
            <a href="/datenschutz" className="underline hover:text-foreground">Datenschutz</a>
            <span>·</span>
            <a
              href="https://github.com/brainbytes-dev/engpassradar"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          </p>
        </div>

      </div>
    </main>
  )
}
