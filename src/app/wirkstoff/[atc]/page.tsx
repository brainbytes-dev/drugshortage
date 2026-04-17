import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAllAtcCodes, getShortagesByAtc, getSubstanzByAtc } from '@/lib/db'
import { toSlug } from '@/lib/slug'

interface PageProps {
  params: Promise<{ atc: string }>
}

export const revalidate = 3600

export async function generateStaticParams() {
  const codes = await getAllAtcCodes()
  return codes.map(c => ({ atc: c.atc }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { atc } = await params
  const [shortages, substanz] = await Promise.all([
    getShortagesByAtc(atc),
    getSubstanzByAtc(atc).catch(() => null),
  ])
  const count = shortages.length

  if (count === 0) {
    return {
      title: `${substanz ? `${substanz} (${atc})` : `ATC ${atc}`} — Lieferengpässe Schweiz | engpass.radar`,
    }
  }

  return {
    title: `${substanz ? `${substanz} (${atc})` : `ATC ${atc}`} — Lieferengpässe Schweiz | engpass.radar`,
    description: `Alle Lieferengpässe für ${substanz ?? atc} in der Schweiz. ATC-Code ${atc}. Täglich aktualisiert.`,
  }
}

export default async function WirkstoffPage({ params }: PageProps) {
  const { atc } = await params
  const [shortages, substanz] = await Promise.all([
    getShortagesByAtc(atc),
    getSubstanzByAtc(atc).catch(() => null),
  ])

  if (shortages.length === 0) {
    notFound()
  }

  const count = shortages.length

  const avgTage = Math.round(shortages.reduce((s, x) => s + (x.tageSeitMeldung ?? 0), 0) / count)
  const firmen = [...new Set(shortages.map(s => s.firma).filter(Boolean))].slice(0, 5).join(', ')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalWebPage',
        '@id': `https://www.engpassradar.ch/wirkstoff/${atc}`,
        url: `https://www.engpassradar.ch/wirkstoff/${atc}`,
        name: `${substanz ? `${substanz} (${atc})` : `ATC ${atc}`} Lieferengpass Schweiz | engpass.radar`,
        description: `${count} Präparat${count !== 1 ? 'e' : ''} mit dem Wirkstoff ${substanz ?? atc} ${count !== 1 ? 'sind' : 'ist'} aktuell nicht lieferbar in der Schweiz.`,
        about: {
          '@type': 'MedicalEntity',
          name: substanz ?? atc,
          code: { '@type': 'MedicalCode', code: atc, codingSystem: 'ATC' },
        },
        isPartOf: { '@id': 'https://www.engpassradar.ch' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.engpassradar.ch' },
          { '@type': 'ListItem', position: 2, name: substanz ?? `ATC ${atc}`, item: `https://www.engpassradar.ch/wirkstoff/${atc}` },
        ],
      },
    ],
  }


  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\u003c') }}
      />
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <Link
          href={`/?atc=${atc}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Alle {atc}-Engpässe
        </Link>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {substanz ?? `ATC ${atc}`}
          </h1>
          {substanz && (
            <p className="text-sm text-muted-foreground font-mono">{atc}</p>
          )}
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div>
            <span className="text-muted-foreground">Aktive Engpässe</span>
            <p className="font-semibold tabular-nums">{count}</p>
          </div>
          {avgTage > 0 && (
            <div>
              <span className="text-muted-foreground">Ø Engpassdauer</span>
              <p className="font-semibold tabular-nums">{avgTage} Tage</p>
            </div>
          )}
          {firmen && (
            <div className="col-span-2 mt-1">
              <span className="text-muted-foreground">Betroffen: </span>
              <span>{firmen}{shortages.length > 5 ? ' u.a.' : ''}</span>
            </div>
          )}
        </div>

        <section className="space-y-4">
          <ul className="divide-y text-sm">
            {shortages.map(s => (
              <li key={s.gtin} className="py-3 flex flex-col gap-1">
                <Link
                  href={`/medikament/${s.slug ?? toSlug(s.bezeichnung)}`}
                  className="font-medium hover:underline"
                >
                  {s.bezeichnung}
                </Link>
                <span className="text-muted-foreground">{s.firma}</span>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{s.statusText}</span>
                  {s.datumLieferfahigkeit && s.datumLieferfahigkeit !== 'offen' && (
                    <span>Lieferbar ab: {s.datumLieferfahigkeit}</span>
                  )}
                  <span>{s.tageSeitMeldung} Tage gemeldet</span>
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
