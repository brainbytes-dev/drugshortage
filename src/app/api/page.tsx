import type { Metadata } from 'next'
import Link from 'next/link'
import { Zap, ShieldCheck, BarChart3, ArrowRight, Code2 } from 'lucide-react'
import { PricingSection } from '@/components/pricing-section'

export const metadata: Metadata = {
  title: 'API für Schweizer Arzneimittel-Lieferengpässe | engpassradar.ch',
  description: 'Die einzige Schweizer REST API für Arzneimittel-Lieferengpässe — mit Severity Scoring, ATC-Alerting und täglicher Aktualisierung. Für Kliniken, Apotheken und Softwarehersteller.',
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
            Daten der Lieferengpässe direkt in Ihr System —
            <br className="hidden sm:block" />
            <span className="gradient-text">die einzige Schweizer Arzneimittel-Engpass-API.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Tagesaktuelle Lieferengpässe, BWL-Warnungen und Severity Scores für alle ~700 aktiven Engpässe.
            Für Spitäler, Apothekenketten und pharmazeutische Softwarehersteller.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/api-keys"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              API-Zugang erhalten
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/api-docs"
              className="inline-flex items-center gap-2 rounded-lg border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <Code2 className="h-4 w-4" />
              Dokumentation
            </Link>
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
              { value: '~700', label: 'Aktive Engpässe täglich' },
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
      <section className="max-w-2xl mx-auto px-4 py-14 space-y-6">
        <h2 className="text-xl font-bold tracking-tight text-center">Häufige Fragen</h2>
        <div className="space-y-4">
          {FAQS.map(({ q, a }) => (
            <div key={q} className="rounded-lg border bg-card p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">{q}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="border-t bg-primary">
        <div className="max-w-2xl mx-auto px-4 py-14 text-center space-y-5">
          <h2 className="text-xl font-bold text-primary-foreground">Bereit für den Echtbetrieb?</h2>
          <p className="text-sm text-primary-foreground/80">
            Starten Sie kostenlos — kein Key, kein Login. Oder sichern Sie sich einen Professional-Key für produktiven Einsatz.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/api-keys"
              className="inline-flex items-center gap-2 rounded-lg bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow"
            >
              API-Key erhalten
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/api-docs"
              className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/30 px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
            >
              Dokumentation lesen
            </Link>
          </div>
          <p className="text-xs text-primary-foreground/60">
            Fragen?{' '}
            <a href="mailto:api@engpassradar.ch" className="underline hover:text-primary-foreground">
              api@engpassradar.ch
            </a>
          </p>
        </div>
      </section>

    </main>
  )
}
