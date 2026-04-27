import type { Metadata } from 'next'
import { CheckCircle2, ArrowRight, Clock, ShieldCheck, BarChart3 } from 'lucide-react'
import { KlinikSystemForm } from '@/components/klinik-system-form'

export const metadata: Metadata = {
  title: 'Engpassradar Klinik-System — Für Spitalapotheken',
  description: 'Wie Schweizer Spitalapotheken Medikamenten-Engpässe früher erkennen — mit dem Engpassradar Klinik-System. Anfrage stellen und kostenlosen Shortage Report erhalten.',
}

const PAIN_POINTS = [
  {
    icon: Clock,
    title: '15–20 Minuten täglich',
    body: 'So lange dauert der manuelle Check auf drugshortage.ch — bei einer Spitalapotheke mit 200–500 Wirkstoffen im Sortiment.',
  },
  {
    icon: BarChart3,
    title: 'Kein Score, kein Kontext',
    body: 'Die offizielle Liste sagt, was gemeldet ist. Nicht wie ernst. Nicht wie lange. Nicht ob Alternativen existieren.',
  },
  {
    icon: ShieldCheck,
    title: 'Kein Alerting',
    body: 'Wer heute Nacht ein kritisches Medikament gemeldet wird, wissen Sie morgen früh — falls Sie daran denken nachzuschauen.',
  },
]

const INCLUDES = [
  'Engpass-Score für alle aktiven Meldungen (proprietäre Metrik)',
  'Webhook-Alerts bei neuen Engpässen Ihrer ATC-Klassen',
  '100 000 API-Anfragen pro Tag',
  'Monatlicher Shortage Report Schweiz als PDF — exklusiv',
  '30-Min-Onboarding-Call: Watchlist gemeinsam einrichten',
  'SLA 99.9 % · Prioritäts-Support',
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
            Für leitende Apotheker:innen an Schweizer Spitalapotheken, die täglich mehr als 10 Minuten auf drugshortage.ch verbringen und trotzdem nicht sicher sind, ob sie alles sehen.
          </p>
          <a
            href="#anfrage"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            Kostenlosen Shortage Report anfordern
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="mt-3 text-[12px] text-muted-foreground">
            Kein Abo. Kein Pitch. Wir senden Ihnen den Report für Ihre Institution und erklären was er zeigt.
          </p>
        </section>

        {/* Pain points */}
        <section className="border-t border-border/40 bg-muted/[0.15]">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-10">
              Das Problem
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

        {/* What's included */}
        <section className="border-t border-border/40">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-5">
                  Klinik-System — CHF 199 / Monat
                </p>
                <h2 className="text-[22px] font-semibold tracking-tight text-foreground mb-6 leading-snug">
                  Alles was eine Spitalapotheke braucht. Nichts was sie nicht braucht.
                </h2>
                <ul className="space-y-3">
                  {INCLUDES.map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-[13px] text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                  <p className="text-[12px] text-muted-foreground">
                    <strong className="text-foreground">Zum Vergleich:</strong> 3 Mitarbeitende · 15 Min./Tag · CHF 90/h = CHF 297/Monat Personalaufwand allein für den manuellen Check. Das Klinik-System kostet CHF 199.
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

        {/* Social proof / data */}
        <section className="border-t border-border/40 bg-muted/[0.15]">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-14 sm:py-16">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
              {[
                { value: '700+', label: 'Aktive Engpässe täglich' },
                { value: '8 600+', label: 'Historische Fälle seit 2018' },
                { value: '99.2 %', label: 'ODDB-Matching-Quote' },
                { value: '24 h', label: 'Max. Reaktionszeit' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-[28px] font-bold tracking-tight text-foreground tabular-nums">{value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{label}</p>
                </div>
              ))}
            </div>
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
