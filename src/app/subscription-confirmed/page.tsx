import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Anmeldung bestätigt — engpass.radar',
  robots: { index: false, follow: false },
}

export default function SubscriptionConfirmedPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Anmeldung bestätigt</h1>
          <p className="text-muted-foreground leading-relaxed">
            Vielen Dank — Sie erhalten ab sofort den{' '}
            <strong className="text-foreground">Engpass-Signal Newsletter</strong>.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Die erste Ausgabe wird an Sie gesendet, sobald neue relevante Engpässe vorliegen.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Zum Dashboard
        </Link>
      </div>
    </main>
  )
}
