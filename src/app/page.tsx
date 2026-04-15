import { Suspense } from 'react'
import { queryShortages, getKPIStats, getFirmaList } from '@/lib/db'
import { KPICards } from '@/components/kpi-cards'
import { SearchBar } from '@/components/search-bar'
import { FilterBar } from '@/components/filter-bar'
import { ShortagesTable } from '@/components/shortages-table'
import type { ShortagesQuery } from '@/lib/types'
import { Pill } from 'lucide-react'

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

  const [response, kpi, firmaList] = await Promise.all([
    queryShortages(query),
    getKPIStats(),
    getFirmaList(),
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
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Pill className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Swiss Drug Shortage Tracker
              </h1>
              <p className="text-sm text-muted-foreground">
                Aktuelle Lieferengpässe bei Medikamenten in der Schweiz
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            Stand: {lastUpdated}
          </p>
        </div>

        {/* KPI Cards */}
        <KPICards stats={kpi} />

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
        <p className="text-xs text-muted-foreground text-center pt-4 border-t">
          Daten von{' '}
          <a href="https://www.drugshortage.ch" target="_blank" rel="noopener noreferrer"
            className="underline hover:text-foreground">
            drugshortage.ch
          </a>
          {' '}· täglich aktualisiert · keine Gewähr auf Vollständigkeit
        </p>
      </div>
    </main>
  )
}
