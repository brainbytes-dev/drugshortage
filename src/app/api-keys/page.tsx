'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  research: 'Research',
  professional: 'Professional',
  institutional: 'Institutional',
  data_license: 'Data License',
}

const TIER_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  free: 'outline',
  research: 'secondary',
  professional: 'default',
  institutional: 'default',
  data_license: 'default',
}

type KeyData = {
  tier: string
  dailyLimit: number
  dailyCount: number
  createdAt: string
  active: boolean
}

const PRICES = [
  { label: 'Professional — CHF 39/Mo', priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_MONTHLY ?? '', tier: 'professional' },
  { label: 'Professional — CHF 390/Jahr', priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_YEARLY ?? '', tier: 'professional' },
  { label: 'Institutional — CHF 199/Mo', priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_INSTITUTIONAL_MONTHLY ?? '', tier: 'institutional' },
  { label: 'Institutional — CHF 1990/Jahr', priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_INSTITUTIONAL_YEARLY ?? '', tier: 'institutional' },
]

function Dashboard({ token }: { token: string }) {
  const [data, setData] = useState<KeyData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/api-keys/verify?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError('Fehler beim Laden'))
  }, [token])

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Link ungültig oder abgelaufen.{' '}
            <a href="/api-keys" className="underline">Neuen Link anfordern</a>
          </p>
        </CardContent>
      </Card>
    )
  }
  if (!data) return <p className="text-sm text-muted-foreground">Lädt…</p>

  const pct = Math.min(100, Math.round((data.dailyCount / data.dailyLimit) * 100))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          API-Key Dashboard
          <Badge variant={TIER_COLORS[data.tier] ?? 'outline'}>{TIER_LABELS[data.tier] ?? data.tier}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm font-medium mb-1">Nutzung heute</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-sm tabular-nums">
              {data.dailyCount.toLocaleString('de-CH')} / {data.dailyLimit.toLocaleString('de-CH')}
            </span>
          </div>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>Key erstellt: {new Date(data.createdAt).toLocaleDateString('de-CH')}</p>
          <p>Status: {data.active ? 'aktiv' : 'inaktiv'}</p>
        </div>

        <div className="flex gap-2">
          <a
            href={`/api/api-keys/portal?token=${encodeURIComponent(token)}`}
            className="inline-flex items-center justify-center rounded-md border border-input px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            Abo verwalten →
          </a>
        </div>

        <div className="border rounded-md p-3 bg-muted/50">
          <p className="text-xs font-mono text-muted-foreground">
            curl -H &quot;Authorization: Bearer &lt;ihr-key&gt;&quot; \<br />
            &nbsp;&nbsp;https://engpassradar.ch/api/v1/shortages
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function SignupForm() {
  const [email, setEmail] = useState('')
  const [selectedPrice, setSelectedPrice] = useState(PRICES[0])
  const [loading, setLoading] = useState(false)
  const [magicEmail, setMagicEmail] = useState('')
  const [magicSent, setMagicSent] = useState(false)

  async function handleCheckout() {
    if (!email) return
    setLoading(true)
    const res = await fetch('/api/api-keys/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, priceId: selectedPrice.priceId }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(false)
  }

  async function handleMagicLink() {
    if (!magicEmail) return
    setLoading(true)
    await fetch('/api/api-keys/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: magicEmail }),
    })
    setMagicSent(true)
    setLoading(false)
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>API-Zugang beantragen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Plan</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={selectedPrice.priceId}
              onChange={(e) => setSelectedPrice(PRICES.find((p) => p.priceId === e.target.value) ?? PRICES[0])}
            >
              {PRICES.map((p) => (
                <option key={p.priceId} value={p.priceId}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">E-Mail</label>
            <Input
              type="email"
              placeholder="name@organisation.ch"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button onClick={handleCheckout} disabled={loading || !email} className="w-full">
            {loading ? 'Weiterleitung…' : 'Weiter zu Stripe →'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Forscher und akademische Institutionen:{' '}
            <a href="/api-keys/research" className="underline">kostenloser Research-Key</a>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Key verloren?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {magicSent ? (
            <p className="text-sm text-muted-foreground">
              Falls ein Konto existiert, erhalten Sie einen Dashboard-Link per E-Mail.
            </p>
          ) : (
            <>
              <Input
                type="email"
                placeholder="Registrierte E-Mail"
                value={magicEmail}
                onChange={(e) => setMagicEmail(e.target.value)}
              />
              <Button variant="outline" onClick={handleMagicLink} disabled={loading || !magicEmail} className="w-full">
                Dashboard-Link zusenden
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ApiKeysContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  return (
    <main className="max-w-lg mx-auto px-4 py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">API-Zugang</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Engpassradar-API für automatisierte Abfragen und Systemintegrationen.
        </p>
      </div>
      {token ? <Dashboard token={token} /> : <SignupForm />}
    </main>
  )
}

export default function ApiKeysPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto px-4 py-12"><p className="text-sm text-muted-foreground">Lädt…</p></div>}>
      <ApiKeysContent />
    </Suspense>
  )
}
