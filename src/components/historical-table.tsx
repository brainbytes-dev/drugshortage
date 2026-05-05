'use client'

import { useRef, useEffect, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter, usePathname, Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react'
import type { HistoricalShortage } from '@/lib/db'
import { toSlug } from '@/lib/slug'

interface HistoricalTableProps {
  data: HistoricalShortage[]
  total: number
  page: number
  perPage: number
}

const SORT_KEYS = ['bezeichnung', 'firma', 'lastSeenAt', 'firstSeenAt', 'occurrenceCount'] as const
type SortKey = typeof SORT_KEYS[number]

const LOCALE_TO_BCP47: Record<string, string> = {
  de: 'de-CH',
  en: 'en-GB',
  fr: 'fr-CH',
  it: 'it-CH',
}

export function HistoricalTable({ data, total, page, perPage }: HistoricalTableProps) {
  const t = useTranslations('HistoricalTable')
  const locale = useLocale()
  const dateLocale = LOCALE_TO_BCP47[locale] ?? 'de-CH'
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const tableRef = useRef<HTMLDivElement>(null)
  const scrollToTable = useRef(false)
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  useEffect(() => {
    if (scrollToTable.current) {
      scrollToTable.current = false
      const el = tableRef.current
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 16
        window.scrollTo({ top: Math.max(0, top), behavior: 'instant' })
      }
    }
  }, [page, data])

  function navigate(updates: Record<string, string | null>, scroll = false) {
    const p = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v === null) p.delete(k); else p.set(k, v)
    }
    scrollToTable.current = scroll
    const query = Object.fromEntries(p.entries())
    startTransition(() => {
      router.replace(
        { pathname, query } as Parameters<typeof router.replace>[0],
        { scroll: false }
      )
    })
  }

  const currentSort = searchParams.get('sort') ?? 'lastSeenAt:desc'
  const [sortField, sortDir] = currentSort.split(':')

  function toggleSort(field: string) {
    const newDir = sortField === field && sortDir === 'desc' ? 'asc' : 'desc'
    navigate({ sort: `${field}:${newDir}`, page: '1' }, true)
  }

  const start = (page - 1) * perPage + 1
  const end   = Math.min(page * perPage, total)

  const colLabel: Record<SortKey, string> = {
    bezeichnung: t('colBezeichnung'),
    firma: t('colFirma'),
    lastSeenAt: t('colLastSeen'),
    firstSeenAt: t('colFirstSeen'),
    occurrenceCount: t('colOccurrences'),
  }

  return (
    <div ref={tableRef} className="space-y-3">
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/40">
              {SORT_KEYS.map(key => (
                <TableHead
                  key={key}
                  className={[
                    'font-semibold text-foreground',
                    key === 'bezeichnung' ? 'pl-4' : '',
                    key === 'occurrenceCount' ? 'text-right pr-4' : '',
                  ].join(' ')}
                >
                  <button
                    onClick={() => toggleSort(key)}
                    className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    {colLabel[key]}
                    <ArrowUpDown className={[
                      'h-3 w-3',
                      sortField === key ? 'text-primary' : 'text-muted-foreground/50',
                    ].join(' ')} />
                  </button>
                </TableHead>
              ))}
              <TableHead className="font-semibold text-foreground">{t('colDuration')}</TableHead>
              <TableHead className="font-semibold text-foreground pr-4">{t('colAtc')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  {t('emptyState')}
                </TableCell>
              </TableRow>
            ) : (
              data.map(row => (
                <TableRow key={row.id} className="border-border/30 hover:bg-muted/30 transition-colors">
                  <TableCell className="pl-4 font-medium text-sm max-w-xs">
                    {row.slug ? (
                      <Link href={{ pathname: '/medikament/[slug]', params: { slug: row.slug } }} className="hover:text-primary hover:underline underline-offset-2">
                        <span className="line-clamp-2 leading-snug">{row.bezeichnung}</span>
                      </Link>
                    ) : (
                      <span className="line-clamp-2 leading-snug">{row.bezeichnung}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <Link href={{ pathname: '/firma/[slug]', params: { slug: toSlug(row.firma) } }} className="text-primary hover:underline underline-offset-2">
                      {row.firma}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">
                    {formatDate(row.lastSeenAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">
                    {formatDate(row.firstSeenAt)}
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    {row.occurrenceCount > 1 ? (
                      <span className="inline-flex items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold px-2 py-0.5 tabular-nums">
                        {row.occurrenceCount}×
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground tabular-nums">1×</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">
                    {row.durationDays !== null ? t('durationDays', { days: row.durationDays }) : '—'}
                  </TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground pr-4">
                    {row.atcCode}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground tabular-nums">
            {t('rangeOfTotal', { start, end, total })}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page <= 1}
              onClick={() => navigate({ page: '1' }, true)} aria-label={t('firstPage')}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page <= 1}
              onClick={() => navigate({ page: String(page - 1) }, true)} aria-label={t('previousPage')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2 tabular-nums">{page} / {totalPages}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page >= totalPages}
              onClick={() => navigate({ page: String(page + 1) }, true)} aria-label={t('nextPage')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page >= totalPages}
              onClick={() => navigate({ page: String(totalPages) }, true)} aria-label={t('lastPage')}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
