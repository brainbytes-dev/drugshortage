import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nutzungsbedingungen — engpass.radar',
  robots: { index: false, follow: false },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Nutzungsbedingungen — engpass.radar',
  url: 'https://www.engpassradar.ch/nutzungsbedingungen',
  isPartOf: { '@id': 'https://www.engpassradar.ch' },
}

export default function NutzungsbedingungenPage() {
  return (
    <main className="bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\u003c') }}
      />
      <div className="max-w-2xl mx-auto px-6 py-16 space-y-10">

        <div className="space-y-1 border-b pb-8">
          <h1 className="text-3xl font-bold tracking-tight">Nutzungsbedingungen</h1>
          <p className="text-muted-foreground">Stand: April 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">1. Geltungsbereich</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Diese Nutzungsbedingungen gelten für die Nutzung der Website engpassradar.ch sowie aller
            damit verbundenen Dienste (nachfolgend «Dienst»), betrieben von Henrik Rühe,
            Buchenweg 18, 5036 Oberentfelden, Schweiz.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">2. Leistung und Zweck</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            engpass.radar ist ein kostenloses Informationsangebot, das öffentlich verfügbare Daten
            zu Medikamenten-Lieferengpässen in der Schweiz aggregiert und aufbereitet. Die Daten
            stammen aus offiziellen Quellen (drugshortage.ch, Bundesamt für wirtschaftliche
            Landesversorgung BWL, HIN/ODDB) und werden täglich automatisch aktualisiert.
          </p>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Der Dienst richtet sich an Fachpersonen im Gesundheitswesen (Apotheker, Ärzte,
            Spitalpharmazie, Forschung) sowie an interessierte Öffentlichkeit.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">3. Keine medizinische Beratung</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Die auf engpassradar.ch angezeigten Informationen dienen ausschliesslich zu
            Informationszwecken und stellen <strong>keine</strong> medizinische, pharmazeutische
            oder rechtliche Beratung dar. Für konkrete Therapieentscheide sind stets die
            zuständigen Fachpersonen und die jeweils gültigen offiziellen Quellen (Swissmedic,
            BAG, Kompendium.ch) massgebend.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">4. Haftungsausschluss</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Der Betreiber übernimmt keine Gewähr für die Richtigkeit, Vollständigkeit oder
            Aktualität der angezeigten Daten. Die Primärquellen (drugshortage.ch, BWL, HIN/ODDB)
            sind massgebend. Der Betreiber haftet nicht für Schäden, die aus der Nutzung oder
            Nichtnutzung der bereitgestellten Informationen entstehen.
          </p>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Der Dienst wird ohne Verfügbarkeitsgarantie («as is») bereitgestellt. Wartungsarbeiten,
            Datenausfälle und Änderungen am Funktionsumfang bleiben vorbehalten.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">5. Erlaubte Nutzung</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Die Nutzung des Dienstes ist gestattet für:
          </p>
          <ul className="text-[15px] text-muted-foreground list-disc list-outside ml-5 space-y-2 leading-relaxed">
            <li>Persönliche und berufliche Informationszwecke im Gesundheitswesen</li>
            <li>Nicht-kommerzielle Forschung und Lehre</li>
            <li>Journalistische Berichterstattung mit Quellenangabe (engpassradar.ch)</li>
            <li>Interne Nutzung in Spitälern, Apotheken und Gesundheitsinstitutionen</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">6. Unzulässige Nutzung</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Unzulässig ist insbesondere:
          </p>
          <ul className="text-[15px] text-muted-foreground list-disc list-outside ml-5 space-y-2 leading-relaxed">
            <li>
              Das Betreiben eines kommerziellen Dienstes auf Basis des Quellcodes oder der
              aufbereiteten Daten ohne schriftliche Genehmigung des Betreibers
            </li>
            <li>
              Automatisiertes Massenabfragen («Scraping») der Website, das den Betrieb beeinträchtigt
            </li>
            <li>
              Die Weitergabe der Daten als eigenes Produkt ohne Quellenangabe
            </li>
            <li>
              Jede Nutzung, die gegen geltendes Schweizer Recht verstösst
            </li>
          </ul>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Der Quellcode unterliegt der{' '}
            <a
              href="https://www.elastic.co/licensing/elastic-license"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Elastic License 2.0
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">7. Datenquellen und Urheberrecht</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Die Rohdaten stammen aus öffentlichen Quellen und verbleiben im Eigentum der
            jeweiligen Datenanbieter. Die Aufbereitung, Strukturierung und Darstellung durch
            engpass.radar ist urheberrechtlich geschützt.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">8. Änderungen</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Der Betreiber behält sich vor, diese Nutzungsbedingungen jederzeit anzupassen.
            Die jeweils aktuelle Version ist auf dieser Seite abrufbar. Das Datum der letzten
            Änderung ist oben angegeben.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">9. Anwendbares Recht</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Es gilt ausschliesslich Schweizer Recht. Gerichtsstand ist Aarau, Schweiz.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">10. Kontakt</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Bei Fragen zu diesen Nutzungsbedingungen:{' '}
            <a href="mailto:info@engpassradar.ch" className="underline hover:text-foreground">
              info@engpassradar.ch
            </a>
          </p>
        </section>


      </div>
    </main>
  )
}
