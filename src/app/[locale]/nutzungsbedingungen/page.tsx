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
          <p className="text-muted-foreground">Stand: April 2026 (inkl. API-Tarife und Zahlungsbedingungen)</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">1. Geltungsbereich</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Diese Nutzungsbedingungen gelten für die Nutzung der Website engpassradar.ch sowie aller
            damit verbundenen Dienste (nachfolgend «Dienst»), betrieben von HM Consulting Rühe,
            Buchenweg 18, 5036 Oberentfelden, Schweiz.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">2. Leistung und Zweck</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            engpass.radar ist ein Informationsdienst, der öffentlich verfügbare Daten
            zu Medikamenten-Lieferengpässen in der Schweiz aggregiert und aufbereitet. Die Daten
            stammen aus offiziellen Quellen (drugshortage.ch, Bundesamt für wirtschaftliche
            Landesversorgung BWL, ODDB) und werden täglich automatisch aktualisiert.
          </p>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Der Dienst umfasst eine kostenlose Weboberfläche sowie eine REST API mit kostenpflichtigen
            Zugangs-Tarifen für den professionellen und institutionellen Einsatz (vgl. Ziffer 10).
            Er richtet sich an Fachpersonen im Gesundheitswesen (Apotheker, Ärzte, Spitalpharmazie,
            Forschung) sowie an Softwarehersteller im pharmazeutischen Umfeld.
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
            Aktualität der angezeigten Daten. Die Primärquellen (drugshortage.ch, BWL, ODDB)
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
            <li>
              Kommerzielle Softwareintegration auf Basis eines gültigen kostenpflichtigen
              API-Tarifs (Professional, Institutional oder Data License, vgl. Ziffer 10)
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">6. Unzulässige Nutzung</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Unzulässig ist insbesondere:
          </p>
          <ul className="text-[15px] text-muted-foreground list-disc list-outside ml-5 space-y-2 leading-relaxed">
            <li>
              Das Betreiben eines kommerziellen Dienstes auf Basis der aufbereiteten Daten
              ohne gültigen kostenpflichtigen Tarif oder schriftliche Genehmigung des Betreibers
            </li>
            <li>
              Die Weitergabe oder Weiterverbreitung von API-Daten als eigenes Produkt ohne
              Data-License-Vereinbarung (vgl. Ziffer 10.5)
            </li>
            <li>
              Automatisiertes Massenabfragen der Website ausserhalb der API, das den Betrieb beeinträchtigt
            </li>
            <li>
              Die Umgehung von Rate-Limits (z. B. durch wechselnde IP-Adressen, Key-Sharing oder
              Proxying)
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

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">10. API-Nutzung und Tarife</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            engpass.radar stellt eine REST API bereit. Die vollständige Dokumentation ist unter{' '}
            <a href="/api-docs" className="underline hover:text-foreground">engpassradar.ch/api-docs</a>{' '}
            und die Tarifübersicht unter{' '}
            <a href="/api" className="underline hover:text-foreground">engpassradar.ch/api</a>{' '}
            abrufbar.
          </p>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-foreground">10.1 Free-Tarif</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              Der Free-Tarif ist ohne Registrierung nutzbar und auf 100 Requests pro Tag pro
              IP-Adresse begrenzt. Er eignet sich für Tests und nicht-produktive Zwecke.
              Eine Attribution («Quelle: engpassradar.ch») ist bei Weiterverwendung der Daten
              erforderlich.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-foreground">10.2 Research-Tarif</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              Der kostenlose Research-Tarif (2 000 Req/Tag) steht Universitäten, Fachhochschulen
              und Schweizer Spitälern zur Verfügung. Der Antrag erfolgt über{' '}
              <a href="/api-keys?tab=research" className="underline hover:text-foreground">engpassradar.ch/api-keys</a>.
              Voraussetzung ist eine gültige institutionelle E-Mail-Adresse oder ein glaubwürdiger
              Forschungsnachweis. Bei Falschangaben kann der Key ohne Vorwarnung gesperrt werden.
              Der Research-Tarif darf nicht für kommerzielle Produkte eingesetzt werden.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-foreground">10.3 Professional-Tarif (CHF 39/Monat)</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              Für individuelle Entwickler, Apotheken und kleine Softwareprojekte. Limit: 10 000
              Requests pro Tag. Die kommerzielle Nutzung ist erlaubt, sofern die Daten nicht
              unverändert weitervertrieben werden. Keine SLA-Garantie.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-foreground">10.4 Institutional-Tarif (CHF 199/Monat)</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              Für Kliniken, Apothekenketten und Softwarehersteller. Limit: 100 000 Requests pro
              Tag. Dieser Tarif beinhaltet eine Verfügbarkeits-SLA von 99,9 % (gemessen monatlich,
              geplante Wartungsfenster ausgenommen). Abweichungen berechtigen auf Anfrage zu einer
              anteiligen Gutschrift, jedoch nicht zu Schadenersatzansprüchen.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-foreground">10.5 Data-License (ab CHF 499/Monat)</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              Unbegrenzter Zugang und das Recht zur Weiterverbreitung der Daten in eigenen
              Produkten oder als Datenfeed erfordert eine separate, schriftliche Data-License-
              Vereinbarung. Ohne diese ist die Redistribution ausdrücklich untersagt.
              Anfragen an{' '}
              <a href="mailto:api@engpassradar.ch" className="underline hover:text-foreground">api@engpassradar.ch</a>.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-foreground">10.6 API-Keys und Zugangsdaten</h3>
            <ul className="text-[15px] text-muted-foreground list-disc list-outside ml-5 space-y-2 leading-relaxed">
              <li>
                API-Keys dürfen nicht geteilt oder öffentlich zugänglich gemacht werden.
                Bei Verdacht auf Missbrauch ist der Betreiber unverzüglich zu informieren.
              </li>
              <li>
                Der Betreiber behält sich vor, Keys bei Verstoss gegen diese Bedingungen
                ohne Vorwarnung zu sperren. In diesem Fall entfällt der Anspruch auf Rückerstattung
                laufender Abonnementgebühren.
              </li>
              <li>
                Die Authentifizierung erfolgt per Magic-Link (JWT, 30 Tage gültig). Eine
                Passwortspeicherung findet nicht statt. Der Nutzer ist für die Sicherheit
                seiner E-Mail-Adresse verantwortlich.
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-foreground">10.7 Änderungen an der API</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              Änderungen an Endpunkten, Datenformaten oder Rate-Limits werden mit mindestens
              14 Tagen Vorankündigung per E-Mail kommuniziert. Breaking Changes werden mit
              mindestens 30 Tagen Vorlaufzeit angekündigt.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">11. Zahlungsbedingungen</h2>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-foreground">11.1 Abrechnung</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              Kostenpflichtige Tarife werden monatlich oder jährlich im Voraus abgerechnet.
              Die Zahlungsabwicklung erfolgt über Stripe Payments Europe Ltd. («Stripe»).
              Mit dem Abschluss eines Abonnements akzeptiert der Nutzer zusätzlich die{' '}
              <a href="https://stripe.com/ch/legal/ssa" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                Nutzungsbedingungen von Stripe
              </a>
              .
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-foreground">11.2 Kündigung</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              Monatliche Abonnements können jederzeit zum Ende des laufenden Abrechnungsmonats
              gekündigt werden. Jährliche Abonnements können zum Ende des Vertragsjahres
              gekündigt werden. Die Kündigung erfolgt über das Kundenportal (erreichbar über
              den Magic-Link im Dashboard). Nach Kündigung bleibt der Zugang bis zum Ende des
              bereits bezahlten Zeitraums bestehen.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-foreground">11.3 Rückerstattungen</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              Bereits bezahlte Abrechnungsperioden werden grundsätzlich nicht zurückerstattet,
              es sei denn, der Dienst war während mehr als 72 Stunden zusammenhängend nicht
              erreichbar (Institutional-Tarif: 99,9 % SLA). In begründeten Einzelfällen
              entscheidet der Betreiber nach billigem Ermessen.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[15px] font-semibold text-foreground">11.4 Preisänderungen</h3>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              Preisänderungen werden bestehenden Abonnenten mit mindestens 30 Tagen Vorankündigung
              per E-Mail mitgeteilt. Bei Nichteinverständnis kann das Abonnement vor Inkrafttreten
              der neuen Preise gekündigt werden.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">12. Kontakt</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Bei Fragen zu diesen Nutzungsbedingungen:{' '}
            <a href="mailto:info@engpassradar.ch" className="underline hover:text-foreground">
              info@engpassradar.ch
            </a>
            <br />
            API-spezifische Anfragen:{' '}
            <a href="mailto:api@engpassradar.ch" className="underline hover:text-foreground">
              api@engpassradar.ch
            </a>
          </p>
        </section>


      </div>
    </main>
  )
}
