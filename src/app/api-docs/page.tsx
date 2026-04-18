import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Dokumentation | engpass.radar',
  description: 'Öffentliche REST API für Schweizer Arzneimittel-Engpässe.',
}

const params = [
  { name: 'search', type: 'string', desc: 'Volltextsuche auf Bezeichnung, Firma und ATC-Code', example: 'amoxicillin' },
  { name: 'status', type: 'string', desc: 'Statuscode(s) 1–5, kommagetrennt', example: '1,4' },
  { name: 'firma', type: 'string', desc: 'Exakter Firmenname', example: 'Sandoz' },
  { name: 'atc', type: 'string', desc: 'ATC-Code-Präfix', example: 'C09' },
  { name: 'neu', type: 'string', desc: 'Nur neue Engpässe (≤7 Tage). Wert: 1', example: 'neu=1' },
  { name: 'page', type: 'integer', desc: 'Seitennummer (Standard: 1)', example: '2' },
  { name: 'perPage', type: 'integer', desc: 'Einträge pro Seite (Standard: 50, max: 200)', example: '100' },
  { name: 'sort', type: 'string', desc: 'Sortierung: feld:asc oder feld:desc', example: 'tageSeitMeldung:desc' },
]

const responseExample = `{
  "data": [
    {
      "id": 1,
      "gtin": "7680123456789",
      "bezeichnung": "Amoxicillin Sandoz 500 mg",
      "firma": "Sandoz",
      "atcCode": "J01CA04",
      "statusCode": 1,
      "statusText": "Engpass gemeldet",
      "tageSeitMeldung": 42,
      "isActive": true
    }
  ],
  "total": 712,
  "page": 1,
  "perPage": 50,
  "meta": {
    "generatedAt": "2026-04-17T10:00:00.000Z",
    "source": "engpassradar.ch",
    "docsUrl": "https://engpassradar.ch/api-docs"
  }
}`

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'API Dokumentation — engpass.radar',
  url: 'https://www.engpassradar.ch/api-docs',
  publisher: {
    '@type': 'Organization',
    name: 'engpass.radar',
    url: 'https://www.engpassradar.ch',
  },
}

export default function ApiDocsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\u003c') }}
      />
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Öffentliche API — engpass.radar</h1>
        <p className="text-muted-foreground leading-relaxed">
          Freier Zugang zu allen Schweizer Arzneimittel-Engpässen. Kein API-Key erforderlich, kein Login.
          Bitte fair nutzen — max. ~100 Requests/Tag empfohlen.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Base URL</h2>
        <pre className="bg-muted border rounded-md px-4 py-3 text-sm font-mono overflow-x-auto">
          https://engpassradar.ch/api/v1
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          <span className="inline-block bg-muted border rounded px-2 py-0.5 text-sm font-mono mr-2">GET</span>
          /shortages
        </h2>
        <p className="text-muted-foreground text-sm">Gibt eine paginierte Liste aller gemeldeten Engpässe zurück.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4 font-semibold">Parameter</th>
                <th className="pb-2 pr-4 font-semibold">Typ</th>
                <th className="pb-2 pr-4 font-semibold">Beschreibung</th>
                <th className="pb-2 font-semibold">Beispiel</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {params.map((p) => (
                <tr key={p.name} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-mono text-foreground">{p.name}</td>
                  <td className="py-2 pr-4">{p.type}</td>
                  <td className="py-2 pr-4">{p.desc}</td>
                  <td className="py-2 font-mono">{p.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Response-Schema</h2>
        <pre className="bg-muted border rounded-md px-4 py-3 text-sm font-mono overflow-x-auto leading-relaxed">
          {responseExample}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Beispiele</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Alle aktiven Engpässe:</p>
            <pre className="bg-muted border rounded-md px-4 py-3 text-sm font-mono overflow-x-auto">
              curl https://engpassradar.ch/api/v1/shortages
            </pre>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Gefiltert nach ATC-Gruppe und Status:</p>
            <pre className="bg-muted border rounded-md px-4 py-3 text-sm font-mono overflow-x-auto">
              {`curl "https://engpassradar.ch/api/v1/shortages?atc=C09&status=1,4"`}
            </pre>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">RSS-Feeds</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Neben der REST API stehen auch RSS-Feeds zur Verfügung:
        </p>
        <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
          <li>
            <span className="font-mono text-foreground">/rss.xml</span> — Alle aktuellen Engpässe
          </li>
          <li>
            <span className="font-mono text-foreground">/wirkstoff/{'{atc}'}/feed.xml</span> — Engpässe nach ATC-Gruppe (z. B. <span className="font-mono">/wirkstoff/C09/feed.xml</span>)
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Score-Methodik</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Jeder Engpass-Datensatz enthält einen <strong className="text-foreground">engpass.radar Severity Score</strong> (0–100).
          Die genaue Berechnung ist auf der{' '}
          <a href="/methodik" className="underline hover:text-foreground">Score-Methodik-Seite</a>{' '}
          dokumentiert.
        </p>
      </section>

      <footer className="border-t pt-6 text-xs text-muted-foreground">
        Daten täglich aktualisiert aus drugshortage.ch, BWL und ODDB.
      </footer>
    </main>
  )
}
