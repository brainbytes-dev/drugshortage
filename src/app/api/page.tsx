import type { Metadata } from 'next'
import Link from 'next/link'
import { Zap, ShieldCheck, BarChart3, ArrowRight, Code2 } from 'lucide-react'

import { PricingSection, FinalCtaSection } from '@/components/pricing-section'

export const metadata: Metadata = {
  title: 'API für Schweizer Arzneimittel-Lieferengpässe | engpassradar.ch',
  description: 'REST API für Schweizer Arzneimittel-Lieferengpässe — mit Severity Scoring, ATC-Filterung und täglicher Aktualisierung. Für Kliniken, Apotheken und Softwarehersteller.',
}

const CURL_EXAMPLE = `curl "https://engpassradar.ch/api/v1/shortages?atc=C09&status=1,4" \\
  -H "X-Api-Key: ihr_api_key"

{
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
        "breakdown": { "duration": 22, "noAlternatives": 15 }
      }
    }
  ],
  "total": 68,
  "meta": { "generatedAt": "2026-04-20T10:00:00Z" }
}`

const VALUE_PROPS = [
  {
    icon: Zap,
    title: 'Tagesaktuelle Daten',
    body: 'Täglicher Scrape aus drugshortage.ch und BWL — immer der aktuelle Stand, nicht gestern.',
  },
  {
    icon: BarChart3,
    title: 'Severity Scoring',
    body: 'Jedes Präparat erhält einen kombinierten Score aus Dauer, Alternativen, BWL-Status und Kritikalität.',
  },
  {
    icon: ShieldCheck,
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
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            REST API — v1 öffentlich verfügbar
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
            Lieferengpass-Daten direkt in Ihr System —{' '}
            <span className="gradient-text">die Schweizer REST API für Arzneimittel-Engpässe.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Tagesaktuelle Lieferengpässe, BWL-Warnungen und Severity Scores — täglich abgeglichen.
            Für Spitäler, Apothekenketten und pharmazeutische Softwarehersteller.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/api-docs"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              <Code2 className="h-4 w-4" />
              Dokumentation & Quickstart
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-lg border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Tarife & Preise
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Keine Kreditkarte für erste Tests. Free-Tier ohne Key-Registrierung.
          </p>
        </div>
      </section>

      {/* ── VALUE PROPS ── */}
      <section className="max-w-3xl mx-auto px-4 py-14 space-y-6">
        <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Warum engpassradar.ch
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border bg-card p-5 space-y-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CODE SNIPPET ── */}
      <section className="border-y bg-slate-950 dark:bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">Beispiel-Request</p>
            <Link href="/api-docs" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
              Alle Endpunkte →
            </Link>
          </div>
          <pre className="text-xs font-mono text-slate-200 leading-relaxed overflow-x-auto whitespace-pre">
            {CURL_EXAMPLE}
          </pre>
        </div>
      </section>

      {/* ── PRICING (Client Component with toggle) ── */}
      <PricingSection />

      {/* ── STATS ── */}
      <section className="border-y bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { value: 'täglich', label: 'Engpässe aktualisiert' },
              { value: '148+', label: 'ATC-Gruppen abgedeckt' },
              { value: '24 h', label: 'Max. Datenverzug' },
            ].map(({ value, label }) => (
              <div key={label} className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
