import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getOffMarketByGtin, getOddbByGtin } from '@/lib/db'

interface PageProps {
  params: Promise<{ gtin: string }>
}

export const revalidate = 3600

const AUTH_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  A: { label: 'Zugelassen', color: 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/40 dark:border-green-800' },
  E: { label: 'Erloschen', color: 'text-destructive bg-destructive/10 border-destructive/30' },
  S: { label: 'Sistiert', color: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800' },
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  AUSSER_HANDEL: { label: 'Ausser Handel', color: 'text-destructive bg-destructive/10 border-destructive/30' },
  VERTRIEBSEINSTELLUNG: { label: 'Vertriebseinstellung', color: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800' },
  ERLOSCHEN: { label: 'Zulassung erloschen', color: 'text-destructive bg-destructive/10 border-destructive/30' },
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { gtin } = await params
  const [offMarket, oddb] = await Promise.all([
    getOffMarketByGtin(gtin).catch((err) => { console.error('[gtin/page] generateMetadata getOffMarketByGtin failed', err); return [] }),
    getOddbByGtin(gtin).catch((err) => { console.error('[gtin/page] generateMetadata getOddbByGtin failed', err); return null }),
  ])
  const name = oddb?.bezeichnungDe ?? offMarket[0]?.bezeichnung ?? `GTIN ${gtin}`
  return {
    title: `${name} — Produktdetail | engpass.radar`,
    description: `Produktinformationen zu ${name} (GTIN ${gtin}).`,
  }
}

export default async function GtinPage({ params }: PageProps) {
  const { gtin } = await params

  const [offMarket, oddb] = await Promise.all([
    getOffMarketByGtin(gtin).catch((err) => { console.error('[gtin/page] getOffMarketByGtin failed', err); return [] }),
    getOddbByGtin(gtin).catch((err) => { console.error('[gtin/page] getOddbByGtin failed', err); return null }),
  ])

  if (offMarket.length === 0 && !oddb) {
    notFound()
  }

  const bezeichnung = oddb?.bezeichnungDe ?? offMarket[0]?.bezeichnung ?? gtin
  const firma = offMarket[0]?.firma ?? null
  const atcCode = oddb?.atcCode ?? offMarket[0]?.atcCode ?? null
  const authStatus = oddb?.authStatus ?? null
  const authStatusInfo = authStatus ? (AUTH_STATUS_LABELS[authStatus] ?? null) : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalWebPage',
        '@id': `https://www.engpassradar.ch/gtin/${gtin}`,
        url: `https://www.engpassradar.ch/gtin/${gtin}`,
        name: `${bezeichnung} — engpass.radar`,
        about: {
          '@type': 'Drug',
          name: bezeichnung,
          ...(atcCode ? { code: { '@type': 'MedicalCode', code: atcCode, codingSystem: 'ATC' } } : {}),
        },
        isPartOf: { '@id': 'https://www.engpassradar.ch' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.engpassradar.ch' },
          { '@type': 'ListItem', position: 2, name: bezeichnung, item: `https://www.engpassradar.ch/gtin/${gtin}` },
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
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Zur Übersicht
        </Link>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{bezeichnung}</h1>
          <div className="flex flex-wrap gap-2">
            {offMarket.map(entry => {
              const info = CATEGORY_LABELS[entry.category]
              return (
                <div
                  key={entry.category}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${info?.color ?? ''}`}
                >
                  {info?.label ?? entry.category}
                  {entry.datum ? ` · ${entry.datum}` : ''}
                </div>
              )
            })}
            {authStatusInfo && (
              <div className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${authStatusInfo.color}`}>
                {authStatusInfo.label} ({authStatus})
              </div>
            )}
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="font-semibold text-base">Details</h2>
          <dl className="grid grid-cols-1 gap-3 text-sm">
            {firma && (
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Firma</dt>
                <dd>{firma}</dd>
              </div>
            )}

            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">GTIN</dt>
              <dd className="font-mono text-xs">{gtin}</dd>
            </div>

            {atcCode && (
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">ATC-Code</dt>
                <dd>
                  <Link
                    href={`/?atc=${atcCode}`}
                    className="underline hover:text-muted-foreground"
                  >
                    {atcCode}
                  </Link>
                </dd>
              </div>
            )}

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

            {oddb?.ppub != null && (
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Publikumspreis (PPUB)</dt>
                <dd className="font-mono text-sm">CHF {oddb.ppub.toFixed(2)}</dd>
              </div>
            )}

            {oddb?.pexf != null && (
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Fabrikabgabepreis (PEXF)</dt>
                <dd className="font-mono text-sm">CHF {oddb.pexf.toFixed(2)}</dd>
              </div>
            )}

            {gtin.startsWith('7680') && (
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">Fachinformation (AIPS)</dt>
                <dd>
                  <a
                    href={`https://swissmedicinfo-pro.ch/showText.aspx?textType=FI&lang=DE&authNr=${parseInt(gtin.substring(4, 9), 10)}&supportMultipleResults=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline hover:text-muted-foreground"
                  >
                    swissmedicinfo.ch →
                  </a>
                </dd>
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

        <p className="text-xs text-muted-foreground border-t pt-4">
          Daten von ODDB / Swissmedic · keine Gewähr auf Vollständigkeit
        </p>
      </div>
    </main>
  )
}
