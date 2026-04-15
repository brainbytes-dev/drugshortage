'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Building2 } from 'lucide-react'
import type { FirmaRanking } from '@/lib/types'

const BEWERTUNG_LABEL: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  1: { label: 'Gut', variant: 'default' },
  2: { label: 'Mittel', variant: 'secondary' },
  3: { label: 'Schlecht', variant: 'outline' },
  4: { label: 'Kritisch', variant: 'destructive' },
}

interface FirmaRankingSheetProps {
  firmenRanking: FirmaRanking[]
}

export function FirmaRankingSheet({ firmenRanking }: FirmaRankingSheetProps) {
  const [search, setSearch] = useState('')

  const filtered = firmenRanking.filter(f =>
    f.firma.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Sheet>
      <SheetTrigger
        render={<button className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors" />}
      >
        <Building2 className="h-4 w-4 text-primary" />
        Firmen-Ranking
        <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-semibold">
          {firmenRanking.length}
        </span>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto px-6 py-6">
        <SheetHeader className="mb-4">
          <SheetTitle>Firmen-Ranking</SheetTitle>
          <p className="text-xs text-muted-foreground">
            Hersteller nach Anzahl aktiver Lieferengpässe, sortiert nach Bewertung von{' '}
            <a href="https://www.drugshortage.ch" target="_blank" rel="noopener noreferrer"
              className="underline hover:text-foreground">drugshortage.ch</a>.
          </p>
        </SheetHeader>

        {/* Bewertungs-Legende */}
        <div className="mb-4 rounded-md border bg-muted/40 px-3 py-2.5">
          <p className="text-xs font-medium mb-2">Bewertung (Quelle: drugshortage.ch)</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Badge variant="default" className="text-[10px] px-1.5 py-0">Gut</Badge>
              <span>&lt; 5 % Produkte betroffen</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Mittel</Badge>
              <span>5–15 % Produkte betroffen</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">Schlecht</Badge>
              <span>15–30 % Produkte betroffen</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Kritisch</Badge>
              <span>&gt; 30 % Produkte betroffen</span>
            </div>
          </div>
        </div>

        <input
          type="search"
          placeholder="Firma suchen…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full mb-4 rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
        />

        <div className="divide-y">
          {filtered.map((f, i) => {
            const bew = BEWERTUNG_LABEL[f.bewertung]
            return (
              <div key={f.firma} className="flex items-center gap-3 py-2.5">
                <span className="w-6 text-xs text-muted-foreground text-right shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.firma}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.anzahlOffeneEngpaesse} offen · {f.anzahlProdukteTotal} total
                  </p>
                </div>
                {bew && (
                  <Badge variant={bew.variant} className="shrink-0 text-xs">
                    {bew.label}
                  </Badge>
                )}
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
