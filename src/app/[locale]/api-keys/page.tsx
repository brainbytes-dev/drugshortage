'use client'

import { useEffect, useState, Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const TIER_LABEL_KEYS: Record<string, 'tierFree' | 'tierResearch' | 'tierProfessional' | 'tierInstitutional' | 'tierDataLicense'> = {
  free: 'tierFree',
  research: 'tierResearch',
  professional: 'tierProfessional',
  institutional: 'tierInstitutional',
  data_license: 'tierDataLicense',
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
  const t = useTranslations('ApiKeys')
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const masked = value.slice(0, 8) + '•'.repeat(24) + value.slice(-4)
  return (
    <div className="rounded-md border bg-muted/40 p-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('apiKeyLabel')}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <code className="text-sm font-mono break-all flex-1">{revealed ? value : masked}</code>
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => setRevealed((r) => !r)}
            className="rounded px-2 py-1 text-xs border hover:bg-muted transition-colors"
          >
            {revealed ? t('hide') : t('reveal')}
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="rounded px-2 py-1 text-xs border hover:bg-muted transition-colors"
          >
            {copied ? t('copied') : t('copy')}
          </button>
        </div>
      </div>
    </div>
  )
}

function CopyButton({ value }: { value: string }) {
  const t = useTranslations('ApiKeys')
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="ml-2 rounded px-2 py-0.5 text-xs border hover:bg-muted transition-colors"
    >
      {copied ? t('copied') : t('copy')}
    </button>
  )
}


function Dashboard({ token }: { token: string }) {
  const t = useTranslations('ApiKeys')
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
      .catch(() => setError(t('loadError')))
  }, [token, t])

  async function handleRegenerate() {
    setRegenLoading(true)
    const res = await fetch(`/api/api-keys/regenerate?token=${encodeURIComponent(token)}`, { method: 'POST' })
    const d = await res.json()
    if (d.plaintext) {
      setNewKey(d.plaintext)
      setConfirmRegen(false)
    } else {
      setError(d.error ?? t('regenerateError'))
    }
    setRegenLoading(false)
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            {t('linkInvalid')}{' '}
            <Link href="/api-keys" className="underline">{t('requestNewLink')}</Link>
          </p>
        </CardContent>
      </Card>
    )
  }
  if (!data) return <p className="text-sm text-muted-foreground">{t('loading')}</p>

  const pct = Math.min(100, Math.round((data.dailyCount / data.dailyLimit) * 100))
  const tierKey = TIER_LABEL_KEYS[data.tier]
  const tierLabel = tierKey ? t(tierKey) : data.tier

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t('dashboardTitle')}
          <Badge variant={TIER_COLORS[data.tier] ?? 'outline'}>{tierLabel}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm font-medium mb-1">{t('usageToday')}</p>
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
              <p className="text-xs text-muted-foreground">{t('keyUnavailable')}</p>
            </div>
          )
        }

        <div className="text-sm text-muted-foreground space-y-1">
          <p>{t('keyCreated', { date: new Date(data.createdAt).toLocaleDateString('de-CH') })}</p>
          <p>{t('statusLabel')} {data.active ? t('statusActive') : t('statusInactive')}</p>
        </div>

        {newKey && (
          <div className="rounded-md border border-border bg-status-resolved-soft p-3 space-y-1">
            <p className="text-xs font-semibold text-status-resolved">{t('newKeyTitle')}</p>
            <div className="flex items-center gap-1">
              <code className="text-xs font-mono break-all">{newKey}</code>
              <CopyButton value={newKey} />
            </div>
            <p className="text-[11px] text-muted-foreground">{t('newKeyEmailNote')}</p>
          </div>
        )}

        {/* Upgrade wall: show when >= 80% of free/research limit used */}
        {(data.tier === 'free' || data.tier === 'research') && pct >= 80 && (
          <div className={`rounded-lg border px-4 py-3 space-y-2 ${
            pct >= 100
              ? 'border-status-active/40 bg-status-active-soft'
              : 'border-status-longterm/40 bg-status-longterm-soft'
          }`}>
            <p className={`text-[12px] font-semibold ${pct >= 100 ? 'text-status-active' : 'text-status-longterm'}`}>
              {pct >= 100
                ? t('limitReached')
                : t('limitNearing', { percent: pct })}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {data.tier === 'free'
                ? t('upgradeFreeBody')
                : t('upgradeResearchBody')}
            </p>
            <Link
              href={{ pathname: '/', hash: 'pricing' }}
              className="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              {t('upgradeCta')}
            </Link>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {data.tier === 'free' || data.tier === 'research' ? (
            <Link
              href={{ pathname: '/', hash: 'pricing' }}
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {t('upgradeShort')}
            </Link>
          ) : (
            <a
              href={`/api/api-keys/portal?token=${encodeURIComponent(token)}`}
              className="inline-flex items-center justify-center rounded-md border border-input px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
            >
              {t('manageSubscription')}
            </a>
          )}
          {!newKey && !confirmRegen && (
            <button
              onClick={() => setConfirmRegen(true)}
              className="inline-flex items-center justify-center rounded-md border border-input px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors text-destructive"
            >
              {t('regenerateKey')}
            </button>
          )}
          {confirmRegen && (
            <div className="w-full rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2">
              <p className="text-sm text-destructive font-medium">{t('regenerateConfirm')}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={handleRegenerate} disabled={regenLoading}>
                  {regenLoading ? t('regenerating') : t('regenerateConfirmYes')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setConfirmRegen(false)} disabled={regenLoading}>
                  {t('regenerateCancel')}
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
  const t = useTranslations('ApiKeys')
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
    if (!res.ok) setResearchError(d.error ?? t('researchErrorFallback'))
    else setResearchSent(true)
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('accessTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex rounded-lg border bg-muted/40 p-0.5 gap-0.5">
          <button
            onClick={() => setTab('lost')}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-all ${
              tab === 'lost' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('tabLost')}
          </button>
          <button
            onClick={() => setTab('research')}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-all ${
              tab === 'research' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('tabResearch')}
          </button>
        </div>

        {tab === 'lost' && (
          <div className="space-y-3">
            {magicSent ? (
              <p className="text-sm text-muted-foreground">
                {t('magicSent')}
              </p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {t('magicIntro')}
                </p>
                <Input
                  type="email"
                  placeholder={t('magicEmailPlaceholder')}
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                />
                <Button onClick={handleMagicLink} disabled={loading || !magicEmail} className="w-full">
                  {loading ? t('magicSending') : t('magicSubmit')}
                </Button>
              </>
            )}
          </div>
        )}

        {tab === 'research' && (
          <div className="space-y-3">
            {researchSent ? (
              <p className="text-sm text-muted-foreground">
                {t('researchSent')}
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {t('researchIntro')}
                </p>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t('researchEmailLabel')}</label>
                  <Input
                    type="email"
                    placeholder={t('researchEmailPlaceholder')}
                    value={researchEmail}
                    onChange={(e) => setResearchEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t('researchEmailHint')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    {t('researchReasonLabel')} <span className="font-normal text-muted-foreground">{t('researchReasonNote')}</span>
                  </label>
                  <textarea
                    className="w-full border rounded-md px-3 py-2 text-sm min-h-[72px] resize-none bg-background"
                    placeholder={t('researchReasonPlaceholder')}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                {researchError && <p className="text-sm text-destructive">{researchError}</p>}
                <Button onClick={handleResearch} disabled={loading || !researchEmail} className="w-full">
                  {loading ? t('researchSubmitting') : t('researchSubmit')}
                </Button>
              </>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pt-1">
          {t('noKeyHint')}{' '}
          <Link href={{ pathname: '/api', hash: 'pricing' }} className="underline hover:text-foreground">{t('noKeyHintLink')}</Link>
        </p>
      </CardContent>
    </Card>
  )
}

function ApiKeysContent() {
  const t = useTranslations('ApiKeys')
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const tabParam = searchParams.get('tab') as AccessTab | null

  return (
    <main className="max-w-lg mx-auto px-4 py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('h1')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('subtitle')}
        </p>
      </div>
      {!token && (
        <div className="rounded-md border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          {t('newHereHint')} <Link href={{ pathname: '/api', hash: 'pricing' }} className="underline hover:text-foreground">{t('newHereHintLink')}</Link>{t('newHereHintSuffix')}
        </div>
      )}
      {token
        ? <Dashboard token={token} />
        : <AccessForm initialTab={tabParam === 'research' ? 'research' : 'lost'} />
      }
    </main>
  )
}

export default function ApiKeysPage() {
  return (
    <Suspense fallback={<ApiKeysFallback />}>
      <ApiKeysContent />
    </Suspense>
  )
}

function ApiKeysFallback() {
  const t = useTranslations('ApiKeys')
  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <p className="text-sm text-muted-foreground">{t('loading')}</p>
    </div>
  )
}
