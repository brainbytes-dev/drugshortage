'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { calculateScore, scoreLabel } from '@/lib/score'
import { toSlug } from '@/lib/slug'
import type { Shortage } from '@/lib/types'

const STATUS_TEXT_COLORS: Record<number, string> = {
  1: 'text-emerald-600 dark:text-emerald-400',
  2: 'text-lime-600 dark:text-lime-400',
  3: 'text-amber-600 dark:text-amber-400',
  4: 'text-red-600 dark:text-red-400',
  5: 'text-yellow-600 dark:text-yellow-400',
}

type SortKey = 'bezeichnung' | 'statusCode' | 'tageSeitMeldung' | 'score'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`ml-1 inline-block text-[10px] ${active ? 'opacity-100' : 'opacity-30'}`}>
      {active && dir === 'desc' ? '↓' : '↑'}
    </span>
  )
}

interface Props {
  shortages: Shortage[]
  historicalShortages: Shortage[]
  historicalCount: number
  bwlGtins: string[]
}

export function FirmaShortagesToggle({ shortages, historicalShortages, historicalCount, bwlGtins }: Props) {
  const t = useTranslations('FirmaShortages')
  const [view, setView] = useState<'active' | 'historical'>('active')
  const [sortKey, setSortKey] = useState<SortKey>('tageSeitMeldung')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const bwlSet = useMemo(() => new Set(bwlGtins), [bwlGtins])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'bezeichnung' ? 'asc' : 'desc')
    }
  }

  const rows = useMemo(() => {
    const base = view === 'active' ? shortages : historicalShortages
    return [...base].sort((a, b) => {
      let valA: string | number
      let valB: string | number
      if (sortKey === 'score') {
        valA = calculateScore(a, bwlSet.has(a.gtin)).total
        valB = calculateScore(b, bwlSet.has(b.gtin)).total
      } else if (sortKey === 'bezeichnung') {
        valA = a.bezeichnung.toLowerCase()
        valB = b.bezeichnung.toLowerCase()
      } else {
        valA = a[sortKey]
        valB = b[sortKey]
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [view, shortages, historicalShortages, sortKey, sortDir, bwlSet])

  function th(label: string, key: SortKey, align: 'left' | 'center' | 'right' = 'left') {
    const alignCls = align === 'left' ? 'text-left' : align === 'center' ? 'text-center' : 'text-right'
    return (
      <th
        className={`px-4 py-2.5 ${alignCls} font-medium text-muted-foreground text-xs cursor-pointer select-none hover:text-foreground transition-colors`}
        onClick={() => handleSort(key)}
      >
        {label}
        <SortIcon active={sortKey === key} dir={sortDir} />
      </th>
    )
  }

  return (
    <section className="space-y-3">
      {/* Tab toggle */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/40 border border-border/60 w-fit">
        <button
          onClick={() => setView('active')}
          className={[
            'px-3 py-1.5 rounded-md text-xs font-semibold transition-colors duration-150',
            view === 'active'
              ? 'bg-background text-foreground shadow-sm border border-border/60'
              : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
        >
          {t('tabActive')}
          <span className={`ml-1.5 tabular-nums ${view === 'active' ? 'text-foreground' : 'text-muted-foreground/60'}`}>
            ({shortages.length})
          </span>
        </button>
        {historicalCount > 0 && (
          <button
            onClick={() => setView('historical')}
            className={[
              'px-3 py-1.5 rounded-md text-xs font-semibold transition-colors duration-150',
              view === 'historical'
                ? 'bg-background text-foreground shadow-sm border border-border/60'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {t('tabHistorical')}
            <span className={`ml-1.5 tabular-nums ${view === 'historical' ? 'text-foreground' : 'text-muted-foreground/60'}`}>
              ({historicalCount})
            </span>
          </button>
        )}
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {view === 'active' ? t('emptyActive') : t('emptyHistorical')}
        </p>
      ) : (
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border/60">
                {th(t('colBezeichnung'), 'bezeichnung', 'left')}
                {th(t('colStatus'), 'statusCode', 'center')}
                {th(t('colDays'), 'tageSeitMeldung', 'right')}
                {th(t('colScore'), 'score', 'right')}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rows.map(s => {
                const sc = calculateScore(s, bwlSet.has(s.gtin))
                const { color } = scoreLabel(sc.total)
                return (
                  <tr
                    key={s.gtin}
                    className={`hover:bg-muted/30 transition-colors${view === 'historical' ? ' opacity-70' : ''}`}
                  >
                    <td className="px-4 py-2.5 max-w-[300px]">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <Link
                          href={{ pathname: '/medikament/[slug]', params: { slug: s.slug ?? toSlug(s.bezeichnung) } }}
                          className="truncate hover:text-primary hover:underline transition-colors"
                        >
                          {s.bezeichnung}
                        </Link>
                        {bwlSet.has(s.gtin) && (
                          <span className="shrink-0 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">
                            {t('badgeBwl')}
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
  )
}
