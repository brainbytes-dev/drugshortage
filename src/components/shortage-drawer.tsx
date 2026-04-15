'use client'

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
import { ExternalLink } from 'lucide-react'

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

export function ShortageDrawer({ shortage, onClose }: ShortageDrawerProps) {
  return (
    <Sheet open={!!shortage} onOpenChange={open => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        {shortage && (
          <>
            <SheetHeader className="mb-4">
              <SheetTitle className="text-base leading-tight">{shortage.bezeichnung}</SheetTitle>
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
              <DetailRow label="Letzte Mutation" value={shortage.datumLetzteMutation} />
              <DetailRow label="Tage seit erster Meldung" value={shortage.tageSeitMeldung} />
              <DetailRow label="Generic Group" value={shortage.gengrp} />
              <DetailRow
                label="Erste Erfassung (unser System)"
                value={new Date(shortage.firstSeenAt).toLocaleDateString('de-CH')}
              />
              <DetailRow
                label="Quelle"
                value={
                  <a
                    href={shortage.detailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    drugshortage.ch <ExternalLink className="h-3 w-3" />
                  </a>
                }
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
