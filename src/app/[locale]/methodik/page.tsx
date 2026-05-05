import type { Metadata } from 'next'
import { buildPageAlternates } from '@/lib/i18n-meta'
import type { Locale } from '@/i18n/routing'
import Script from 'next/script'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/prisma-optimized'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const t = await getTranslations('Methodik')
  const { locale } = await params
  const { canonical, languages } = buildPageAlternates('/methodik', locale as Locale)
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical, languages },
  }
}

function fmtCH(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '’')
}

export default async function MetodikPage() {
  const t = await getTranslations('Methodik')

  const [activeCount, totalProducts, totalEpisodes] = await Promise.all([
    prisma.shortage.count({ where: { isActive: true } }),
    prisma.shortage.count(),
    prisma.shortageEpisode.count(),
  ])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: t('jsonLdHeadline'),
    url: 'https://www.engpassradar.ch/methodik',
    publisher: {
      '@type': 'Organization',
      name: 'engpass.radar',
      url: 'https://www.engpassradar.ch',
    },
  }

  const sources = [
    {
      name: 'drugshortage.ch',
      url: 'https://www.drugshortage.ch',
      badge: t('sourceDrugshortageBadge'),
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      desc: t('sourceDrugshortageDesc'),
    },
    {
      name: t('sourceBwlName'),
      url: 'https://www.bwl.admin.ch/de/meldestelle-heilmittel',
      badge: t('sourceBwlBadge'),
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      desc: t('sourceBwlDesc'),
    },
    {
      name: 'ODDB / ywesee',
      url: 'https://www.oddb.org',
      badge: t('sourceOddbBadge'),
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      desc: t('sourceOddbDesc'),
    },
    {
      name: t('sourceUsbName'),
      url: 'https://www.spitalpharmazie-basel.ch',
      badge: t('sourceUsbBadge'),
      badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
      desc: t('sourceUsbDesc'),
    },
  ]

  const stats = [
    { value: t('statRefreshValue'), label: t('statRefreshLabel') },
    { value: fmtCH(totalProducts), label: t('statProductsLabel') },
    { value: fmtCH(totalEpisodes), label: t('statEpisodesLabel') },
    { value: fmtCH(activeCount), label: t('statActiveLabel') },
  ]

  const episodeFields: [string, string][] = [
    ['opened_at', t('episodeFieldOpenedAt')],
    ['closed_at', t('episodeFieldClosedAt')],
    ['duration_days', t('episodeFieldDurationDays')],
    ['is_active', t('episodeFieldIsActive')],
  ]

  const tiers = [
    { range: '80–100', label: t('tierCriticalLabel'), color: 'text-red-600 dark:text-red-400', desc: t('tierCriticalDesc') },
    { range: '60–79', label: t('tierHighLabel'), color: 'text-orange-600 dark:text-orange-400', desc: t('tierHighDesc') },
    { range: '40–59', label: t('tierMediumLabel'), color: 'text-yellow-600 dark:text-yellow-400', desc: t('tierMediumDesc') },
    { range: '0–39', label: t('tierLowLabel'), color: 'text-emerald-600 dark:text-emerald-400', desc: t('tierLowDesc') },
  ]

  const transparencyRows: [string, string, string][] = [
    ['1', t('transparencyStatus1'), '5'],
    ['2', t('transparencyStatus2'), '12'],
    ['3', t('transparencyStatus3'), '22'],
    ['4', t('transparencyStatus4'), '35'],
    ['5', t('transparencyStatus5'), '20'],
  ]

  const durationRows: [string, string][] = [
    [t('durationRange1'), '5'],
    [t('durationRange2'), '10'],
    [t('durationRange3'), '17'],
    [t('durationRange4'), '22'],
    [t('durationRange5'), '27'],
    [t('durationRange6'), '30'],
  ]

  const limitations = [
    t.rich('limitation1', {
      strong: (chunks) => <strong className="text-foreground font-semibold">{chunks}</strong>,
    }),
    t('limitation2'),
    t('limitation3'),
    t('limitation4'),
  ]

  return (
    <main className="min-h-screen bg-background">
      <Script
        id="ld-methodik"
        type="application/ld+json"
        strategy="beforeInteractive"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <div className="max-w-3xl mx-auto px-4 pt-16 pb-24 sm:pb-32">

        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-14">
          <ArrowLeft className="h-4 w-4" />
          {t('backToOverview')}
        </Link>

        {/* Page header */}
        <div className="mb-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-5">
            {t('eyebrowTransparency')}
          </p>
          <h1 className="text-[clamp(32px,4vw,52px)] font-semibold leading-[1.08] tracking-[-0.025em] text-foreground mb-4">
            {t.rich('h1', {
              br: () => <br />,
            })}
          </h1>
          <p className="text-base text-muted-foreground max-w-[520px] leading-[1.6]">
            {t('lead')}
          </p>
        </div>

        {/* ── DATENQUELLEN ── */}
        <section className="border-t border-border/40 pt-14 mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-8">
            {t('eyebrowSources')}
          </p>
          <div className="divide-y border rounded-lg overflow-hidden">
            {sources.map(s => (
              <div key={s.name} className="px-5 py-5 bg-card space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-sm hover:underline"
                  >
                    {s.name}
                  </a>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.badgeColor}`}>{s.badge}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-[1.65]">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── ERHEBUNG & AKTUALISIERUNG ── */}
        <section className="border-t border-border/40 pt-14 mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-8">
            {t('eyebrowCollection')}
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-8 mb-10">
            {stats.map(s => (
              <div key={s.label}>
                <p className="text-[12px] text-muted-foreground tracking-[0.02em] mb-1.5">{s.label}</p>
                <span className="font-sans text-[28px] font-semibold tracking-[-0.01em] tabular-nums text-foreground">
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-4 text-sm text-muted-foreground leading-[1.7]">
            <p>
              {t.rich('collectionBody1', {
                em: (chunks) => <em>{chunks}</em>,
              })}
            </p>
            <p>{t('collectionBody2')}</p>
            <p>{t('collectionBody3')}</p>
          </div>
        </section>

        {/* ── EPISODE-TRACKING ── */}
        <section className="border-t border-border/40 pt-14 mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-8">
            {t('eyebrowEpisodeTracking')}
          </p>
          <p className="text-sm text-muted-foreground leading-[1.7] mb-6">
            {t.rich('episodeIntro', {
              strong: (chunks) => <strong className="text-foreground font-semibold">{chunks}</strong>,
            })}
          </p>
          <div className="rounded-lg border overflow-hidden text-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground">{t('episodeColField')}</th>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground">{t('episodeColDesc')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {episodeFields.map(([field, desc]) => (
                  <tr key={field} className="bg-card">
                    <td className="py-2.5 px-4 font-mono text-[12px] text-foreground whitespace-nowrap">{field}</td>
                    <td className="py-2.5 px-4 text-[13px] text-muted-foreground">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── ANALYTISCHE AUSWERTUNG ── */}
        <section className="border-t border-border/40 pt-14 mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-8">
            {t('eyebrowAnalysis')}
          </p>
          <div className="space-y-4 text-sm text-muted-foreground leading-[1.7]">
            <p>
              {t.rich('analysisBody1', {
                em: (chunks) => <em>{chunks}</em>,
              })}
            </p>
            <p>{t('analysisBody2')}</p>
          </div>
        </section>

        {/* ── SEVERITY SCORE ── */}
        <section className="border-t border-border/40 pt-14 mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-5">
            {t('eyebrowSeverity')}
          </p>
          <h2 className="text-[clamp(24px,3vw,36px)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground mb-4">
            {t('severityHeading')}
          </h2>
          <div className="space-y-4 text-sm text-muted-foreground leading-[1.7] mb-10">
            <p>{t('severityBody1')}</p>
            <p>
              {t.rich('severityBody2', {
                strong: (chunks) => <strong className="text-foreground font-semibold">{chunks}</strong>,
              })}
            </p>
          </div>

          {/* Score tiers */}
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-5">{t('eyebrowTiers')}</p>
          <div className="divide-y border rounded-lg overflow-hidden mb-12">
            {tiers.map(t2 => (
              <div key={t2.range} className="flex items-start gap-5 px-5 py-4 bg-card">
                <span className={`tabular-nums font-semibold text-[17px] w-16 shrink-0 ${t2.color}`}>{t2.range}</span>
                <div>
                  <p className={`font-semibold text-sm mb-0.5 ${t2.color}`}>{t2.label}</p>
                  <p className="text-muted-foreground text-[13px] leading-[1.6]">{t2.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Factors */}
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-6">{t('eyebrowFactors')}</p>
          <div className="space-y-4">

            {/* Factor 1 */}
            <div className="rounded-lg border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{t('factor1Title')}</h3>
                <span className="text-xs text-muted-foreground tabular-nums">{t('factor1Points')}</span>
              </div>
              <p className="text-[13px] text-muted-foreground leading-[1.65]">
                {t.rich('factor1Body', {
                  em: (chunks) => <em>{chunks}</em>,
                })}
              </p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-1.5 text-left font-medium text-muted-foreground">{t('factor1ColCode')}</th>
                    <th className="py-1.5 text-left font-medium text-muted-foreground">{t('factor1ColDesc')}</th>
                    <th className="py-1.5 text-right font-medium text-muted-foreground">{t('factor1ColPoints')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transparencyRows.map(([code, desc, pts]) => (
                    <tr key={code}>
                      <td className="py-1.5 font-mono">{code}</td>
                      <td className="py-1.5 text-muted-foreground">{desc}</td>
                      <td className="py-1.5 text-right tabular-nums font-semibold">{pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Factor 2 */}
            <div className="rounded-lg border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{t('factor2Title')}</h3>
                <span className="text-xs text-muted-foreground tabular-nums">{t('factor2Points')}</span>
              </div>
              <p className="text-[13px] text-muted-foreground leading-[1.65]">
                {t.rich('factor2Body', {
                  em: (chunks) => <em>{chunks}</em>,
                })}
              </p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-1.5 text-left font-medium text-muted-foreground">{t('factor2ColRange')}</th>
                    <th className="py-1.5 text-right font-medium text-muted-foreground">{t('factor2ColPoints')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {durationRows.map(([range, pts]) => (
                    <tr key={range}>
                      <td className="py-1.5 text-muted-foreground">{range}</td>
                      <td className="py-1.5 text-right tabular-nums font-semibold">{pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Factor 3 */}
            <div className="rounded-lg border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{t('factor3Title')}</h3>
                <span className="text-xs text-muted-foreground tabular-nums">{t('factor3Points')}</span>
              </div>
              <p className="text-[13px] text-muted-foreground leading-[1.65]">
                {t('factor3Body')}
              </p>
            </div>

            {/* Factor 4 */}
            <div className="rounded-lg border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{t('factor4Title')}</h3>
                <span className="text-xs text-muted-foreground tabular-nums">{t('factor4Points')}</span>
              </div>
              <p className="text-[13px] text-muted-foreground leading-[1.65]">
                {t.rich('factor4Body', {
                  link: (chunks) => (
                    <a
                      href="https://www.bwl.admin.ch/de/meldestelle-heilmittel"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground"
                    >
                      {chunks}
                    </a>
                  ),
                })}
              </p>
            </div>
          </div>
        </section>

        {/* ── FORMEL ── */}
        <section className="border-t border-border/40 pt-14 mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-6">
            {t('eyebrowFormula')}
          </p>
          <pre className="rounded-lg bg-muted px-5 py-4 text-sm font-mono leading-[1.8] overflow-x-auto">
{t('formula')}
          </pre>
        </section>

        {/* ── EINSCHRÄNKUNGEN ── */}
        <section className="border-t border-border/40 pt-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-6">
            {t('eyebrowLimitations')}
          </p>
          <ul className="space-y-3">
            {limitations.map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-[1.7]">
                <span className="font-mono text-[11px] text-primary shrink-0 mt-[3px]">{String(i + 1).padStart(2, '0')}</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

      </div>
    </main>
  )
}
