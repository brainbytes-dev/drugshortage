import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAllAtcCodes, getShortagesByAtc } from '@/lib/db'
import { toSlug } from '@/lib/slug'

interface PageProps {
  params: Promise<{ atc: string }>
}

export async function generateStaticParams() {
  const codes = await getAllAtcCodes()
  return codes.map(c => ({ atc: c.atc }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { atc } = await params
  const shortages = await getShortagesByAtc(atc)
  const count = shortages.length

  if (count === 0) {
    return {
      title: `ATC ${atc} — Lieferengpässe Schweiz | engpass.radar`,
    }
  }

  return {
    title: `ATC ${atc} — Lieferengpässe Schweiz | engpass.radar`,
    description: `${count} aktive Lieferengpässe für ATC ${atc} in der Schweiz. Täglich aktualisiert aus drugshortage.ch.`,
  }
}

export default async function WirkstoffPage({ params }: PageProps) {
  const { atc } = await params
  const shortages = await getShortagesByAtc(atc)

  if (shortages.length === 0) {
    notFound()
  }

  const count = shortages.length

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `ATC ${atc} Lieferengpässe Schweiz`,
    numberOfItems: count,
    itemListElement: shortages.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.bezeichnung,
      url: `https://engpassradar.ch/medikament/${toSlug(s.bezeichnung)}`,
    })),
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
          <h1 className="text-2xl font-bold tracking-tight">ATC {atc}</h1>
          <p className="text-sm text-muted-foreground">
            ATC {atc} · {count} aktive Engpässe
          </p>
        </div>

        <section className="space-y-4">
          <ul className="divide-y text-sm">
            {shortages.map(s => (
              <li key={s.gtin} className="py-3 flex flex-col gap-1">
                <Link
                  href={`/medikament/${toSlug(s.bezeichnung)}`}
                  className="font-medium hover:underline"
                >
                  {s.bezeichnung}
                </Link>
                <span className="text-muted-foreground">{s.firma}</span>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{s.statusText}</span>
                  <span>{s.tageSeitMeldung} Tage</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-xs text-muted-foreground border-t pt-4">
          Daten von drugshortage.ch · keine Gewähr auf Vollständigkeit
        </p>
      </div>
    </main>
  )
}
