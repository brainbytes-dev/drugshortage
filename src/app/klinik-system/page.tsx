import type { Metadata } from 'next'
import { CheckCircle2, ArrowRight, Clock, BarChart3, Bell, MessageSquare } from 'lucide-react'
import { KlinikSystemForm } from '@/components/klinik-system-form'

export const metadata: Metadata = {
  title: 'Engpassradar Klinik-System — Für Spitalapotheken',
  description: 'Engpass-Monitoring für Schweizer Spitalapotheken: Score, Alerting, API — integriert in Ihren Workflow. Kostenlosen Shortage Report für Ihre Institution anfordern.',
}

const PAIN_POINTS = [
  {
    icon: Clock,
    title: 'Bis ein Engpass sichtbar wird, ist oft Zeit vergangen',
    body: 'Wer täglich manuell prüft, sieht Änderungen erst beim nächsten Check. Proaktives Handeln erfordert proaktive Information.',
  },
  {
    icon: BarChart3,
    title: 'Nicht jeder Engpass ist gleich kritisch',
    body: 'Ohne Bewertung sieht alles gleich dringend aus. Welcher Engpass betrifft Ihr Sortiment wirklich? Wie lange dauert er typischerweise? Gibt es Alternativen?',
  },
  {
    icon: Bell,
    title: 'Integration kostet mehr als ein Abo',
    body: 'Einen eigenen Scraper, eine eigene Datenbank und eigene Alerts aufzubauen bindet Entwicklungszeit. Engpassradar liefert das als fertige API.',
  },
]

const INCLUDES = [
  'Engpass-Score 0–100 für jede aktive Meldung (proprietäre Metrik)',
  'Webhook-Alerts bei neuen Engpässen Ihrer ATC-Klassen',
  '100 000 API-Anfragen pro Tag',
  'Monatlicher Shortage Report Schweiz als PDF — exklusiv',
  '30-Min-Onboarding-Call: Watchlist gemeinsam einrichten',
  'SLA 99.9 % · Prioritäts-Support',
]

const OBJECTIONS = [
  {
    q: 'Wir haben bereits eigene Prozesse.',
    a: 'Engpassradar ersetzt nichts — es reduziert den manuellen Aufwand und fügt Score und Alerting hinzu, die intern kaum zu replizieren sind.',
  },
  {
    q: 'CHF 199 muss intern beantragt werden.',
    a: 'Für Spitalapotheken liegt dieser Betrag typischerweise unter der Schwelle, die eine formelle Ausschreibung erfordert. Der Onboarding-Call hilft Ihnen, den internen Business Case zu formulieren.',
  },
  {
    q: 'Was wenn der Dienst ausfällt?',
    a: 'SLA 99.9 % vertraglich. 30-Tage-Geld-zurück-Garantie ohne Begründung. Die offiziellen Quellen bleiben Ihre Primärquelle — wir ergänzen, wir ersetzen nicht.',
  },
  {
    q: 'Wir sind eine kleine Apotheke, keine Klinik.',
    a: 'Das Klinik-System ist für Institutionen ab ca. 100 überwachten Wirkstoffen sinnvoll. Für kleinere Apotheken empfehlen wir Engpassradar Pro (CHF 39/Mo) oder den kostenlosen Zugang.',
  },
]

export default function KlinikSystemPage() {
  return (
    <>
      <main className="bg-background">

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-8 pt-20 pb-16 sm:pt-28 sm:pb-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-5">
            Engpassradar Klinik-System
          </p>
          <h1 className="text-[clamp(28px,4vw,52px)] font-semibold tracking-[-0.025em] text-foreground leading-[1.1] max-w-3xl mb-6">
            Wissen Sie morgen früh, was heute Nacht auf die Liste kam — bevor Ihr erstes Telefon klingelt.
          </h1>
          <p className="text-[15px] text-muted-foreground leading-[1.65] max-w-xl mb-10">
            Engpassradar Klinik-System integriert tagesaktuelle Engpass-Daten mit Score, Alerting und API in Ihren Apotheken-Workflow — ohne eigene Infrastruktur, ohne manuelle Aggregation.
          </p>
          <a
            href="#anfrage"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            Kostenlosen Shortage Report anfordern
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="mt-3 text-[12px] text-muted-foreground">
            Kein Abo. Kein Pitch. Wir erstellen einen personalisierten Report für Ihre Institution — innert 24 h.
          </p>
        </section>

        {/* Pain points */}
        <section className="border-t border-border/40 bg-muted/[0.15]">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-10">
              Warum Engpassradar Klinik-System
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {PAIN_POINTS.map(({ icon: Icon, title, body }) => (
                <div key={title}>
                  <Icon className="h-5 w-5 text-primary mb-4" />
                  <h3 className="text-[15px] font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-[1.65]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's included + form */}
        <section className="border-t border-border/40">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-5">
                  Klinik-System — CHF 199 / Monat
                </p>
                <h2 className="text-[22px] font-semibold tracking-tight text-foreground mb-2 leading-snug">
                  Was Sie ab dem ersten Tag haben.
                </h2>
                <p className="text-[13px] text-muted-foreground mb-6 leading-relaxed">
                  Konfiguriert in einem 30-minütigen Onboarding-Call. Kein internes IT-Projekt.
                </p>
                <ul className="space-y-3">
                  {INCLUDES.map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-[13px] text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 rounded-xl border border-border/50 bg-muted/30 px-4 py-3 space-y-2">
                  <p className="text-[12px] text-muted-foreground">
                    <strong className="text-foreground">Zum Vergleich:</strong> 3 Mitarbeitende · 15 Min./Tag · CHF 90/h = CHF 297/Monat Personalaufwand für manuelles Monitoring. Das Klinik-System kostet CHF 199.
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    <strong className="text-foreground">Was Sie kaufen:</strong> nicht die Software — die täglich zuverlässig laufende Infrastruktur, ohne dass Sie Scraper, Datenbank oder Alerts selbst betreiben müssen.
                  </p>
                </div>
              </div>

              {/* Application form */}
              <div id="anfrage" className="rounded-2xl border bg-card shadow-sm p-6 scroll-mt-20">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Anfrage
                </p>
                <p className="text-[17px] font-semibold text-foreground mb-1">
                  Kostenlosen Shortage Report erhalten
                </p>
                <p className="text-[12px] text-muted-foreground mb-5 leading-relaxed">
                  Wir erstellen einen personalisierten Report für Ihre Institution und melden uns persönlich — kein Autoresponder.
                </p>
                <KlinikSystemForm />
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-t border-border/40 bg-muted/[0.15]">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-14 sm:py-16">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
              {[
                { value: '700+', label: 'Aktive Engpässe täglich überwacht' },
                { value: '99.2 %', label: 'Automatische ODDB-Anreicherung (ATC, GTIN, Wirkstoff)' },
                { value: '< 2 h', label: 'Ø Zeit bis neue Meldung im System sichtbar ist' },
                { value: '24 h', label: 'Persönliche Reaktionszeit bei Support-Anfragen' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-[28px] font-bold tracking-tight text-foreground tabular-nums">{value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Objection handling */}
        <section className="border-t border-border/40">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-10">
              Häufige Fragen
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
              {OBJECTIONS.map(({ q, a }) => (
                <div key={q}>
                  <p className="text-[14px] font-semibold text-foreground mb-2">{q}</p>
                  <p className="text-[13px] text-muted-foreground leading-[1.65]">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border/40 bg-muted/[0.15]">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16 sm:py-20 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-5">
              Nächster Schritt
            </p>
            <h2 className="text-[clamp(22px,3vw,36px)] font-semibold tracking-tight text-foreground mb-4">
              Sehen Sie, welche Engpässe Ihre Institution heute betreffen.
            </h2>
            <p className="text-[14px] text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
              Anfrage stellen — wir erstellen Ihnen kostenfrei einen personalisierten Shortage Report und melden uns persönlich.
            </p>
            <a
              href="#anfrage"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              Jetzt Anfrage stellen
              <ArrowRight className="h-4 w-4" />
            </a>
            <p className="mt-3 text-[12px] text-muted-foreground">Kein Abo. Kostenlos. Innert 24 h.</p>
          </div>
        </section>

        {/* Back to pricing */}
        <section className="border-t border-border/40">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-muted-foreground">
              Entwickler oder Softwarehersteller? API-Tarife mit Rate Limits und technischer Dokumentation.
            </p>
            <a
              href="/api#pricing"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline"
            >
              API-Tarife ansehen
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>

      </main>
    </>
  )
}
