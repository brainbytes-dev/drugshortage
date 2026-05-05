import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import {
  getFirmaBySlug,
  getFirmaActiveShortages,
  getFirmaHistoricalShortages,
  getFirmaHistoricalCount,
  getBwlGtins,
} from '@/lib/db'
import { calculateScore, scoreLabel } from '@/lib/score'
import { FirmaShortagesToggle } from '@/components/firma-shortages-toggle'

export const revalidate = 3600

// ISR on-demand: with 4 locales, prerendering every firm × locale at build
// time exhausts the Supabase connection pool. Pages still cache for 1h via
// `revalidate`, and `dynamicParams = true` (default) lets Next.js render any
// firm slug on first request.
export async function generateStaticParams() {
  return []
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const [firma, t] = await Promise.all([
    getFirmaBySlug(slug),
    getTranslations('Firma'),
  ])
  if (!firma) return { title: t('metaTitleNotFound') }
  return {
    title: t('metaTitle', { firma }),
    description: t('metaDescription', { firma }),
    alternates: { canonical: `https://engpassradar.ch/firma/${slug}` },
  }
}

const STATUS_DOT_COLORS: Record<number, string> = {
  1: 'bg-emerald-500',
  2: 'bg-lime-500',
  3: 'bg-amber-500',
  4: 'bg-red-500',
  5: 'bg-yellow-500',
}

const STATUS_TEXT_COLORS: Record<number, string> = {
  1: 'text-emerald-600 dark:text-emerald-400',
  2: 'text-lime-600 dark:text-lime-400',
  3: 'text-amber-600 dark:text-amber-400',
  4: 'text-red-600 dark:text-red-400',
  5: 'text-yellow-600 dark:text-yellow-400',
}

export default async function FirmaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const [firma, bwlGtins, t] = await Promise.all([
    getFirmaBySlug(slug),
    getBwlGtins(),
    getTranslations('Firma'),
  ])

  if (!firma) notFound()

  const STATUS_LABELS: Record<number, string> = {
    1: t('statusLabel1'),
    2: t('statusLabel2'),
    3: t('statusLabel3'),
    4: t('statusLabel4'),
    5: t('statusLabel5'),
  }

  const [shortages, historicalShortages, historicalCount] = await Promise.all([
    getFirmaActiveShortages(firma),
    getFirmaHistoricalShortages(firma).catch(() => []),
    getFirmaHistoricalCount(firma),
  ])

  const bwlSet = new Set(bwlGtins)

  const statusBreakdown = shortages.reduce<Record<number, number>>((acc, s) => {
    acc[s.statusCode] = (acc[s.statusCode] ?? 0) + 1
    return acc
  }, {})

  const scores = shortages.map(s => calculateScore(s, bwlSet.has(s.gtin)).total)
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0

  const noInfoCount = statusBreakdown[4] ?? 0
  const noInfoPct = shortages.length > 0
    ? Math.round((noInfoCount / shortages.length) * 100)
    : 0

  const { label: avgLabel, color: avgColor } = scoreLabel(avgScore)

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebPage',
                '@id': `https://www.engpassradar.ch/firma/${slug}`,
                url: `https://www.engpassradar.ch/firma/${slug}`,
                name: t('jsonLdName', { firma }),
                description: t('jsonLdDescription', { firma }),
                isPartOf: { '@id': 'https://www.engpassradar.ch' },
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: t('breadcrumbHome'), item: 'https://www.engpassradar.ch' },
                  { '@type': 'ListItem', position: 2, name: firma, item: `https://www.engpassradar.ch/firma/${slug}` },
                ],
              },
            ],
          }).replace(/</g, '<'),
        }}
      />

      {/* Page header */}
      <section className="border-b border-border/40">
        <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
          <Link
            href={{ pathname: '/', query: { firma } }}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group mb-8"
          >
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform duration-150" />
            {t('backLink')}
          </Link>

          <div className="space-y-4">
            {/* Eyebrow */}
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{t('eyebrow')}</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">{firma}</h1>

            {/* KPI strip */}
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div>
                <p className="text-3xl font-black tabular-nums leading-none">{shortages.length}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t('kpiActiveShortages')}</p>
              </div>
              <div className="w-px h-8 bg-border/60 hidden sm:block" />
              <div>
                <p className="text-3xl font-black tabular-nums leading-none">{historicalCount}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t('kpiHistorical')}</p>
              </div>
              <div className="w-px h-8 bg-border/60 hidden sm:block" />
              <div>
                <p className={`text-3xl font-black tabular-nums leading-none ${avgColor}`}>{avgScore}</p>
                <p className={`text-[11px] mt-0.5 ${avgColor}`}>{avgLabel}</p>
              </div>
              <div className="w-px h-8 bg-border/60 hidden sm:block" />
              <div>
                <p className={`text-3xl font-black tabular-nums leading-none ${noInfoPct >= 50 ? 'text-red-600 dark:text-red-400' : noInfoPct >= 25 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {noInfoPct}%
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t('kpiNoInfo')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        {/* Meldeverhalten */}
        {shortages.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('sectionReportingBehaviour')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {([1, 2, 3, 4, 5] as const).map(code => {
                const count = statusBreakdown[code] ?? 0
                if (count === 0) return null
                const pct = Math.round((count / shortages.length) * 100)
                return (
                  <div key={code} className="rounded-lg border border-border/60 bg-card p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_COLORS[code]}`} />
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('statusPrefix', { code, label: STATUS_LABELS[code] })}
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <span className={`text-2xl font-black tabular-nums ${STATUS_TEXT_COLORS[code]}`}>{count}</span>
                      <span className="text-sm text-muted-foreground tabular-nums mb-0.5">{pct}%</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${STATUS_DOT_COLORS[code]}/60`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('reportingFootnote')}
            </p>
          </section>
        )}

        <FirmaShortagesToggle
          shortages={shortages}
          historicalShortages={historicalShortages}
          historicalCount={historicalCount}
          bwlGtins={bwlGtins}
        />

        <p className="text-xs text-muted-foreground border-t border-border/40 pt-5">
          {t('footerSourcePrefix')}{' '}
          <a href="https://www.drugshortage.ch" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            drugshortage.ch
          </a>
          {' · '}
          <Link href="/methodik" className="underline hover:text-foreground">{t('footerMethodology')}</Link>
        </p>
      </div>
    </main>
  )
}
