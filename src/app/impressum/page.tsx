import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Impressum — engpass.radar',
  robots: { index: false, follow: false },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ContactPage',
      name: 'Impressum — engpass.radar',
      url: 'https://www.engpassradar.ch/impressum',
    },
    {
      '@type': 'Organization',
      name: 'engpass.radar',
      url: 'https://www.engpassradar.ch',
      founder: { '@type': 'Person', name: 'Henrik Rühe' },
      legalName: 'HM Consulting Rühe',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Buchenweg 18',
        postalCode: '5036',
        addressLocality: 'Oberentfelden',
        addressCountry: 'CH',
      },
      email: 'info@engpassradar.ch',
    },
  ],
}

export default function ImpressumPage() {
  return (
    <main className="bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\u003c') }}
      />
      <div className="max-w-2xl mx-auto px-6 py-16 space-y-10">
        <div className="space-y-1 border-b pb-8">
          <h1 className="text-3xl font-bold tracking-tight">Impressum</h1>
          <p className="text-muted-foreground">Angaben gemäss Art. 13 DSG (Schweiz)</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Betreiber dieser Website</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            HM Consulting Rühe<br />
            Buchenweg 18<br />
            5036 Oberentfelden, Schweiz
          </p>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Verantwortlich: Henrik Rühe
          </p>
          <p className="text-muted-foreground">
            E-Mail:{' '}
            <a href="mailto:info@engpassradar.ch" className="underline hover:text-foreground">
              info@engpassradar.ch
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Datenquellen</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Die auf dieser Website angezeigten Daten stammen aus folgenden öffentlichen Quellen,
            die automatisch abgerufen und aufbereitet werden:
          </p>
          <ul className="text-[15px] text-muted-foreground list-disc list-outside ml-5 space-y-2 leading-relaxed">
            <li>
              <a href="https://www.drugshortage.ch" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                drugshortage.ch
              </a>{' '}
              (Martinelli Consulting GmbH) — Aktive und historische Medikamenten-Lieferengpässe (täglich)
            </li>
            <li>
              <a href="https://www.bwl.admin.ch/de/meldestelle-heilmittel" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                Bundesamt für wirtschaftliche Landesversorgung (BWL)
              </a>{' '}
              — Versorgungsstörungen bei Heilmitteln (täglich)
            </li>
            <li>
              <a href="https://ch.oddb.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                ODDB / ch.oddb.org
              </a>{' '}
              — Schweizer Arzneimittelstammdaten (Wirkstoff, Zusammensetzung, Swissmedic-Nr), wöchentlich
            </li>
          </ul>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Wir erheben keinen Anspruch auf die Vollständigkeit oder Richtigkeit der angezeigten
            Informationen. Massgebliche und verbindliche Informationen finden sich ausschliesslich
            auf den offiziellen Seiten von Swissmedic und drugshortage.ch.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Haftungsausschluss</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Der Autor behält sich das Recht vor, keine Verantwortung für die Richtigkeit,
            Genauigkeit, Aktualität, Zuverlässigkeit und Vollständigkeit der Informationen zu
            übernehmen.
          </p>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Haftungsansprüche gegen den Autor wegen Schäden materieller oder immaterieller Art,
            welche aus dem Zugriff oder der Nutzung bzw. Nichtnutzung der veröffentlichten
            Informationen, durch Missbrauch der Verbindung oder durch technische Störungen
            entstanden sind, werden ausgeschlossen.
          </p>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Alle Angebote sind freibleibend und unverbindlich. Der Autor behält es sich
            ausdrücklich vor, Teile der Seiten oder das gesamte Angebot ohne gesonderte
            Ankündigung zu verändern, zu ergänzen, zu löschen oder die Veröffentlichung
            zeitweise oder endgültig einzustellen.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Haftung für Links</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Verweise und Links auf Webseiten Dritter liegen ausserhalb unseres
            Verantwortungsbereiches. Jegliche Verantwortung für solche Websites wird abgelehnt.
            Der Zugang und die Benutzung solcher Websites erfolgt auf eigenes Risiko des Benutzers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Urheberrechte</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Das Urheberrecht und alle anderen Rechte an Inhalten, Bildern, Fotos oder anderen
            Dateien auf der Website gehören ausschliesslich HM Consulting Rühe oder den speziell
            genannten Rechteinhabern. Für die Reproduktion jeglicher Elemente muss im Voraus
            die schriftliche Zustimmung der Urheberrechtsinhaber eingeholt werden.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Datenschutz</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Gestützt auf Artikel 13 der Schweizerischen Bundesverfassung und die
            Datenschutzbestimmungen des Bundes (Datenschutzgesetz, DSG) hat jede Person
            Anspruch auf den Schutz ihrer Privatsphäre und auf Schutz vor Missbrauch ihrer
            persönlichen Daten. Wir halten uns an diese Bestimmungen. Persönliche Daten werden
            streng vertraulich behandelt und nicht verkauft oder an Dritte weitergegeben.
          </p>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            In enger Zusammenarbeit mit unseren Hosting-Providern sind wir bestrebt, die
            Datenbanken so weit wie möglich vor unberechtigtem Zugriff, Verlust, Missbrauch
            oder Fälschung zu schützen. Weitere Informationen zum Datenschutz entnehmen Sie
            bitte unserer{' '}
            <Link href="/datenschutz" className="underline hover:text-foreground">
              Datenschutzerklärung
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  )
}
