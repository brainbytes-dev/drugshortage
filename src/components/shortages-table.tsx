'use client'

import { useState, useMemo, useRef, useEffect, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter, usePathname, Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './status-badge'
import { ShortageDrawer } from './shortage-drawer'
import type { Shortage } from '@/lib/types'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react'
import { calculateScore, scoreLabel } from '@/lib/score'
import { toSlug } from '@/lib/slug'

interface ShortagesTableProps {
  shortages: Shortage[]
  total: number
  page: number
  perPage: number
  bwlGtins?: string[]
}

const COLUMN_KEYS = ['bezeichnung', 'firma', 'statusCode', 'datumLieferfahigkeit', 'tageSeitMeldung', 'atcCode'] as const
type ColumnKey = typeof COLUMN_KEYS[number]
const SORTABLE: Record<ColumnKey, boolean> = {
  bezeichnung: true,
  firma: true,
  statusCode: true,
  datumLieferfahigkeit: false,
  tageSeitMeldung: true,
  atcCode: false,
}

const NEU_THRESHOLD_DAYS = 7

export function ShortagesTable({ shortages, total, page, perPage, bwlGtins }: ShortagesTableProps) {
  const t = useTranslations('ShortagesTable')
  const [selected, setSelected] = useState<Shortage | null>(null)
  const pageInputRef = useRef<HTMLInputElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const [, startTransition] = useTransition()
  const scrollToTable = useRef(false)

  // Scroll to table top on explicit page navigation.
  useEffect(() => {
    if (scrollToTable.current) {
      scrollToTable.current = false
      const el = tableRef.current
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 16
        window.scrollTo({ top: Math.max(0, top), behavior: 'instant' })
      }
    }
  }, [page, shortages])

  // ✅ Only recreate Set when bwlGtins changes (prevents unnecessary re-renders)
  const bwlSet = useMemo(() => new Set(bwlGtins ?? []), [bwlGtins])
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const totalPages = Math.ceil(total / perPage)

  const navigate = (params: Record<string, string>, scrollBehavior: 'table' | 'keep' = 'keep') => {
    if (scrollBehavior === 'table') scrollToTable.current = true
    const p = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(params)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    const query = Object.fromEntries(p.entries())
    startTransition(() => {
      router.replace(
        { pathname, query } as Parameters<typeof router.replace>[0],
        { scroll: false }
      )
    })
  }

  const handleSort = (key: string) => {
    const current = searchParams.get('sort') ?? ''
    const [currentKey, currentDir] = current.split(':')
    const newDir = currentKey === key && currentDir === 'asc' ? 'desc' : 'asc'
    navigate({ sort: `${key}:${newDir}` })
  }

  const columnLabel: Record<ColumnKey, string> = {
    bezeichnung: t('colBezeichnung'),
    firma: t('colFirma'),
    statusCode: t('colStatus'),
    datumLieferfahigkeit: t('colAvailableFrom'),
    tageSeitMeldung: t('colDays'),
    atcCode: t('colAtc'),
  }

  return (
    <>
      <div ref={tableRef} className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {COLUMN_KEYS.map(key => (
                <TableHead key={key} className="whitespace-nowrap">
                  {SORTABLE[key] ? (
                    <button
                      onClick={() => handleSort(key)}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {columnLabel[key]}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ) : columnLabel[key]}
                </TableHead>
              ))}
              <TableHead className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t('colScore')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shortages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMN_KEYS.length + 1} className="text-center text-muted-foreground py-12">
                  {t('emptyState')}
                </TableCell>
              </TableRow>
            ) : (
              shortages.map(s => (
                <TableRow
                  key={s.gtin}
                  onClick={() => setSelected(s)}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium max-w-[280px]" title={s.bezeichnung}>
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{s.bezeichnung}</span>
                      {s.tageSeitMeldung <= NEU_THRESHOLD_DAYS && (
                        <span className="shrink-0 text-[10px] font-semibold tracking-wide text-status-resolved bg-status-resolved-soft px-1.5 py-0.5 rounded">
                          {t('badgeNew')}
                        </span>
                      )}
                      {bwlSet.has(s.gtin) && (
                        <span className="shrink-0 text-[10px] font-semibold tracking-wide text-status-longterm bg-status-longterm-soft px-1.5 py-0.5 rounded">
                          {t('badgeBwl')}
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    <Link
                      href={{ pathname: '/firma/[slug]', params: { slug: toSlug(s.firma) } }}
                      onClick={e => e.stopPropagation()}
                      className="hover:underline hover:text-foreground"
                    >
                      {s.firma}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge code={s.statusCode} />
                  </TableCell>
                  <TableCell className="text-sm">{s.datumLieferfahigkeit}</TableCell>
                  <TableCell className="text-sm text-right tabular-nums">{s.tageSeitMeldung}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{s.atcCode}</TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    {(() => {
                      const sc = calculateScore(s, bwlSet.has(s.gtin))
                      const { color } = scoreLabel(sc.total)
                      return <span className={`tabular-nums text-xs font-semibold ${color}`}>{sc.total}</span>
                    })()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-3 gap-2">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            {t('paginationSummary', { total, page, totalPages })}
          </p>
          <div className="flex items-center gap-1">
            {/* First page */}
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => navigate({ page: '1' }, 'table')}
              aria-label={t('firstPage')}
            >
              <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            {/* Prev page */}
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => navigate({ page: String(page - 1) }, 'table')}
              aria-label={t('previousPage')}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            {/* Manual page input — key={page} resets the uncontrolled input when page changes */}
            <input
              key={page}
              ref={pageInputRef}
              type="number"
              min={1}
              max={totalPages}
              defaultValue={String(page)}
              aria-label={t('pageOfTotalAria', { totalPages })}
              onBlur={() => {
                const n = parseInt(pageInputRef.current?.value ?? '', 10)
                if (!isNaN(n) && n >= 1 && n <= totalPages && n !== page) {
                  navigate({ page: String(n) }, 'table')
                } else if (pageInputRef.current) {
                  pageInputRef.current.value = String(page)
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') pageInputRef.current?.blur()
              }}
              className="w-12 h-8 rounded-md border border-input bg-background text-center text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="text-sm text-muted-foreground tabular-nums" aria-hidden="true">/ {totalPages}</span>
            {/* Next page */}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => navigate({ page: String(page + 1) }, 'table')}
              aria-label={t('nextPage')}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            {/* Last page */}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => navigate({ page: String(totalPages) }, 'table')}
              aria-label={t('lastPage')}
            >
              <ChevronsRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      <ShortageDrawer shortage={selected} onClose={() => setSelected(null)} />
    </>
  )
}
