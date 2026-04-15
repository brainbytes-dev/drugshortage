import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Impressum — Swiss Drug Shortage Tracker',
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
            [Vorname Nachname / Firmenname]<br />
            [Strasse Nr.]<br />
            [PLZ Ort], Schweiz
          </p>
          <p className="text-muted-foreground mt-2">
            E-Mail:{' '}
            <a href="mailto:admin@proflowlabsai.com" className="underline hover:text-foreground">
              admin@proflowlabsai.com
            </a>
          </p>
        </section>

        <section className="space-y-2 text-sm">
          <h2 className="font-semibold text-base">Datenquelle</h2>
          <p className="text-muted-foreground">
            Die auf dieser Website angezeigten Daten zu Medikamenten-Lieferengpässen stammen von{' '}
            <a
              href="https://www.drugshortage.ch"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              drugshortage.ch
            </a>
            . Die Daten werden täglich automatisch abgerufen und aufbereitet. Wir erheben keinen
            Anspruch auf die Vollständigkeit oder Richtigkeit der angezeigten Informationen.
          </p>
          <p className="text-muted-foreground">
            Massgebliche und verbindliche Informationen finden sich ausschliesslich auf den
            offiziellen Seiten von Swissmedic und drugshortage.ch.
          </p>
        </section>

        <section className="space-y-2 text-sm">
          <h2 className="font-semibold text-base">Haftungsausschluss</h2>
          <p className="text-muted-foreground">
            Diese Website dient ausschliesslich zu Informationszwecken. Die bereitgestellten
            Informationen stellen keine medizinische oder pharmakologische Beratung dar und
            ersetzen nicht die Auskunft durch Fachpersonen (Ärzte, Apotheker). Der Betreiber
            übernimmt keine Haftung für Schäden, die aus der Nutzung oder Nicht-Nutzung der
            angezeigten Informationen entstehen.
          </p>
        </section>

        <section className="space-y-2 text-sm">
          <h2 className="font-semibold text-base">Urheberrecht</h2>
          <p className="text-muted-foreground">
            Die Aufbereitung, Darstellung und das Design dieser Website sind urheberrechtlich
            geschützt. Die Rohdaten der Lieferengpässe stammen von drugshortage.ch und werden
            mit Quellenangabe wiedergegeben.
          </p>
        </section>
      </div>
    </main>
  )
}
