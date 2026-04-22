import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma-optimized'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Methodik & Datenquellen | engpassradar.ch',
  description:
    'Wie engpassradar.ch Schweizer Medikamenten-Lieferengpässe erfasst: Datenquellen (drugshortage.ch, BWL, ODDB, USB Spitalpharmazie Basel), Aktualisierungsrhythmus und Severity Score.',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Methodik & Datenquellen — engpass.radar',
  url: 'https://www.engpassradar.ch/methodik',
  publisher: {
    '@type': 'Organization',
    name: 'engpass.radar',
    url: 'https://www.engpassradar.ch',
  },
}

function fmtCH(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '’')
}

export default async function MetodikPage() {
  const [activeCount, totalProducts, totalEpisodes] = await Promise.all([
    prisma.shortage.count({ where: { isActive: true } }),
    prisma.shortage.count(),
    prisma.shortageEpisode.count(),
  ])

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '<') }}
      />

      <div className="max-w-3xl mx-auto px-4 pt-16 pb-24 sm:pb-32">

        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-14">
          <ArrowLeft className="h-4 w-4" />
          Zur Übersicht
        </Link>

        {/* Page header */}
        <div className="mb-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-5">
            Transparenz
          </p>
          <h1 className="text-[clamp(32px,4vw,52px)] font-semibold leading-[1.08] tracking-[-0.025em] text-foreground mb-4">
            Methodik &<br />Datenquellen
          </h1>
          <p className="text-base text-muted-foreground max-w-[520px] leading-[1.6]">
            Wie engpassradar.ch Schweizer Medikamenten-Lieferengpässe erfasst, aufbereitet und bewertet.
          </p>
        </div>

        {/* ── DATENQUELLEN ── */}
        <section className="border-t border-border/40 pt-14 mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-8">
            Datenquellen
          </p>
          <div className="divide-y border rounded-lg overflow-hidden">
            {[
              {
                name: 'drugshortage.ch',
                url: 'https://www.drugshortage.ch',
                badge: 'Primärquelle',
                badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                desc: 'Private Plattform der Martinelli Consulting GmbH zur Erfassung von Medikamenten-Lieferengpässen in der Schweiz. Pharmaunternehmen melden hier freiwillig Engpässe und Erlöschungen von Zulassungen. Alle Produktdaten, Status-Codes und Alternativprodukte stammen aus dieser Quelle.',
              },
              {
                name: 'BWL — Bundesamt für wirtschaftliche Landesversorgung',
                url: 'https://www.bwl.admin.ch/de/meldestelle-heilmittel',
                badge: 'Pflichtlagerliste',
                badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                desc: 'Das BWL publiziert die Liste der pflichtlagerpflichtigen Heilmittel. Produkte auf dieser Liste sind für die Versorgungssicherheit der Schweiz besonders kritisch — bei einem Engpass besteht erhöhtes Risiko für Patienten.',
              },
              {
                name: 'ODDB / ywesee',
                url: 'https://www.oddb.org',
                badge: 'Preise & ATC',
                badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                desc: 'Die Open Drug Database liefert Apothekenverkaufspreise (Ex-Factory) sowie ATC-Codes für gemeldete Produkte. Diese Daten werden täglich abgeglichen, um Preisveränderungen und therapeutische Einordnung aktuell zu halten.',
              },
              {
                name: 'USB — Spitalpharmazie Basel',
                url: 'https://www.spitalpharmazie-basel.ch',
                badge: 'Spitalapotheke',
                badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
                desc: 'Das Universitätsspital Basel (USB) publiziert wöchentlich einen Lieferengpassbericht seiner Spitalpharmazie als PDF. Dieser enthält interne SAP-Nummern, betroffene Wirkstoffe und — besonders wertvoll — konkrete Substitutionsempfehlungen aus klinisch-pharmazeutischer Sicht. Diese Quelle ergänzt die drugshortage.ch-Daten um eine spitalpharmazeutische Perspektive, die sonst öffentlich nicht zugänglich ist.',
              },
            ].map(s => (
              <div key={s.name} className="px-5 py-5 bg-card space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-sm hover:underline"
                  >
                    {s.name}
                  </a>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.badgeColor}`}>{s.badge}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-[1.65]">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── ERHEBUNG & AKTUALISIERUNG ── */}
        <section className="border-t border-border/40 pt-14 mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-8">
            Erhebung & Aktualisierung
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-8 mb-10">
            {[
              { value: 'täglich', label: 'Aktualisierungsrhythmus' },
              { value: fmtCH(totalProducts), label: 'erfasste Präparate' },
              { value: fmtCH(totalEpisodes), label: 'Engpass-Episoden gesamt' },
              { value: fmtCH(activeCount), label: 'aktuell aktive Engpässe' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-[12px] text-muted-foreground tracking-[0.02em] mb-1.5">{s.label}</p>
                <span className="font-sans text-[28px] font-semibold tracking-[-0.01em] tabular-nums text-foreground">
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-4 text-sm text-muted-foreground leading-[1.7]">
            <p>
              Ein automatisierter Scraper läuft täglich und ruft alle gemeldeten Engpässe von drugshortage.ch ab.
              Dabei werden neue Produkte erfasst, bestehende Einträge aktualisiert und — falls ein Produkt von
              der Plattform verschwindet — die Engpass-Episode als geschlossen markiert (<em>resolved</em>).
              Diese Episode-Logik ermöglicht es, die Gesamtdauer und Häufigkeit von Engpässen pro Wirkstoff
              über Zeit zu analysieren.
            </p>
            <p>
              Preise und ATC-Codes werden in einem separaten Schritt aus ODDB abgeglichen.
              Die Pflichtlagerliste des BWL wird bei jeder Scrape-Runde verglichen, da sie sich nur selten ändert.
            </p>
            <p>
              Der wöchentliche Lieferengpassbericht der Spitalpharmazie Basel (USB) wird automatisch
              als PDF abgerufen und geparst. Die enthaltenen Wirkstoffe und Substitutionsempfehlungen
              werden in einer separaten Tabelle gehalten und sind nicht direkt mit den drugshortage.ch-Einträgen
              verknüpft — die Daten dienen als ergänzende, klinisch-pharmazeutische Perspektive.
            </p>
          </div>
        </section>

        {/* ── EPISODE-TRACKING ── */}
        <section className="border-t border-border/40 pt-14 mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-8">
            Episode-Tracking
          </p>
          <p className="text-sm text-muted-foreground leading-[1.7] mb-6">
            Jeder Engpass wird als <strong className="text-foreground font-semibold">Episode</strong> verfolgt — eine
            zeitlich abgegrenzte Periode, in der ein Produkt auf drugshortage.ch als Engpass gemeldet ist.
            Verschwindet ein Produkt aus der Meldeplattform, gilt die Episode als abgeschlossen.
            Taucht dasselbe Produkt später erneut auf, beginnt eine neue Episode.
          </p>
          <div className="rounded-lg border overflow-hidden text-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground">Feld</th>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground">Beschreibung</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  ['opened_at', 'Datum, an dem das Produkt erstmals in diesem Scrape-Zyklus als Engpass erschien'],
                  ['closed_at', 'Datum, an dem das Produkt nicht mehr in der Meldeplattform gelistet war'],
                  ['duration_days', 'Berechnete Dauer der Episode (closed_at − opened_at)'],
                  ['is_active', 'true, solange der Engpass aktuell aktiv ist'],
                ].map(([field, desc]) => (
                  <tr key={field} className="bg-card">
                    <td className="py-2.5 px-4 font-mono text-[12px] text-foreground whitespace-nowrap">{field}</td>
                    <td className="py-2.5 px-4 text-[13px] text-muted-foreground">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── ANALYTISCHE AUSWERTUNG ── */}
        <section className="border-t border-border/40 pt-14 mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-8">
            Analytische Auswertung
          </p>
          <div className="space-y-4 text-sm text-muted-foreground leading-[1.7]">
            <p>
              Für Analysen wie <em>«Häufigste Lieferengpässe nach Wirkstoff»</em> werden Produktnamen
              normalisiert: Der erste Teil des Handelsnamens (vor Stärke- und Darreichungsformangabe)
              dient als Proxy für den Wirkstoff. Wirkstoff-Gruppierungen ermöglichen es,
              mehrere Stärken und Generika eines Medikaments zusammenzufassen — z. B.
              «Pregabalin» mit 22 aktiven Stärken/Firmen gleichzeitig.
            </p>
            <p>
              Eine exakte Wirkstoff-Normalisierung via ATC-Code ist für zukünftige Versionen geplant.
              Die aktuelle Methodik deckt den Grossteil der Fälle ab, kann jedoch bei
              Kombinationspräparaten oder stark abweichenden Handelsnamen unvollständig sein.
            </p>
          </div>
        </section>

        {/* ── SEVERITY SCORE ── */}
        <section className="border-t border-border/40 pt-14 mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-5">
            Severity Score
          </p>
          <h2 className="text-[clamp(24px,3vw,36px)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground mb-4">
            Wie der Score berechnet wird
          </h2>
          <div className="space-y-4 text-sm text-muted-foreground leading-[1.7] mb-10">
            <p>
              Der engpassradar Score ist ein proprietärer Index (0–100), der den Schweregrad eines Lieferengpasses
              auf einen einzigen Wert verdichtet. Höhere Werte bedeuten schwerwiegendere Engpässe.
              Der Score kombiniert vier unabhängig gewichtete Faktoren und ermöglicht so eine
              schnelle Priorisierung — z. B. bei der täglichen Versorgungsprüfung in Spital- oder
              öffentlichen Apotheken.
            </p>
            <p>
              Der Score ersetzt <strong className="text-foreground font-semibold">keine</strong> klinische Beurteilung. Er ist ein
              Screening-Werkzeug, das auf öffentlich verfügbaren Daten aus drugshortage.ch und dem
              Bundesamt für wirtschaftliche Landesversorgung (BWL) basiert.
            </p>
          </div>

          {/* Score tiers */}
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-5">Stufen</p>
          <div className="divide-y border rounded-lg overflow-hidden mb-12">
            {[
              { range: '80–100', label: 'Kritisch', color: 'text-red-600 dark:text-red-400', desc: 'Höchste Priorität: keine Alternativen, lange Dauer, Unternehmen kommuniziert nicht, BWL-relevant.' },
              { range: '60–79', label: 'Hoch', color: 'text-orange-600 dark:text-orange-400', desc: 'Erhöhte Aufmerksamkeit erforderlich: mehrere belastende Faktoren kombiniert.' },
              { range: '40–59', label: 'Mittel', color: 'text-yellow-600 dark:text-yellow-400', desc: 'Moderater Engpass: einzelne Faktoren erhöhen den Schweregrad, Alternativen oft vorhanden.' },
              { range: '0–39', label: 'Niedrig', color: 'text-emerald-600 dark:text-emerald-400', desc: 'Geringes Risiko: kurze Dauer, gute Kommunikation, Alternativen verfügbar.' },
            ].map(t => (
              <div key={t.range} className="flex items-start gap-5 px-5 py-4 bg-card">
                <span className={`tabular-nums font-semibold text-[17px] w-16 shrink-0 ${t.color}`}>{t.range}</span>
                <div>
                  <p className={`font-semibold text-sm mb-0.5 ${t.color}`}>{t.label}</p>
                  <p className="text-muted-foreground text-[13px] leading-[1.6]">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Factors */}
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-6">Die vier Faktoren</p>
          <div className="space-y-4">

            {/* Factor 1 */}
            <div className="rounded-lg border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">1. Transparenz</h3>
                <span className="text-xs text-muted-foreground tabular-nums">0–35 Punkte</span>
              </div>
              <p className="text-[13px] text-muted-foreground leading-[1.65]">
                Bewertet wie offen das Unternehmen über den Engpass kommuniziert.
                Hohe Transparenz (Status 1) führt zu <em>weniger</em> Punkten —
                denn ein kooperatives Unternehmen mindert das Risiko für Apotheken und Patienten.
                Keine Information (Status 4) ist der schwerwiegendste Fall.
              </p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-1.5 text-left font-medium text-muted-foreground">Status-Code</th>
                    <th className="py-1.5 text-left font-medium text-muted-foreground">Bezeichnung</th>
                    <th className="py-1.5 text-right font-medium text-muted-foreground">Punkte</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    ['1', 'Direkt gemeldet — volle Transparenz', '5'],
                    ['2', 'Gemeldet — ohne Exklusivzugang', '12'],
                    ['3', 'Sporadische Meldungen', '22'],
                    ['4', 'Keine Information vom Unternehmen', '35'],
                    ['5', 'Verhandlungen laufend', '20'],
                  ].map(([code, desc, pts]) => (
                    <tr key={code}>
                      <td className="py-1.5 font-mono">{code}</td>
                      <td className="py-1.5 text-muted-foreground">{desc}</td>
                      <td className="py-1.5 text-right tabular-nums font-semibold">{pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Factor 2 */}
            <div className="rounded-lg border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">2. Dauer</h3>
                <span className="text-xs text-muted-foreground tabular-nums">0–30 Punkte</span>
              </div>
              <p className="text-[13px] text-muted-foreground leading-[1.65]">
                Längere Engpässe sind schwerer überbrückbar. Die Dauer basiert auf
                <em> Tage seit Meldung</em> aus drugshortage.ch (Feld «Gemeldet am»).
              </p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-1.5 text-left font-medium text-muted-foreground">Dauer</th>
                    <th className="py-1.5 text-right font-medium text-muted-foreground">Punkte</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    ['≤ 14 Tage', '5'],
                    ['15–30 Tage', '10'],
                    ['31–90 Tage (3 Monate)', '17'],
                    ['91–180 Tage (6 Monate)', '22'],
                    ['181–365 Tage (1 Jahr)', '27'],
                    ['> 1 Jahr', '30'],
                  ].map(([range, pts]) => (
                    <tr key={range}>
                      <td className="py-1.5 text-muted-foreground">{range}</td>
                      <td className="py-1.5 text-right tabular-nums font-semibold">{pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Factor 3 */}
            <div className="rounded-lg border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">3. Keine Alternativen</h3>
                <span className="text-xs text-muted-foreground tabular-nums">0 oder 20 Punkte</span>
              </div>
              <p className="text-[13px] text-muted-foreground leading-[1.65]">
                Existieren auf drugshortage.ch gelistete Alternativen (wirkstoffgleiche Produkte)?
                Wenn ja, ist der Engpass überbrückbar und der Faktor zählt 0 Punkte.
                Fehlen Alternativen, erhöht sich der Score um 20 Punkte.
              </p>
            </div>

            {/* Factor 4 */}
            <div className="rounded-lg border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">4. Pflichtlager / BWL</h3>
                <span className="text-xs text-muted-foreground tabular-nums">0 oder 15 Punkte</span>
              </div>
              <p className="text-[13px] text-muted-foreground leading-[1.65]">
                Ist das Produkt auf der Pflichtlagerliste des Bundesamts für wirtschaftliche
                Landesversorgung (BWL)? Pflichtlagerpflichtige Produkte sind für die
                Schweizer Versorgungssicherheit kritisch. Trifft dies zu: +15 Punkte.
                Datenquelle: täglicher Abgleich mit{' '}
                <a
                  href="https://www.bwl.admin.ch/de/meldestelle-heilmittel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  bwl.admin.ch
                </a>.
              </p>
            </div>
          </div>
        </section>

        {/* ── FORMEL ── */}
        <section className="border-t border-border/40 pt-14 mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-6">
            Formel
          </p>
          <pre className="rounded-lg bg-muted px-5 py-4 text-sm font-mono leading-[1.8] overflow-x-auto">
{`Score = Transparenz (0–35)
      + Dauer        (0–30)
      + Alternativen (0–20)
      + BWL          (0–15)
      ─────────────────────
      = 0–100`}
          </pre>
        </section>

        {/* ── EINSCHRÄNKUNGEN ── */}
        <section className="border-t border-border/40 pt-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-6">
            Einschränkungen & Hinweise
          </p>
          <ul className="space-y-3">
            {[
              <>Der Score bewertet <strong className="text-foreground font-semibold">keinen therapeutischen Bedarf</strong> — ein Antihistaminikum mit Score 80 ist nicht zwingend dringlicher als ein Herzmedikament mit Score 40.</>,
              <>Alternativ-Erkennung basiert auf dem von drugshortage.ch gemeldeten Link, nicht auf einer vollständigen Wirkstoff-Datenbank.</>,
              <>Transparenz-Bewertung kann sich täglich ändern, wenn Unternehmen ihren Kommunikationsstatus aktualisieren.</>,
              <>Der Score wird bei jeder Seitenanfrage live berechnet — keine separate Datenbankspeicherung.</>,
            ].map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-[1.7]">
                <span className="font-mono text-[11px] text-primary shrink-0 mt-[3px]">{String(i + 1).padStart(2, '0')}</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

      </div>
    </main>
  )
}
