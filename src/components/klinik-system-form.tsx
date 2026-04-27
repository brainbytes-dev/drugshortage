'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'

export function KlinikSystemForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [institution, setInstitution] = useState('')
  const [problem, setProblem] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [status])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/klinik-system/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, institution, problem }),
      })
      const d = await res.json()
      if (!res.ok) {
        setErrorMsg(d.error ?? 'Fehler beim Absenden.')
        setStatus('error')
      } else {
        setStatus('success')
      }
    } catch {
      setErrorMsg('Netzwerkfehler — bitte erneut versuchen.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div ref={containerRef} className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-[18px] font-semibold text-foreground">Anfrage erhalten.</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
            Wir erstellen innerhalb von 24&nbsp;Stunden einen personalisierten Shortage Report für Ihre Institution und melden uns per E-Mail.
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground border-t border-border/40 pt-4 w-full text-center">
          Keine Antwort erhalten? Schreiben Sie uns: <a href="mailto:api@engpassradar.ch" className="underline hover:text-foreground">api@engpassradar.ch</a>
        </p>
      </div>
    )
  }

  return (
    <div ref={containerRef}>
      {status === 'error' && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{errorMsg}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Ihr Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Dr. Maria Müller"
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">E-Mail-Adresse</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="maria.mueller@spital.ch"
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Institution</label>
          <input
            type="text"
            required
            value={institution}
            onChange={e => setInstitution(e.target.value)}
            placeholder="Kantonsspital Winterthur"
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Hauptproblem im Engpass-Management</label>
          <textarea
            required
            value={problem}
            onChange={e => setProblem(e.target.value)}
            placeholder="z.B. täglicher manueller Check kostet viel Zeit, kein Alerting, fehlende Integration ins PMS…"
            rows={3}
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {status === 'loading' ? 'Wird gesendet…' : 'Anfrage absenden'}
          {status !== 'loading' && <ArrowRight className="h-4 w-4" />}
        </button>
        <p className="text-[11px] text-muted-foreground text-center">
          Kein Automatismus — wir melden uns persönlich innert 24&nbsp;h.
        </p>
      </form>
    </div>
  )
}
