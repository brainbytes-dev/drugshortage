'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { FlaskConical, X } from 'lucide-react'
import type { AtcGruppeStats } from '@/lib/types'

interface AtcGruppenSheetProps {
  atcGruppen: AtcGruppeStats[]
}

export function AtcGruppenSheet({ atcGruppen }: AtcGruppenSheetProps) {
  const t = useTranslations('AtcGruppen')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const sorted = useMemo(() => [...atcGruppen].sort((a, b) => b.anzahl - a.anzahl), [atcGruppen])

  const filtered = useMemo(() => {
    if (!search.trim()) return sorted
    const searchLower = search.toLowerCase()
    return sorted.filter(g =>
      g.atcCode.toLowerCase().includes(searchLower) ||
      g.bezeichnung.toLowerCase().includes(searchLower)
    )
  }, [sorted, search])

  const max = useMemo(() => sorted[0]?.anzahl ?? 1, [sorted])

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

  function handleAtcClick(atcCode: string) {
    setOpen(false)
    router.push({ pathname: '/', query: { atc: atcCode } }, { scroll: false })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors whitespace-nowrap"
      >
        <FlaskConical className="h-4 w-4 text-primary" />
        {t('title')}
        <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-semibold">
          {atcGruppen.length}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} aria-hidden />

          <div className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border bg-card shadow-xl">

            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b px-6 py-4 shrink-0">
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">{t('title')}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('description')}
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

            {/* Search */}
            <div className="px-6 pt-4 pb-2 shrink-0">
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
                      <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                    </div>
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
