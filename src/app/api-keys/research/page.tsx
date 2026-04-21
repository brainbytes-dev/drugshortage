'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function ResearchPage() {
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    const res = await fetch('/api/api-keys/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, reason }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error ?? 'Fehler')
    else setSent(true)
    setLoading(false)
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Research-Zugang</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Kostenloser API-Key für Forschung, Journalismus und akademische Institutionen (2&apos;000 Anfragen/Tag).
        </p>
      </div>

      {sent ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm">
              Falls Ihre Angaben einer Berechtigung entsprechen, erhalten Sie den Key per E-Mail. Bitte auch den Spam-Ordner prüfen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Zugang beantragen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Institutionelle E-Mail</label>
              <Input
                type="email"
                placeholder="name@unibas.ch"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Automatisch akzeptiert: .edu, .ac.*, Schweizer Uni- und Spitalsdomains
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Verwendungszweck <span className="font-normal text-muted-foreground">(bei privater E-Mail obligatorisch)</span>
              </label>
              <textarea
                className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px] resize-none"
                placeholder="Kurze Beschreibung des Forschungsprojekts oder der Verwendung…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleSubmit} disabled={loading || !email} className="w-full">
              {loading ? 'Wird geprüft…' : 'Key beantragen'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Gewerbliche Nutzung? <a href="/api-keys" className="underline">Hier zum kostenpflichtigen Tarif</a>
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
