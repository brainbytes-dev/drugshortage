import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Impressum — engpass.radar',
  robots: { index: false, follow: false },
}

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Übersicht
        </Link>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Impressum</h1>
          <p className="text-sm text-muted-foreground">Angaben gemäss Art. 13 DSG (Schweiz)</p>
        </div>

        <section className="space-y-1 text-sm">
          <h2 className="font-semibold text-base">Betreiber dieser Website</h2>
          <p className="text-muted-foreground">
            Henrik Rühe<br />
            Buchenweg 18<br />
            5036 Oberentfelden, Schweiz
          </p>
          <p className="text-muted-foreground mt-2">
            E-Mail:{' '}
            <a href="mailto:info@engpassradar.ch" className="underline hover:text-foreground">
              info@engpassradar.ch
            </a>
          </p>
        </section>

        <section className="space-y-2 text-sm">
          <h2 className="font-semibold text-base">Datenquellen</h2>
          <p className="text-muted-foreground">
            Die auf dieser Website angezeigten Daten stammen aus folgenden öffentlichen Quellen,
            die automatisch abgerufen und aufbereitet werden:
          </p>
          <ul className="text-muted-foreground list-disc list-inside space-y-1">
            <li>
              <a
                href="https://www.drugshortage.ch"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                drugshortage.ch
              </a>{' '}
              — Aktive und historische Medikamenten-Lieferengpässe (täglich)
            </li>
            <li>
              <a
                href="https://www.bwl.admin.ch/de/meldestelle-heilmittel"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Bundesamt für wirtschaftliche Landesversorgung (BWL)
              </a>{' '}
              — Versorgungsstörungen bei Heilmitteln (täglich)
            </li>
            <li>
              <a
                href="https://download.hin.ch/download/oddb2xml/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                HIN / oddb2xml
              </a>{' '}
              — Schweizer Arzneimittelstammdaten (Wirkstoff, Zusammensetzung, Swissmedic-Nr), wöchentlich
            </li>
          </ul>
          <p className="text-muted-foreground">
            Wir erheben keinen Anspruch auf die Vollständigkeit oder Richtigkeit der angezeigten
            Informationen. Massgebliche und verbindliche Informationen finden sich ausschliesslich
            auf den offiziellen Seiten von Swissmedic und drugshortage.ch.
          </p>
        </section>

        <section className="space-y-2 text-sm">
          <h2 className="font-semibold text-base">Haftungsausschluss</h2>
          <p className="text-muted-foreground">
            Der Autor behält sich das Recht vor, keine Verantwortung für die Richtigkeit,
            Genauigkeit, Aktualität, Zuverlässigkeit und Vollständigkeit der Informationen zu
            übernehmen.
          </p>
          <p className="text-muted-foreground">
            Haftungsansprüche gegen den Autor wegen Schäden materieller oder immaterieller Art,
            welche aus dem Zugriff oder der Nutzung bzw. Nichtnutzung der veröffentlichten
            Informationen, durch Missbrauch der Verbindung oder durch technische Störungen
            entstanden sind, werden ausgeschlossen.
          </p>
          <p className="text-muted-foreground">
            Alle Angebote sind freibleibend und unverbindlich. Der Autor behält es sich
            ausdrücklich vor, Teile der Seiten oder das gesamte Angebot ohne gesonderte
            Ankündigung zu verändern, zu ergänzen, zu löschen oder die Veröffentlichung
            zeitweise oder endgültig einzustellen.
          </p>
        </section>

        <section className="space-y-2 text-sm">
          <h2 className="font-semibold text-base">Haftung für Links</h2>
          <p className="text-muted-foreground">
            Verweise und Links auf Webseiten Dritter liegen ausserhalb unseres
            Verantwortungsbereiches. Jegliche Verantwortung für solche Websites wird abgelehnt.
            Der Zugang und die Benutzung solcher Websites erfolgt auf eigenes Risiko des
            Benutzers.
          </p>
        </section>

        <section className="space-y-2 text-sm">
          <h2 className="font-semibold text-base">Urheberrechte</h2>
          <p className="text-muted-foreground">
            Das Urheberrecht und alle anderen Rechte an Inhalten, Bildern, Fotos oder anderen
            Dateien auf der Website gehören ausschliesslich Henrik Rühe oder den speziell
            genannten Rechteinhabern. Für die Reproduktion jeglicher Elemente muss im Voraus
            die schriftliche Zustimmung der Urheberrechtsinhaber eingeholt werden.
          </p>
        </section>

        <section className="space-y-2 text-sm">
          <h2 className="font-semibold text-base">Datenschutz</h2>
          <p className="text-muted-foreground">
            Gestützt auf Artikel 13 der Schweizerischen Bundesverfassung und die
            Datenschutzbestimmungen des Bundes (Datenschutzgesetz, DSG) hat jede Person
            Anspruch auf den Schutz ihrer Privatsphäre und auf Schutz vor Missbrauch ihrer
            persönlichen Daten. Wir halten uns an diese Bestimmungen. Persönliche Daten werden
            streng vertraulich behandelt und nicht verkauft oder an Dritte weitergegeben.
          </p>
          <p className="text-muted-foreground">
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
