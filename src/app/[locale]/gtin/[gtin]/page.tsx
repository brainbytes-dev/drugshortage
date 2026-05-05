import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getOffMarketByGtin, getOddbByGtin } from '@/lib/db'
import { buildPageAlternates } from '@/lib/i18n-meta'
import type { Locale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: string; gtin: string }>
}

export const revalidate = 3600

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, gtin } = await params
  const [offMarket, oddb, t] = await Promise.all([
    getOffMarketByGtin(gtin).catch(() => []),
    getOddbByGtin(gtin).catch(() => null),
    getTranslations('Gtin'),
  ])
  const name = oddb?.bezeichnungDe ?? offMarket[0]?.bezeichnung ?? t('fallbackName', { gtin })
  const offMarketLabels = offMarket.map(e =>
    e.category === 'AUSSER_HANDEL' ? t('offMarketLabelAusserHandel') :
    e.category === 'VERTRIEBSEINSTELLUNG' ? t('offMarketLabelVertriebseinstellung') : t('offMarketLabelErloschen')
  )
  const statusText = offMarketLabels.length > 0 ? `${t('metaStatusSeparator')}${offMarketLabels.join(', ')}` : ''
  const substanzText = oddb?.substanz ? t('metaSubstanzPart', { substanz: oddb.substanz }) : ''
  const { canonical, languages } = buildPageAlternates(
    '/gtin/[gtin]',
    locale as Locale,
    { gtin },
  )
  return {
    title: t('metaTitle', { name }),
    description: t('metaDescriptionBase', { name, substanz: substanzText, gtin, status: statusText }),
    alternates: { canonical, languages },
  }
}

export default async function GtinPage({ params }: PageProps) {
  const { gtin } = await params

  const [offMarket, oddb, t] = await Promise.all([
    getOffMarketByGtin(gtin).catch((err) => { console.error('[gtin/page] getOffMarketByGtin failed', err); return [] }),
    getOddbByGtin(gtin).catch((err) => { console.error('[gtin/page] getOddbByGtin failed', err); return null }),
    getTranslations('Gtin'),
  ])

  if (offMarket.length === 0 && !oddb) notFound()

  const AUTH_STATUS_LABELS: Record<string, { label: string; variant: string }> = {
    A: { label: t('authStatusZugelassen'), variant: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
    E: { label: t('authStatusErloschen'),  variant: 'text-destructive bg-destructive/10 border-destructive/30' },
    S: { label: t('authStatusSistiert'),   variant: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
  }

  const CATEGORY_LABELS: Record<string, { label: string; variant: string }> = {
    AUSSER_HANDEL:        { label: t('categoryAusserHandel'),        variant: 'text-destructive bg-destructive/10 border-destructive/30' },
    VERTRIEBSEINSTELLUNG: { label: t('categoryVertriebseinstellung'), variant: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
    ERLOSCHEN:            { label: t('categoryErloschen'),            variant: 'text-destructive bg-destructive/10 border-destructive/30' },
  }

  const bezeichnung = oddb?.bezeichnungDe ?? offMarket[0]?.bezeichnung ?? gtin
  const firma = offMarket[0]?.firma ?? null
  const atcCode = oddb?.atcCode ?? offMarket[0]?.atcCode ?? null
  const authStatus = oddb?.authStatus ?? null
  const authStatusInfo = authStatus ? (AUTH_STATUS_LABELS[authStatus] ?? null) : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalWebPage',
        '@id': `https://www.engpassradar.ch/gtin/${gtin}`,
        url: `https://www.engpassradar.ch/gtin/${gtin}`,
        name: t('jsonLdName', { name: bezeichnung }),
        about: {
          '@type': 'MedicalEntity',
          name: bezeichnung,
          ...(atcCode ? { code: { '@type': 'MedicalCode', code: atcCode, codingSystem: 'ATC' } } : {}),
        },
        isPartOf: { '@id': 'https://www.engpassradar.ch' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('breadcrumbHome'), item: 'https://www.engpassradar.ch' },
          { '@type': 'ListItem', position: 2, name: bezeichnung, item: `https://www.engpassradar.ch/gtin/${gtin}` },
        ],
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      {/* Page header */}
      <section className="border-b border-border/40">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group mb-8"
          >
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform duration-150" />
            {t('backLink')}
          </Link>

          <div className="space-y-4">
            {/* Eyebrow */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t('eyebrow')}</span>
              </div>
              <span className="text-muted-foreground/40 text-xs">—</span>
              <span className="font-mono text-xs text-muted-foreground">{gtin}</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">{bezeichnung}</h1>

            {/* Status badges */}
            {(offMarket.length > 0 || authStatusInfo) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {offMarket.map(entry => {
                  const info = CATEGORY_LABELS[entry.category]
                  return (
                    <span
                      key={entry.category}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${info?.variant ?? ''}`}
                    >
                      {info?.label ?? entry.category}
                      {entry.datum ? ` · ${entry.datum}` : ''}
                    </span>
                  )
                })}
                {authStatusInfo && (
                  <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${authStatusInfo.variant}`}>
                    {t('authStatusWithCode', { label: authStatusInfo.label, code: authStatus ?? '' })}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">{t('sectionDetails')}</h2>
          <dl className="divide-y divide-border/40">
            {firma && (
              <div className="py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-0.5 sm:gap-4">
                <dt className="text-sm text-muted-foreground shrink-0 sm:w-52">{t('labelFirma')}</dt>
                <dd className="text-sm font-medium sm:text-right">{firma}</dd>
              </div>
            )}

            <div className="py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-0.5 sm:gap-4">
              <dt className="text-sm text-muted-foreground shrink-0 sm:w-52">{t('labelGtin')}</dt>
              <dd className="text-sm font-mono sm:text-right">{gtin}</dd>
            </div>

            {atcCode && (
              <div className="py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-0.5 sm:gap-4">
                <dt className="text-sm text-muted-foreground shrink-0 sm:w-52">{t('labelAtcCode')}</dt>
                <dd className="text-sm sm:text-right">
                  <Link href={{ pathname: '/wirkstoff/[atc]', params: { atc: atcCode } }} className="font-mono hover:text-muted-foreground transition-colors underline">
                    {atcCode}
                  </Link>
                </dd>
              </div>
            )}

            {oddb?.substanz && (
              <div className="py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-0.5 sm:gap-4">
                <dt className="text-sm text-muted-foreground shrink-0 sm:w-52">{t('labelSubstance')}</dt>
                <dd className="text-sm font-medium sm:text-right">{oddb.substanz}</dd>
              </div>
            )}

            {oddb?.prodno && (
              <div className="py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-0.5 sm:gap-4">
                <dt className="text-sm text-muted-foreground shrink-0 sm:w-52">{t('labelSwissmedicNo')}</dt>
                <dd className="text-sm font-mono sm:text-right">{oddb.prodno}</dd>
              </div>
            )}

            {oddb?.ppub != null && (
              <div className="py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-0.5 sm:gap-4">
                <dt className="text-sm text-muted-foreground shrink-0 sm:w-52">{t('labelPpub')}</dt>
                <dd className="text-sm font-mono sm:text-right">CHF {oddb.ppub.toFixed(2)}</dd>
              </div>
            )}

            {oddb?.pexf != null && (
              <div className="py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-0.5 sm:gap-4">
                <dt className="text-sm text-muted-foreground shrink-0 sm:w-52">{t('labelPexf')}</dt>
                <dd className="text-sm font-mono sm:text-right">CHF {oddb.pexf.toFixed(2)}</dd>
              </div>
            )}

            {gtin.startsWith('7680') && (
              <div className="py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-0.5 sm:gap-4">
                <dt className="text-sm text-muted-foreground shrink-0 sm:w-52">{t('labelAips')}</dt>
                <dd className="text-sm sm:text-right">
                  <a
                    href={`https://swissmedicinfo-pro.ch/showText.aspx?textType=FI&lang=DE&authNr=${parseInt(gtin.substring(4, 9), 10)}&supportMultipleResults=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-muted-foreground transition-colors underline"
                  >
                    swissmedicinfo.ch →
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </section>

        {oddb?.zusammensetzung && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('sectionComposition')}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{oddb.zusammensetzung}</p>
          </section>
        )}

        <p className="text-xs text-muted-foreground border-t border-border/40 pt-5">
          {t('footerSource')}
        </p>
      </div>
    </main>
  )
}
