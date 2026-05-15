'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, X, Download } from 'lucide-react'
import { Link, useRouter } from '@/i18n/navigation'
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
  const t = useTranslations('Hero')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [query, setQuery] = useState(searchParams.get('search') ?? '')
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    startTransition(() => setQuery(searchParams.get('search') ?? ''))
  }, [searchParams])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const neuActive = searchParams.get('neu') === '1'
  const hasActiveFilter = !!searchParams.get('search') || neuActive

  function pushHomeWithParams(params: URLSearchParams, opts: { replace?: boolean; scroll?: boolean } = {}) {
    const query: Record<string, string> = {}
    params.forEach((v, k) => { query[k] = v })
    const href = { pathname: '/' as const, query, hash: 'dashboard' }
    if (opts.replace) {
      router.replace(href, { scroll: opts.scroll ?? true })
    } else {
      router.push(href, { scroll: opts.scroll ?? true })
    }
  }

  function clearFilters() {
    const p = new URLSearchParams(searchParams.toString())
    p.delete('search')
    p.delete('neu')
    p.delete('page')
    setQuery('')
    pushHomeWithParams(p)
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
        pushHomeWithParams(params, { replace: true, scroll: false })
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
    pushHomeWithParams(params)
  }

  function toggleNeu() {
    const p = new URLSearchParams(searchParams.toString())
    if (neuActive) {
      p.delete('neu')
    } else {
      p.set('neu', '1')
      p.delete('page')
    }
    pushHomeWithParams(p)
  }

  return (
    <div className="w-full bg-background">
      <div className="max-w-7xl mx-auto px-4 pt-16 pb-8 sm:px-10 sm:pt-20">

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-3 mb-12">
          <PulseDot />
          <span
            className="font-mono text-[11px] text-muted-foreground tracking-[0.04em] uppercase"
            aria-label={t('sourcesAria')}
          >
            {t('sourcesLabel')}
          </span>
        </div>

        {/* Two-column grid: big number + delta rows */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-16 items-end">

          {/* Left: H1 = the live count itself */}
          <div>
            <h1
              className="font-serif text-[clamp(96px,13vw,168px)] font-semibold leading-[0.88] tracking-[-0.04em] text-foreground tabular-nums mb-4"
              aria-label={t('activeAria', { count: activeCount })}
            >
              {fmtCH(activeCount)}
            </h1>
            <p className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight text-foreground max-w-[720px]">
              {t('headline')}
            </p>
            <p className="text-base text-muted-foreground mt-5 max-w-[580px] leading-relaxed">
              {t('subline')}{' '}
              <Link href="/methodik" className="font-mono text-xs text-primary hover:underline">
                {t('methodologyLink')}
              </Link>
            </p>
          </div>

          {/* Right: delta rows */}
          <div className="flex flex-col gap-5 lg:border-l lg:border-border-strong lg:pl-8 border-t border-border-strong pt-6 lg:pt-0">
            <DeltaRow label={t('deltaNew', { week: isoWeek })} value={`+${newThisWeek}`} tone="neutral" />
            <DeltaRow label={t('deltaResolved', { week: isoWeek })} value={`−${resolvedThisWeek}`} tone="good" />
            <DeltaRow label={t('deltaLongTerm')} value={fmtCH(longTermCount)} suffix={`${longTermPct} %`} />
            <DeltaRow label={t('deltaHistorical')} value={fmtCH(historicalTotal)} suffix={t('deltaHistoricalSuffix')} />
          </div>
        </div>

        {/* Search + actions */}
        <div className="mt-16">
          <label
            htmlFor="hero-search"
            className="block font-mono text-[11px] font-medium text-muted-foreground tracking-[0.04em] uppercase mb-3"
          >
            {t('searchLabel')}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">

            {/* Search input + mobile icon column */}
            <div className="flex min-w-0 flex-1 items-stretch gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 bg-muted/40 border border-border-strong rounded-lg">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-muted-foreground shrink-0" aria-hidden>
                  <circle cx="9" cy="9" r="6" /><path d="M14 14l4 4" strokeLinecap="round" />
                </svg>
                <input
                  id="hero-search"
                  value={query}
                  onChange={e => handleQueryChange(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitSearch(query)}
                  placeholder={t('searchPlaceholder')}
                  className="min-w-0 flex-1 border-none outline-none bg-transparent text-base text-foreground placeholder:text-muted-foreground/60"
                />
                <button
                  onClick={() => submitSearch(query)}
                  aria-label={t('searchSubmitAria')}
                  className="font-mono text-[11px] text-muted-foreground px-2 py-1 border border-border-strong rounded shrink-0 min-h-11 min-w-11 sm:min-h-8 sm:min-w-8 flex items-center justify-center"
                >
                  ↵
                </button>
              </div>

              {/* Mobile icon column */}
              <div className="sm:hidden flex flex-col shrink-0 self-stretch gap-1">
                {hasActiveFilter && (
                  <Tip label={t('filterResetTip')}>
                    <button
                      onClick={clearFilters}
                      aria-label={t('filterResetAria')}
                      className="flex flex-1 min-h-11 items-center justify-center rounded border border-border-strong bg-muted/40 px-3 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </Tip>
                )}
                <Tip label={t('exportCsvTip')}>
                  <button
                    onClick={exportCsv}
                    aria-label={t('exportCsvAria')}
                    className="flex flex-1 min-h-11 items-center justify-center rounded border border-border-strong bg-muted/40 px-3 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </Tip>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-stretch gap-2">
              <button
                onClick={toggleNeu}
                className={[
                  'inline-flex flex-1 sm:flex-none shrink-0 items-center justify-center gap-2 rounded-lg border px-4 min-h-11 sm:min-h-10 text-sm font-medium transition-colors whitespace-nowrap min-w-[140px]',
                  neuActive
                    ? 'border-status-new bg-status-new-soft text-status-new'
                    : 'border-border-strong bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted',
                ].join(' ')}
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                {t('newReportsButton')}
              </button>
              {firmenRanking.length > 0 && <FirmaRankingSheet firmenRanking={firmenRanking} />}
              {atcGruppen.length > 0 && <AtcGruppenSheet atcGruppen={atcGruppen} />}

              {/* Desktop secondary icons */}
              <div className="hidden sm:flex flex-col self-stretch shrink-0 gap-1 ml-auto">
                {hasActiveFilter && (
                  <Tip label={t('filterResetTip')}>
                    <button
                      onClick={clearFilters}
                      aria-label={t('filterResetAria')}
                      className="flex flex-1 items-center justify-center rounded border border-border-strong bg-muted/40 px-3 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </Tip>
                )}
                <Tip label={t('exportCsvTip')}>
                  <button
                    onClick={exportCsv}
                    aria-label={t('exportCsvAria')}
                    className="flex flex-1 items-center justify-center rounded border border-border-strong bg-muted/40 px-3 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </Tip>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group relative flex flex-col flex-1">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded bg-popover border border-border px-2 py-1 text-[11px] text-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
        {label}
      </span>
    </div>
  )
}

function PulseDot() {
  return (
    <span
      aria-hidden="true"
      className="relative flex h-2 w-2 shrink-0"
    >
      <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-status-resolved opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-status-resolved" />
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
      ? 'text-status-resolved'
      : tone === 'bad'
      ? 'text-status-active'
      : 'text-foreground'

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-semibold tracking-tight tabular-nums ${valueClass}`}>
          {value}
        </span>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  )
}
