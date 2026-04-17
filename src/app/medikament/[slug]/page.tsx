import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getShortageBySlug, getOddbByGtin, getHistoricalByGengrp } from '@/lib/db'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600 // ISR: revalidate every hour

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const shortage = await getShortageBySlug(slug)

  if (!shortage) {
    return {
      title: 'Medikament nicht gefunden | engpass.radar',
    }
  }

  return {
    title: `${shortage.bezeichnung} — Lieferengpass Schweiz | engpass.radar`,
    description: `Lieferengpass für ${shortage.bezeichnung} von ${shortage.firma}. Status: ${shortage.statusText}. Täglich aktualisiert aus drugshortage.ch.`,
  }
}

export default async function MedikamentPage({ params }: PageProps) {
  const { slug } = await params
  const shortage = await getShortageBySlug(slug)

  if (!shortage) {
    notFound()
  }

  const [oddb, historical] = await Promise.all([
    getOddbByGtin(shortage.gtin).catch(() => null),
    getHistoricalByGengrp(shortage.gengrp, shortage.gtin).catch(() => []),
  ])

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Drug',
    name: shortage.bezeichnung,
    url: `https://engpassradar.ch/medikament/${slug}`,
    manufacturer: { '@type': 'Organization', name: shortage.firma },
    description: `Lieferengpass für ${shortage.bezeichnung} von ${shortage.firma} in der Schweiz. Status: ${shortage.statusText}. Seit ${shortage.tageSeitMeldung} Tagen gemeldet.`,
    ...(oddb?.substanz && { activeIngredient: oddb.substanz }),
    ...(oddb?.zusammensetzung && { nonProprietaryName: oddb.zusammensetzung }),
    ...(oddb?.prodno && {
      code: {
        '@type': 'MedicalCode',
        codeValue: oddb.prodno,
        codingSystem: 'Swissmedic',
      },
    }),
    ...(shortage.atcCode && {
      code: [
        ...(oddb?.prodno ? [{
          '@type': 'MedicalCode',
          codeValue: oddb.prodno,
          codingSystem: 'Swissmedic',
        }] : []),
        {
          '@type': 'MedicalCode',
          codeValue: shortage.atcCode,
          codingSystem: 'ATC',
        },
      ],
    }),
    ...(shortage.datumLieferfahigkeit && {
      availabilityStarts: shortage.datumLieferfahigkeit,
    }),
    ...(shortage.ersteMeldung && {
      availabilityEnds: shortage.ersteMeldung,
    }),
  }

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Zur Übersicht
        </Link>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{shortage.bezeichnung}</h1>
        </div>

        <section className="space-y-4">
          <h2 className="font-semibold text-base">Details</h2>
          <dl className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">Firma</dt>
              <dd>{shortage.firma}</dd>
            </div>

            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">ATC-Code</dt>
              <dd>
                {shortage.atcCode ? (
                  <Link
                    href={`/?atc=${shortage.atcCode}`}
                    className="underline hover:text-muted-foreground"
                  >
                    {shortage.atcCode}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">–</span>
                )}
              </dd>
            </div>

            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">Status</dt>
              <dd>{shortage.statusText}</dd>
            </div>

            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">Seit</dt>
              <dd>{shortage.tageSeitMeldung} Tage</dd>
            </div>

            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">Voraussichtliche Verfügbarkeit</dt>
              <dd>
                {shortage.datumLieferfahigkeit
                  ? shortage.datumLieferfahigkeit
                  : <span className="text-muted-foreground">–</span>}
              </dd>
            </div>

            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">Erste Meldung</dt>
              <dd>
                {shortage.ersteMeldung
                  ? shortage.ersteMeldung
                  : <span className="text-muted-foreground">–</span>}
              </dd>
            </div>

            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">Gemeldet durch</dt>
              <dd>
                {shortage.ersteMeldungDurch
                  ? shortage.ersteMeldungDurch
                  : <span className="text-muted-foreground">–</span>}
              </dd>
            </div>

            {oddb?.substanz && (
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Wirkstoff</dt>
                <dd>{oddb.substanz}</dd>
              </div>
            )}

            {oddb?.prodno && (
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Swissmedic-Nr</dt>
                <dd className="font-mono text-xs">{oddb.prodno}</dd>
              </div>
            )}
          </dl>
        </section>

        {oddb?.zusammensetzung && (
          <section className="space-y-2">
            <h2 className="font-semibold text-base">Zusammensetzung</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {oddb.zusammensetzung}
            </p>
          </section>
        )}

        {shortage.bemerkungen && (
          <section className="space-y-2">
            <h2 className="font-semibold text-base">Bemerkungen</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {shortage.bemerkungen}
            </p>
          </section>
        )}

        {historical.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-semibold text-base">Historischer Verlauf</h2>
            <p className="text-sm text-muted-foreground">
              Dieses Produkt (oder ein wirkstoffgleiches) war bereits{' '}
              <span className="font-semibold text-foreground">{historical.length}×</span>{' '}
              im Engpass.
            </p>
            <div className="divide-y text-sm">
              {historical.slice(0, 10).map(h => (
                <div key={h.gtin} className="py-2 flex items-start justify-between gap-4">
                  <span className="text-muted-foreground truncate max-w-[60%]">{h.bezeichnung}</span>
                  <span className="tabular-nums shrink-0 text-muted-foreground">{h.tageSeitMeldung} Tage</span>
                </div>
              ))}
              {historical.length > 10 && (
                <p className="py-2 text-xs text-muted-foreground">
                  + {historical.length - 10} weitere historische Einträge
                </p>
              )}
            </div>
          </section>
        )}

        <p className="text-xs text-muted-foreground border-t pt-4">
          Daten von drugshortage.ch · keine Gewähr auf Vollständigkeit
        </p>
      </div>
    </main>
  )
}
