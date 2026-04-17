import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getShortageBySlug, getOddbByGtin, getHistoricalByGengrp, getBwlGtins } from '@/lib/db'
import { calculateScore, scoreLabel } from '@/lib/score'

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

function ScoreRow({
  label, value, max, tooltip
}: { label: string; value: number; max: number; tooltip: string }) {
  return (
    <div className="space-y-0.5" title={tooltip}>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums font-medium text-foreground">{value} / {max}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/70"
          style={{ width: `${Math.round((value / max) * 100)}%` }}
        />
      </div>
    </div>
  )
}

export default async function MedikamentPage({ params }: PageProps) {
  const { slug } = await params
  const shortage = await getShortageBySlug(slug)

  if (!shortage) {
    notFound()
  }

  const [oddb, historical, bwlGtins] = await Promise.all([
    getOddbByGtin(shortage.gtin).catch(() => null),
    getHistoricalByGengrp(shortage.gengrp, shortage.gtin).catch(() => []),
    getBwlGtins().catch(() => [] as string[]),
  ])
  const isBwl = bwlGtins.includes(shortage.gtin)
  const score = calculateScore(shortage, isBwl)
  const { label: scoreText, color: scoreColor } = scoreLabel(score.total)

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

        {/* engpass.radar Score */}
        <section className="space-y-3 rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">engpass.radar Score</h2>
            <span className={`text-2xl font-black tabular-nums ${scoreColor}`}>
              {score.total}
              <span className="text-sm font-normal text-muted-foreground ml-1">/ 100</span>
            </span>
          </div>
          <p className={`text-sm font-medium ${scoreColor}`}>{scoreText}</p>

          {/* Factor breakdown */}
          <div className="space-y-2 text-sm">
            <ScoreRow label="Transparenz (0–35)" value={score.transparency} max={35}
              tooltip="Wie offen das Unternehmen kommuniziert. Status 1 (direktes Reporting) = 5 Punkte, Status 4 (keine Information) = 35 Punkte." />
            <ScoreRow label="Dauer (0–30)" value={score.duration} max={30}
              tooltip={`${shortage.tageSeitMeldung} Tage seit Meldung.`} />
            <ScoreRow label="Keine Alternativen (0–20)" value={score.noAlternatives} max={20}
              tooltip={score.noAlternatives > 0 ? 'Keine Alternativen auf drugshortage.ch gelistet.' : 'Alternativen verfügbar.'} />
            <ScoreRow label="Pflichtlager/BWL (0–15)" value={score.critical} max={15}
              tooltip={isBwl ? 'Produkt auf der BWL-Pflichtlagerliste.' : 'Nicht auf der Pflichtlagerliste.'} />
          </div>

          <p className="text-xs text-muted-foreground pt-1">
            Proprietärer Index von engpass.radar. Höher = schwerwiegender Engpass.
            Kombiniert Transparenz, Dauer, Alternativverfügbarkeit und strategische Relevanz.{' '}
            <a href="/methodik" className="underline hover:text-foreground">Score-Methodik →</a>
          </p>
        </section>

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
