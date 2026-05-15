'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from './status-badge'
import type { Shortage } from '@/lib/types'
import type { AlternativesResponse, Alternative } from '@/app/api/alternatives/route'

interface ShortageDrawerProps {
  shortage: Shortage | null
  onClose: () => void
}

const LOCALE_TO_BCP47: Record<string, string> = {
  de: 'de-CH',
  en: 'en-GB',
  fr: 'fr-CH',
  it: 'it-CH',
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
  const t = useTranslations('ShortageDrawer')
  const typeLabel = alt.typ === 'O'
    ? t('typeOriginal')
    : alt.typ === 'G'
      ? t('typeGeneric')
      : alt.typ
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
            {typeLabel}
          </Badge>
        )}
      </div>
    </button>
  )
}

function AlternativesSection({ gtin, onSelect }: { gtin: string; onSelect: (bezeichnung: string) => void }) {
  const t = useTranslations('ShortageDrawer')
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

  if (loading) return <p className="text-xs text-muted-foreground py-3">{t('alternativesLoading')}</p>
  if (error) return <p className="text-xs text-muted-foreground py-3">{t('alternativesUnavailable')}</p>

  const hasAny = data && (
    data.alleAlternativen.length > 0 ||
    data.coMarketing.length > 0 ||
    data.gleicheFirma.length > 0
  )

  if (!hasAny) return <p className="text-xs text-muted-foreground py-3">{t('alternativesNone')}</p>

  return (
    <div className="space-y-4">
      {data!.alleAlternativen.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            {t('alternativesAllHeading', { count: data!.alleAlternativen.length })}
          </p>
          <div className="divide-y">
            {data!.alleAlternativen.map(a => <AlternativeRow key={a.gtin || a.bezeichnung} alt={a} onClick={() => onSelect(a.bezeichnung)} />)}
          </div>
        </div>
      )}
      {data!.coMarketing.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            {t('coMarketingHeading')}
          </p>
          <div className="divide-y">
            {data!.coMarketing.map(a => <AlternativeRow key={a.gtin || a.bezeichnung} alt={a} onClick={() => onSelect(a.bezeichnung)} />)}
          </div>
        </div>
      )}
      {data!.gleicheFirma.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            {t('sameFirmaHeading')}
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
  const t = useTranslations('ShortageDrawer')
  const locale = useLocale()
  const dateLocale = LOCALE_TO_BCP47[locale] ?? 'de-CH'
  const router = useRouter()

  useEffect(() => {
    if (!shortage) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [shortage, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (shortage) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [shortage])

  function handleAlternativeSelect(bezeichnung: string) {
    onClose()
    router.push({ pathname: '/', query: { search: bezeichnung } }, { scroll: false })
  }

  if (!shortage) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-card shadow-xl">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-card px-6 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
              {shortage.firma}
            </p>
            <h2 className="text-[16px] font-semibold leading-tight text-foreground">
              <Link
                href={{ pathname: '/medikament/[slug]', params: { slug: shortage.slug ?? shortage.gtin } }}
                onClick={onClose}
                className="hover:text-primary hover:underline underline-offset-2 transition-colors"
              >
                {shortage.bezeichnung}
              </Link>
            </h2>
            <div className="flex gap-2 mt-2 flex-wrap">
              <StatusBadge code={shortage.statusCode} showText />
              <Badge variant="outline">{shortage.atcCode}</Badge>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t('closeAria')}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body — two columns on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x">

          {/* Left: details */}
          <div className="px-6 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              {t('detailsHeading')}
            </p>
            <div className="divide-y">
              <DetailRow label={t('detailGtin')} value={shortage.gtin} />
              <DetailRow label={t('detailPharmacode')} value={shortage.pharmacode} />
              <DetailRow label={t('detailAvailableFrom')} value={shortage.datumLieferfahigkeit} />
              {shortage.voraussichtlicheDauer && (
                <DetailRow label={t('detailExpectedDuration')} value={shortage.voraussichtlicheDauer} />
              )}
              <DetailRow label={t('detailLastMutation')} value={shortage.datumLetzteMutation} />
              {shortage.ersteMeldung && (
                <DetailRow label={t('detailFirstReport')} value={shortage.ersteMeldung} />
              )}
              {shortage.ersteMeldungDurch && (
                <DetailRow label={t('detailReportedBy')} value={shortage.ersteMeldungDurch} />
              )}
              {shortage.ersteInfoDurchFirma && (
                <DetailRow label={t('detailFirmaInfo')} value={shortage.ersteInfoDurchFirma} />
              )}
              {shortage.artDerInfoDurchFirma && (
                <DetailRow label={t('detailInfoType')} value={shortage.artDerInfoDurchFirma} />
              )}
              {shortage.bemerkungen && (
                <DetailRow label={t('detailRemarks')} value={shortage.bemerkungen} />
              )}
              <DetailRow label={t('detailDaysSinceReport')} value={shortage.tageSeitMeldung} />
              <DetailRow label={t('detailGenericGroup')} value={shortage.gengrp} />
              <DetailRow
                label={t('detailFirstSeen')}
                value={new Date(shortage.firstSeenAt).toLocaleDateString(dateLocale)}
              />
            </div>
            <p className="mt-4 pt-3 border-t text-xs text-muted-foreground">
              {t.rich('sourceLine', {
                link: (chunks) => (
                  <a
                    href="https://www.drugshortage.ch"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </div>

          {/* Right: alternatives */}
          <div className="px-6 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              {t('alternativesHeading')}
            </p>
            <AlternativesSection gtin={shortage.gtin} onSelect={handleAlternativeSelect} />
          </div>

        </div>
      </div>
    </div>
  )
}
