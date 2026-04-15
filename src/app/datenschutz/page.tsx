import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Datenschutz — engpass.radar',
  robots: { index: false, follow: false },
}

export default function DatenschutzPage() {
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
          <h1 className="text-2xl font-bold tracking-tight">Datenschutzerklärung</h1>
          <p className="text-sm text-muted-foreground">Stand: April 2026</p>
        </div>

        <section className="space-y-2 text-sm">
          <h2 className="font-semibold text-base">Grundsatz</h2>
          <p className="text-muted-foreground">
            Der Schutz Ihrer Daten ist uns wichtig. Diese Datenschutzerklärung informiert darüber,
            welche Daten beim Besuch dieser Website verarbeitet werden.
          </p>
        </section>

        <section className="space-y-2 text-sm">
          <h2 className="font-semibold text-base">Keine Nutzerkonten, keine Registrierung</h2>
          <p className="text-muted-foreground">
            Diese Website erfordert keine Registrierung und erhebt keine personenbezogenen Daten
            von Besuchern. Es werden keine Formulare angeboten, die zur Eingabe persönlicher Daten
            auffordern.
          </p>
        </section>

        <section className="space-y-2 text-sm">
          <h2 className="font-semibold text-base">Server-Logs</h2>
          <p className="text-muted-foreground">
            Der Hosting-Anbieter (Vercel Inc., USA) erhebt automatisch technische Zugriffsdaten
            (IP-Adresse, Zeitstempel, aufgerufene URL, Browser-Typ). Diese Daten werden für
            Sicherheits- und Betriebszwecke gespeichert und nach spätestens 30 Tagen gelöscht.
            Die Verarbeitung erfolgt auf Basis des berechtigten Interesses (Art. 31 Abs. 1 DSG).
          </p>
          <p className="text-muted-foreground">
            Vercel ist unter dem EU-US Data Privacy Framework zertifiziert. Details:{' '}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              vercel.com/legal/privacy-policy
            </a>
          </p>
        </section>

        <section className="space-y-2 text-sm">
          <h2 className="font-semibold text-base">Cookies</h2>
          <p className="text-muted-foreground">
            Diese Website verwendet keine Tracking-Cookies und keine Analyse-Tools (z.B. Google
            Analytics). Technisch notwendige Cookies können vom Hosting-Anbieter gesetzt werden.
          </p>
        </section>

        <section className="space-y-2 text-sm">
          <h2 className="font-semibold text-base">Datenquelle (Medikamentendaten)</h2>
          <p className="text-muted-foreground">
            Die angezeigten Medikamenten-Lieferengpässe sind öffentlich zugängliche Daten von{' '}
            <a
              href="https://www.drugshortage.ch"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              drugshortage.ch
            </a>
            . Es handelt sich dabei ausschliesslich um Sachdaten (keine Personendaten).
          </p>
        </section>

        <section className="space-y-2 text-sm">
          <h2 className="font-semibold text-base">Datenbankhosting</h2>
          <p className="text-muted-foreground">
            Die gescrapten Daten werden in einer Datenbank bei Supabase (Supabase Inc., USA /
            EU-Region) gespeichert. Es werden ausschliesslich öffentliche Sachdaten (keine
            Personendaten) gespeichert.
          </p>
        </section>

        <section className="space-y-2 text-sm">
          <h2 className="font-semibold text-base">Ihre Rechte</h2>
          <p className="text-muted-foreground">
            Da wir keine personenbezogenen Daten von Besuchern erheben, entfallen die
            typischen Auskunfts-, Berichtigungs- und Löschungsrechte in der Praxis. Bei Fragen
            wenden Sie sich an:{' '}
            <a href="mailto:info@engpassradar.ch" className="underline hover:text-foreground">
              info@engpassradar.ch
            </a>
          </p>
        </section>

        <section className="space-y-2 text-sm">
          <h2 className="font-semibold text-base">Änderungen</h2>
          <p className="text-muted-foreground">
            Diese Datenschutzerklärung kann bei Bedarf angepasst werden. Das Datum der letzten
            Änderung ist oben angegeben.
          </p>
        </section>
      </div>
    </main>
  )
}
