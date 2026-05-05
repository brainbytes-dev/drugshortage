import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getShortageBySlug, getOddbByGtin, getHistoricalByGengrp, getBwlGtins } from '@/lib/db'
import { calculateScore, scoreLabel } from '@/lib/score'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const [shortage, t] = await Promise.all([
    getShortageBySlug(slug),
    getTranslations('Medikament'),
  ])

  if (!shortage) {
    return { title: t('metaTitleNotFound') }
  }

  const oddb = await getOddbByGtin(shortage.gtin).catch(() => null)

  return {
    title: oddb?.substanz
      ? t('metaTitleWithSubstanz', { name: shortage.bezeichnung, substanz: oddb.substanz })
      : t('metaTitleNoSubstanz', { name: shortage.bezeichnung }),
    description: oddb?.substanz
      ? t('metaDescriptionWithSubstanz', { name: shortage.bezeichnung, substanz: oddb.substanz, firma: shortage.firma })
      : t('metaDescriptionNoSubstanz', { name: shortage.bezeichnung, firma: shortage.firma }),
    alternates: { canonical: `https://engpassradar.ch/medikament/${slug}` },
  }
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-0.5 sm:gap-4">
      <dt className="text-sm text-muted-foreground shrink-0 sm:w-52">{label}</dt>
      <dd className="text-sm font-medium text-right">{children}</dd>
    </div>
  )
}

function ScoreBar({ label, value, max, tooltip }: { label: string; value: number; max: number; tooltip: string }) {
  return (
    <div className="space-y-1.5" title={tooltip}>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium text-foreground">{value}<span className="text-muted-foreground font-normal"> / {max}</span></span>
      </div>
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary/60" style={{ width: `${Math.round((value / max) * 100)}%` }} />
      </div>
    </div>
  )
}

export default async function MedikamentPage({ params }: PageProps) {
  const { slug } = await params
  const [shortage, t] = await Promise.all([
    getShortageBySlug(slug),
    getTranslations('Medikament'),
  ])

  if (!shortage) notFound()

  const [oddb, historical, bwlGtins] = await Promise.all([
    getOddbByGtin(shortage.gtin).catch(() => null),
    getHistoricalByGengrp(shortage.gengrp, shortage.gtin).catch(() => []),
    getBwlGtins().catch(() => [] as string[]),
  ])
  const isBwl = bwlGtins.includes(shortage.gtin)
  const score = calculateScore(shortage, isBwl)
  const { label: scoreText, color: scoreColor } = scoreLabel(score.total)

  const firmaSlug = shortage.firma.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'MedicalWebPage',
                '@id': `https://www.engpassradar.ch/medikament/${slug}`,
                url: `https://www.engpassradar.ch/medikament/${slug}`,
                name: t('jsonLdName', { name: shortage.bezeichnung }),
                description: t('jsonLdDescription', { name: shortage.bezeichnung, firma: shortage.firma, atc: shortage.atcCode ?? '' }),
                about: {
                  '@type': 'MedicalEntity',
                  name: shortage.bezeichnung,
                  manufacturer: { '@type': 'Organization', name: shortage.firma },
                  ...(shortage.atcCode ? { code: { '@type': 'MedicalCode', code: shortage.atcCode, codingSystem: 'ATC' } } : {}),
                },
                isPartOf: { '@id': 'https://www.engpassradar.ch' },
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: t('breadcrumbHome'), item: 'https://www.engpassradar.ch' },
                  { '@type': 'ListItem', position: 2, name: shortage.bezeichnung, item: `https://www.engpassradar.ch/medikament/${slug}` },
                ],
              },
            ],
          }).replace(/</g, '<'),
        }}
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
                <div className={`h-1.5 w-1.5 rounded-full ${shortage.isActive ? 'bg-destructive' : 'bg-muted-foreground'}`} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {shortage.isActive ? t('eyebrowActive') : t('eyebrowHistorical')}
                </span>
              </div>
              {shortage.atcCode && (
                <>
                  <span className="text-muted-foreground/40 text-xs">—</span>
                  <Link
                    href={{ pathname: '/wirkstoff/[atc]', params: { atc: shortage.atcCode } }}
                    className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {shortage.atcCode}
                  </Link>
                </>
              )}
              {shortage.tageSeitMeldung > 0 && (
                <>
                  <span className="text-muted-foreground/40 text-xs">—</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {t('daysReported', { days: shortage.tageSeitMeldung })}
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">
              {shortage.bezeichnung}
            </h1>

            {/* Subtitle + badges */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={{ pathname: '/', query: { firma: shortage.firma } }}
                className="text-base text-muted-foreground hover:text-foreground transition-colors"
              >
                {shortage.firma}
              </Link>

              {isBwl && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md px-2 py-0.5">
                  {t('badgeBwl')}
                </span>
              )}
              {oddb?.authStatus && oddb.authStatus !== 'A' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-2 py-0.5">
                  {t('badgeAuthExpired')}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_264px] gap-10 lg:gap-12 items-start">

          {/* Main column */}
          <div className="space-y-10 min-w-0">

            {/* Details */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">{t('sectionDetails')}</h2>
              <dl className="divide-y divide-border/40">
                <InfoRow label={t('labelFirma')}>
                  <Link href={{ pathname: '/', query: { firma: shortage.firma } }} className="hover:text-muted-foreground transition-colors">
                    {shortage.firma}
                  </Link>
                </InfoRow>

                {shortage.atcCode && (
                  <InfoRow label={t('labelAtcCode')}>
                    <Link href={{ pathname: '/wirkstoff/[atc]', params: { atc: shortage.atcCode } }} className="font-mono hover:text-muted-foreground transition-colors">
                      {shortage.atcCode}
                    </Link>
                  </InfoRow>
                )}

                <InfoRow label={t('labelStatus')}>
                  <span>{shortage.statusText}</span>
                </InfoRow>

                <InfoRow label={t('labelReportedSince')}>
                  <span className="tabular-nums">{shortage.tageSeitMeldung} {t('daysSuffix')}</span>
                </InfoRow>

                {shortage.datumLieferfahigkeit && (
                  <InfoRow label={t('labelExpectedAvailable')}>
                    <span>{shortage.datumLieferfahigkeit}</span>
                  </InfoRow>
                )}

                {shortage.ersteMeldung && (
                  <InfoRow label={t('labelFirstReport')}>
                    <span>{shortage.ersteMeldung}</span>
                  </InfoRow>
                )}

                {shortage.ersteMeldungDurch && (
                  <InfoRow label={t('labelReportedBy')}>
                    <span>{shortage.ersteMeldungDurch}</span>
                  </InfoRow>
                )}

                {oddb?.substanz && (
                  <InfoRow label={t('labelSubstance')}>
                    <span>{oddb.substanz}</span>
                  </InfoRow>
                )}

                {oddb?.prodno && (
                  <InfoRow label={t('labelSwissmedicNo')}>
                    <span className="font-mono text-xs">{oddb.prodno}</span>
                  </InfoRow>
                )}

                {oddb?.ppub != null && (
                  <InfoRow label={t('labelPpub')}>
                    <span className="font-mono">CHF {oddb.ppub.toFixed(2)}</span>
                  </InfoRow>
                )}

                {oddb?.pexf != null && (
                  <InfoRow label={t('labelPexf')}>
                    <span className="font-mono">CHF {oddb.pexf.toFixed(2)}</span>
                  </InfoRow>
                )}

                {shortage.gtin.startsWith('7680') && (
                  <InfoRow label={t('labelAips')}>
                    <a
                      href={`https://swissmedicinfo-pro.ch/showText.aspx?textType=FI&lang=DE&authNr=${parseInt(shortage.gtin.substring(4, 9), 10)}&supportMultipleResults=1`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-muted-foreground transition-colors"
                    >
                      swissmedicinfo.ch →
                    </a>
                  </InfoRow>
                )}

                {oddb?.authStatus && oddb.authStatus !== 'A' && (
                  <InfoRow label={t('labelAuthStatus')}>
                    <span className="text-destructive">{t('authStatusExpired', { status: oddb.authStatus })}</span>
                  </InfoRow>
                )}
              </dl>
            </section>

            {oddb?.zusammensetzung && (
              <section className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('sectionComposition')}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{oddb.zusammensetzung}</p>
              </section>
            )}

            {shortage.bemerkungen && (
              <section className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('sectionRemarks')}</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{shortage.bemerkungen}</p>
              </section>
            )}

            {historical.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('sectionHistory')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('historyIntro')}{' '}
                  <span className="font-semibold text-foreground tabular-nums">{t('historyCount', { count: historical.length })}</span>
                  {t('historyOutro')}
                </p>
                <div className="divide-y divide-border/40 text-sm">
                  {historical.slice(0, 10).map(h => (
                    <div key={h.gtin} className="py-2.5 flex items-start justify-between gap-4">
                      <span className="text-muted-foreground truncate">{h.bezeichnung}</span>
                      <span className="tabular-nums shrink-0 text-muted-foreground/60 text-xs">{h.tageSeitMeldung} {t('daysSuffix')}</span>
                    </div>
                  ))}
                  {historical.length > 10 && (
                    <p className="py-2 text-xs text-muted-foreground">{t('historyMore', { count: historical.length - 10 })}</p>
                  )}
                </div>
              </section>
            )}

            <p className="text-xs text-muted-foreground border-t border-border/40 pt-5">
              {t('footerSource')}
            </p>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-6">
            {/* Score card */}
            <div className="rounded-lg border border-border/60 bg-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">{t('scoreEyebrow')}</p>
                  <p className={`text-4xl font-black tabular-nums leading-none ${scoreColor}`}>{score.total}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('scoreOutOf')}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-md border ${scoreColor} bg-current/5`}
                  style={{ borderColor: 'currentColor', backgroundColor: 'color-mix(in oklch, currentColor 8%, transparent)' }}>
                  {scoreText}
                </span>
              </div>

              <div className="space-y-3 pt-1">
                <ScoreBar label={t('scoreBarTransparency')} value={score.transparency} max={35}
                  tooltip={t('scoreBarTransparencyTooltip')} />
                <ScoreBar label={t('scoreBarDuration')} value={score.duration} max={30}
                  tooltip={t('scoreBarDurationTooltip', { days: shortage.tageSeitMeldung })} />
                <ScoreBar label={t('scoreBarNoAlternatives')} value={score.noAlternatives} max={20}
                  tooltip={score.noAlternatives > 0 ? t('scoreBarNoAlternativesYes') : t('scoreBarNoAlternativesNo')} />
                <ScoreBar label={t('scoreBarCritical')} value={score.critical} max={15}
                  tooltip={isBwl ? t('scoreBarCriticalYes') : t('scoreBarCriticalNo')} />
              </div>

              <p className="text-[11px] text-muted-foreground/70 leading-relaxed pt-1 border-t border-border/40">
                {t('scoreFootnote')}{' '}
                <Link href="/methodik" className="underline hover:text-foreground">{t('scoreMethodology')}</Link>
              </p>
            </div>

            {/* Quick links */}
            <div className="rounded-lg border border-border/60 bg-card p-4 space-y-2 text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">{t('linksHeading')}</p>
              {shortage.atcCode && (
                <Link href={{ pathname: '/wirkstoff/[atc]', params: { atc: shortage.atcCode } }} className="flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
                  <span>{t('linkAllAtc', { atc: shortage.atcCode })}</span>
                  <span className="text-muted-foreground/40">→</span>
                </Link>
              )}
              <Link href={{ pathname: '/firma/[slug]', params: { slug: firmaSlug } }}
                className="flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
                <span>{t('linkFirma', { firma: shortage.firma })}</span>
                <span className="text-muted-foreground/40">→</span>
              </Link>
              {shortage.gtin.startsWith('7680') && (
                <a
                  href={`https://swissmedicinfo-pro.ch/showText.aspx?textType=FI&lang=DE&authNr=${parseInt(shortage.gtin.substring(4, 9), 10)}&supportMultipleResults=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  <span>{t('linkAips')}</span>
                  <span className="text-muted-foreground/40">↗</span>
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
