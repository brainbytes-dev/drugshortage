import type { Metadata } from 'next'
import { Suspense } from 'react'
import { queryShortages, getOverviewStats, getBwlGtins, getWeeklyTimelineWithActive, queryOffMarketDrugs, getOffMarketStats, getLastScrapedAt, queryHistoricalShortages, getHistoricalCount } from '@/lib/db'
import { getKPIStatsCached as getKPIStats, getFirmaListCached as getFirmaList } from '@/lib/db-cached-example'
import { KPICards } from '@/components/kpi-cards'
import { SearchBar } from '@/components/search-bar-optimized'
import { FilterBar } from '@/components/filter-bar'
import { ShortagesTable } from '@/components/shortages-table'
import { OffMarketTable } from '@/components/off-market-table'
import { HistoricalTable } from '@/components/historical-table'
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

type ViewMode = 'engpaesse' | 'ausser-handel' | 'vertriebseinstellung' | 'erloschen' | 'historisch'

interface PageProps {
  searchParams: Promise<Record<string, string>>
}

export const revalidate = 3600 // ISR: revalidate every hour

export const metadata: Metadata = {
  title: 'Lieferengpass Medikamente Schweiz | engpass.radar',
  description: 'Alle aktuellen Medikamenten-Lieferengpässe der Schweiz — täglich aus drugshortage.ch und BWL aktualisiert. Suche nach Wirkstoff, Firma oder ATC-Code. Kostenlos, kein Login.',
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const view = (params.view ?? 'engpaesse') as ViewMode
  const page = params.page ? parseInt(params.page, 10) : 1

  const isOffMarket = view === 'ausser-handel' || view === 'vertriebseinstellung' || view === 'erloschen'
  const isHistorical = view === 'historisch'

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

  const historicalQuery = {
    search: params.search,
    firma: params.firma,
    page,
    perPage: 50,
    sort: params.sort,
  }

  const [response, kpi, firmaList, overview, bwlGtins, weeklyTimeline, offMarketResponse, offMarketStats, lastScrapedAt, historicalResponse, historicalCount] = await Promise.all([
    isOffMarket || isHistorical ? Promise.resolve({ data: [], total: 0, page: 1, perPage: 50 }) : queryShortages(query),
    getKPIStats(),
    isOffMarket || isHistorical ? Promise.resolve([] as string[]) : getFirmaList(),
    getOverviewStats(),
    isOffMarket || isHistorical ? Promise.resolve([] as string[]) : getBwlGtins().catch(() => [] as string[]),
    getWeeklyTimelineWithActive().catch(() => []),
    isOffMarket
      ? queryOffMarketDrugs({
          category: view === 'ausser-handel' ? 'AUSSER_HANDEL' : view === 'erloschen' ? 'ERLOSCHEN' : 'VERTRIEBSEINSTELLUNG',
          search: params.search,
          page,
          perPage: 50,
        })
      : Promise.resolve({ data: [], total: 0, page: 1, perPage: 50 }),
    getOffMarketStats().catch(() => ({ ausserHandel: 0, vertriebseingestellt: 0, erloschen: 0 })),
    getLastScrapedAt().catch(() => null),
    isHistorical ? queryHistoricalShortages(historicalQuery) : Promise.resolve({ data: [], total: 0, page: 1, perPage: 50 }),
    getHistoricalCount().catch(() => 0),
  ])

  const historicalTotal = isHistorical ? historicalResponse.total : historicalCount

  const lastUpdated = lastScrapedAt
    ? new Date(lastScrapedAt).toLocaleString('de-CH', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : 'noch nicht aktualisiert'

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "engpass.radar",
            "url": "https://engpassradar.ch",
            "description": "Schweizer Medikamenten-Lieferengpass Dashboard",
            "sameAs": ["https://github.com/brainbytes-dev/engpassradar"]
          }).replace(/</g, '\u003c')
        }}
      />
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
            Über <strong className="text-foreground">{kpi.totalActive}</strong> aktive Engpässe aus 3 offiziellen Quellen.
            Täglich aktualisiert. Kostenlos, ohne Login.
          </p>

          {/* Use-case pills */}
          <div className="hero-animate hero-animate-4 flex flex-wrap justify-center gap-2 text-sm">
            {['Spitalapotheke', 'Apotheke & Drogerie', 'Forschung & Medien'].map(label => (
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
              {kpi.totalActive} Engpässe durchsuchen
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
            <a href="https://ch.oddb.org/de/gcc/home/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">ODDB</a>
          </p>
        </div>
      </section>

      {/* Dashboard */}
      <main id="dashboard" className="bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* KPI Cards */}
        <KPICards stats={kpi} historicalCount={historicalTotal} />

        {/* Weekly Timeline Chart */}
        <TimelineChart initialData={weeklyTimeline} />

        {/* ATC Treemap */}
        {overview && overview.atcGruppen.length > 0 && (
          <AtcTreemap data={overview.atcGruppen} />
        )}

        {/* View Switch + Overview Buttons in one row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Suspense fallback={null}>
            <ViewSwitch
              active={view}
              counts={{
                engpaesse: kpi.totalActive,
                ausserHandel: offMarketStats.ausserHandel,
                vertriebseingestellt: offMarketStats.vertriebseingestellt,
                erloschen: offMarketStats.erloschen,
                historisch: historicalTotal,
              }}
            />
          </Suspense>
          <div className="flex items-center gap-2">
            {overview && overview.firmenRanking.length > 0 && (
              <FirmaRankingSheet firmenRanking={overview.firmenRanking} />
            )}
            {overview && overview.atcGruppen.length > 0 && (
              <AtcGruppenSheet atcGruppen={overview.atcGruppen} />
            )}
          </div>
        </div>

        {/* Search + Filters (Engpässe only) */}
        {!isOffMarket && !isHistorical && (
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

        {/* Off-market / historical search only */}
        {(isOffMarket || isHistorical) && (
          <Suspense fallback={null}>
            <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
              <SearchBar />
              <ResetFiltersButton />
            </div>
          </Suspense>
        )}

        {/* Table */}
        <Suspense fallback={null}>
          {isHistorical ? (
            <HistoricalTable
              data={historicalResponse.data}
              total={historicalResponse.total}
              page={historicalResponse.page}
              perPage={historicalResponse.perPage}
            />
          ) : isOffMarket ? (
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
                title: 'Alle Quellen, ein Dashboard',
                body: 'Jeden Morgen liegen die neuesten Engpass-Meldungen aus allen offiziellen Schweizer Quellen bereit — ohne dass Sie selbst drei Portale prüfen müssen.',
              },
              {
                step: '02',
                title: 'Sofort zugeordnet',
                body: "Wirkstoff, ATC-Code und Hersteller sind automatisch ergänzt. Kein manuelles Nachschlagen, kein Copy-Paste zwischen Systemen.",
              },
              {
                step: '03',
                title: 'Finden statt suchen',
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

      {/* ── Was Sie hier finden ─────────────────────────────────── */}
      <section className="border-t border-border/40 bg-muted/[0.08]">
        <div className="max-w-3xl mx-auto px-4 py-20 sm:py-28">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-14">
            Was Sie hier finden
          </p>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
            {[
              'Alle Quellen in einem Dashboard (drugshortage.ch + BWL + ODDB)',
              'Täglich automatisch aktualisiert',
              'Volltextsuche nach Wirkstoff, Produkt, Firma',
              'Filter nach ATC-Gruppe, Status, Firma',
              'Severity Score pro Engpass',
              'Alternativen-Vorschläge (wirkstoffgleich)',
              'Verlaufs-Timeline (Wochen-Ansicht)',
              'CSV-Export',
              'REST API für Eigenintegration',
              'Kostenlos, kein Login, kein Abo',
            ].map((feature, i, arr) => (
              <div
                key={feature}
                className={`flex items-center justify-between gap-4 px-6 py-4 text-sm${i < arr.length - 1 ? ' border-b border-border/40' : ''}`}
              >
                <span className="text-foreground/80">{feature}</span>
                <svg className="h-4 w-4 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              { "@type": "Question", "name": "Woher stammen die Daten?", "acceptedAnswer": { "@type": "Answer", "text": "Engpass-Meldungen kommen direkt von drugshortage.ch und dem Bundesamt für wirtschaftliche Landesversorgung (BWL). Wirkstoff- und ATC-Daten werden automatisch aus öffentlichen Referenzdatenbanken ergänzt." } },
              { "@type": "Question", "name": "Wie aktuell sind die Daten?", "acceptedAnswer": { "@type": "Answer", "text": "Die Daten werden jede Nacht automatisch abgeglichen." } },
              { "@type": "Question", "name": "Kostet das etwas?", "acceptedAnswer": { "@type": "Answer", "text": "Nein — komplett kostenlos. Das Projekt wird in der Freizeit betrieben und bewusst werbefrei gehalten." } },
              { "@type": "Question", "name": "Kann ich die Daten herunterladen oder per API abrufen?", "acceptedAnswer": { "@type": "Answer", "text": "CSV-Export ist verfügbar. Eine öffentliche REST API steht unter engpassradar.ch/api-docs bereit — kostenlos, ohne Registrierung." } },
              { "@type": "Question", "name": "Haftung und Gewähr", "acceptedAnswer": { "@type": "Answer", "text": "engpass.radar ist ein Informationswerkzeug, kein Ersatz für die offiziellen Quellen. Für klinische oder pharmazeutische Entscheide gelten immer die Primärquellen." } }
            ]
          }).replace(/</g, '\u003c')
        }}
      />
      <section id="faq" className="border-t border-border/40 bg-muted/[0.15]">
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
                a: 'Nein — komplett kostenlos. Das Projekt wird in der Freizeit betrieben und bewusst werbefrei gehalten.',
              },
              {
                q: 'Kann ich die Daten herunterladen oder per API abrufen?',
                a: 'CSV-Export ist verfügbar. Eine öffentliche REST API steht unter /api-docs bereit — kostenlos, ohne Registrierung.',
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
