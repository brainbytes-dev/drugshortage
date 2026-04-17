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
import { Badge } from '@/components/ui/badge'
import { Building2 } from 'lucide-react'
import type { FirmaRanking } from '@/lib/types'

const BEWERTUNG_LABEL: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; description: string }> = {
  1: { label: 'Exklusiv',      variant: 'default',     description: 'Gibt Daten selbst ein, exklusiver Zugang, verpflichtet à jour zu halten' },
  2: { label: 'Aktiv',         variant: 'secondary',   description: 'Gibt Daten selbst ein, kein exklusiver Zugang' },
  3: { label: 'Vereinzelt',    variant: 'outline',     description: 'Meldet vereinzelt Lieferengpässe an Kunden' },
  4: { label: 'Passiv',        variant: 'destructive', description: 'Informiert Kunden nicht direkt; Meldungen durch drugshortage.ch-Netzwerk' },
  5: { label: 'Verhandlung',   variant: 'outline',     description: 'Verhandlungen mit drugshortage.ch laufen' },
}

interface FirmaRankingSheetProps {
  firmenRanking: FirmaRanking[]
}

export function FirmaRankingSheet({ firmenRanking }: FirmaRankingSheetProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // ✅ Memoize the filtered results - only recompute when inputs change
  const filtered = useMemo(() => {
    if (!search.trim()) return firmenRanking

    const searchLower = search.toLowerCase() // ✅ Compute once, not N times
    return firmenRanking.filter(f =>
      f.firma.toLowerCase().includes(searchLower)
    )
  }, [firmenRanking, search])

  function handleFirmaClick(firma: string) {
    setOpen(false)
    router.push(`/?firma=${encodeURIComponent(firma)}`)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
          <p className="text-xs font-medium mb-2">Bewertung = Melde-Transparenz (Quelle: drugshortage.ch)</p>
          <div className="flex flex-col gap-1.5">
            {Object.entries(BEWERTUNG_LABEL).map(([key, { label, variant, description }]) => (
              <div key={key} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Badge variant={variant} className="text-[10px] px-1.5 py-0 shrink-0 mt-px">{label}</Badge>
                <span>{description}</span>
              </div>
            ))}
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
              <button
                key={f.firma}
                onClick={() => handleFirmaClick(f.firma)}
                className="w-full flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-md text-left hover:bg-muted/50 transition-colors"
              >
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
