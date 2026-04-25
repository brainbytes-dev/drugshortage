import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getShortagesByAtc, getSubstanzByAtc, getAllProductsByAtc } from '@/lib/db'
import { toSlug } from '@/lib/slug'
import { WatchlistForm } from '@/components/watchlist-form'

interface PageProps {
  params: Promise<{ atc: string }>
  searchParams: Promise<{ filter?: string }>
}

export const revalidate = 3600

type FilterKey = 'all' | 'in_shortage' | 'available' | 'off_market'

const FILTERS: { key: FilterKey; label: string; dot?: string }[] = [
  { key: 'all',         label: 'Alle' },
  { key: 'in_shortage', label: 'Im Engpass',    dot: 'bg-destructive' },
  { key: 'available',   label: 'Verfügbar',     dot: 'bg-emerald-500' },
  { key: 'off_market',  label: 'Ausser Handel', dot: 'bg-muted-foreground/50' },
]

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

const STATUS_LABEL: Record<string, { label: string; dot: string; text: string }> = {
  in_shortage: { label: 'Engpass',   dot: 'bg-destructive',           text: 'text-destructive' },
  available:   { label: 'Verfügbar', dot: 'bg-emerald-500',           text: 'text-emerald-600 dark:text-emerald-400' },
  off_market:  { label: 'Ausser Handel', dot: 'bg-muted-foreground',  text: 'text-muted-foreground' },
}

export default async function WirkstoffPage({ params, searchParams }: PageProps) {
  const [{ atc }, { filter: rawFilter }] = await Promise.all([params, searchParams])
  const activeFilter: FilterKey = (FILTERS.find(f => f.key === rawFilter)?.key) ?? 'all'

  const [shortages, substanz, allProducts] = await Promise.all([
    getShortagesByAtc(atc),
    getSubstanzByAtc(atc).catch(() => null),
    getAllProductsByAtc(atc).catch(() => []),
  ])

  if (shortages.length === 0) notFound()

  const shortageCount = shortages.length
  const availableCount = allProducts.filter(p => p.status === 'available').length
  const offMarketCount = allProducts.filter(p => p.status === 'off_market').length
  const totalCatalog = allProducts.length
  const avgTage = Math.round(shortages.reduce((s, x) => s + (x.tageSeitMeldung ?? 0), 0) / shortageCount)
  const firmen = [...new Set(shortages.map(s => s.firma).filter(Boolean))]
  const hasFullCatalog = totalCatalog > shortageCount

  const filteredProducts = activeFilter === 'all'
    ? allProducts
    : allProducts.filter(p => p.status === activeFilter)

  const filterCounts: Record<FilterKey, number> = {
    all: totalCatalog,
    in_shortage: shortageCount,
    available: availableCount,
    off_market: offMarketCount,
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalWebPage',
        '@id': `https://www.engpassradar.ch/wirkstoff/${atc}`,
        url: `https://www.engpassradar.ch/wirkstoff/${atc}`,
        name: `${substanz ? `${substanz} (${atc})` : `ATC ${atc}`} Lieferengpass Schweiz | engpass.radar`,
        description: `${shortageCount} Präparat${shortageCount !== 1 ? 'e' : ''} mit dem Wirkstoff ${substanz ?? atc} ${shortageCount !== 1 ? 'sind' : 'ist'} aktuell nicht lieferbar in der Schweiz.`,
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '<') }} />

      {/* ─── Header ──────────────────────────────────────────────────── */}
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
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Wirkstoff</span>
              <span className="text-muted-foreground/40 text-xs">—</span>
              <span className="font-mono text-xs text-muted-foreground">{atc}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">
              {substanz ?? `ATC ${atc}`}
            </h1>

            <p className="text-base text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground tabular-nums">{shortageCount} Präparat{shortageCount !== 1 ? 'e' : ''}</span>{' '}
              {shortageCount !== 1 ? 'sind' : 'ist'} aktuell nicht lieferbar in der Schweiz.
              {avgTage > 0 && <> Ø Engpassdauer: <span className="font-medium text-foreground tabular-nums">{avgTage} Tage</span>.</>}
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-5 pt-1">
              <div>
                <p className="text-2xl font-black tabular-nums leading-none text-destructive">{shortageCount}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Im Engpass</p>
              </div>
              {hasFullCatalog && availableCount > 0 && (
                <div>
                  <p className="text-2xl font-black tabular-nums leading-none text-emerald-600 dark:text-emerald-400">{availableCount}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Verfügbar</p>
                </div>
              )}
              {hasFullCatalog && offMarketCount > 0 && (
                <div>
                  <p className="text-2xl font-black tabular-nums leading-none text-muted-foreground">{offMarketCount}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Ausser Handel</p>
                </div>
              )}
              {avgTage > 0 && (
                <div>
                  <p className="text-2xl font-black tabular-nums leading-none">{avgTage}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Ø Tage</p>
                </div>
              )}
              {firmen.length > 0 && (
                <div>
                  <p className="text-2xl font-black tabular-nums leading-none">{firmen.length}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Firmen im Engpass</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Filter + Produktliste ────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">

        {/* Filter badges */}
        {hasFullCatalog && (
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map(f => {
              const count = filterCounts[f.key]
              if (count === 0 && f.key !== 'all') return null
              const isActive = activeFilter === f.key
              const href = f.key === 'all' ? `/wirkstoff/${atc}` : `/wirkstoff/${atc}?filter=${f.key}`
              return (
                <Link
                  key={f.key}
                  href={href}
                  scroll={false}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150',
                    isActive
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border',
                  ].join(' ')}
                >
                  {f.dot && <span className={`h-1.5 w-1.5 rounded-full ${f.dot} ${isActive ? 'opacity-80' : ''}`} />}
                  {f.label}
                  <span className={`tabular-nums ${isActive ? 'opacity-70' : 'opacity-60'}`}>{count}</span>
                </Link>
              )
            })}
          </div>
        )}

        {hasFullCatalog ? (
          <section className="space-y-1">
            <p className="text-xs text-muted-foreground pb-1">
              {filteredProducts.length} Präparat{filteredProducts.length !== 1 ? 'e' : ''}
              {activeFilter !== 'all' ? ` (gefiltert von ${totalCatalog})` : ''}
            </p>
            <div className="divide-y divide-border/40">
              {filteredProducts.map(p => {
                const st = STATUS_LABEL[p.status]
                const href = p.shortage
                  ? `/medikament/${p.shortage.slug ?? toSlug(p.bezeichnung)}`
                  : `/gtin/${p.gtin}`
                const isClickable = p.status !== 'off_market'

                return isClickable ? (
                  <Link
                    key={p.gtin}
                    href={href}
                    className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-6 py-3.5 hover:bg-muted/20 -mx-4 px-4 rounded-lg transition-colors duration-150"
                  >
                    <ProductRow p={p} st={st} />
                  </Link>
                ) : (
                  <div key={p.gtin} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-6 py-3.5 opacity-50">
                    <ProductRow p={p} st={st} />
                  </div>
                )
              })}
            </div>
          </section>
        ) : (
          /* Fallback: only shortages (ODDB not fully imported yet) */
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
                    <p className="font-medium text-sm leading-snug group-hover:text-primary transition-colors duration-150 truncate">{s.bezeichnung}</p>
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
        )}

        <WatchlistForm atcCode={atc} atcName={substanz ?? atc} />

        <p className="text-xs text-muted-foreground border-t border-border/40 pt-5">
          Engpass-Daten: drugshortage.ch ·{hasFullCatalog ? ' Produktkatalog: ODDB / Swissmedic ·' : ''} keine Gewähr auf Vollständigkeit
        </p>
      </div>
    </main>
  )
}

// Extracted to avoid duplication between clickable and non-clickable rows
function ProductRow({
  p,
  st,
}: {
  p: { bezeichnung: string; firma: string | null; shortage: { statusText?: string; datumLieferfahigkeit?: string; tageSeitMeldung?: number } | null; status: string }
  st: { label: string; dot: string; text: string }
}) {
  return (
    <>
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm leading-snug group-hover:text-primary transition-colors duration-150 truncate">
            {p.bezeichnung}
          </p>
          <span className={`inline-flex items-center gap-1 shrink-0 text-[10px] font-semibold uppercase tracking-wide ${st.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {p.firma ?? <span className="opacity-40">Hersteller n. v.</span>}
        </p>
      </div>
      {p.shortage && (
        <div className="flex items-center gap-4 sm:shrink-0">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{p.shortage.statusText}</p>
            {p.shortage.datumLieferfahigkeit && p.shortage.datumLieferfahigkeit !== 'offen' && (
              <p className="text-xs text-muted-foreground/60">ab {p.shortage.datumLieferfahigkeit}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold tabular-nums leading-none">{p.shortage.tageSeitMeldung}</p>
            <p className="text-[11px] text-muted-foreground">Tage</p>
          </div>
          <svg className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150 shrink-0 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </>
  )
}
