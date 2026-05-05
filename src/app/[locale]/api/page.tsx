import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Code2 } from 'lucide-react'

import { PricingSection, FinalCtaSection } from '@/components/pricing-section'

export const metadata: Metadata = {
  title: 'API für Schweizer Arzneimittel-Lieferengpässe | engpassradar.ch',
  description: 'REST API für Schweizer Arzneimittel-Lieferengpässe — mit Severity Scoring, ATC-Filterung und täglicher Aktualisierung. Für Kliniken, Apotheken und Softwarehersteller.',
}

const CURL_REQUEST = `curl "https://engpassradar.ch/api/v1/shortages
  ?atc=C09
  &status=1,4
  &limit=1" \\
  -H "X-Api-Key: ihr_api_key"`

const JSON_RESPONSE = `{
  "data": [
    {
      "gtin": "7680654320016",
      "bezeichnung": "Olmesartan Mepha Lactab 20 mg",
      "firma": "Mepha Pharma AG",
      "atcCode": "C09CA08",
      "statusCode": 1,
      "tageSeitMeldung": 183,
      "score": {
        "total": 57,
        "label": "Mittel",
        "breakdown": {
          "duration": 22,
          "noAlternatives": 15
        }
      }
    }
  ],
  "total": 68,
  "meta": {
    "generatedAt": "2026-04-20T10:00:00Z"
  }
}`

const VALUE_PROPS = [
  {
    title: 'Tagesaktuelle Daten',
    body: 'Täglicher Scrape aus drugshortage.ch und BWL — immer der aktuelle Stand, nicht gestern.',
  },
  {
    title: 'Severity Scoring',
    body: 'Jedes Präparat erhält einen kombinierten Score aus Dauer, Alternativen, BWL-Status und Kritikalität.',
  },
  {
    title: 'Schweiz-nativ',
    body: 'GTIN, Pharmacode, ATC-Gruppen und Swissmedic-Daten — kein Mapping, keine Lücken.',
  },
]

const FAQS = [
  {
    q: 'Brauche ich einen API-Key für erste Tests?',
    a: 'Nein. Alle öffentlichen Endpunkte sind ohne Key zugänglich — bis 100 Requests pro Stunde pro IP. Für produktiven Einsatz empfehlen wir einen Professional-Key.',
  },
  {
    q: 'Wie schnell werde ich freigeschaltet?',
    a: 'Nach erfolgreicher Zahlung via Stripe erhalten Sie Ihren API-Key sofort per E-Mail. Der Magic-Link führt direkt zu Ihrem Dashboard — ohne Passwort.',
  },
  {
    q: 'Gibt es einen Research-Tarif für Hochschulen?',
    a: 'Ja — für Universitäten, Fachhochschulen und Schweizer Spitäler stellen wir kostenlose Research-Keys mit 2 000 Req/Tag aus. Einfach mit Ihrer institutionellen E-Mail beantragen.',
  },
  {
    q: 'Was ist im Severity Score enthalten?',
    a: 'Der Score kombiniert vier Faktoren: Transparenz der Meldung (0–5 Pkt.), Engpass-Dauer (0–25 Pkt.), fehlende Alternativen (0–25 Pkt.) sowie Pflichtlager/BWL-Status (0–25 Pkt.). Maximum: 80 Punkte.',
  },
  {
    q: 'Kann ich die Daten in meiner Software weitervertreiben?',
    a: 'Redistribution erfordert eine Data-License-Vereinbarung. Schreiben Sie uns an api@engpassradar.ch.',
  },
]

export default function ApiLandingPage() {
  return (
    <main className="min-h-screen bg-background">

      {/* ── HERO ── */}
      <div className="w-full bg-background border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 pt-[72px] pb-[64px]">
          <div className="px-10 max-w-[760px]">

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2.5 mb-10">
              <span aria-hidden="true" className="relative flex h-[7px] w-[7px] shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[oklch(0.58_0.13_150)] opacity-75" />
                <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-[oklch(0.58_0.13_150)]" />
              </span>
              <span className="font-mono text-[11.5px] text-muted-foreground tracking-[0.04em] uppercase">
                Developer API
              </span>
            </div>

            <h1 className="text-[clamp(40px,5vw,68px)] font-semibold leading-[1.0] tracking-[-0.03em] text-foreground mb-5">
              Lieferengpass-Daten direkt in Ihr System.
            </h1>
            <p className="text-base text-muted-foreground max-w-[520px] leading-[1.6] mb-9">
              Tagesaktuelle Engpässe, BWL-Warnungen und Severity Scores über eine einfache REST API.
              Für Spitäler, Apothekenketten und pharmazeutische Softwarehersteller.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center sm:justify-start gap-3 mb-10">
              <Link
                href="/api-docs"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Code2 className="h-4 w-4" />
                Dokumentation & Quickstart
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/80 bg-muted/40 px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Tarife & Preise
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            {/* Fact strip */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {[
                '≤ 24 h Datenverzug',
                'Alle ATC-Gruppen',
                'Free-Tier ohne Key',
                'JSON · CSV · Webhooks · MCP',
              ].map((fact, i, arr) => (
                <span key={fact} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  {fact}
                  {i < arr.length - 1 && <span aria-hidden className="text-border">·</span>}
                </span>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* ── VALUE PROPS ── */}
      <section className="border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 py-20 sm:py-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-14">
            Warum engpassradar.ch
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
            {VALUE_PROPS.map(({ title, body }, i) => (
              <div key={title}>
                <p className="font-mono text-[11px] text-primary mb-4">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-foreground mb-3">{title}</h3>
                <p className="text-[14px] text-muted-foreground leading-[1.6]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CODE TERMINAL ── */}
      <section className="border-t border-border/40 bg-slate-50 dark:bg-[#0d1117]">
        <div className="max-w-7xl mx-auto px-4 py-14">

          {/* Section label */}
          <div className="flex items-center justify-between mb-8">
            <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.18em]">Beispiel-Request</p>
            <Link href="/api-docs" className="font-mono text-[11px] text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Alle Endpunkte →
            </Link>
          </div>

          {/* Terminal window */}
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/[0.06] shadow-sm dark:shadow-2xl">

            {/* Chrome bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-[#161b22] border-b border-slate-200 dark:border-white/[0.06]">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <div className="ml-3 flex gap-1">
                <span className="rounded-md bg-white dark:bg-white/[0.06] px-4 py-1 font-mono text-[11px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06]">
                  request.sh
                </span>
                <span className="rounded-md px-4 py-1 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                  response.json
                </span>
              </div>
            </div>

            {/* Split panes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-white/[0.06] bg-white dark:bg-[#0d1117]">

              {/* Left: curl request */}
              <div className="p-6">
                <p className="font-mono text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-4">Request</p>
                <pre className="font-mono text-[13px] leading-[1.75] overflow-x-auto whitespace-pre">
                  <span className="text-[oklch(0.58_0.13_150)]">$</span>
                  {' '}
                  <span className="text-slate-700 dark:text-slate-200">{CURL_REQUEST}</span>
                </pre>
              </div>

              {/* Right: JSON response */}
              <div className="p-6">
                <p className="font-mono text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-4">
                  Response <span className="text-[oklch(0.58_0.13_150)] ml-2">200 OK</span>
                </p>
                <pre className="font-mono text-[13px] leading-[1.75] overflow-x-auto whitespace-pre">
                  {JSON_RESPONSE.split('\n').map((line, i) => {
                    const colored = line
                      .replace(/"([^"]+)":/g, '<k>"$1"</k>:')
                      .replace(/: "([^"]+)"/g, ': <v>"$1"</v>')
                      .replace(/: (\d+)/g, ': <n>$1</n>')
                    return (
                      <span key={i} dangerouslySetInnerHTML={{ __html: colored + '\n' }}
                        className="text-slate-600 dark:text-slate-300 [&_k]:text-blue-600 dark:[&_k]:text-[#79b8ff] [&_v]:text-blue-500 dark:[&_v]:text-[#9ecbff] [&_n]:text-amber-600 dark:[&_n]:text-[#f8c555]" />
                    )
                  })}
                </pre>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── MCP HINT ── */}
      <section className="border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">MCP-Server für Claude, Copilot & Cursor</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Engpassradar-Daten als native Agent-Tools — direkt im AI-Workflow, ohne Scraping.
              Tools: <code className="text-xs font-mono">find_alternatives</code>, <code className="text-xs font-mono">check_atc_group</code>, <code className="text-xs font-mono">get_company_status</code> u. a.
            </p>
          </div>
          <Link
            href="/api-docs#mcp"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Setup-Anleitung →
          </Link>
        </div>
      </section>

      {/* ── PRICING (Client Component with toggle) ── */}
      <PricingSection />

      {/* ── FAQ ── */}
      <section className="border-t border-border/40 bg-muted/[0.15]">
        <div className="max-w-3xl mx-auto px-4 py-20 sm:py-28">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-14">
            Häufige Fragen
          </h2>
          <div className="border-t border-border/40">
            {FAQS.map(({ q, a }, i) => (
              <details key={q} className="group border-b border-border/40">
                <summary className="flex items-baseline gap-[14px] py-6 cursor-pointer list-none select-none">
                  <span className="font-mono text-[11px] text-primary font-medium min-w-[28px] shrink-0 mt-[3px]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 text-[16px] font-semibold leading-snug tracking-[-0.005em] group-hover:text-primary transition-colors duration-200">
                    {q}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                    className="h-4 w-4 shrink-0 text-muted-foreground group-open:rotate-45 transition-transform duration-200 ease-out ml-4" aria-hidden>
                    <path strokeLinecap="round" d="M8 2v12M2 8h12" />
                  </svg>
                </summary>
                <p className="pl-[42px] pb-6 text-[14.5px] text-muted-foreground leading-[1.62] sm:pr-10">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <FinalCtaSection />

    </main>
  )
}
