'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Building2, X } from 'lucide-react'
import type { FirmaRanking } from '@/lib/types'

interface FirmaRankingSheetProps {
  firmenRanking: FirmaRanking[]
}

const BEWERTUNG_VARIANT: Record<number, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  1: 'default',
  2: 'secondary',
  3: 'outline',
  4: 'destructive',
  5: 'outline',
}

export function FirmaRankingSheet({ firmenRanking }: FirmaRankingSheetProps) {
  const t = useTranslations('FirmaRanking')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const filtered = useMemo(() => {
    if (!search.trim()) return firmenRanking
    const searchLower = search.toLowerCase()
    return firmenRanking.filter(f => f.firma.toLowerCase().includes(searchLower))
  }, [firmenRanking, search])

  const bewertungEntries = useMemo(
    () =>
      [
        { key: 1, label: t('rating1Label'), description: t('rating1Desc') },
        { key: 2, label: t('rating2Label'), description: t('rating2Desc') },
        { key: 3, label: t('rating3Label'), description: t('rating3Desc') },
        { key: 4, label: t('rating4Label'), description: t('rating4Desc') },
        { key: 5, label: t('rating5Label'), description: t('rating5Desc') },
      ] as const,
    [t]
  )

  const labelByKey = useMemo<Record<number, string>>(
    () => Object.fromEntries(bewertungEntries.map(e => [e.key, e.label])),
    [bewertungEntries]
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  function handleFirmaClick(firma: string) {
    setOpen(false)
    router.push({ pathname: '/', query: { firma } }, { scroll: false })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors whitespace-nowrap"
      >
        <Building2 className="h-4 w-4 text-primary" />
        {t('title')}
        <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-semibold">
          {firmenRanking.length}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />

          <div className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border bg-card shadow-xl">

            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b px-6 py-4 shrink-0">
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">{t('title')}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t.rich('descriptionRich', {
                    link: (chunks) => (
                      <a href="https://www.drugshortage.ch" target="_blank" rel="noopener noreferrer"
                        className="underline hover:text-foreground">{chunks}</a>
                    ),
                  })}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label={t('closeAria')}
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search + legend */}
            <div className="px-6 pt-4 pb-2 shrink-0 space-y-3">
              <div className="rounded-md border bg-muted/40 px-3 py-2.5">
                <p className="text-xs font-medium mb-2">{t('legendTitleExtended')}</p>
                <div className="flex flex-col gap-1.5">
                  {bewertungEntries.map(({ key, label, description }) => (
                    <div key={key} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Badge variant={BEWERTUNG_VARIANT[key]} className="text-[10px] px-1.5 py-0 shrink-0 mt-px">{label}</Badge>
                      <span>{description}</span>
                    </div>
                  ))}
                </div>
              </div>
              <input
                type="search"
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* List */}
            <div className="overflow-y-auto px-6 pb-4 divide-y">
              {filtered.map((f, i) => {
                const variant = BEWERTUNG_VARIANT[f.bewertung]
                const label = labelByKey[f.bewertung]
                return (
                  <button
                    key={f.firma}
                    onClick={() => handleFirmaClick(f.firma)}
                    className="w-full flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-md text-left hover:bg-muted/50 transition-colors"
                  >
                    <span className="w-6 text-xs text-muted-foreground text-right shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.firma}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('firmaCounts', { open: f.anzahlOffeneEngpaesse, total: f.anzahlProdukteTotal })}
                      </p>
                    </div>
                    {variant && label && <Badge variant={variant} className="shrink-0 text-xs">{label}</Badge>}
                  </button>
                )
              })}
              {filtered.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">{t('emptyState')}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
