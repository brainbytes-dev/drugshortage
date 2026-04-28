import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import {
  getFirmaBySlug,
  getFirmaActiveShortages,
  getFirmaHistoricalShortages,
  getFirmaHistoricalCount,
  getBwlGtins,
  getAllFirmaSlugs,
} from '@/lib/db'
import { toSlug } from '@/lib/slug'
import { calculateScore, scoreLabel } from '@/lib/score'

export const revalidate = 3600

export async function generateStaticParams() {
  const firms = await getAllFirmaSlugs()
  return firms.map(f => ({ slug: f.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const firma = await getFirmaBySlug(slug)
  if (!firma) return { title: 'Firma nicht gefunden | engpass.radar' }
  return {
    title: `${firma} Lieferengpässe Schweiz | engpass.radar`,
    description: `Lieferengpass-Profil von ${firma}: aktuelle Engpässe, Meldeverhalten (Status 1–5) und Severity Score. Täglich aktualisiert aus drugshortage.ch.`,
    alternates: { canonical: `https://engpassradar.ch/firma/${slug}` },
  }
}

const STATUS_LABELS: Record<number, string> = {
  1: 'Direkt gemeldet',
  2: 'Gemeldet',
  3: 'Sporadisch',
  4: 'Keine Info',
  5: 'Verhandlung',
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

  const [firma, bwlGtins] = await Promise.all([
    getFirmaBySlug(slug),
    getBwlGtins(),
  ])

  if (!firma) notFound()

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
                name: `${firma} | engpass.radar`,
                description: `Lieferengpass-Profil von ${firma}: aktuelle Engpässe und Severity Score.`,
                isPartOf: { '@id': 'https://www.engpassradar.ch' },
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.engpassradar.ch' },
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
            href={`/?firma=${encodeURIComponent(firma)}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group mb-8"
          >
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform duration-150" />
            Zur Übersicht
          </Link>

          <div className="space-y-4">
            {/* Eyebrow */}
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Firma</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">{firma}</h1>

            {/* KPI strip */}
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div>
                <p className="text-3xl font-black tabular-nums leading-none">{shortages.length}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Aktive Engpässe</p>
              </div>
              <div className="w-px h-8 bg-border/60 hidden sm:block" />
              <div>
                <p className="text-3xl font-black tabular-nums leading-none">{historicalCount}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Historisch</p>
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
                <p className="text-[11px] text-muted-foreground mt-0.5">Keine Info</p>
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
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Meldeverhalten</h2>
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
                        Status {code} · {STATUS_LABELS[code]}
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
              Status 1 = Firma kommuniziert proaktiv · Status 4 = keine Information.
              Hoher Status-4-Anteil erhöht den Severity Score.
            </p>
          </section>
        )}

        {/* Active shortages table */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Aktive Engpässe
            <span className="ml-2 text-muted-foreground/60 font-normal normal-case tracking-normal">({shortages.length})</span>
          </h2>
          {shortages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Keine aktiven Engpässe für diese Firma.</p>
          ) : (
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/60">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Bezeichnung</th>
                    <th className="px-4 py-2.5 text-center font-medium text-muted-foreground text-xs">Status</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs tabular-nums">Tage</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {shortages.map(s => {
                    const sc = calculateScore(s, bwlSet.has(s.gtin))
                    const { color } = scoreLabel(sc.total)
                    return (
                      <tr key={s.gtin} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 max-w-[300px]">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <Link
                              href={`/medikament/${toSlug(s.bezeichnung)}`}
                              className="truncate hover:text-primary hover:underline transition-colors"
                            >
                              {s.bezeichnung}
                            </Link>
                            {bwlSet.has(s.gtin) && (
                              <span className="shrink-0 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">
                                BWL
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`text-xs font-semibold ${STATUS_TEXT_COLORS[s.statusCode] ?? 'text-muted-foreground'}`}>
                            {s.statusCode}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                          {s.tageSeitMeldung}
                        </td>
                        <td className={`px-4 py-2.5 text-right tabular-nums font-semibold text-xs ${color}`}>
                          {sc.total}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Historical shortages table */}
        {historicalCount > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Historische Engpässe
              <span className="ml-2 text-muted-foreground/60 font-normal normal-case tracking-normal">
                ({historicalCount}{historicalShortages.length > 0 && historicalShortages.length < historicalCount ? `, ${historicalShortages.length} angezeigt` : ''})
              </span>
            </h2>
            {historicalShortages.length > 0 ? (
              <div className="rounded-lg border border-border/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/60">
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Bezeichnung</th>
                      <th className="px-4 py-2.5 text-center font-medium text-muted-foreground text-xs">Status</th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs tabular-nums">Tage</th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {historicalShortages.map(s => {
                      const sc = calculateScore(s, bwlSet.has(s.gtin))
                      const { color } = scoreLabel(sc.total)
                      return (
                        <tr key={s.gtin} className="hover:bg-muted/30 transition-colors opacity-70">
                          <td className="px-4 py-2.5 max-w-[300px]">
                            <span className="flex items-center gap-1.5 min-w-0">
                              <Link
                                href={`/medikament/${toSlug(s.bezeichnung)}`}
                                className="truncate hover:text-primary hover:underline transition-colors"
                              >
                                {s.bezeichnung}
                              </Link>
                              {bwlSet.has(s.gtin) && (
                                <span className="shrink-0 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">
                                  BWL
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`text-xs font-semibold ${STATUS_TEXT_COLORS[s.statusCode] ?? 'text-muted-foreground'}`}>
                              {s.statusCode}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                            {s.tageSeitMeldung}
                          </td>
                          <td className={`px-4 py-2.5 text-right tabular-nums font-semibold text-xs ${color}`}>
                            {sc.total}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center border border-border/60 rounded-lg">
                Verlaufsdaten werden beim nächsten Rebuild geladen.
              </p>
            )}
          </section>
        )}

        <p className="text-xs text-muted-foreground border-t border-border/40 pt-5">
          Daten aus{' '}
          <a href="https://www.drugshortage.ch" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            drugshortage.ch
          </a>
          {' · '}
          <Link href="/methodik" className="underline hover:text-foreground">Score-Methodik</Link>
        </p>
      </div>
    </main>
  )
}
