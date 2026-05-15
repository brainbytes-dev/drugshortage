import type { Metadata } from 'next'
import Script from 'next/script'
import { buildPageAlternates } from '@/lib/i18n-meta'
import type { Locale } from '@/i18n/routing'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { queryShortages, getOverviewStats, getBwlGtins, getWeeklyTimelineWithActive, queryOffMarketDrugs, getOffMarketStats, getLastScrapedAt, queryHistoricalShortages, getHeroStats } from '@/lib/db'
import { ShortagesTable } from '@/components/shortages-table'
import { OffMarketTable } from '@/components/off-market-table'
import { HistoricalTable } from '@/components/historical-table'
import { Hero } from '@/components/hero'
import { LazyTimelineChart, LazyAtcTreemap } from '@/components/lazy-charts'
import { NewsletterSignup } from '@/components/newsletter-signup'
import type { ShortagesQuery } from '@/lib/types'

type ViewMode = 'engpaesse' | 'ausser-handel' | 'vertriebseinstellung' | 'erloschen' | 'historisch'

interface PageProps {
  searchParams: Promise<Record<string, string>>
}

export const revalidate = 3600 // ISR: revalidate every hour

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const t = await getTranslations('Home')
  const { locale } = await params
  const { canonical, languages } = buildPageAlternates('/', locale as Locale)
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical, languages },
  }
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

  const [
    response,
    overview,
    bwlGtins,
    weeklyTimeline,
    offMarketResponse,
    ,
    ,
    historicalResponse,
    heroStats,
    tHome,
    tFaq,
    tSd,
  ] = await Promise.all([
    isOffMarket || isHistorical ? Promise.resolve({ data: [], total: 0, page: 1, perPage: 50 }) : queryShortages(query),
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
    getHeroStats().catch(() => null),
    getTranslations('Home'),
    getTranslations('Faq'),
    getTranslations('HomeStructuredData'),
  ])

  const steps = [
    { step: tHome('step1Number'), title: tHome('step1Title'), body: tHome('step1Body') },
    { step: tHome('step2Number'), title: tHome('step2Title'), body: tHome('step2Body') },
    { step: tHome('step3Number'), title: tHome('step3Title'), body: tHome('step3Body') },
  ]

  const categories = [
    {
      cat: tHome('categoryDataTitle'),
      items: [
        { label: tHome('dataItem1Label'), desc: tHome('dataItem1Desc') },
        { label: tHome('dataItem2Label'), desc: tHome('dataItem2Desc') },
        { label: tHome('dataItem3Label'), desc: tHome('dataItem3Desc') },
        { label: tHome('dataItem4Label'), desc: tHome('dataItem4Desc') },
      ],
    },
    {
      cat: tHome('categorySearchTitle'),
      items: [
        { label: tHome('searchItem1Label'), desc: tHome('searchItem1Desc') },
        { label: tHome('searchItem2Label'), desc: tHome('searchItem2Desc') },
        { label: tHome('searchItem3Label'), desc: tHome('searchItem3Desc') },
        { label: tHome('searchItem4Label'), desc: tHome('searchItem4Desc') },
      ],
    },
    {
      cat: tHome('categoryApiTitle'),
      items: [
        { label: tHome('apiItem1Label'), desc: tHome('apiItem1Desc') },
        { label: tHome('apiItem2Label'), desc: tHome('apiItem2Desc') },
        { label: tHome('apiItem3Label'), desc: tHome('apiItem3Desc') },
        { label: tHome('apiItem4Label'), desc: tHome('apiItem4Desc') },
      ],
    },
  ]

  // FAQ keys — used both in JSON-LD and the accordion below.
  // faq5 / faq6 contain inline links and use t.rich for rendering, but their
  // plain-text variants (`faq5APlain`, `faq6APlain`) feed the JSON-LD payload.
  const faqItems: { qKey: string; aKey: string; aPlainKey: string; rich?: boolean }[] = [
    { qKey: 'faq1Q', aKey: 'faq1A', aPlainKey: 'faq1A' },
    { qKey: 'faq2Q', aKey: 'faq2A', aPlainKey: 'faq2A' },
    { qKey: 'faq3Q', aKey: 'faq3A', aPlainKey: 'faq3A' },
    { qKey: 'faq4Q', aKey: 'faq4A', aPlainKey: 'faq4A' },
    { qKey: 'faq5Q', aKey: 'faq5ARich', aPlainKey: 'faq5APlain', rich: true },
    { qKey: 'faq6Q', aKey: 'faq6ARich', aPlainKey: 'faq6APlain', rich: true },
    { qKey: 'faq7Q', aKey: 'faq7A', aPlainKey: 'faq7A' },
    { qKey: 'faq8Q', aKey: 'faq8A', aPlainKey: 'faq8A' },
  ]

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ qKey, aPlainKey }) => ({
      '@type': 'Question',
      name: tFaq(qKey),
      acceptedAnswer: { '@type': 'Answer', text: tFaq(aPlainKey) },
    })),
  }

  return (
    <>
      <Script
        id="ld-home-graph"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://engpassradar.ch/#organization",
                "name": "engpass.radar",
                "url": "https://engpassradar.ch",
                "description": tSd('organizationDescription'),
                "sameAs": ["https://github.com/brainbytes-dev/engpassradar"],
                "founder": { "@type": "Person", "name": "Henrik Rühe", "jobTitle": tSd('founderJobTitle') }
              },
              {
                "@type": "Dataset",
                "@id": "https://engpassradar.ch/#dataset",
                "name": tSd('datasetName'),
                "description": tSd('datasetDescription'),
                "url": "https://engpassradar.ch",
                "publisher": { "@id": "https://engpassradar.ch/#organization" },
                "license": "https://engpassradar.ch/nutzungsbedingungen",
                "inLanguage": "de-CH",
                "temporalCoverage": "2023/..",
                "spatialCoverage": { "@type": "Place", "name": tSd('spatialCoverageName'), "geo": { "@type": "GeoShape", "addressCountry": "CH" } },
                "distribution": [
                  { "@type": "DataDownload", "encodingFormat": "text/csv", "contentUrl": "https://engpassradar.ch/api/export/csv" },
                  { "@type": "DataDownload", "encodingFormat": "application/json", "contentUrl": "https://engpassradar.ch/api/v1/shortages" }
                ],
                "keywords": [
                  tSd('keyword1'),
                  tSd('keyword2'),
                  tSd('keyword3'),
                  tSd('keyword4'),
                  tSd('keyword5'),
                  tSd('keyword6'),
                  tSd('keyword7'),
                ]
              },
              {
                "@type": "WebSite",
                "@id": "https://engpassradar.ch/#website",
                "url": "https://engpassradar.ch",
                "name": "engpass.radar",
                "publisher": { "@id": "https://engpassradar.ch/#organization" },
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://engpassradar.ch/?search={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              }
            ]
          }).replace(/</g, '\\u003c')
        }}
      />
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
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-8 space-y-4">

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
        <section id="statistik" className="scroll-mt-16 space-y-4">
          <LazyTimelineChart initialData={weeklyTimeline} />
          {overview && overview.atcGruppen.length > 0 && (
            <LazyAtcTreemap data={overview.atcGruppen} />
          )}
        </section>

      </div>
      </main>

      {/* ── Wie es funktioniert ─────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-24 sm:py-32">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary mb-14">
            {tHome('howItWorksEyebrow')}
          </p>
          <h2 className="sr-only">{tHome('howItWorksEyebrow')}</h2>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map(({ step, title, body }) => (
              <li key={step}>
                <p className="font-mono text-[11px] text-primary mb-4">{step}</p>
                <h3 className="text-base font-semibold tracking-tight text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Was Sie hier finden — Editorial enumeration, no card grid ─ */}
      <section className="border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-20 sm:py-24">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary mb-14">
            {tHome('whatYouFindEyebrow')}
          </p>
          <h2 className="sr-only">{tHome('whatYouFindEyebrow')}</h2>
          <div className="space-y-16">
            {categories.map(({ cat, items }, catIdx) => (
              <div key={cat} className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-6">
                <div>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {String(catIdx + 1).padStart(2, '0')}
                  </p>
                  <h3 className="text-sm font-semibold text-foreground mt-2 tracking-tight">
                    {cat}
                  </h3>
                </div>
                <ul className="space-y-5">
                  {items.map(({ label, desc }) => (
                    <li key={label}>
                      <p className="text-sm font-semibold text-foreground leading-snug">{label}</p>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <Script
        id="ld-home-faq"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c')
        }}
      />
      <section id="faq" className="border-t border-border bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 py-20 sm:py-28">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary mb-14">
            {tFaq('title')}
          </p>
          <h2 className="sr-only">{tFaq('title')}</h2>
          <div className="border-t border-border">
            {faqItems.map(({ qKey, aKey, rich }, i) => {
              const q = tFaq(qKey)
              const answer = rich
                ? tFaq.rich(aKey, {
                    api: (chunks) => (
                      <Link href="/api" className="font-mono text-xs text-primary hover:underline">{chunks}</Link>
                    ),
                    docs: (chunks) => (
                      <Link href="/api-docs" className="font-mono text-xs text-primary hover:underline">{chunks}</Link>
                    ),
                  })
                : tFaq(aKey)
              return (
                <details key={qKey} className="group border-b border-border">
                  <summary className="flex items-baseline gap-4 py-6 cursor-pointer list-none select-none">
                    <span className="font-mono text-[11px] text-primary font-medium min-w-8 shrink-0 mt-1">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1 text-base font-semibold leading-snug tracking-tight group-hover:text-primary transition-colors duration-150">
                      {q}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                      className="h-4 w-4 shrink-0 text-muted-foreground group-open:rotate-45 transition-transform duration-150 ease-out ml-4" aria-hidden>
                      <path strokeLinecap="round" d="M8 2v12M2 8h12" />
                    </svg>
                  </summary>
                  <p className="pl-12 pb-6 text-sm text-muted-foreground leading-relaxed sm:pr-10">
                    {answer}
                  </p>
                </details>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Newsletter ──────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="max-w-xl mx-auto px-4 py-20 sm:py-28 text-center">
          <NewsletterSignup />
        </div>
      </section>
    </>
  )
}
