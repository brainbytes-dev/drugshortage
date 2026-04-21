'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
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
  plaintext: string | null
}

function ApiKeyDisplay({ value }: { value: string }) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const masked = value.slice(0, 8) + '•'.repeat(24) + value.slice(-4)
  return (
    <div className="rounded-md border bg-muted/40 p-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">API-Key</p>
      <div className="flex items-center gap-2 flex-wrap">
        <code className="text-sm font-mono break-all flex-1">{revealed ? value : masked}</code>
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => setRevealed((r) => !r)}
            className="rounded px-2 py-1 text-xs border hover:bg-muted transition-colors"
          >
            {revealed ? 'Verbergen' : 'Anzeigen'}
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="rounded px-2 py-1 text-xs border hover:bg-muted transition-colors"
          >
            {copied ? 'Kopiert!' : 'Kopieren'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="ml-2 rounded px-2 py-0.5 text-xs border hover:bg-muted transition-colors"
    >
      {copied ? 'Kopiert!' : 'Kopieren'}
    </button>
  )
}


function Dashboard({ token }: { token: string }) {
  const [data, setData] = useState<KeyData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmRegen, setConfirmRegen] = useState(false)
  const [regenLoading, setRegenLoading] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/api-keys/verify?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError('Fehler beim Laden'))
  }, [token])

  async function handleRegenerate() {
    setRegenLoading(true)
    const res = await fetch(`/api/api-keys/regenerate?token=${encodeURIComponent(token)}`, { method: 'POST' })
    const d = await res.json()
    if (d.plaintext) {
      setNewKey(d.plaintext)
      setConfirmRegen(false)
    } else {
      setError(d.error ?? 'Fehler beim Regenerieren')
    }
    setRegenLoading(false)
  }

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
          API-Dashboard
          <Badge variant={TIER_COLORS[data.tier] ?? 'outline'}>{TIER_LABELS[data.tier] ?? data.tier}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm font-medium mb-1">Nutzung heute</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm tabular-nums">
              {data.dailyCount.toLocaleString('de-CH')} / {data.dailyLimit.toLocaleString('de-CH')}
            </span>
          </div>
        </div>

        {data.plaintext
          ? <ApiKeyDisplay value={data.plaintext} />
          : (
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Key nicht verfügbar — bitte unten neu generieren.</p>
            </div>
          )
        }

        <div className="text-sm text-muted-foreground space-y-1">
          <p>Key erstellt: {new Date(data.createdAt).toLocaleDateString('de-CH')}</p>
          <p>Status: {data.active ? 'aktiv' : 'inaktiv'}</p>
        </div>

        {newKey && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 p-3 space-y-1">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Neuer API-Key (wird nur einmal angezeigt):</p>
            <div className="flex items-center gap-1">
              <code className="text-xs font-mono break-all">{newKey}</code>
              <CopyButton value={newKey} />
            </div>
            <p className="text-[11px] text-muted-foreground">Der Key wurde auch per E-Mail versandt.</p>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {data.tier === 'free' || data.tier === 'research' ? (
            <a
              href="/api#pricing"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Upgrade →
            </a>
          ) : (
            <a
              href={`/api/api-keys/portal?token=${encodeURIComponent(token)}`}
              className="inline-flex items-center justify-center rounded-md border border-input px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
            >
              Abo verwalten →
            </a>
          )}
          {!newKey && !confirmRegen && (
            <button
              onClick={() => setConfirmRegen(true)}
              className="inline-flex items-center justify-center rounded-md border border-input px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors text-destructive"
            >
              Key neu generieren
            </button>
          )}
          {confirmRegen && (
            <div className="w-full rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2">
              <p className="text-sm text-destructive font-medium">Der alte Key wird sofort ungültig. Fortfahren?</p>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={handleRegenerate} disabled={regenLoading}>
                  {regenLoading ? 'Generiere…' : 'Ja, neu generieren'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setConfirmRegen(false)} disabled={regenLoading}>
                  Abbrechen
                </Button>
              </div>
            </div>
          )}
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

type AccessTab = 'lost' | 'research'

function AccessForm({ initialTab }: { initialTab: AccessTab }) {
  const [tab, setTab] = useState<AccessTab>(initialTab)
  const [loading, setLoading] = useState(false)
  // lost key
  const [magicEmail, setMagicEmail] = useState('')
  const [magicSent, setMagicSent] = useState(false)
  // research
  const [researchEmail, setResearchEmail] = useState('')
  const [reason, setReason] = useState('')
  const [researchSent, setResearchSent] = useState(false)
  const [researchError, setResearchError] = useState<string | null>(null)

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

  async function handleResearch() {
    setResearchError(null)
    setLoading(true)
    const res = await fetch('/api/api-keys/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: researchEmail, reason }),
    })
    const d = await res.json()
    if (!res.ok) setResearchError(d.error ?? 'Fehler')
    else setResearchSent(true)
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Zugang</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex rounded-lg border bg-muted/40 p-0.5 gap-0.5">
          <button
            onClick={() => setTab('lost')}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-all ${
              tab === 'lost' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Dashboard-Link anfordern
          </button>
          <button
            onClick={() => setTab('research')}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-all ${
              tab === 'research' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Research-Zugang
          </button>
        </div>

        {tab === 'lost' && (
          <div className="space-y-3">
            {magicSent ? (
              <p className="text-sm text-muted-foreground">
                Falls ein Konto mit dieser E-Mail existiert, erhalten Sie den Dashboard-Link per E-Mail.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Sie erhalten einen Link zu Ihrem Dashboard per E-Mail.</p>
                <Input
                  type="email"
                  placeholder="Registrierte E-Mail"
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                />
                <Button onClick={handleMagicLink} disabled={loading || !magicEmail} className="w-full">
                  {loading ? 'Wird gesendet…' : 'Dashboard-Link zusenden'}
                </Button>
              </>
            )}
          </div>
        )}

        {tab === 'research' && (
          <div className="space-y-3">
            {researchSent ? (
              <p className="text-sm text-muted-foreground">
                Falls Ihre Angaben einer Berechtigung entsprechen, erhalten Sie den Key per E-Mail.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Kostenloser Key für Forschung und akademische Institutionen (2&apos;000 Anfragen/Tag).
                </p>
                <div>
                  <label className="text-sm font-medium mb-1 block">Institutionelle E-Mail</label>
                  <Input
                    type="email"
                    placeholder="name@unibas.ch"
                    value={researchEmail}
                    onChange={(e) => setResearchEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Automatisch akzeptiert: .edu, .ac.*, Schweizer Uni- und Forschungsdomains</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Verwendungszweck <span className="font-normal text-muted-foreground">(bei privater E-Mail obligatorisch)</span>
                  </label>
                  <textarea
                    className="w-full border rounded-md px-3 py-2 text-sm min-h-[72px] resize-none bg-background"
                    placeholder="Kurze Beschreibung des Forschungsprojekts…"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                {researchError && <p className="text-sm text-destructive">{researchError}</p>}
                <Button onClick={handleResearch} disabled={loading || !researchEmail} className="w-full">
                  {loading ? 'Wird geprüft…' : 'Key beantragen'}
                </Button>
              </>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pt-1">
          Noch kein Key?{' '}
          <Link href="/api#pricing" className="underline hover:text-foreground">Tarife ansehen →</Link>
        </p>
      </CardContent>
    </Card>
  )
}

function ApiKeysContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const tabParam = searchParams.get('tab') as AccessTab | null

  return (
    <main className="max-w-lg mx-auto px-4 py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">API-Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Engpassradar-API für automatisierte Abfragen und Systemintegrationen.
        </p>
      </div>
      {token
        ? <Dashboard token={token} />
        : <AccessForm initialTab={tabParam === 'research' ? 'research' : 'lost'} />
      }
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
