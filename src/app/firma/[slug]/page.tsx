import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import {
  getFirmaBySlug,
  getFirmaActiveShortages,
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
    title: `${firma} | engpass.radar`,
    description: `Lieferengpass-Profil von ${firma}: aktuelle Engpässe, Meldeverhalten und Severity Score.`,
  }
}

const STATUS_LABELS: Record<number, string> = {
  1: 'Direkt gemeldet',
  2: 'Gemeldet',
  3: 'Sporadisch',
  4: 'Keine Info',
  5: 'Verhandlung',
}

const STATUS_COLORS: Record<number, string> = {
  1: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  2: 'bg-lime-100 dark:bg-lime-900/40 text-lime-700 dark:text-lime-400',
  3: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
  4: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
  5: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400',
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

  const [shortages, historicalCount] = await Promise.all([
    getFirmaActiveShortages(firma),
    getFirmaHistoricalCount(firma),
  ])

  const bwlSet = new Set(bwlGtins)

  const statusBreakdown = shortages.reduce<Record<number, number>>((acc, s) => {
    acc[s.statusCode] = (acc[s.statusCode] ?? 0) + 1
    return acc
  }, {})

  const scores = shortages.map(s => calculateScore(s, bwlSet.has(s.gtin)).total)
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0

  const noInfoCount = statusBreakdown[4] ?? 0
  const noInfoPct =
    shortages.length > 0
      ? Math.round((noInfoCount / shortages.length) * 100)
      : 0

  const { label: avgLabel, color: avgColor } = scoreLabel(avgScore)

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebPage",
                "@id": `https://www.engpassradar.ch/firma/${slug}`,
                "url": `https://www.engpassradar.ch/firma/${slug}`,
                "name": `${firma} | engpass.radar`,
                "description": `Lieferengpass-Profil von ${firma}: aktuelle Engpässe und Severity Score.`,
                "isPartOf": { "@id": "https://www.engpassradar.ch" }
              },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.engpassradar.ch" },
                  { "@type": "ListItem", "position": 2, "name": firma, "item": `https://www.engpassradar.ch/firma/${slug}` }
                ]
              }
            ]
          }).replace(/</g, '\u003c')
        }}
      />
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <Link
          href={`/?firma=${encodeURIComponent(firma)}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Zur Übersicht
        </Link>

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{firma}</h1>
          <p className="text-muted-foreground text-sm">Lieferengpass-Profil</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Aktive Engpässe</p>
            <p className="text-3xl font-black tabular-nums">{shortages.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Historisch</p>
            <p className="text-3xl font-black tabular-nums">{historicalCount}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Ø Severity Score</p>
            <p className={`text-3xl font-black tabular-nums ${avgColor}`}>{avgScore}</p>
            <p className={`text-xs font-medium ${avgColor}`}>{avgLabel}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Keine-Info-Anteil</p>
            <p className={`text-3xl font-black tabular-nums ${noInfoPct >= 50 ? 'text-red-600 dark:text-red-400' : noInfoPct >= 25 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {noInfoPct}%
            </p>
            <p className="text-xs text-muted-foreground">Status 4 — keine Kommunikation</p>
          </div>
        </div>

        {/* Meldeverhalten */}
        {shortages.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-semibold text-base">Meldeverhalten</h2>
            <div className="flex flex-wrap gap-2">
              {([1, 2, 3, 4, 5] as const).map(code => {
                const count = statusBreakdown[code] ?? 0
                if (count === 0) return null
                const pct = Math.round((count / shortages.length) * 100)
                return (
                  <div
                    key={code}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${STATUS_COLORS[code]}`}
                  >
                    <span className="font-mono text-xs font-bold">Status {code}</span>
                    <span className="text-xs opacity-80">{STATUS_LABELS[code]}</span>
                    <span className="font-black tabular-nums text-sm">
                      {count}
                      <span className="font-normal text-xs ml-0.5">({pct}%)</span>
                    </span>
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
          <h2 className="font-semibold text-base">
            Aktive Engpässe
            <span className="ml-2 text-muted-foreground font-normal text-sm">({shortages.length})</span>
          </h2>
          {shortages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Keine aktiven Engpässe für diese Firma.</p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Bezeichnung</th>
                    <th className="px-4 py-2.5 text-center font-medium text-muted-foreground text-xs">Status</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs tabular-nums">Tage</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {shortages.map(s => {
                    const sc = calculateScore(s, bwlSet.has(s.gtin))
                    const { color } = scoreLabel(sc.total)
                    return (
                      <tr key={s.gtin} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-2.5 max-w-[300px]">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <Link
                              href={`/medikament/${toSlug(s.bezeichnung)}`}
                              className="truncate hover:underline font-medium"
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

        <p className="text-xs text-muted-foreground border-t pt-6">
          Daten aus{' '}
          <a
            href="https://www.drugshortage.ch"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            drugshortage.ch
          </a>
          {' · '}
          <Link href="/methodik" className="underline hover:text-foreground">
            Score-Methodik
          </Link>
        </p>
      </div>
    </main>
  )
}
