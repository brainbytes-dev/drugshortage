import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAllDrugSlugs, getShortageBySlug, getOddbByGtin } from '@/lib/db'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await getAllDrugSlugs()
  return slugs.map(s => ({ slug: s.slug }))
}

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

  const oddb = await getOddbByGtin(shortage.gtin).catch(() => null)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Drug',
    name: shortage.bezeichnung,
    manufacturer: { '@type': 'Organization', name: shortage.firma },
    description: `Lieferengpass in der Schweiz seit ${shortage.tageSeitMeldung} Tagen`,
    url: `https://engpassradar.ch/medikament/${slug}`,
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

        <p className="text-xs text-muted-foreground border-t pt-4">
          Daten von drugshortage.ch · keine Gewähr auf Vollständigkeit
        </p>
      </div>
    </main>
  )
}
