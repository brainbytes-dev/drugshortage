'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { FlaskConical } from 'lucide-react'
import type { AtcGruppeStats } from '@/lib/types'

interface AtcGruppenSheetProps {
  atcGruppen: AtcGruppeStats[]
}

export function AtcGruppenSheet({ atcGruppen }: AtcGruppenSheetProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // ✅ Memoize sorting - only sort once when data changes, not on every render
  const sorted = useMemo(() =>
    [...atcGruppen].sort((a, b) => b.anzahl - a.anzahl),
    [atcGruppen]
  )

  // ✅ Memoize filtering with optimized search
  const filtered = useMemo(() => {
    if (!search.trim()) return sorted

    const searchLower = search.toLowerCase() // ✅ Compute once
    return sorted.filter(g =>
      g.atcCode.toLowerCase().includes(searchLower) ||
      g.bezeichnung.toLowerCase().includes(searchLower)
    )
  }, [sorted, search])

  // ✅ Memoize max value computation
  const max = useMemo(() => sorted[0]?.anzahl ?? 1, [sorted])

  function handleAtcClick(atcCode: string) {
    setOpen(false)
    router.push(`/?atc=${encodeURIComponent(atcCode)}`, { scroll: false })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<button className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors whitespace-nowrap" />}
      >
        <FlaskConical className="h-4 w-4 text-primary" />
        ATC-Gruppen
        <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-semibold">
          {atcGruppen.length}
        </span>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto px-6 py-6">
        <SheetHeader className="mb-4">
          <SheetTitle>ATC-Gruppen</SheetTitle>
          <p className="text-xs text-muted-foreground">
            Betroffene Wirkstoffgruppen nach Anzahl aktiver Engpässe. Gruppe anklicken zum Filtern.
          </p>
        </SheetHeader>

        <input
          type="search"
          placeholder="ATC-Code oder Bezeichnung…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full mb-4 rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
        />

        <div className="divide-y">
          {filtered.map(g => {
            const pct = Math.round((g.anzahl / max) * 100)
            return (
              <button
                key={g.atcCode}
                onClick={() => handleAtcClick(g.atcCode)}
                className="w-full py-3 space-y-1.5 text-left hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-mono font-semibold text-primary">{g.atcCode}</span>
                    <p className="text-sm leading-snug">{g.bezeichnung}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums shrink-0">{g.anzahl}</span>
                </div>
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/60"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Keine Treffer</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
