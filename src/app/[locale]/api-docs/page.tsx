import type { Metadata } from 'next'
import { buildPageAlternates } from '@/lib/i18n-meta'
import type { Locale } from '@/i18n/routing'
import Script from 'next/script'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ArrowLeft } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const t = await getTranslations('ApiDocs')
  const { locale } = await params
  const { canonical, languages } = buildPageAlternates('/api-docs', locale as Locale)
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical, languages },
  }
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

function ParamTable({ rows, labels }: { rows: ParamRow[]; labels: { parameter: string; type: string; required: string; description: string; example: string; yes: string } }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="py-2 px-3 text-left font-semibold text-muted-foreground">{labels.parameter}</th>
            <th className="py-2 px-3 text-left font-semibold text-muted-foreground">{labels.type}</th>
            <th className="py-2 px-3 text-left font-semibold text-muted-foreground">{labels.required}</th>
            <th className="py-2 px-3 text-left font-semibold text-muted-foreground">{labels.description}</th>
            <th className="py-2 px-3 text-left font-semibold text-muted-foreground">{labels.example}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map(r => (
            <tr key={r.name}>
              <td className="py-2 px-3 font-mono text-foreground">{r.name}</td>
              <td className="py-2 px-3 text-muted-foreground">{r.type}</td>
              <td className="py-2 px-3">
                {r.required
                  ? <span className="text-red-500 font-medium">{labels.yes}</span>
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

export default async function ApiDocsPage() {
  const t = await getTranslations('ApiDocs')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: t('jsonLdHeadline'),
    url: 'https://www.engpassradar.ch/api-docs',
    publisher: { '@type': 'Organization', name: 'engpassradar.ch', url: 'https://www.engpassradar.ch' },
  }

  const tableLabels = {
    parameter: t('tableParameter'),
    type: t('tableType'),
    required: t('tableRequired'),
    description: t('tableDescription'),
    example: t('tableExample'),
    yes: t('yes'),
  }

  return (
    <main className="min-h-screen bg-background">
      <Script
        id="ld-api-docs"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-12">

        <Link href="/api" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t('backToOverview')}
        </Link>

        {/* Header */}
        <header className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{t('h1')}</h1>
            <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
              {t('versionBadge')}
            </span>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t('intro')}
          </p>
        </header>

        {/* API Pricing CTA */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm text-foreground">
            <span className="font-medium">{t('upgradeBoxTitle')}</span>
            {' '}{t('upgradeBoxBody')}
          </p>
          <Link
            href={{ pathname: '/api', hash: 'pricing' }}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t('upgradeBoxCta')}
          </Link>
        </div>

        {/* Base URL */}
        <section className="space-y-2">
          <h2 className="font-semibold text-base">{t('baseUrlTitle')}</h2>
          <Code>https://engpassradar.ch/api/v1</Code>
          <p className="text-xs text-muted-foreground">
            {t.rich('baseUrlNote', {
              header: () => <code className="font-mono bg-muted px-1 rounded">Access-Control-Allow-Origin: *</code>,
            })}
          </p>
        </section>

        {/* Endpoints overview */}
        <section className="space-y-3">
          <h2 className="font-semibold text-base">{t('endpointsTitle')}</h2>
          <div className="rounded-lg border overflow-hidden divide-y text-sm">
            {[
              { method: 'GET' as const, path: '/api/v1/shortages', desc: t('endpointShortagesList') },
              { method: 'GET' as const, path: '/api/v1/shortages/:gtin', desc: t('endpointShortageDetail') },
              { method: 'GET' as const, path: '/api/v1/stats', desc: t('endpointStats') },
              { method: 'GET' as const, path: '/api/v1/timeline', desc: t('endpointTimeline') },
              { method: 'GET' as const, path: '/api/alternatives', desc: t('endpointAlternatives') },
              { method: 'POST' as const, path: '/api/alternatives/batch', desc: t('endpointAlternativesBatch') },
              { method: 'GET' as const, path: '/api/export/csv', desc: t('endpointCsv') },
              { method: 'GET' as const, path: '/api/health', desc: t('endpointHealth') },
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
          <p className="text-sm text-muted-foreground">{t('shortagesIntro')}</p>
          <ParamTable
            labels={tableLabels}
            rows={[
              { name: 'search', type: 'string', desc: t('paramSearchDesc'), example: 'pregabalin' },
              { name: 'status', type: 'string', desc: t('paramStatusDesc'), example: '1,4' },
              { name: 'firma', type: 'string', desc: t('paramFirmaDesc'), example: 'Sandoz' },
              { name: 'atc', type: 'string', desc: t('paramAtcDesc'), example: 'C09' },
              { name: 'neu', type: 'integer', desc: t('paramNeuDesc'), example: '1' },
              { name: 'page', type: 'integer', desc: t('paramPageDesc'), example: '2' },
              { name: 'perPage', type: 'integer', desc: t('paramPerPageDesc'), example: '100' },
              { name: 'sort', type: 'string', desc: t('paramSortDesc'), example: 'tageSeitMeldung:desc' },
            ]}
          />
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
            {t('shortageDetailIntro')} <strong className="text-foreground">{t('shortageDetailScoreBreakdown')}</strong>.
          </p>
          <ParamTable
            labels={tableLabels}
            rows={[
              { name: 'gtin', type: 'string', required: true, desc: t('paramGtinDesc'), example: '7680654320016' },
            ]}
          />
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
            {t('statsIntro')}
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
            {t('timelineIntro')}
          </p>
          <ParamTable
            labels={tableLabels}
            rows={[
              { name: 'weeks', type: 'integer', desc: t('paramWeeksDesc'), example: '104' },
            ]}
          />
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
            {t('alternativesIntro')}
          </p>
          <ParamTable
            labels={tableLabels}
            rows={[
              { name: 'gtin', type: 'string', required: true, desc: t('paramGtinSimpleDesc'), example: '7680654320016' },
            ]}
          />
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
            {t('alternativesBatchIntro')}
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
            {t.rich('alternativesBatchNote', {
              code: () => <code className="font-mono bg-muted px-1 rounded">data: null</code>,
            })}
          </p>
        </section>

        {/* ── GET /export/csv ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <MethodBadge method="GET" />
            <h2 className="font-semibold text-base font-mono">/api/export/csv</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('csvIntro')}
          </p>
          <ParamTable
            labels={tableLabels}
            rows={[
              { name: 'search', type: 'string', desc: t('paramSearchDesc'), example: 'pregabalin' },
              { name: 'status', type: 'string', desc: t('paramStatusDesc'), example: '1,4' },
              { name: 'firma', type: 'string', desc: t('paramFirmaDesc'), example: 'Novartis' },
              { name: 'atc', type: 'string', desc: t('paramAtcDesc'), example: 'N06' },
            ]}
          />
          <Code>{`# Alle Neuropharmaka-Engpässe als CSV herunterladen
curl "https://engpassradar.ch/api/export/csv?atc=N06" -o n06-engpaesse.csv

# In Python:
import pandas as pd
df = pd.read_csv("https://engpassradar.ch/api/export/csv?atc=N06")`}
          </Code>
          <p className="text-xs text-muted-foreground">
            {t('csvFields')}
          </p>
        </section>

        {/* ── GET /health ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <MethodBadge method="GET" />
            <h2 className="font-semibold text-base font-mono">/api/health</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {t.rich('healthIntro', {
              ok: () => <code className="font-mono bg-muted px-1 rounded">200</code>,
              fail: () => <code className="font-mono bg-muted px-1 rounded">503</code>,
            })}
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
          <h2 className="font-semibold text-base">{t('statusCodesTitle')}</h2>
          <div className="rounded-lg border overflow-hidden divide-y text-xs">
            {[
              { code: '200', desc: t('status200') },
              { code: '400', desc: t('status400') },
              { code: '404', desc: t('status404') },
              { code: '500', desc: t('status500') },
              { code: '503', desc: t('status503') },
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
          <h2 className="font-semibold text-base">{t('cachingTitle')}</h2>
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
          <h2 className="font-semibold text-base">{t('rateLimitsTitle')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('rateLimitsIntro')}
          </p>
          <div className="rounded-lg border overflow-hidden divide-y text-xs">
            {[
              { tier: 'Free', limit: t('rateLimitFreeLimit'), key: t('rateLimitFreeKey'), price: 'CHF 0' },
              { tier: 'Research', limit: t('rateLimitResearchLimit'), key: t('rateLimitResearchKey'), price: 'CHF 0' },
              { tier: 'Engpassradar Pro', limit: t('rateLimitProLimit'), key: t('rateLimitProKey'), price: t('rateLimitProPrice') },
              { tier: 'Klinik-System', limit: t('rateLimitKlinikLimit'), key: t('rateLimitKlinikKey'), price: t('rateLimitKlinikPrice') },
              { tier: 'Data License', limit: t('rateLimitDataLimit'), key: t('rateLimitDataKey'), price: t('rateLimitDataPrice') },
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
            <Link href="/api-keys" className="text-primary underline underline-offset-2">{t('rateLimitCtaApply')}</Link>
            <Link href={{ pathname: '/api-keys', query: { tab: 'research' } }} className="text-muted-foreground underline underline-offset-2">{t('rateLimitCtaResearch')}</Link>
          </div>
          <div className="rounded-lg border overflow-hidden divide-y text-xs">
            {[
              { code: '401', desc: t('status401') },
              { code: '429', desc: t('status429') },
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
          <h2 className="font-semibold text-base">{t('webhooksTitle')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('webhooksIntro')}
          </p>
          <div className="rounded-lg border overflow-hidden divide-y text-xs">
            {[
              { event: 'shortage.created', desc: t('webhookCreatedDesc') },
              { event: 'shortage.resolved', desc: t('webhookResolvedDesc') },
              { event: 'shortage.updated', desc: t('webhookUpdatedDesc') },
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
              <p className="text-sm font-semibold text-foreground">{t('webhookUpgradeTitle')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('webhookUpgradeBody')}
              </p>
            </div>
            <a
              href="/klinik-system"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t('webhookUpgradeCta')}
            </a>
          </div>
        </section>

        {/* RSS */}
        <section className="space-y-3">
          <h2 className="font-semibold text-base">{t('rssTitle')}</h2>
          <div className="rounded-lg border overflow-hidden divide-y text-xs">
            {[
              { url: '/rss.xml', desc: t('rssAllDesc') },
              { url: '/wirkstoff/{atc}/feed.xml', desc: t('rssAtcDesc') },
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
          <h2 className="font-semibold text-base">{t('mcpTitle')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('mcpIntroPart1')}{' '}
            <span className="italic">{t('mcpIntroExample')}</span>{' '}
            {t('mcpIntroPart2')}
          </p>

          {/* Tools */}
          <div className="rounded-lg border overflow-hidden divide-y text-xs">
            {[
              { tool: 'search_shortages', desc: t('mcpToolSearchShortagesDesc') },
              { tool: 'get_shortage', desc: t('mcpToolGetShortageDesc') },
              { tool: 'find_alternatives', desc: t('mcpToolFindAlternativesDesc') },
              { tool: 'check_atc_group', desc: t('mcpToolCheckAtcGroupDesc') },
              { tool: 'list_active_shortages', desc: t('mcpToolListActiveShortagesDesc') },
              { tool: 'get_company_status', desc: t('mcpToolGetCompanyStatusDesc') },
              { tool: 'get_shortage_timeline', desc: t('mcpToolGetShortageTimelineDesc') },
              { tool: 'get_weekly_summary', desc: t('mcpToolGetWeeklySummaryDesc') },
            ].map(r => (
              <div key={r.tool} className="flex items-start gap-4 px-4 py-2.5 bg-card">
                <code className="font-mono font-semibold text-primary shrink-0 w-52">{r.tool}</code>
                <span className="text-muted-foreground">{r.desc}</span>
              </div>
            ))}
          </div>

          {/* Smithery — primary setup */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('mcpSmitheryEyebrow')}</p>
            <p className="text-xs text-muted-foreground">
              {t.rich('mcpSmitheryBody', {
                server: () => <code className="font-mono">mcp.engpassradar.ch</code>,
              })}
            </p>
            <a
              href="https://smithery.ai/servers/info-re81/engpassradar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-muted/40 px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              {t('mcpSmitheryCta')}
            </a>
          </div>

          {/* Manual config */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('mcpManualEyebrow')}</p>
            <p className="text-xs text-muted-foreground">
              {t.rich('mcpManualBody', {
                file: () => <code className="font-mono">claude_desktop_config.json</code>,
                path: () => <code className="font-mono">~/Library/Application Support/Claude/</code>,
              })}
            </p>
            <Code>{`{
  "mcpServers": {
    "engpassradar": {
      "type": "http",
      "url": "https://mcp.engpassradar.ch"
    }
  }
}`}</Code>
            <p className="text-xs text-muted-foreground">
              {t('mcpManualWithKey')}
            </p>
            <Code>{`{
  "mcpServers": {
    "engpassradar": {
      "type": "http",
      "url": "https://mcp.engpassradar.ch?ENGPASS_API_KEY=ihr-api-key"
    }
  }
}`}</Code>
          </div>

          <p className="text-xs text-muted-foreground">
            {t('mcpFooterIntro')}{' '}
            <Link href="/api-keys" className="underline underline-offset-2 hover:text-foreground">{t('mcpFooterApiKeys')}</Link>.{' '}
            {t('mcpFooterSource')}{' '}
            <a
              href="https://github.com/brainbytes-dev/engpassradar/tree/main/mcp"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              github.com/…/mcp
            </a>
          </p>
        </section>

      </div>
    </main>
  )
}
