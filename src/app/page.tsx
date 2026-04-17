import { Suspense } from 'react'
import { queryShortages, getOverviewStats, getBwlGtins, getWeeklyTimeline, queryOffMarketDrugs, getOffMarketStats } from '@/lib/db'
import { getKPIStatsCached as getKPIStats, getFirmaListCached as getFirmaList } from '@/lib/db-cached-example'
import { KPICards } from '@/components/kpi-cards'
import { SearchBar } from '@/components/search-bar-optimized'
import { FilterBar } from '@/components/filter-bar'
import { ShortagesTable } from '@/components/shortages-table'
import { OffMarketTable } from '@/components/off-market-table'
import { ViewSwitch } from '@/components/view-switch'
import { FirmaRankingSheet } from '@/components/firma-ranking-sheet-optimized'
import { AtcGruppenSheet } from '@/components/atc-gruppen-sheet-optimized'
import { ResetFiltersButton } from '@/components/reset-filters-button'
import { NeueMeldungenButton } from '@/components/neue-meldungen-button'
import { ExportCsvButton } from '@/components/export-csv-button'
import { HeroAutoSkip } from '@/components/hero-auto-skip'
import { TimelineChart } from '@/components/timeline-chart'
import { AtcTreemap } from '@/components/atc-treemap'
import type { ShortagesQuery } from '@/lib/types'

type ViewMode = 'engpaesse' | 'ausser-handel' | 'vertriebseinstellung'

interface PageProps {
  searchParams: Promise<Record<string, string>>
}

export const revalidate = 3600 // ISR: revalidate every hour

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const view = (params.view ?? 'engpaesse') as ViewMode
  const page = params.page ? parseInt(params.page, 10) : 1

  const isOffMarket = view === 'ausser-handel' || view === 'vertriebseinstellung'

  const query: ShortagesQuery = {
    search: params.search,
    status: params.status,
    firma: params.firma,
    atc: params.atc,
    neu: params.neu === '1',
    page,
    sort: params.sort ?? 'tageSeitMeldung:desc',
    perPage: 50,
  }

  const [response, kpi, firmaList, overview, bwlGtins, weeklyTimeline, offMarketResponse, offMarketStats] = await Promise.all([
    isOffMarket ? Promise.resolve({ data: [], total: 0, page: 1, perPage: 50 }) : queryShortages(query),
    getKPIStats(),
    isOffMarket ? Promise.resolve([] as string[]) : getFirmaList(),
    getOverviewStats(),
    isOffMarket ? Promise.resolve([] as string[]) : getBwlGtins().catch(() => [] as string[]),
    getWeeklyTimeline().catch(() => []),
    isOffMarket
      ? queryOffMarketDrugs({
          category: view === 'ausser-handel' ? 'AUSSER_HANDEL' : 'VERTRIEBSEINSTELLUNG',
          search: params.search,
          page,
          perPage: 50,
        })
      : Promise.resolve({ data: [], total: 0, page: 1, perPage: 50 }),
    getOffMarketStats().catch(() => ({ ausserHandel: 0, vertriebseingestellt: 0 })),
  ])

  const lastUpdated = kpi.lastScrapedAt
    ? new Date(kpi.lastScrapedAt).toLocaleString('de-CH', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : 'noch nicht aktualisiert'

  return (
    <>
      <HeroAutoSkip />
      {/* Hero — full viewport */}
      <section className="relative flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] text-center px-4 overflow-hidden">

        {/* Animated gradient blob */}
        <div
          aria-hidden
          className="hero-blob pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-[0.07] blur-3xl"
          style={{ background: 'radial-gradient(ellipse, oklch(0.52 0.09 200), oklch(0.62 0.14 225) 60%, transparent)' }}
        />
        {/* Second accent blob */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full opacity-[0.04] blur-3xl"
          style={{ background: 'radial-gradient(ellipse, oklch(0.62 0.14 225), transparent)' }}
        />

        {/* Curtain gradient — KPI cards bleed through at bottom */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-background via-background/60 to-transparent z-20"
        />

        <div className="relative z-10 max-w-3xl mx-auto space-y-7">

          {/* Live badge */}
          <div className="hero-animate hero-animate-1 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Letzte Aktualisierung: {lastUpdated}
            </span>
          </div>

          {/* Headline */}
          <div className="hero-animate hero-animate-2">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              Wissen, was{' '}
              <span className="gradient-text">fehlt.</span>
              <br />
              <span className="text-muted-foreground font-normal text-3xl sm:text-4xl lg:text-5xl">
                Bevor der Patient davorsteht.
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="hero-animate hero-animate-3 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Strukturierte Engpassdaten für die Schweizer Arzneimittelversorgung —
            täglich aktualisiert, kostenlos, kein Login.
          </p>

          {/* Use-case pills */}
          <div className="hero-animate hero-animate-4 flex flex-wrap justify-center gap-2 text-sm">
            {['Spitalapotheke', 'Apotheke & Drogerie', 'Forschung & Medien', 'Beschaffung'].map(label => (
              <span
                key={label}
                className="rounded-full border border-border/70 bg-muted/30 px-3.5 py-1 text-muted-foreground backdrop-blur-sm"
              >
                {label}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="hero-animate hero-animate-5 pt-1">
            <a
              href="#dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:shadow-[0_0_0_4px_oklch(0.52_0.09_200/0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out"
            >
              Engpässe prüfen
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          </div>

          {/* Source line */}
          <p className="hero-animate hero-animate-5 text-xs text-muted-foreground">
            Daten aus{' '}
            <a href="https://www.drugshortage.ch" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">drugshortage.ch</a>
            {', '}
            <a href="https://www.bwl.admin.ch/de/meldestelle-heilmittel" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">BWL</a>
            {' und '}
            <a href="https://download.hin.ch/download/oddb2xml/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">HIN/ODDB</a>
          </p>
        </div>
      </section>

      {/* Dashboard */}
      <main id="dashboard" className="bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* KPI Cards */}
        <KPICards stats={kpi} />

        {/* Weekly Timeline Chart */}
        <TimelineChart data={weeklyTimeline} />

        {/* ATC Treemap */}
        {overview && overview.atcGruppen.length > 0 && (
          <AtcTreemap data={overview.atcGruppen} />
        )}

        {/* Overview Buttons + Stand */}
        <div className="flex flex-wrap items-center gap-2">
          {overview && overview.firmenRanking.length > 0 && (
            <FirmaRankingSheet firmenRanking={overview.firmenRanking} />
          )}
          {overview && overview.atcGruppen.length > 0 && (
            <AtcGruppenSheet atcGruppen={overview.atcGruppen} />
          )}
        </div>

        {/* View Switch */}
        <Suspense fallback={null}>
          <ViewSwitch
            active={view}
            counts={{
              engpaesse: kpi.totalActive,
              ausserHandel: offMarketStats.ausserHandel,
              vertriebseingestellt: offMarketStats.vertriebseingestellt,
            }}
          />
        </Suspense>

        {/* Search + Filters (Engpässe only) */}
        {!isOffMarket && (
          <Suspense fallback={null}>
            <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
              <SearchBar />
              <FilterBar firmaList={firmaList} />
              <ResetFiltersButton />
              <NeueMeldungenButton />
              <ExportCsvButton />
            </div>
          </Suspense>
        )}

        {/* Off-market search only */}
        {isOffMarket && (
          <Suspense fallback={null}>
            <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
              <SearchBar />
              <ResetFiltersButton />
            </div>
          </Suspense>
        )}

        {/* Table */}
        <Suspense fallback={null}>
          {isOffMarket ? (
            <OffMarketTable
              data={offMarketResponse.data}
              total={offMarketResponse.total}
              page={offMarketResponse.page}
              perPage={offMarketResponse.perPage}
            />
          ) : (
            <ShortagesTable
              shortages={response.data}
              total={response.total}
              page={response.page}
              perPage={response.perPage}
              bwlGtins={bwlGtins}
            />
          )}
        </Suspense>

      </div>
      </main>

      {/* ── Wie es funktioniert ─────────────────────────────────── */}
      <section className="border-t border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-24 sm:py-32">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-20 sm:mb-24">
            Wie es funktioniert
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                step: '01',
                title: 'Täglich gescraped',
                body: 'Jeden Morgen liegen die neuesten Engpass-Meldungen aus allen offiziellen Schweizer Quellen bereit — ohne dass Sie selbst drei Portale prüfen müssen.',
              },
              {
                step: '02',
                title: 'Aufbereitet & angereichert',
                body: "Wirkstoff, ATC-Code und Hersteller sind sofort zugeordnet. Über 8'600 Fälle, sauber verknüpft und lückenlos nachvollziehbar.",
              },
              {
                step: '03',
                title: 'Sofort abrufbar',
                body: 'Volltextsuche, Filter nach Firma oder ATC-Gruppe, Detailseite pro Präparat. Kein Login, kein Abo, kostenlos.',
              },
            ].map(({ step, title, body }) => (
              <div
                key={step}
                className="group relative flex flex-col gap-5 rounded-xl border border-border/60 bg-card p-8 sm:p-10 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_8px_30px_-8px_oklch(0.52_0.09_200/0.15)]"
              >
                {/* Ghost number */}
                <span
                  aria-hidden
                  className="absolute -right-2 -bottom-4 text-[96px] font-black leading-none select-none pointer-events-none tabular-nums text-foreground/[0.04] group-hover:text-primary/[0.07] transition-colors duration-300"
                >
                  {step}
                </span>

                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary tabular-nums">
                  {step}
                </span>
                <h3 className="text-xl font-bold leading-snug tracking-tight">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section className="border-t border-border/40 bg-muted/[0.15]">
        <div className="max-w-3xl mx-auto px-4 py-20 sm:py-28">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-14">
            Häufige Fragen
          </p>
          <div className="divide-y divide-border/40">
            {[
              {
                q: 'Woher stammen die Daten?',
                a: 'Engpass-Meldungen kommen direkt von drugshortage.ch und dem Bundesamt für wirtschaftliche Landesversorgung (BWL). Wirkstoff- und ATC-Daten werden automatisch aus öffentlichen Referenzdatenbanken ergänzt.',
              },
              {
                q: 'Wie aktuell sind die Daten?',
                a: 'Die Daten werden jede Nacht automatisch abgeglichen. Oben auf der Seite sehen Sie jederzeit, wann der letzte Import gelaufen ist.',
              },
              {
                q: 'Kostet das etwas?',
                a: 'Ja, wirklich kostenlos. Das Projekt wird in der Freizeit betrieben.',
              },
              {
                q: 'Kann ich die Daten herunterladen oder per API abrufen?',
                a: 'API und CSV-Export sind in Arbeit. Wer die Daten für Forschung oder eigene Systeme braucht, meldet sich am besten via GitHub-Issue — wir priorisieren nach Bedarf.',
              },
              {
                q: 'Haftung und Gewähr',
                a: 'engpass.radar ist ein Informationswerkzeug, kein Ersatz für die offiziellen Quellen. Für klinische oder pharmazeutische Entscheide gelten immer die Primärquellen.',
              },
            ].map(({ q, a }) => (
              <details key={q} className="group py-6 cursor-pointer">
                <summary className="flex items-center justify-between gap-6 list-none select-none">
                  <span className="text-[15px] font-semibold leading-snug group-hover:text-primary transition-colors duration-200">
                    {q}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-4 w-4 shrink-0 text-muted-foreground group-open:rotate-45 transition-transform duration-200 ease-out"
                    aria-hidden
                  >
                    <path strokeLinecap="round" d="M8 2v12M2 8h12" />
                  </svg>
                </summary>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed pr-10">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter hidden — pending Buttondown account setup */}
    </>
  )
}
