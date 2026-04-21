'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, useTransition } from 'react'
import { Sparkles, X, Download } from 'lucide-react'
import { FirmaRankingSheet } from '@/components/firma-ranking-sheet-optimized'
import { AtcGruppenSheet } from '@/components/atc-gruppen-sheet-optimized'
import type { HeroStats } from '@/lib/db'
import type { FirmaRanking, AtcGruppeStats } from '@/lib/types'

interface HeroProps extends HeroStats {
  firmenRanking: FirmaRanking[]
  atcGruppen: AtcGruppeStats[]
}

function fmtCH(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '’')
}

export function Hero({ activeCount, newThisWeek, resolvedThisWeek, longTermCount, longTermPct, historicalTotal, isoWeek, firmenRanking, atcGruppen }: HeroProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [query, setQuery] = useState(searchParams.get('search') ?? '')
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Sync input when URL changes externally (e.g. clear filters)
  useEffect(() => {
    startTransition(() => setQuery(searchParams.get('search') ?? ''))
  }, [searchParams])

  // Cleanup debounce on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const neuActive = searchParams.get('neu') === '1'
  const hasActiveFilter = !!searchParams.get('search') || neuActive

  function clearFilters() {
    const p = new URLSearchParams(searchParams.toString())
    p.delete('search')
    p.delete('neu')
    p.delete('page')
    setQuery('')
    router.push(`/?${p.toString()}#dashboard`)
  }

  function exportCsv() {
    const params = new URLSearchParams()
    for (const key of ['search', 'status', 'firma', 'atc', 'sort']) {
      const v = searchParams.get(key)
      if (v) params.set(key, v)
    }
    window.location.href = `/api/export/csv${params.size > 0 ? '?' + params.toString() : ''}`
  }

  function handleQueryChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value.trim()) {
        params.set('search', value.trim())
      } else {
        params.delete('search')
      }
      params.delete('page')
      startTransition(() => {
        router.replace(`/?${params.toString()}#dashboard`, { scroll: false })
      })
    }, 300)
  }

  function submitSearch(term: string) {
    const q = term.trim()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const params = new URLSearchParams(searchParams.toString())
    if (q) {
      params.set('search', q)
    } else {
      params.delete('search')
    }
    params.delete('page')
    router.push(`/?${params.toString()}#dashboard`)
  }

  function toggleNeu() {
    const p = new URLSearchParams(searchParams.toString())
    if (neuActive) {
      p.delete('neu')
    } else {
      p.set('neu', '1')
      p.delete('page')
    }
    router.push(`/?${p.toString()}#dashboard`)
  }

  return (
    <div className="w-full bg-background">
      {/* Outer container matches dashboard max-w-7xl px-4 exactly */}
      <div className="max-w-7xl mx-auto px-4 pt-[72px] pb-6">

        {/* Inner section: eyebrow + grid get extra horizontal breathing room */}
        <div className="px-10">

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2.5 mb-11">
          <PulseDot />
          <span
            className="font-mono text-[11.5px] text-muted-foreground tracking-[0.04em] uppercase"
            aria-label="Datenquellen und Abgleichstatus"
          >
            Abgleich heute · drugshortage.ch · BWL · USB Basel · ODDB
          </span>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-[72px] items-end">

          {/* Left: big number + headline */}
          <div>
            <p
              className="font-sans text-[clamp(128px,14vw,184px)] font-semibold leading-[0.88] tracking-[-0.055em] text-foreground tabular-nums mb-5"
              aria-label={`${activeCount} aktive Engpässe`}
            >
              {fmtCH(activeCount)}
            </p>
            <h1 className="text-[34px] font-medium tracking-[-0.02em] leading-[1.15] text-foreground m-0 max-w-[720px]">
              Medikamente in der Schweiz sind aktuell als nicht lieferbar gemeldet.
            </h1>
            <p className="text-base text-muted-foreground mt-[18px] max-w-[580px] leading-[1.55]">
              Aggregiert aus drugshortage.ch, BWL-Pflichtlager und der
              USB-Basel-Liste. Täglich abgeglichen, öffentlich zugänglich.{' '}
              <a href="/methodik" className="font-mono text-[13px] text-primary hover:underline">
                Methodik & Quellen →
              </a>
            </p>
          </div>

          {/* Right: delta rows */}
          <div className="flex flex-col gap-5 lg:border-l lg:border-border lg:pl-8 border-t border-border pt-6 lg:pt-0">
            <DeltaRow label={`Neu seit KW ${isoWeek}`} value={`+${newThisWeek}`} tone="neutral" />
            <DeltaRow label={`Beendet seit KW ${isoWeek}`} value={`−${resolvedThisWeek}`} tone="good" />
            <DeltaRow label="≥ 6 Monate aktiv" value={fmtCH(longTermCount)} suffix={`${longTermPct} %`} />
            <DeltaRow label="Historische Fälle" value={fmtCH(historicalTotal)} suffix="seit 2018" />
          </div>
        </div>

        </div>{/* end px-10 inner */}

        {/* Search + buttons — outer px-4 width = same as table */}
        <div className="mt-16">
          <label
            htmlFor="hero-search"
            className="block text-[11.5px] font-medium text-muted-foreground tracking-[0.03em] uppercase mb-2.5"
          >
            Suchen
          </label>
          <div className="flex items-stretch gap-2">
            {/* Search input — grows, never compresses below a readable width */}
            <div className="flex min-w-0 flex-1 items-center gap-3.5 px-5 py-4 bg-muted/40 border border-border/80 rounded-lg">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="text-muted-foreground shrink-0" aria-hidden>
                <circle cx="9" cy="9" r="6" /><path d="M14 14l4 4" strokeLinecap="round" />
              </svg>
              <input
                id="hero-search"
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitSearch(query)}
                placeholder="Wirkstoff, Handelsname, ATC-Code oder Firma"
                className="min-w-0 flex-1 border-none outline-none bg-transparent font-sans text-base text-foreground placeholder:text-muted-foreground/60"
              />
              <button
                onClick={() => submitSearch(query)}
                aria-label="Suche starten"
                className="font-mono text-[11px] text-muted-foreground px-[7px] py-[3px] border border-border/80 rounded shrink-0"
              >
                ↵
              </button>
            </div>

            {/* Action buttons — shrink-0 so they never compress the search bar */}
            <button
              onClick={toggleNeu}
              className={[
                'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-4 text-sm font-medium transition-colors whitespace-nowrap',
                neuActive
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'border-border/80 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted',
              ].join(' ')}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              Neue Meldungen
            </button>
            {firmenRanking.length > 0 && <FirmaRankingSheet firmenRanking={firmenRanking} />}
            {atcGruppen.length > 0 && <AtcGruppenSheet atcGruppen={atcGruppen} />}

            {/* Stacked icon column: × (if active) + CSV export */}
            <div className="flex flex-col shrink-0 self-stretch gap-[3px]">
              {hasActiveFilter && (
                <Tip label="Filter zurücksetzen">
                  <button
                    onClick={clearFilters}
                    aria-label="Filter zurücksetzen"
                    className="flex flex-1 items-center justify-center rounded border border-border/80 bg-muted/40 px-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Tip>
              )}
              <Tip label="Aktuelle Ansicht als CSV exportieren">
                <button
                  onClick={exportCsv}
                  aria-label="CSV exportieren"
                  className="flex items-center justify-center rounded border border-border/80 bg-muted/40 px-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  style={{ flex: hasActiveFilter ? '1' : undefined, paddingTop: hasActiveFilter ? undefined : '0', height: hasActiveFilter ? undefined : '100%' }}
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </Tip>
            </div>
          </div>
        </div>

      </div>{/* end max-w-7xl */}
    </div>
  )
}

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group relative flex flex-col flex-1">
      {children}
      <span className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-popover border border-border px-2 py-1 text-[11px] text-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
        {label}
      </span>
    </div>
  )
}

function PulseDot() {
  return (
    <span
      aria-hidden="true"
      className="relative flex h-[7px] w-[7px] shrink-0"
    >
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[oklch(0.58_0.13_150)] opacity-75" />
      <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-[oklch(0.58_0.13_150)]" />
    </span>
  )
}

function DeltaRow({ label, value, tone = 'neutral', suffix }: {
  label: string
  value: string
  tone?: 'neutral' | 'good' | 'bad'
  suffix?: string
}) {
  const valueClass =
    tone === 'good'
      ? 'text-[oklch(0.58_0.13_150)]'
      : tone === 'bad'
      ? 'text-[oklch(0.58_0.21_27)]'
      : 'text-foreground'

  return (
    <div>
      <p className="text-[12px] text-muted-foreground tracking-[0.02em] mb-1.5">{label}</p>
      <div className="flex items-baseline gap-2.5">
        <span className={`font-sans text-[28px] font-semibold tracking-[-0.01em] tabular-nums ${valueClass}`}>
          {value}
        </span>
        {suffix && <span className="text-[13px] text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  )
}
