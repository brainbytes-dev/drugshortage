import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getShortagesByAtc, getSubstanzByAtc } from '@/lib/db'
import { toSlug } from '@/lib/slug'
import { WatchlistForm } from '@/components/watchlist-form'

interface PageProps {
  params: Promise<{ atc: string }>
}

export const revalidate = 3600

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { atc } = await params
  const [shortages, substanz] = await Promise.all([
    getShortagesByAtc(atc),
    getSubstanzByAtc(atc).catch(() => null),
  ])
  const count = shortages.length

  return {
    title: `${substanz ? `${substanz} (${atc})` : `ATC ${atc}`} — Lieferengpässe Schweiz | engpass.radar`,
    description: count > 0
      ? `Alle Lieferengpässe für ${substanz ?? atc} in der Schweiz. ATC-Code ${atc}. Täglich aktualisiert.`
      : undefined,
  }
}

export default async function WirkstoffPage({ params }: PageProps) {
  const { atc } = await params
  const [shortages, substanz] = await Promise.all([
    getShortagesByAtc(atc),
    getSubstanzByAtc(atc).catch(() => null),
  ])

  if (shortages.length === 0) notFound()

  const count = shortages.length
  const avgTage = Math.round(shortages.reduce((s, x) => s + (x.tageSeitMeldung ?? 0), 0) / count)
  const firmen = [...new Set(shortages.map(s => s.firma).filter(Boolean))]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalWebPage',
        '@id': `https://www.engpassradar.ch/wirkstoff/${atc}`,
        url: `https://www.engpassradar.ch/wirkstoff/${atc}`,
        name: `${substanz ? `${substanz} (${atc})` : `ATC ${atc}`} Lieferengpass Schweiz | engpass.radar`,
        description: `${count} Präparat${count !== 1 ? 'e' : ''} mit dem Wirkstoff ${substanz ?? atc} ${count !== 1 ? 'sind' : 'ist'} aktuell nicht lieferbar in der Schweiz.`,
        about: {
          '@type': 'MedicalEntity',
          name: substanz ?? atc,
          code: { '@type': 'MedicalCode', code: atc, codingSystem: 'ATC' },
        },
        isPartOf: { '@id': 'https://www.engpassradar.ch' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.engpassradar.ch' },
          { '@type': 'ListItem', position: 2, name: substanz ?? `ATC ${atc}`, item: `https://www.engpassradar.ch/wirkstoff/${atc}` },
        ],
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '<') }}
      />

      {/* Page header */}
      <section className="border-b border-border/40">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
          <Link
            href={`/?atc=${atc}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group mb-8"
          >
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform duration-150" />
            Alle {atc}-Engpässe
          </Link>

          <div className="space-y-4">
            {/* Eyebrow */}
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Wirkstoff</span>
              <span className="text-muted-foreground/40 text-xs">—</span>
              <span className="font-mono text-xs text-muted-foreground">{atc}</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">
              {substanz ?? `ATC ${atc}`}
            </h1>

            {/* Lede */}
            <p className="text-base text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground tabular-nums">{count} Präparat{count !== 1 ? 'e'  : ''}</span> {count !== 1 ? 'sind' : 'ist'} aktuell nicht lieferbar in der Schweiz.
              {avgTage > 0 && (
                <> Ø Engpassdauer: <span className="font-medium text-foreground tabular-nums">{avgTage} Tage</span>.</>
              )}
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-5 pt-1">
              <div className="text-center sm:text-left">
                <p className="text-2xl font-black tabular-nums leading-none">{count}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Präparate</p>
              </div>
              {avgTage > 0 && (
                <div className="text-center sm:text-left">
                  <p className="text-2xl font-black tabular-nums leading-none">{avgTage}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Ø Tage</p>
                </div>
              )}
              {firmen.length > 0 && (
                <div className="text-center sm:text-left">
                  <p className="text-2xl font-black tabular-nums leading-none">{firmen.length}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Firmen</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* Präparate list */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Betroffene Präparate</h2>
          <div className="divide-y divide-border/40">
            {shortages.map(s => (
              <Link
                key={s.gtin}
                href={`/medikament/${s.slug ?? toSlug(s.bezeichnung)}`}
                className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-6 py-3.5 hover:bg-muted/20 -mx-4 px-4 rounded-lg transition-colors duration-150"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="font-medium text-sm leading-snug group-hover:text-primary transition-colors duration-150 truncate">
                    {s.bezeichnung}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.firma}</p>
                </div>
                <div className="flex items-center gap-4 sm:shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{s.statusText}</p>
                    {s.datumLieferfahigkeit && s.datumLieferfahigkeit !== 'offen' && (
                      <p className="text-xs text-muted-foreground/60">ab {s.datumLieferfahigkeit}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums leading-none">{s.tageSeitMeldung}</p>
                    <p className="text-[11px] text-muted-foreground">Tage</p>
                  </div>
                  <svg className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150 shrink-0 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Watchlist */}
        <WatchlistForm atcCode={atc} atcName={substanz ?? atc} />

        <p className="text-xs text-muted-foreground border-t border-border/40 pt-5">
          Daten von drugshortage.ch · keine Gewähr auf Vollständigkeit
        </p>
      </div>
    </main>
  )
}
