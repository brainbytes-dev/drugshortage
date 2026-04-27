'use client'

import { useState } from 'react'

interface WatchlistFormProps {
  atcCode: string
  atcName: string
}

export function WatchlistForm({ atcCode, atcName }: WatchlistFormProps) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/watchlist/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, atcCode, atcName }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Fehler beim Einrichten des Alerts.')
        setState('error')
        return
      }
      setState('success')
    } catch {
      setErrorMsg('Verbindungsfehler. Bitte versuchen Sie es erneut.')
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="rounded-lg border border-[#2d8f8f]/30 bg-[#2d8f8f]/5 p-4 text-sm">
        <p className="font-medium text-[#2d8f8f]">Bestätigungs-E-Mail gesendet</p>
        <p className="text-muted-foreground mt-1">
          Bitte prüfen Sie Ihr Postfach und bestätigen Sie den Alert.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-medium mb-1">Engpass-Alert einrichten</p>
      <p className="text-xs text-muted-foreground mb-3">
        E-Mail erhalten sobald sich die Lage für {atcName} ändert.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor={`watchlist-email-${atcCode}`} className="sr-only">
          E-Mail-Adresse für Alert
        </label>
        <input
          id={`watchlist-email-${atcCode}`}
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="ihre@email.ch"
          required
          className="flex-1 min-w-0 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d8f8f]/50"
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          aria-label={`Alert für ${atcName} einrichten`}
          className="shrink-0 rounded-md bg-[#2d8f8f] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#267a7a] disabled:opacity-50 transition-colors"
        >
          {state === 'loading' ? '…' : 'Alert'}
        </button>
      </form>
      {state === 'error' && (
        <p className="text-xs text-destructive mt-2">{errorMsg}</p>
      )}

      {/* Upsell: Pro for API access */}
      <p className="text-[11px] text-muted-foreground mt-3 pt-3 border-t border-border/40">
        Für API-Zugang und höhere Limits:{' '}
        <a href="/#pricing" className="underline hover:text-foreground font-medium">
          Engpassradar Pro ab CHF&nbsp;39/Mo →
        </a>
      </p>
    </div>
  )
}
