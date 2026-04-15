'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './status-badge'
import { ShortageDrawer } from './shortage-drawer'
import type { Shortage } from '@/lib/types'
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'

interface ShortagesTableProps {
  shortages: Shortage[]
  total: number
  page: number
  perPage: number
}

const COLUMNS: { key: keyof Shortage; label: string; sortable?: boolean }[] = [
  { key: 'bezeichnung', label: 'Bezeichnung', sortable: true },
  { key: 'firma', label: 'Firma', sortable: true },
  { key: 'statusCode', label: 'Status', sortable: true },
  { key: 'datumLieferfahigkeit', label: 'Lieferbar ab' },
  { key: 'tageSeitMeldung', label: 'Tage', sortable: true },
  { key: 'atcCode', label: 'ATC' },
]

export function ShortagesTable({ shortages, total, page, perPage }: ShortagesTableProps) {
  const [selected, setSelected] = useState<Shortage | null>(null)
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
    router.replace(`${pathname}?${p.toString()}`)
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {shortages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} className="text-center text-muted-foreground py-12">
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
                  <TableCell className="font-medium max-w-[280px] truncate" title={s.bezeichnung}>
                    {s.bezeichnung}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {s.firma}
                  </TableCell>
                  <TableCell>
                    <StatusBadge code={s.statusCode} />
                  </TableCell>
                  <TableCell className="text-sm">{s.datumLieferfahigkeit}</TableCell>
                  <TableCell className="text-sm text-right tabular-nums">{s.tageSeitMeldung}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{s.atcCode}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <p className="text-sm text-muted-foreground">
            {total} Einträge · Seite {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => navigate({ page: String(page - 1) })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => navigate({ page: String(page + 1) })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ShortageDrawer shortage={selected} onClose={() => setSelected(null)} />
    </>
  )
}
