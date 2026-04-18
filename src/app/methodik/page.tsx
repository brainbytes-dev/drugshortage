import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Methodik & Datenquellen | engpassradar.ch',
  description:
    'Wie engpassradar.ch Schweizer Medikamenten-Lieferengpässe erfasst: Datenquellen (drugshortage.ch, BWL, ODDB), Aktualisierungsrhythmus und Severity Score.',
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

export default function MetodikPage() {
  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\u003c') }}
      />
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">

        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Zur Übersicht
        </Link>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Methodik & Datenquellen</h1>
          <p className="text-muted-foreground text-sm">
            Wie engpassradar.ch Schweizer Medikamenten-Lieferengpässe erfasst, aufbereitet und bewertet
          </p>
        </div>

        {/* Data sources */}
        <section className="space-y-4">
          <h2 className="font-semibold text-base">Datenquellen</h2>
          <div className="divide-y rounded-lg border overflow-hidden text-sm">
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
            ].map(s => (
              <div key={s.name} className="px-4 py-4 bg-card space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
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
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Data collection */}
        <section className="space-y-3">
          <h2 className="font-semibold text-base">Erhebung & Aktualisierung</h2>
          <div className="rounded-lg border bg-card p-5 space-y-4 text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { value: 'täglich', label: 'Aktualisierungsrhythmus' },
                { value: '9\'255+', label: 'erfasste Präparate' },
                { value: '9\'373+', label: 'Engpass-Episoden gesamt' },
                { value: '705+', label: 'aktuell aktive Engpässe' },
              ].map(s => (
                <div key={s.label} className="space-y-0.5">
                  <p className="text-xl font-black tabular-nums text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
            <hr className="border-border/40" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ein automatisierter Scraper läuft täglich und ruft alle gemeldeten Engpässe von drugshortage.ch ab.
              Dabei werden neue Produkte erfasst, bestehende Einträge aktualisiert und — falls ein Produkt von
              der Plattform verschwindet — die Engpass-Episode als geschlossen markiert (<em>resolved</em>).
              Diese Episode-Logik ermöglicht es, die Gesamtdauer und Häufigkeit von Engpässen pro Wirkstoff
              über Zeit zu analysieren.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Preise und ATC-Codes werden in einem separaten Schritt aus ODDB abgeglichen.
              Die Pflichtlagerliste des BWL wird bei jeder Scrape-Runde verglichen, da sie sich nur selten ändert.
            </p>
          </div>
        </section>

        {/* Episode tracking */}
        <section className="space-y-3">
          <h2 className="font-semibold text-base">Episode-Tracking</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Jeder Engpass wird als <strong className="text-foreground">Episode</strong> verfolgt — eine
            zeitlich abgegrenzte Periode, in der ein Produkt auf drugshortage.ch als Engpass gemeldet ist.
            Verschwindet ein Produkt aus der Meldeplattform, gilt die Episode als abgeschlossen.
            Taucht dasselbe Produkt später erneut auf, beginnt eine neue Episode.
          </p>
          <div className="rounded-lg border bg-card overflow-hidden text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-2 px-4 text-left font-medium text-muted-foreground">Feld</th>
                  <th className="py-2 px-4 text-left font-medium text-muted-foreground">Beschreibung</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  ['opened_at', 'Datum, an dem das Produkt erstmals in diesem Scrape-Zyklus als Engpass erschien'],
                  ['closed_at', 'Datum, an dem das Produkt nicht mehr in der Meldeplattform gelistet war'],
                  ['duration_days', 'Berechnete Dauer der Episode (closed_at − opened_at)'],
                  ['is_active', 'true, solange der Engpass aktuell aktiv ist'],
                ].map(([field, desc]) => (
                  <tr key={field}>
                    <td className="py-2 px-4 font-mono text-foreground">{field}</td>
                    <td className="py-2 px-4 text-muted-foreground">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Analytical methodology */}
        <section className="space-y-3">
          <h2 className="font-semibold text-base">Analytische Auswertung</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Für Analysen wie <em>«Häufigste Lieferengpässe nach Wirkstoff»</em> werden Produktnamen
            normalisiert: Der erste Teil des Handelsnamens (vor Stärke- und Darreichungsformangabe)
            dient als Proxy für den Wirkstoff. Wirkstoff-Gruppierungen ermöglichen es,
            mehrere Stärken und Generika eines Medikaments zusammenzufassen — z. B.
            «Pregabalin» mit 22 aktiven Stärken/Firmen gleichzeitig.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Eine exakte Wirkstoff-Normalisierung via ATC-Code ist für zukünftige Versionen geplant.
            Die aktuelle Methodik deckt den Grossteil der Fälle ab, kann jedoch bei
            Kombinationspräparaten oder stark abweichenden Handelsnamen unvollständig sein.
          </p>
        </section>

        <hr className="border-border/40" />

        {/* Score section header */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold tracking-tight">Severity Score</h2>
          <p className="text-muted-foreground text-sm">
            Wie der <span className="font-medium text-foreground">engpass.radar Severity Score</span> berechnet wird
          </p>
        </div>

        {/* What is the score */}
        <section className="space-y-3">
          <h2 className="font-semibold text-base">Was ist der Score?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Der engpass.radar Score ist ein proprietärer Index (0–100), der den Schweregrad eines Lieferengpasses
            auf einen einzigen Wert verdichtet. Höhere Werte bedeuten schwerwiegendere Engpässe.
            Der Score kombiniert vier unabhängig gewichtete Faktoren und ermöglicht so eine
            schnelle Priorisierung — z. B. bei der täglichen Versorgungsprüfung in Spital- oder
            öffentlichen Apotheken.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Der Score ersetzt <strong className="text-foreground">keine</strong> klinische Beurteilung. Er ist ein
            Screening-Werkzeug, das auf öffentlich verfügbaren Daten aus drugshortage.ch und dem
            Bundesamt für wirtschaftliche Landesversorgung (BWL) basiert.
          </p>
        </section>

        {/* Score tiers */}
        <section className="space-y-3">
          <h2 className="font-semibold text-base">Stufen</h2>
          <div className="divide-y rounded-lg border overflow-hidden text-sm">
            {[
              { range: '80–100', label: 'Kritisch', color: 'text-red-600 dark:text-red-400', desc: 'Höchste Priorität: keine Alternativen, lange Dauer, Unternehmen kommuniziert nicht, BWL-relevant.' },
              { range: '60–79', label: 'Hoch', color: 'text-orange-600 dark:text-orange-400', desc: 'Erhöhte Aufmerksamkeit erforderlich: mehrere belastende Faktoren kombiniert.' },
              { range: '40–59', label: 'Mittel', color: 'text-yellow-600 dark:text-yellow-400', desc: 'Moderater Engpass: einzelne Faktoren erhöhen den Schweregrad, Alternativen oft vorhanden.' },
              { range: '0–39', label: 'Niedrig', color: 'text-emerald-600 dark:text-emerald-400', desc: 'Geringes Risiko: kurze Dauer, gute Kommunikation, Alternativen verfügbar.' },
            ].map(t => (
              <div key={t.range} className="flex items-start gap-4 px-4 py-3 bg-card">
                <span className={`tabular-nums font-black text-lg w-16 shrink-0 ${t.color}`}>{t.range}</span>
                <div>
                  <p className={`font-semibold ${t.color}`}>{t.label}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed mt-0.5">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Factors */}
        <section className="space-y-4">
          <h2 className="font-semibold text-base">Die vier Faktoren</h2>

          {/* Factor 1 */}
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">1. Transparenz</h3>
              <span className="text-xs text-muted-foreground tabular-nums">0–35 Punkte</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
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
            <p className="text-xs text-muted-foreground leading-relaxed">
              Längere Engpässe sind schwerer überbrückbar. Die Dauer basiert auf
              <em> Tage seit Meldung</em> aus drugshortage.ch (Feld &quot;Gemeldet am&quot;).
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
            <p className="text-xs text-muted-foreground leading-relaxed">
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
            <p className="text-xs text-muted-foreground leading-relaxed">
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
        </section>

        {/* Formula */}
        <section className="space-y-3">
          <h2 className="font-semibold text-base">Formel</h2>
          <pre className="rounded-lg bg-muted px-5 py-4 text-xs font-mono leading-relaxed overflow-x-auto">
{`Score = Transparenz (0–35)
      + Dauer        (0–30)
      + Alternativen (0–20)
      + BWL          (0–15)
      ─────────────────────
      = 0–100`}
          </pre>
        </section>

        {/* Limitations */}
        <section className="space-y-3">
          <h2 className="font-semibold text-base">Einschränkungen & Hinweise</h2>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside leading-relaxed">
            <li>Der Score bewertet <strong className="text-foreground">keinen therapeutischen Bedarf</strong> — ein Antihistaminikum mit Score 80 ist nicht zwingend dringlicher als ein Herzmedikament mit Score 40.</li>
            <li>Alternativ-Erkennung basiert auf dem von drugshortage.ch gemeldeten Link, nicht auf einer vollständigen Wirkstoff-Datenbank.</li>
            <li>Transparenz-Bewertung kann sich täglich ändern, wenn Unternehmen ihren Kommunikationsstatus aktualisieren.</li>
            <li>Der Score wird bei jeder Seitenanfrage live berechnet — keine separate Datenbankspeicherung.</li>
          </ul>
        </section>

      </div>
    </main>
  )
}
