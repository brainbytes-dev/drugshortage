import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'API Dokumentation | engpassradar.ch',
  description: 'Öffentliche REST API für Schweizer Arzneimittel-Lieferengpässe. Kein API-Key. JSON, CSV und Timeline-Daten frei verfügbar.',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'API Dokumentation — engpassradar.ch',
  url: 'https://www.engpassradar.ch/api-docs',
  publisher: { '@type': 'Organization', name: 'engpassradar.ch', url: 'https://www.engpassradar.ch' },
}

function MethodBadge({ method }: { method: 'GET' | 'POST' }) {
  const colors = {
    GET: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    POST: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  }
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-mono font-bold ${colors[method]}`}>
      {method}
    </span>
  )
}

function Code({ children }: { children: string }) {
  return (
    <pre className="rounded-lg bg-muted border px-4 py-3 text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre">
      {children}
    </pre>
  )
}

type ParamRow = { name: string; type: string; required?: boolean; desc: string; example?: string }

function ParamTable({ rows }: { rows: ParamRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="py-2 px-3 text-left font-semibold text-muted-foreground">Parameter</th>
            <th className="py-2 px-3 text-left font-semibold text-muted-foreground">Typ</th>
            <th className="py-2 px-3 text-left font-semibold text-muted-foreground">Pflicht</th>
            <th className="py-2 px-3 text-left font-semibold text-muted-foreground">Beschreibung</th>
            <th className="py-2 px-3 text-left font-semibold text-muted-foreground">Beispiel</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map(r => (
            <tr key={r.name}>
              <td className="py-2 px-3 font-mono text-foreground">{r.name}</td>
              <td className="py-2 px-3 text-muted-foreground">{r.type}</td>
              <td className="py-2 px-3">
                {r.required
                  ? <span className="text-red-500 font-medium">ja</span>
                  : <span className="text-muted-foreground">–</span>
                }
              </td>
              <td className="py-2 px-3 text-muted-foreground">{r.desc}</td>
              <td className="py-2 px-3 font-mono text-muted-foreground">{r.example ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\u003c') }}
      />
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-12">

        <Link href="/api" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Zur API-Übersicht
        </Link>

        {/* Header */}
        <header className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">API Dokumentation</h1>
            <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
              v1 — öffentlich
            </span>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Freier Zugang zu allen Schweizer Arzneimittel-Lieferengpässen. Kein API-Key, kein Login erforderlich.
            Bitte fair nutzen — max. ~300 Requests/Tag empfohlen.
          </p>
        </header>

        {/* API Pricing CTA */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm text-foreground">
            <span className="font-medium">Mehr als 100 Req/Std?</span>
            {' '}Professional-Keys ab CHF 39/Monat — mit Severity Scoring und 10 000 Req/Tag.
          </p>
          <Link
            href="/api#pricing"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            API-Zugang & Preise →
          </Link>
        </div>

        {/* Base URL */}
        <section className="space-y-2">
          <h2 className="font-semibold text-base">Base URL</h2>
          <Code>https://engpassradar.ch/api/v1</Code>
          <p className="text-xs text-muted-foreground">
            Alle Antworten sind UTF-8 JSON. CORS ist aktiviert (<code className="font-mono bg-muted px-1 rounded">Access-Control-Allow-Origin: *</code>).
          </p>
        </section>

        {/* Endpoints overview */}
        <section className="space-y-3">
          <h2 className="font-semibold text-base">Endpunkte</h2>
          <div className="rounded-lg border overflow-hidden divide-y text-sm">
            {[
              { method: 'GET' as const, path: '/api/v1/shortages', desc: 'Paginierte Liste aller Engpässe' },
              { method: 'GET' as const, path: '/api/v1/shortages/:gtin', desc: 'Einzelprodukt mit Score-Breakdown' },
              { method: 'GET' as const, path: '/api/v1/stats', desc: 'Aggregierte Kennzahlen' },
              { method: 'GET' as const, path: '/api/v1/timeline', desc: 'Wöchentliche Zeitreihe' },
              { method: 'GET' as const, path: '/api/alternatives', desc: 'Alternativen für ein Produkt (GTIN)' },
              { method: 'POST' as const, path: '/api/alternatives/batch', desc: 'Batch-Alternativen für bis zu 50 GTINs' },
              { method: 'GET' as const, path: '/api/export/csv', desc: 'Gefilterte CSV-Export' },
              { method: 'GET' as const, path: '/api/health', desc: 'System-Health-Check' },
            ].map(e => (
              <div key={e.path} className="flex items-center gap-3 px-4 py-3 bg-card">
                <MethodBadge method={e.method} />
                <code className="font-mono text-xs text-foreground flex-1">{e.path}</code>
                <span className="text-xs text-muted-foreground hidden sm:block">{e.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── GET /shortages ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <MethodBadge method="GET" />
            <h2 className="font-semibold text-base font-mono">/api/v1/shortages</h2>
          </div>
          <p className="text-sm text-muted-foreground">Gibt eine paginierte, filterbare Liste aller gemeldeten Engpässe zurück.</p>
          <ParamTable rows={[
            { name: 'search', type: 'string', desc: 'Volltextsuche auf Bezeichnung, Firma, ATC-Code', example: 'pregabalin' },
            { name: 'status', type: 'string', desc: 'Status-Code(s) 1–5, kommagetrennt', example: '1,4' },
            { name: 'firma', type: 'string', desc: 'Exakter Firmenname', example: 'Sandoz' },
            { name: 'atc', type: 'string', desc: 'ATC-Code-Präfix', example: 'C09' },
            { name: 'neu', type: 'integer', desc: 'Nur Engpässe ≤ 7 Tage alt', example: '1' },
            { name: 'page', type: 'integer', desc: 'Seitennummer (Standard: 1)', example: '2' },
            { name: 'perPage', type: 'integer', desc: 'Einträge pro Seite (max: 200)', example: '100' },
            { name: 'sort', type: 'string', desc: 'feld:asc oder feld:desc', example: 'tageSeitMeldung:desc' },
          ]} />
          <Code>{`curl "https://engpassradar.ch/api/v1/shortages?atc=C09&status=1,4&perPage=20"

{
  "data": [
    {
      "id": 4821,
      "gtin": "7680654320016",
      "bezeichnung": "Olmesartan Mepha Lactab 20 mg",
      "firma": "Mepha Pharma AG",
      "atcCode": "C09CA08",
      "statusCode": 1,
      "statusText": "Direkt gemeldet",
      "tageSeitMeldung": 183,
      "isActive": true,
      "datumLieferfahigkeit": "31.12.2026",
      ...
    }
  ],
  "total": 68,
  "page": 1,
  "perPage": 20,
  "meta": { "generatedAt": "2026-04-19T10:00:00Z", "source": "engpassradar.ch" }
}`}
          </Code>
        </section>

        {/* ── GET /shortages/:gtin ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <MethodBadge method="GET" />
            <h2 className="font-semibold text-base font-mono">/api/v1/shortages/<span className="text-muted-foreground">:gtin</span></h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Vollständige Details zu einem einzelnen Produkt inklusive <strong className="text-foreground">Severity Score Breakdown</strong>.
          </p>
          <ParamTable rows={[
            { name: 'gtin', type: 'string', required: true, desc: 'GTIN des Produkts (7–14 Ziffern), im URL-Pfad', example: '7680654320016' },
          ]} />
          <Code>{`curl "https://engpassradar.ch/api/v1/shortages/7680654320016"

{
  "data": {
    "gtin": "7680654320016",
    "bezeichnung": "Olmesartan Mepha Lactab 20 mg",
    "firma": "Mepha Pharma AG",
    "atcCode": "C09CA08",
    "statusCode": 1,
    "tageSeitMeldung": 183,
    "isActive": true,
    "isBwl": true,
    "score": {
      "total": 57,
      "label": "Mittel",
      "breakdown": {
        "transparency": 5,
        "duration": 22,
        "noAlternatives": 15,
        "critical": 15
      }
    },
    "bemerkungen": "Engpass aufgrund erhöhter Nachfrage...",
    "voraussichtlicheDauer": "Q3 2026",
    ...
  }
}`}
          </Code>
        </section>

        {/* ── GET /stats ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <MethodBadge method="GET" />
            <h2 className="font-semibold text-base font-mono">/api/v1/stats</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Aggregierte Kennzahlen der aktuellen Versorgungslage. Nützlich für Dashboards und Monitoring.
          </p>
          <Code>{`curl "https://engpassradar.ch/api/v1/stats"

{
  "data": {
    "active": 705,
    "uniqueAtcGroups": 148,
    "avgDaysSinceMeldung": 203,
    "lastUpdated": "2026-04-19T03:15:00Z",
    "duration": {
      "under2Weeks": 42,
      "weeks2to6": 89,
      "weeks6to26": 201,
      "months6to12": 178,
      "over1Year": 195
    },
    "regulatory": {
      "bwl": 87,
      "pflichtlager": 112,
      "kassenpflichtig": 534
    },
    "topAtcGroups": [
      { "atc": "N02", "bezeichnung": "Analgetika", "count": 54 },
      ...
    ]
  }
}`}
          </Code>
        </section>

        {/* ── GET /timeline ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <MethodBadge method="GET" />
            <h2 className="font-semibold text-base font-mono">/api/v1/timeline</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Wöchentliche Zeitreihe: neue Engpässe und aktiver Bestand. Ideal für Trendanalysen.
          </p>
          <ParamTable rows={[
            { name: 'weeks', type: 'integer', desc: 'Anzahl Wochen zurück (4–260, Standard: 52)', example: '104' },
          ]} />
          <Code>{`curl "https://engpassradar.ch/api/v1/timeline?weeks=12"

{
  "data": [
    { "week": "2026-W14", "newShortages": 18, "activeShortages": 712 },
    { "week": "2026-W15", "newShortages": 22, "activeShortages": 705 },
    ...
  ],
  "meta": { "weeks": 12, "generatedAt": "2026-04-19T10:00:00Z" }
}`}
          </Code>
        </section>

        {/* ── GET /alternatives ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <MethodBadge method="GET" />
            <h2 className="font-semibold text-base font-mono">/api/alternatives</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Wirkstoffgleiche Alternativen für ein Produkt, aufgeteilt in gleiche Firma, Co-Marketing und alle Alternativen.
            Antworten werden 24 Stunden gecacht.
          </p>
          <ParamTable rows={[
            { name: 'gtin', type: 'string', required: true, desc: 'GTIN des Produkts', example: '7680654320016' },
          ]} />
          <Code>{`curl "https://engpassradar.ch/api/alternatives?gtin=7680654320016"

{
  "gleicheFirma": [],
  "coMarketing": [
    { "bezeichnung": "Olmesartan Spirig HC Lactab 20 mg", "firma": "Spirig HealthCare", "gtin": "7680591620011" }
  ],
  "alleAlternativen": [
    { "bezeichnung": "Olmesartan Sandoz Filmtabl 20 mg", "firma": "Sandoz", "gtin": "7680630420018", "typ": "G" }
  ]
}`}
          </Code>
        </section>

        {/* ── POST /alternatives/batch ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <MethodBadge method="POST" />
            <h2 className="font-semibold text-base font-mono">/api/alternatives/batch</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Alternativenabfrage für bis zu 50 GTINs in einem einzigen Request. Deutlich effizienter als N Einzelanfragen.
          </p>
          <Code>{`curl -X POST "https://engpassradar.ch/api/alternatives/batch" \\
  -H "Content-Type: application/json" \\
  -d '{"gtins": ["7680654320016", "7680591620011"]}'

[
  { "gtin": "7680654320016", "data": { "alleAlternativen": [...], ... } },
  { "gtin": "7680591620011", "data": null }
]`}
          </Code>
          <p className="text-xs text-muted-foreground">
            <code className="font-mono bg-muted px-1 rounded">data: null</code> wenn für eine GTIN noch keine gecachten Alternativen vorhanden sind.
          </p>
        </section>

        {/* ── GET /export/csv ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <MethodBadge method="GET" />
            <h2 className="font-semibold text-base font-mono">/api/export/csv</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Gibt alle (gefilterten) Engpässe als CSV-Datei zurück. Direkt in Excel oder Python pandas importierbar.
          </p>
          <ParamTable rows={[
            { name: 'search', type: 'string', desc: 'Volltextsuche', example: 'pregabalin' },
            { name: 'status', type: 'string', desc: 'Status-Code(s), kommagetrennt', example: '1,4' },
            { name: 'firma', type: 'string', desc: 'Exakter Firmenname', example: 'Novartis' },
            { name: 'atc', type: 'string', desc: 'ATC-Code-Präfix', example: 'N06' },
          ]} />
          <Code>{`# Alle Neuropharmaka-Engpässe als CSV herunterladen
curl "https://engpassradar.ch/api/export/csv?atc=N06" -o n06-engpaesse.csv

# In Python:
import pandas as pd
df = pd.read_csv("https://engpassradar.ch/api/export/csv?atc=N06")`}
          </Code>
          <p className="text-xs text-muted-foreground">
            Felder: Bezeichnung, Firma, ATC-Code, Status, Lieferbar ab, Letzte Mutation, Tage seit Meldung, GTIN, Pharmacode, Erstmals gesehen
          </p>
        </section>

        {/* ── GET /health ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <MethodBadge method="GET" />
            <h2 className="font-semibold text-base font-mono">/api/health</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            System-Health-Check. Gibt <code className="font-mono bg-muted px-1 rounded">200</code> wenn alle Systeme bereit,
            <code className="font-mono bg-muted px-1 rounded">503</code> bei Problemen.
          </p>
          <Code>{`curl "https://engpassradar.ch/api/health"

{
  "status": "healthy",
  "timestamp": "2026-04-19T10:00:00Z",
  "database": { "healthy": true, "latencyMs": 12 },
  "cache": { "entries": 84, "utilizationPercent": "42.0" }
}`}
          </Code>
        </section>

        {/* Error codes */}
        <section className="space-y-3">
          <h2 className="font-semibold text-base">HTTP Status Codes</h2>
          <div className="rounded-lg border overflow-hidden divide-y text-xs">
            {[
              { code: '200', desc: 'Erfolgreich' },
              { code: '400', desc: 'Ungültige Parameter (z. B. falsche GTIN)' },
              { code: '404', desc: 'Produkt nicht gefunden' },
              { code: '500', desc: 'Interner Serverfehler' },
              { code: '503', desc: 'System degradiert (nur bei /api/health)' },
            ].map(e => (
              <div key={e.code} className="flex items-center gap-4 px-4 py-2.5 bg-card">
                <span className={`font-mono font-bold w-10 ${e.code.startsWith('2') ? 'text-emerald-600 dark:text-emerald-400' : e.code.startsWith('4') ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>{e.code}</span>
                <span className="text-muted-foreground">{e.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Caching */}
        <section className="space-y-3">
          <h2 className="font-semibold text-base">Caching</h2>
          <div className="rounded-lg border overflow-hidden divide-y text-xs">
            {[
              { endpoint: '/api/v1/shortages', ttl: '5 min', stale: '1 h' },
              { endpoint: '/api/v1/shortages/:gtin', ttl: '5 min', stale: '1 h' },
              { endpoint: '/api/v1/stats', ttl: '5 min', stale: '1 h' },
              { endpoint: '/api/v1/timeline', ttl: '1 h', stale: '24 h' },
              { endpoint: '/api/alternatives', ttl: '1 h', stale: '24 h' },
            ].map(r => (
              <div key={r.endpoint} className="flex items-center gap-4 px-4 py-2.5 bg-card">
                <code className="font-mono flex-1 text-foreground">{r.endpoint}</code>
                <span className="text-muted-foreground">s-maxage: {r.ttl}</span>
                <span className="text-muted-foreground">stale: {r.stale}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Rate Limits & Pricing */}
        <section className="space-y-4">
          <h2 className="font-semibold text-base">Rate Limits & API-Zugang</h2>
          <p className="text-sm text-muted-foreground">
            Die API ist kostenlos für Forschung und kleine Teams. Für kommerzielle Integrationen bitte einen Plan wählen, der den Betrieb trägt.
          </p>
          <div className="rounded-lg border overflow-hidden divide-y text-xs">
            {[
              { tier: 'Free', limit: '100 Req/Stunde', key: 'Kein Key nötig', price: 'CHF 0' },
              { tier: 'Research', limit: '2\'000 Req/Tag', key: 'Kostenlos, E-Mail-Bestätigung', price: 'CHF 0' },
              { tier: 'Engpassradar Pro', limit: '10\'000 Req/Tag', key: 'API-Key via Stripe', price: 'CHF 39/Mo' },
              { tier: 'Klinik-System', limit: '100\'000 Req/Tag', key: 'API-Key, Batch-Endpoints, Webhooks', price: 'CHF 199/Mo' },
              { tier: 'Data License', limit: 'Unlimitiert', key: 'Bulk-Dump, White-Label, SLA', price: 'ab CHF 499/Mo' },
            ].map(r => (
              <div key={r.tier} className="grid grid-cols-4 gap-2 px-4 py-2.5 bg-card items-center">
                <span className="font-medium text-foreground">{r.tier}</span>
                <span className="text-muted-foreground">{r.limit}</span>
                <span className="text-muted-foreground hidden sm:block">{r.key}</span>
                <span className="text-right font-mono text-foreground">{r.price}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 text-sm">
            <Link href="/api-keys" className="text-primary underline underline-offset-2">API-Key beantragen →</Link>
            <Link href="/api-keys?tab=research" className="text-muted-foreground underline underline-offset-2">Research-Zugang (kostenlos)</Link>
          </div>
          <div className="rounded-lg border overflow-hidden divide-y text-xs">
            {[
              { code: '401', desc: 'Ungültiger oder inaktiver API-Key' },
              { code: '429', desc: 'Rate-Limit überschritten — X-RateLimit-Reset enthält den Reset-Zeitstempel' },
            ].map(e => (
              <div key={e.code} className="flex items-center gap-4 px-4 py-2.5 bg-card">
                <span className="font-mono font-bold w-10 text-amber-600 dark:text-amber-400">{e.code}</span>
                <span className="text-muted-foreground">{e.desc}</span>
              </div>
            ))}
          </div>
          <Code>{`# Mit API-Key (Professional/Institutional)
curl -H "Authorization: Bearer <ihr-api-key>" \\
  "https://engpassradar.ch/api/v1/shortages?atc=C09"

# Response-Header
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9847
X-RateLimit-Reset: 1746057600
X-Api-Tier: professional`}</Code>
        </section>

        {/* Webhooks */}
        <section className="space-y-4">
          <h2 className="font-semibold text-base">Webhooks</h2>
          <p className="text-sm text-muted-foreground">
            Webhooks senden eine HTTP-POST-Anfrage an Ihre URL, sobald ein neuer Engpass gemeldet oder ein bestehender aufgelöst wird — ohne Polling, in Echtzeit.
          </p>
          <div className="rounded-lg border overflow-hidden divide-y text-xs">
            {[
              { event: 'shortage.created', desc: 'Neuer Engpass auf der Swissmedic-Liste' },
              { event: 'shortage.resolved', desc: 'Engpass als aufgelöst markiert' },
              { event: 'shortage.updated', desc: 'Änderung an bestehendem Engpass (Datum, Status)' },
            ].map(r => (
              <div key={r.event} className="flex items-center gap-4 px-4 py-2.5 bg-card">
                <code className="font-mono font-semibold text-primary shrink-0">{r.event}</code>
                <span className="text-muted-foreground">{r.desc}</span>
              </div>
            ))}
          </div>

          {/* Upgrade prompt */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Webhooks sind im Klinik-System verfügbar</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Engpassradar Pro erhält Daten via API-Polling. Das Klinik-System (CHF&nbsp;199/Mo) sendet Push-Events direkt an Ihre Infrastruktur.
              </p>
            </div>
            <a
              href="/klinik-system"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Klinik-System anfragen →
            </a>
          </div>
        </section>

        {/* RSS */}
        <section className="space-y-3">
          <h2 className="font-semibold text-base">RSS-Feeds</h2>
          <div className="rounded-lg border overflow-hidden divide-y text-xs">
            {[
              { url: '/rss.xml', desc: 'Alle aktuellen Engpässe' },
              { url: '/wirkstoff/{atc}/feed.xml', desc: 'Engpässe nach ATC-Gruppe (z. B. /wirkstoff/C09/feed.xml)' },
            ].map(r => (
              <div key={r.url} className="flex items-center gap-4 px-4 py-2.5 bg-card">
                <code className="font-mono text-foreground">{r.url}</code>
                <span className="text-muted-foreground">{r.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* MCP Server */}
        <section className="space-y-4">
          <h2 className="font-semibold text-base">MCP-Server (Claude / Copilot / Cursor)</h2>
          <p className="text-sm text-muted-foreground">
            Der MCP-Server stellt engpassradar-Daten als native Agent-Tools bereit — ohne Scraping, direkt im
            Workflow von Claude Desktop, GitHub Copilot oder Cursor. Fragen wie{' '}
            <span className="italic">„Inhibace ist nicht lieferbar — was gibt es stattdessen für C09AA?"</span>{' '}
            werden damit zum direkten Datenbankaufruf.
          </p>

          {/* Tools */}
          <div className="rounded-lg border overflow-hidden divide-y text-xs">
            {[
              { tool: 'search_shortages', desc: 'Volltext-Suche nach Produkt, Wirkstoff oder Firma' },
              { tool: 'get_shortage', desc: 'Einzelprodukt per GTIN — inkl. Score, Preis, BWL-Status' },
              { tool: 'find_alternatives', desc: 'Alternativen für ein Produkt im Engpass — mit eigenem Engpass-Status' },
              { tool: 'check_atc_group', desc: 'Wie viele Produkte in einer ATC-Klasse sind betroffen? (C09, C09AA, …)' },
              { tool: 'list_active_shortages', desc: 'Bulk-Liste aktiver Engpässe mit Filtern' },
              { tool: 'get_company_status', desc: 'Firmenprofil: aktive Engpässe + Transparenz-Score' },
              { tool: 'get_shortage_timeline', desc: 'Wochenweise Trendlinie der Engpass-Anzahl' },
              { tool: 'get_weekly_summary', desc: 'KPI-Snapshot: total aktiv, kritisch, BWL-betroffen' },
            ].map(r => (
              <div key={r.tool} className="flex items-start gap-4 px-4 py-2.5 bg-card">
                <code className="font-mono font-semibold text-primary shrink-0 w-52">{r.tool}</code>
                <span className="text-muted-foreground">{r.desc}</span>
              </div>
            ))}
          </div>

          {/* Setup */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Setup</p>
            <Code>{`# 1. Repository klonen und MCP bauen
git clone https://github.com/brainbytes-dev/engpassradar.git
cd engpassradar/mcp && npm run build

# 2. claude_desktop_config.json (macOS: ~/Library/Application Support/Claude/)
{
  "mcpServers": {
    "engpassradar": {
      "command": "node",
      "args": ["/pfad/zu/engpassradar/mcp/dist/index.js"],
      "env": {
        "ENGPASS_API_KEY": "ihr-api-key"  // optional, Free-Tier ohne Key
      }
    }
  }
}`}</Code>
          </div>

          <p className="text-xs text-muted-foreground">
            Free-Tier (100 Req/h) funktioniert ohne API-Key. Pro-Key (10&apos;000 Req/Tag) über{' '}
            <Link href="/api-keys" className="underline underline-offset-2 hover:text-foreground">API-Keys</Link>.
            Quellcode:{' '}
            <a
              href="https://github.com/brainbytes-dev/engpassradar/tree/main/mcp"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              github.com/brainbytes-dev/engpassradar/tree/main/mcp
            </a>
          </p>
        </section>

      </div>
    </main>
  )
}
