'use client'

import { useState, useMemo, useRef, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
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

// ✅ Moved outside component to prevent recreation on every render
const COLUMNS: { key: keyof Shortage; label: string; sortable?: boolean }[] = [
  { key: 'bezeichnung', label: 'Bezeichnung', sortable: true },
  { key: 'firma', label: 'Firma', sortable: true },
  { key: 'statusCode', label: 'Status', sortable: true },
  { key: 'datumLieferfahigkeit', label: 'Lieferbar ab' },
  { key: 'tageSeitMeldung', label: 'Tage', sortable: true },
  { key: 'atcCode', label: 'ATC' },
] as const // ✅ Make readonly to prevent accidental mutations

const NEU_THRESHOLD_DAYS = 7

export function ShortagesTable({ shortages, total, page, perPage, bwlGtins }: ShortagesTableProps) {
  const [selected, setSelected] = useState<Shortage | null>(null)
  const [pageInput, setPageInput] = useState(String(page))
  const pageInputRef = useRef<HTMLInputElement>(null)
  const [, startTransition] = useTransition()

  // Keep input in sync when page changes externally (filter reset, sort, etc.)
  useEffect(() => { setPageInput(String(page)) }, [page])
  // ✅ Only recreate Set when bwlGtins changes (prevents unnecessary re-renders)
  const bwlSet = useMemo(() => new Set(bwlGtins ?? []), [bwlGtins])
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const totalPages = Math.ceil(total / perPage)

  const navigate = (params: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(params)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    startTransition(() => {
      router.replace(`${pathname}?${p.toString()}`, { scroll: false })
    })
  }

  const handleSort = (key: string) => {
    const current = searchParams.get('sort') ?? ''
    const [currentKey, currentDir] = current.split(':')
    const newDir = currentKey === key && currentDir === 'asc' ? 'desc' : 'asc'
    navigate({ sort: `${key}:${newDir}` })
  }

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {COLUMNS.map(col => (
                <TableHead key={col.key} className="whitespace-nowrap">
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {col.label}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ) : col.label}
                </TableHead>
              ))}
              <TableHead className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shortages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length + 1} className="text-center text-muted-foreground py-12">
                  Keine Engpässe gefunden
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
                        <span className="shrink-0 text-[10px] font-bold tracking-wide text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-1 py-0.5 rounded">
                          NEU
                        </span>
                      )}
                      {bwlSet.has(s.gtin) && (
                        <span className="shrink-0 text-[10px] font-bold tracking-wide text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">
                          BWL
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    <Link
                      href={`/firma/${toSlug(s.firma)}`}
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
        <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
          <p className="text-sm text-muted-foreground">
            {total} Einträge · Seite {page} / {totalPages}
          </p>
          <div className="flex items-center gap-1">
            {/* First page */}
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => { setPageInput('1'); navigate({ page: '1' }) }}
              title="Erste Seite"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            {/* Prev page */}
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => { const p = String(page - 1); setPageInput(p); navigate({ page: p }) }}
              title="Vorherige Seite"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {/* Manual page input */}
            <input
              ref={pageInputRef}
              type="number"
              min={1}
              max={totalPages}
              value={pageInput}
              onChange={e => setPageInput(e.target.value)}
              onBlur={() => {
                const n = parseInt(pageInput, 10)
                if (!isNaN(n) && n >= 1 && n <= totalPages && n !== page) {
                  navigate({ page: String(n) })
                } else {
                  setPageInput(String(page))
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') pageInputRef.current?.blur()
              }}
              className="w-12 h-8 rounded-md border border-input bg-background text-center text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="text-sm text-muted-foreground tabular-nums">/ {totalPages}</span>
            {/* Next page */}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => { const p = String(page + 1); setPageInput(p); navigate({ page: p }) }}
              title="Nächste Seite"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {/* Last page */}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => { const p = String(totalPages); setPageInput(p); navigate({ page: p }) }}
              title="Letzte Seite"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ShortageDrawer shortage={selected} onClose={() => setSelected(null)} />
    </>
  )
}
