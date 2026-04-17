'use client'

import { useRef, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import type { OffMarketDrug } from '@prisma/client'
import { toSlug } from '@/lib/slug'

interface OffMarketTableProps {
  data: OffMarketDrug[]
  total: number
  page: number
  perPage: number
}

export function OffMarketTable({ data, total, page, perPage }: OffMarketTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const tableRef = useRef<HTMLDivElement>(null)
  const scrollToTable = useRef(false)

  const totalPages = Math.max(1, Math.ceil(total / perPage))

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

  function navigate(newPage: number) {
    if (newPage < 1 || newPage > totalPages || newPage === page) return
    scrollToTable.current = true
    const p = new URLSearchParams(searchParams.toString())
    p.set('page', String(newPage))
    startTransition(() => {
      router.replace(`${pathname}?${p.toString()}`, { scroll: false })
    })
  }

  const start = (page - 1) * perPage + 1
  const end = Math.min(page * perPage, total)

  return (
    <div ref={tableRef} className="space-y-3">
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="font-semibold text-foreground pl-4">Bezeichnung</TableHead>
              <TableHead className="font-semibold text-foreground">Firma</TableHead>
              <TableHead className="font-semibold text-foreground">ATC</TableHead>
              <TableHead className="font-semibold text-foreground">GTIN</TableHead>
              <TableHead className="font-semibold text-foreground pr-4">Datum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  Keine Einträge gefunden.
                </TableCell>
              </TableRow>
            ) : (
              data.map(row => (
                <TableRow
                  key={`${row.gtin}-${row.category}`}
                  className="border-border/30 hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="pl-4 font-medium text-sm max-w-xs">
                    <Link
                      href={`/gtin/${row.gtin}`}
                      className="line-clamp-2 leading-snug hover:underline underline-offset-2"
                    >
                      {row.bezeichnung}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.firma ? (
                      <Link
                        href={`/firma/${toSlug(row.firma)}`}
                        className="text-primary hover:underline underline-offset-2"
                        onClick={e => e.stopPropagation()}
                      >
                        {row.firma}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">
                    {row.atcCode ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground tabular-nums">
                    {row.gtin}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground pr-4 tabular-nums">
                    {row.datum ?? '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground tabular-nums">
            {start}–{end} von {total.toLocaleString('de-CH')}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => navigate(1)}
              aria-label="Erste Seite"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => navigate(page - 1)}
              aria-label="Vorherige Seite"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2 tabular-nums">
              {page} / {totalPages}
            </span>
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => navigate(page + 1)}
              aria-label="Nächste Seite"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => navigate(totalPages)}
              aria-label="Letzte Seite"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
