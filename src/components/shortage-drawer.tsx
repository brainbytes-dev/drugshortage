'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from './status-badge'
import type { Shortage } from '@/lib/types'
import type { AlternativesResponse, Alternative } from '@/app/api/alternatives/route'

interface ShortageDrawerProps {
  shortage: Shortage | null
  onClose: () => void
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? '—'}</span>
    </div>
  )
}

function AlternativeRow({ alt, onClick }: { alt: Alternative; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-2 border-b last:border-0 text-left hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors"
    >
      <p className="text-sm font-medium leading-snug">{alt.bezeichnung}</p>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-xs text-muted-foreground">{alt.firma}</span>
        {alt.typ && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {alt.typ === 'O' ? 'Original' : alt.typ === 'G' ? 'Generikum' : alt.typ}
          </Badge>
        )}
      </div>
    </button>
  )
}

function AlternativesSection({ gtin, onSelect }: { gtin: string; onSelect: (bezeichnung: string) => void }) {
  const [data, setData] = useState<AlternativesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    const cacheKey = `alt_${gtin}`
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      startTransition(() => {
        setData(JSON.parse(cached))
        setLoading(false)
      })
      return
    }
    startTransition(() => {
      setLoading(true)
      setError(false)
    })
    fetch(`/api/alternatives?gtin=${encodeURIComponent(gtin)}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => {
        sessionStorage.setItem(cacheKey, JSON.stringify(d))
        setData(d)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [gtin])

  if (loading) return <p className="text-xs text-muted-foreground py-3">Alternativen werden geladen…</p>
  if (error) return <p className="text-xs text-muted-foreground py-3">Keine Alternativen verfügbar.</p>

  const hasAny = data && (
    data.alleAlternativen.length > 0 ||
    data.coMarketing.length > 0 ||
    data.gleicheFirma.length > 0
  )

  if (!hasAny) return <p className="text-xs text-muted-foreground py-3">Keine Alternativen erfasst.</p>

  return (
    <div className="space-y-4">
      {data!.alleAlternativen.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Alternativpräparate ({data!.alleAlternativen.length})
          </p>
          <div className="divide-y">
            {data!.alleAlternativen.map(a => <AlternativeRow key={a.gtin || a.bezeichnung} alt={a} onClick={() => onSelect(a.bezeichnung)} />)}
          </div>
        </div>
      )}
      {data!.coMarketing.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Co-Marketing (identisch)
          </p>
          <div className="divide-y">
            {data!.coMarketing.map(a => <AlternativeRow key={a.gtin || a.bezeichnung} alt={a} onClick={() => onSelect(a.bezeichnung)} />)}
          </div>
        </div>
      )}
      {data!.gleicheFirma.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Gleiche Firma (andere Packung)
          </p>
          <div className="divide-y">
            {data!.gleicheFirma.map(a => <AlternativeRow key={a.gtin || a.bezeichnung} alt={a} onClick={() => onSelect(a.bezeichnung)} />)}
          </div>
        </div>
      )}
    </div>
  )
}

export function ShortageDrawer({ shortage, onClose }: ShortageDrawerProps) {
  const router = useRouter()

  function handleAlternativeSelect(bezeichnung: string) {
    onClose()
    router.push(`/?search=${encodeURIComponent(bezeichnung)}`, { scroll: false })
  }

  return (
    <Sheet open={!!shortage} onOpenChange={open => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto px-6 py-6">
        {shortage && (
          <>
            <SheetHeader className="mb-4">
              <SheetTitle className="text-base leading-tight">
                <Link
                  href={`/medikament/${shortage.slug ?? shortage.gtin}`}
                  onClick={onClose}
                  className="hover:text-primary hover:underline underline-offset-2 transition-colors"
                >
                  {shortage.bezeichnung}
                </Link>
              </SheetTitle>
              <SheetDescription>{shortage.firma}</SheetDescription>
            </SheetHeader>

            <div className="flex gap-2 mb-4 flex-wrap">
              <StatusBadge code={shortage.statusCode} showText />
              <Badge variant="outline">{shortage.atcCode}</Badge>
            </div>

            <div className="divide-y">
              <DetailRow label="GTIN" value={shortage.gtin} />
              <DetailRow label="Pharmacode" value={shortage.pharmacode} />
              <DetailRow label="Voraussichtlich lieferbar" value={shortage.datumLieferfahigkeit} />
              {shortage.voraussichtlicheDauer && (
                <DetailRow label="Voraussichtliche Dauer" value={shortage.voraussichtlicheDauer} />
              )}
              <DetailRow label="Letzte Mutation" value={shortage.datumLetzteMutation} />
              {shortage.ersteMeldung && (
                <DetailRow label="Erste Meldung" value={shortage.ersteMeldung} />
              )}
              {shortage.ersteMeldungDurch && (
                <DetailRow label="Gemeldet durch" value={shortage.ersteMeldungDurch} />
              )}
              {shortage.ersteInfoDurchFirma && (
                <DetailRow label="Info durch Firma" value={shortage.ersteInfoDurchFirma} />
              )}
              {shortage.artDerInfoDurchFirma && (
                <DetailRow label="Art der Info" value={shortage.artDerInfoDurchFirma} />
              )}
              {shortage.bemerkungen && (
                <DetailRow label="Bemerkungen" value={shortage.bemerkungen} />
              )}
              <DetailRow label="Tage seit erster Meldung" value={shortage.tageSeitMeldung} />
              <DetailRow label="Generic Group" value={shortage.gengrp} />
              <DetailRow
                label="Erste Erfassung (unser System)"
                value={new Date(shortage.firstSeenAt).toLocaleDateString('de-CH')}
              />
            </div>

            {/* Alternativen */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-3">Mögliche Alternativen</h3>
              <AlternativesSection gtin={shortage.gtin} onSelect={handleAlternativeSelect} />
            </div>

            {/* Quelle */}
            <p className="mt-6 pt-4 border-t text-xs text-muted-foreground">
              Quelle:{' '}
              <a
                href="https://www.drugshortage.ch"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                drugshortage.ch
              </a>
            </p>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
