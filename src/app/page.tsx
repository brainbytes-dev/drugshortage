import { Suspense } from 'react'
import { queryShortages, getKPIStats, getFirmaList, getOverviewStats } from '@/lib/db'
import { KPICards } from '@/components/kpi-cards'
import { SearchBar } from '@/components/search-bar'
import { FilterBar } from '@/components/filter-bar'
import { ShortagesTable } from '@/components/shortages-table'
import { ThemeToggle } from '@/components/theme-toggle'
import { Github } from 'lucide-react'
import { FirmaRankingSheet } from '@/components/firma-ranking-sheet'
import { AtcGruppenSheet } from '@/components/atc-gruppen-sheet'
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
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              engpass<span className="text-primary">.radar</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Stand: {lastUpdated}
            </p>
          </div>
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

        {/* Overview Buttons */}
        {overview && (overview.firmenRanking.length > 0 || overview.atcGruppen.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {overview.firmenRanking.length > 0 && (
              <FirmaRankingSheet firmenRanking={overview.firmenRanking} />
            )}
            {overview.atcGruppen.length > 0 && (
              <AtcGruppenSheet atcGruppen={overview.atcGruppen} />
            )}
          </div>
        )}

        {/* Search + Filters */}
        <Suspense fallback={null}>
          <div className="flex flex-col sm:flex-row gap-2">
            <SearchBar />
            <FilterBar firmaList={firmaList} />
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
              href="https://github.com/brainbytes-dev/drugshortage"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-3.5 w-3.5" />
            </a>
          </p>
        </div>

      </div>
    </main>
  )
}
