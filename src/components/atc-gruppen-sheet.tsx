'use client'

import { useState } from 'react'
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

  const sorted = [...atcGruppen].sort((a, b) => b.anzahl - a.anzahl)
  const filtered = sorted.filter(g =>
    g.atcCode.toLowerCase().includes(search.toLowerCase()) ||
    g.bezeichnung.toLowerCase().includes(search.toLowerCase())
  )

  const max = sorted[0]?.anzahl ?? 1

  return (
    <Sheet>
      <SheetTrigger
        render={<button className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors" />}
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
            Betroffene Wirkstoffgruppen nach Anzahl aktiver Engpässe, absteigend sortiert.
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
              <div key={g.atcCode} className="py-3 space-y-1.5">
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
              </div>
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
