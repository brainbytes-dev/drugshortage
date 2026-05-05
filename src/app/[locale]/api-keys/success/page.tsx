import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Zahlung bestätigt — engpassradar.ch',
  robots: { index: false, follow: false },
}

export default function ApiKeySuccessPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 text-center">
      <div className="max-w-md space-y-8">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Zahlung erfolgreich</h1>
          <p className="text-muted-foreground leading-relaxed">
            Vielen Dank — Ihr <strong className="text-foreground">API-Zugang</strong> ist aktiviert.
          </p>
        </div>

        {/* Next steps */}
        <ol className="text-left space-y-4">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
            <div>
              <p className="text-sm font-medium text-foreground">Zahlung bestätigt</p>
              <p className="text-sm text-muted-foreground">Ihr Abo ist aktiv.</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
            <div>
              <p className="text-sm font-medium text-foreground">E-Mail mit Magic-Link prüfen</p>
              <p className="text-sm text-muted-foreground">
                Schauen Sie in Ihr Postfach — der Link kommt in wenigen Minuten. Bitte auch den Spam-Ordner prüfen.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
            <div>
              <p className="text-sm font-medium text-foreground">Dashboard öffnen &amp; API-Key abrufen</p>
              <p className="text-sm text-muted-foreground">
                Der Magic-Link im Mail ist 30 Tage gültig und führt direkt zu Ihrem API-Key.
              </p>
            </div>
          </li>
        </ol>

        <div className="space-y-3">
          <Link
            href="/api-keys"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Zum Dashboard
          </Link>
          <p className="text-xs text-muted-foreground">
            Sie benötigen den Magic-Link aus der E-Mail, um sich einzuloggen.
          </p>
          <div>
            <Link
              href="/api-docs"
              className="text-sm text-primary hover:underline transition-colors"
            >
              In der Zwischenzeit: API-Dokumentation lesen &rarr;
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
