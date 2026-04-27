'use client'

import { useState, FormEvent } from 'react'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json() as { success?: boolean; error?: string }

      if (!res.ok || !data.success) {
        setErrorMessage(data.error ?? 'Ein Fehler ist aufgetreten. Bitte erneut versuchen.')
        setStatus('error')
        return
      }

      setStatus('success')
    } catch {
      setErrorMessage('Ein Fehler ist aufgetreten. Bitte erneut versuchen.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-center gap-3">
          <svg
            className="h-6 w-6 text-green-500 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm text-muted-foreground">
            Sie erhalten den aktuellen Shortage Report per E-Mail — bitte prüfen Sie Ihr Postfach und bestätigen Sie Ihre Anmeldung.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Engpass-Signal
        </p>
        <p className="text-lg font-bold tracking-tight">
          Shortage Report Schweiz — kostenlos
        </p>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Jeden Dienstag: Die 5 relevantesten Engpässe der Woche in 90 Sekunden — kuratiert für Apotheken und Spitalfachpersonal. Kostenlos, jederzeit abmeldbar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="flex flex-col sm:flex-row gap-2">
          <label htmlFor="newsletter-email" className="sr-only">E-Mail-Adresse für Shortage Report</label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ihre@email.ch"
            required
            disabled={status === 'loading'}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            aria-label="Shortage Report abonnieren"
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Wird angemeldet…
              </>
            ) : (
              'Report erhalten'
            )}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground text-center">
          Kein Spam. Jederzeit abmeldbar.
        </p>

        {status === 'error' && (
          <p className="mt-2 text-sm text-red-500">
            {errorMessage}
          </p>
        )}
      </form>
    </div>
  )
}
