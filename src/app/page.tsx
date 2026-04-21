import type { Metadata } from 'next'
import { Suspense } from 'react'
import { queryShortages, getOverviewStats, getBwlGtins, getWeeklyTimelineWithActive, queryOffMarketDrugs, getOffMarketStats, getLastScrapedAt, queryHistoricalShortages, getHistoricalCount, getHeroStats } from '@/lib/db'
import { getKPIStatsCached as getKPIStats } from '@/lib/db-cached-example'
import { KPICards } from '@/components/kpi-cards'
import { ShortagesTable } from '@/components/shortages-table'
import { OffMarketTable } from '@/components/off-market-table'
import { HistoricalTable } from '@/components/historical-table'
import { HeroAutoSkip } from '@/components/hero-auto-skip'
import { Hero } from '@/components/hero'
import { LazyTimelineChart, LazyAtcTreemap } from '@/components/lazy-charts'
import { NewsletterSignup } from '@/components/newsletter-signup'
import type { ShortagesQuery } from '@/lib/types'

type ViewMode = 'engpaesse' | 'ausser-handel' | 'vertriebseinstellung' | 'erloschen' | 'historisch'

interface PageProps {
  searchParams: Promise<Record<string, string>>
}

export const revalidate = 3600 // ISR: revalidate every hour

export const metadata: Metadata = {
  title: 'Lieferengpass Medikamente Schweiz | engpass.radar',
  description: 'Alle aktuellen Medikamenten-Lieferengpässe der Schweiz — täglich aus drugshortage.ch und BWL aktualisiert. Suche nach Wirkstoff, Firma oder ATC-Code. Öffentlich zugänglich, ohne Registrierung.',
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

  const [response, kpi, overview, bwlGtins, weeklyTimeline, offMarketResponse, , , historicalResponse, historicalCount, heroStats] = await Promise.all([
    isOffMarket || isHistorical ? Promise.resolve({ data: [], total: 0, page: 1, perPage: 50 }) : queryShortages(query),
    getKPIStats(),
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
    getHeroStats().catch(() => null),
  ])

  const historicalTotal = isHistorical ? historicalResponse.total : historicalCount

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
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
      {/* Hero — Live-Zahl */}
      {heroStats && (
        <Hero
          {...heroStats}
          firmenRanking={overview?.firmenRanking ?? []}
          atcGruppen={overview?.atcGruppen ?? []}
        />
      )}

      {/* Dashboard */}
      <main id="dashboard" className="bg-background">
      <div className="max-w-7xl mx-auto px-4 pt-3 pb-6 space-y-3">

        {/* KPI Cards — hidden, stats now shown in hero */}
        <div className="hidden">
          <KPICards stats={kpi} historicalCount={historicalTotal} />
        </div>

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

        {/* Charts section */}
        <section id="statistik" className="scroll-mt-16 space-y-3">
          <LazyTimelineChart initialData={weeklyTimeline} />
          {overview && overview.atcGruppen.length > 0 && (
            <LazyAtcTreemap data={overview.atcGruppen} />
          )}
        </section>

      </div>
      </main>

      {/* ── Wie es funktioniert ─────────────────────────────────── */}
      <section className="border-t border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-24 sm:py-32">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-20 sm:mb-24">
            Wie es funktioniert
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                step: '01',
                title: 'Alle Quellen, ein Dashboard',
                body: 'Die neuesten Engpass-Meldungen aus allen offiziellen Schweizer Quellen — täglich abgeglichen, ohne dass Sie selbst drei Portale prüfen müssen.',
              },
              {
                step: '02',
                title: 'Sofort zugeordnet',
                body: "Wirkstoff, ATC-Code und Hersteller sind automatisch ergänzt. Kein manuelles Nachschlagen, kein Copy-Paste zwischen Systemen.",
              },
              {
                step: '03',
                title: 'Finden statt suchen',
                body: 'Volltextsuche, Filter nach Firma oder ATC-Gruppe, Detailseite pro Präparat. Öffentlich zugänglich, ohne Registrierung.',
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
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-14">
            Was Sie hier finden
          </h2>
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
              'Öffentlich zugänglich, ohne Registrierung',
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
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              { "@type": "Question", "name": "Wer steckt hinter engpass.radar?", "acceptedAnswer": { "@type": "Answer", "text": "engpass.radar ist ein unabhängiges Projekt von Henrik Rühe, Neurologe in der Schweiz. Kein Pharma-Sponsor, keine Werbung, keine Affiliate-Links. Entwickelt aus klinischem Eigenbedarf und in der Freizeit betrieben. Der Quellcode ist öffentlich einsehbar auf GitHub." } },
              { "@type": "Question", "name": "Woher stammen die Daten?", "acceptedAnswer": { "@type": "Answer", "text": "Die Engpass-Meldungen kommen primär von drugshortage.ch. Ergänzend werden die Daten des Bundesamts für wirtschaftliche Landesversorgung (BWL) und die Shortage-Liste der Spitalpharmazie des Universitätsspitals Basel einbezogen. Wirkstoff, ATC-Code, Swissmedic-Nummer und GTIN stammen aus der öffentlichen ODDB-Referenzdatenbank." } },
              { "@type": "Question", "name": "Wie aktuell sind die Daten?", "acceptedAnswer": { "@type": "Answer", "text": "Die Daten werden täglich automatisch abgeglichen. Am Seitenkopf sehen Sie jederzeit, wann der letzte Import gelaufen ist. Sollte ein Abgleich einmal ausfallen, wird das am Zeitstempel sichtbar — kein nachgezogener Stand wird als aktuell ausgewiesen." } },
              { "@type": "Question", "name": "Ist die Liste vollständig?", "acceptedAnswer": { "@type": "Answer", "text": "engpass.radar zeigt, was in den aggregierten Quellen gemeldet ist — nicht mehr und nicht weniger. Nicht gemeldete Engpässe erscheinen hier nicht. Für behördlich massgebliche Informationen gilt immer die Primärquelle." } },
              { "@type": "Question", "name": "Kostet das etwas?", "acceptedAnswer": { "@type": "Answer", "text": "Das Dashboard, die Suche, die Detailseiten, der CSV-Export und die Basis-API sind öffentlich zugänglich. Kostenpflichtig sind höhere API-Kontingente, White-Label-Integrationen und SLA-gebundene Institutional-Pläne — adressiert an Software-Anbieter und Spitalapotheken-Ketten." } },
              { "@type": "Question", "name": "Kann ich die Daten weiterverarbeiten oder in ein eigenes System einbinden?", "acceptedAnswer": { "@type": "Answer", "text": "Ja. Ein CSV-Export ist verfügbar, eine öffentliche REST-API steht unter engpassradar.ch/api-docs bereit. Der Free-Tier funktioniert ohne Anmeldung. Für produktive Integrationen gibt es Professional- und Institutional-Pläne mit höheren Kontingenten und SLA." } },
              { "@type": "Question", "name": "Darf ich engpass.radar im Spital- oder Apotheken-Alltag einsetzen?", "acceptedAnswer": { "@type": "Answer", "text": "Ja — als Informations- und Monitoring-Werkzeug. Für pharmazeutische oder klinische Entscheide ist die Primärquelle (drugshortage.ch, Swissmedic, BWL) massgeblich. Der Monatsbericht und der Engpass-Signal-Newsletter sind zitierfähig und dürfen intern weitergegeben werden." } },
              { "@type": "Question", "name": "Haftung und Gewähr", "acceptedAnswer": { "@type": "Answer", "text": "engpass.radar ist ein Informationswerkzeug, kein behördliches Register. Anzeige, Score und Alternativen-Hinweise werden automatisiert aggregiert; Fehler in der Primärquelle werden unverändert übernommen. Für klinische, pharmazeutische oder regulatorische Entscheidungen gelten ausschliesslich die offiziellen Quellen." } }
            ]
          }).replace(/</g, '\u003c')
        }}
      />
      <section id="faq" className="border-t border-border/40 bg-muted/[0.15]">
        <div className="max-w-3xl mx-auto px-4 py-20 sm:py-28">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-14">
            Häufige Fragen
          </h2>
          <div className="border-t border-border/40">
            {([
              {
                q: 'Wer steckt hinter engpass.radar?',
                a: <>engpass.radar ist ein unabhängiges Projekt von Henrik Rühe, Neurologe in der Schweiz. Kein Pharma-Sponsor, keine Werbung, keine Affiliate-Links. Entwickelt aus klinischem Eigenbedarf und in der Freizeit betrieben. Der Quellcode ist öffentlich einsehbar auf GitHub.</>,
              },
              {
                q: 'Woher stammen die Daten?',
                a: <>Die Engpass-Meldungen kommen primär von drugshortage.ch. Ergänzend werden die Daten des Bundesamts für wirtschaftliche Landesversorgung (BWL) und die Shortage-Liste der Spitalpharmazie des Universitätsspitals Basel einbezogen. Wirkstoff, ATC-Code, Swissmedic-Nummer und GTIN stammen aus der öffentlichen ODDB-Referenzdatenbank.</>,
              },
              {
                q: 'Wie aktuell sind die Daten?',
                a: <>Die Daten werden täglich automatisch abgeglichen. Am Seitenkopf sehen Sie jederzeit, wann der letzte Import gelaufen ist. Sollte ein Abgleich einmal ausfallen, wird das am Zeitstempel sichtbar — kein nachgezogener Stand wird als aktuell ausgewiesen.</>,
              },
              {
                q: 'Ist die Liste vollständig?',
                a: <>engpass.radar zeigt, was in den aggregierten Quellen gemeldet ist — nicht mehr und nicht weniger. Nicht gemeldete Engpässe erscheinen hier nicht. Für behördlich massgebliche Informationen gilt immer die Primärquelle.</>,
              },
              {
                q: 'Kostet das etwas?',
                a: <>Das Dashboard, die Suche, die Detailseiten, der CSV-Export und die Basis-API sind öffentlich zugänglich. Kostenpflichtig sind höhere API-Kontingente, White-Label-Integrationen und SLA-gebundene Institutional-Pläne — adressiert an Software-Anbieter und Spitalapotheken-Ketten. Details auf <a href="/api" className="font-mono text-[12px] text-primary hover:underline">/api</a>.</>,
              },
              {
                q: 'Kann ich die Daten weiterverarbeiten oder in ein eigenes System einbinden?',
                a: <>Ja. Ein CSV-Export ist verfügbar, eine öffentliche REST-API steht unter <a href="/api-docs" className="font-mono text-[12px] text-primary hover:underline">engpassradar.ch/api-docs</a> bereit. Der Free-Tier funktioniert ohne Anmeldung. Für produktive Integrationen gibt es Professional- und Institutional-Pläne mit höheren Kontingenten und SLA.</>,
              },
              {
                q: 'Darf ich engpass.radar im Spital- oder Apotheken-Alltag einsetzen?',
                a: <>Ja — als Informations- und Monitoring-Werkzeug. Für pharmazeutische oder klinische Entscheide ist die Primärquelle (drugshortage.ch, Swissmedic, BWL) massgeblich. Der Monatsbericht und der Engpass-Signal-Newsletter sind zitierfähig und dürfen intern weitergegeben werden.</>,
              },
              {
                q: 'Haftung und Gewähr',
                a: <>engpass.radar ist ein Informationswerkzeug, kein behördliches Register. Anzeige, Score und Alternativen-Hinweise werden automatisiert aggregiert; Fehler in der Primärquelle werden unverändert übernommen. Für klinische, pharmazeutische oder regulatorische Entscheidungen gelten ausschliesslich die offiziellen Quellen.</>,
              },
            ] as { q: string; a: React.ReactNode }[]).map(({ q, a }, i) => (
              <details key={q} className="group border-b border-border/40">
                <summary className="flex items-baseline gap-[14px] py-6 cursor-pointer list-none select-none">
                  <span className="font-mono text-[11px] text-primary font-medium min-w-[28px] shrink-0 mt-[3px]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 text-[16px] font-semibold leading-snug tracking-[-0.005em] group-hover:text-primary transition-colors duration-200">
                    {q}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                    className="h-4 w-4 shrink-0 text-muted-foreground group-open:rotate-45 transition-transform duration-200 ease-out ml-4" aria-hidden>
                    <path strokeLinecap="round" d="M8 2v12M2 8h12" />
                  </svg>
                </summary>
                <p className="pl-[42px] pb-6 text-[14.5px] text-muted-foreground leading-[1.62] sm:pr-10">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ──────────────────────────────────────── */}
      <section className="border-t border-border/40">
        <div className="max-w-xl mx-auto px-4 py-20 sm:py-28 text-center">
          <NewsletterSignup />
        </div>
      </section>
    </>
  )
}
