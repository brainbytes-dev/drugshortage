'use client'

import { useState } from 'react'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) throw new Error('Subscribe failed')
      setState('success')
      setEmail('')
    } catch {
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <p className="text-sm text-muted-foreground text-center py-2">
        Angemeldet. Erste Ausgabe erscheint dienstags.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 justify-center">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="ihre@email.ch"
        required
        disabled={state === 'loading'}
        className="flex-1 min-w-0 rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={state === 'loading'}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity whitespace-nowrap disabled:opacity-50"
      >
        {state === 'loading' ? 'Wird angemeldet…' : 'Abonnieren'}
      </button>
      {state === 'error' && (
        <p className="text-xs text-destructive w-full text-center">
          Fehler beim Anmelden. Bitte nochmals versuchen.
        </p>
      )}
    </form>
  )
}
