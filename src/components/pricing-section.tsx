'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { CheckCircle2, ArrowRight, Zap, X, ShieldCheck } from 'lucide-react'
import { TIERS, type Tier } from '@/lib/pricing'
import { RoiCalculator } from '@/components/roi-calculator'

function yearlyMonthlyEquivalent(yearlyAmount: number) {
  return Math.floor(yearlyAmount / 12)
}

const PAID_TIERS = TIERS.filter(t => t.key !== 'free' && t.key !== 'research')

function FreeTierRow({ tier, onResearch }: { tier: Tier; onResearch?: () => void }) {
  const isResearch = tier.key === 'research'
  return (
    <div className={`flex flex-col gap-4 rounded-xl border px-5 py-5 ${
      isResearch
        ? 'border-border bg-card'
        : 'border-border/60 bg-muted/30'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {tier.label}
          </p>
          <p className="text-[22px] font-bold text-foreground mt-1 leading-none">Kostenlos</p>
          <p className="text-[11px] text-muted-foreground mt-1">{tier.priceNote}</p>
        </div>
        <span className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold bg-muted text-muted-foreground">
          {tier.dailyLimit}
        </span>
      </div>
      {isResearch && onResearch ? (
        <button
          onClick={onResearch}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-[12px] font-semibold transition-colors bg-secondary text-secondary-foreground border border-border hover:bg-muted"
        >
          {tier.cta}
          <ArrowRight className="h-3 w-3" />
        </button>
      ) : (
        <Link
          href={tier.ctaHref}
          className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-[12px] font-semibold transition-colors ${
            isResearch
              ? 'bg-secondary text-secondary-foreground border border-border hover:bg-muted'
              : 'border border-border/80 bg-background text-foreground hover:bg-muted'
          }`}
        >
          {tier.cta}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  )
}

function ResearchModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/api-keys/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, reason }),
    })
    const d = await res.json()
    if (!res.ok) setError(d.error ?? 'Fehler beim Senden')
    else setSent(true)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border bg-card shadow-xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Research</p>
            <p className="text-lg font-bold mt-0.5">Key beantragen</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors mt-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>

        {sent ? (
          <p className="text-sm text-muted-foreground py-2">
            Falls Ihre Angaben einer Berechtigung entsprechen, erhalten Sie den Key per E-Mail.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Kostenloser Key für Forschung und akademische Institutionen (2&apos;000 Anfragen/Tag).
            </p>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Institutionelle E-Mail</label>
              <input
                ref={inputRef}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@unibas.ch"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
              />
              <p className="text-[11px] text-muted-foreground">Automatisch akzeptiert: .edu, .ac.*, Schweizer Uni- und Forschungsdomains</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Verwendungszweck <span className="font-normal text-muted-foreground">(bei privater E-Mail obligatorisch)</span>
              </label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm min-h-[72px] resize-none bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                placeholder="Kurze Beschreibung des Forschungsprojekts…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? 'Wird geprüft…' : 'Key beantragen'}
              {!loading && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

type CheckoutModalState = { tier: Tier; yearly: boolean }

function CheckoutModal({ state, onClose }: { state: CheckoutModalState; onClose: () => void }) {
  const { tier, yearly } = state
  const [email, setEmail] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const monthlyNum = tier.price !== null ? parseInt(tier.price, 10) : null
  const displayPrice =
    monthlyNum !== null && yearly && tier.yearlyAmountCHF
      ? yearlyMonthlyEquivalent(tier.yearlyAmountCHF)
      : monthlyNum
  const billingLabel = yearly ? 'jährlich abgerechnet' : 'monatlich kündbar'
  const paymentLink = yearly ? tier.paymentLinkYearly : tier.paymentLinkMonthly

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !paymentLink) return
    const url = `${paymentLink}?prefilled_email=${encodeURIComponent(email)}`
    window.location.href = url
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border bg-card shadow-xl p-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{tier.label}</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              {displayPrice !== null ? (
                <>
                  <span className="text-2xl font-extrabold tracking-tight">CHF&nbsp;{displayPrice}</span>
                  <span className="text-xs text-muted-foreground">/ Mo. — {billingLabel}</span>
                </>
              ) : (
                <span className="text-lg font-bold">Auf Anfrage</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors mt-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Feature summary */}
        <ul className="space-y-1.5">
          {tier.features.slice(0, 3).map((f) => (
            <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-500" />
              {f}
            </li>
          ))}
        </ul>

        <hr className="border-border/50" />

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Ihre E-Mail-Adresse</label>
            <input
              ref={inputRef}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@beispiel.ch"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
            <p className="text-[11px] text-muted-foreground">
              Ihr API-Key und Dashboard-Link werden an diese Adresse gesendet.
            </p>
          </div>
          <button
            type="submit"
            disabled={!email}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Weiter zu Stripe
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <p className="text-[11px] text-muted-foreground text-center">
          Sichere Zahlung via Stripe. Jederzeit kündbar.
        </p>
      </div>
    </div>
  )
}

function PaidCard({ tier, yearly, onCheckout }: { tier: Tier; yearly: boolean; onCheckout: (t: Tier, y: boolean) => void }) {
  const monthlyNum = tier.price !== null ? parseInt(tier.price, 10) : null
  const displayPrice =
    monthlyNum !== null && yearly && monthlyNum > 0 && tier.yearlyAmountCHF
      ? yearlyMonthlyEquivalent(tier.yearlyAmountCHF)
      : monthlyNum
  const annualSavings =
    monthlyNum !== null && yearly && monthlyNum > 0 && tier.yearlyAmountCHF
      ? monthlyNum * 12 - tier.yearlyAmountCHF
      : null

  const hasPaymentLink = yearly ? !!tier.paymentLinkYearly : !!tier.paymentLinkMonthly

  return (
    <div
      className={`relative flex flex-col rounded-2xl border transition-all duration-200 ${
        tier.highlight
          ? 'border-primary bg-primary/5 shadow-lg ring-1 ring-primary/20'
          : 'bg-card hover:shadow-md hover:border-border/80'
      }`}
    >
      {tier.highlight && (
        <div className="absolute -top-3.5 inset-x-0 flex justify-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm">
            <Zap className="h-3 w-3" />
            Beliebt
          </span>
        </div>
      )}

      <div className="p-5 flex flex-col flex-1 space-y-4">

        <p className={`text-[11px] font-bold uppercase tracking-widest ${
          tier.highlight ? 'text-primary' : 'text-muted-foreground'
        }`}>
          {tier.label}
        </p>

        <div className="min-h-[52px] space-y-0.5">
          {displayPrice !== null ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold tracking-tight text-foreground">
                  CHF&nbsp;{displayPrice}
                </span>
                <span className="text-xs text-muted-foreground">/ Mo.</span>
              </div>
              {annualSavings !== null && annualSavings > 0 ? (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Sie sparen CHF&nbsp;{annualSavings} pro Jahr
                </p>
              ) : (
                !yearly && (
                  <p className="text-[11px] text-muted-foreground">{tier.priceNote}</p>
                )
              )}
            </>
          ) : (
            <>
              <p className="text-xl font-bold text-foreground">Auf Anfrage</p>
              <p className="text-[11px] text-muted-foreground">{tier.priceNote}</p>
            </>
          )}
        </div>

        <div className="rounded-lg bg-muted/60 px-3 py-2">
          <p className="text-[11px] font-semibold text-foreground">{tier.dailyLimit}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{tier.rateLimit}</p>
        </div>

        <ul className="space-y-2 flex-1">
          {tier.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                tier.highlight ? 'text-primary' : 'text-emerald-500'
              }`} />
              {f}
            </li>
          ))}
        </ul>

        {hasPaymentLink ? (
          <button
            onClick={() => onCheckout(tier, yearly)}
            className={`mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${
              tier.highlight
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                : 'border bg-background text-foreground hover:bg-muted'
            }`}
          >
            {tier.cta}
            <ArrowRight className="h-3 w-3" />
          </button>
        ) : (
          <a
            href={tier.ctaHref}
            className={`mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${
              tier.highlight
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                : 'border bg-background text-foreground hover:bg-muted'
            }`}
          >
            {tier.cta}
            <ArrowRight className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  )
}

export function PricingSection() {
  const [yearly, setYearly] = useState(false)
  const [checkoutModal, setCheckoutModal] = useState<CheckoutModalState | null>(null)
  const [researchModal, setResearchModal] = useState(false)

  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload()
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  return (
    <section id="pricing" className="border-t border-border/40">
      {checkoutModal && (
        <CheckoutModal state={checkoutModal} onClose={() => setCheckoutModal(null)} />
      )}
      {researchModal && (
        <ResearchModal onClose={() => setResearchModal(false)} />
      )}

      <div className="max-w-6xl mx-auto px-4 py-20 sm:py-28">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-3">
              Tarife & Preise
            </p>
            <p className="text-[14px] text-muted-foreground max-w-sm leading-relaxed">
              Alle Preise in CHF, exkl. MwSt. Monatliche Kündigung jederzeit möglich.
            </p>
          </div>
          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 p-1 self-center sm:self-auto">
            <button
              onClick={() => setYearly(false)}
              className={`rounded-full px-5 py-2 text-xs font-semibold transition-all ${
                !yearly ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monatlich
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`rounded-full px-5 py-2 text-xs font-semibold transition-all flex items-center gap-2 ${
                yearly ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Jährlich
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 text-[10px] font-bold leading-none">
                2 Mt. gratis
              </span>
            </button>
          </div>
        </div>

        {/* Free + Research — compact horizontal rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          {TIERS.filter(t => t.key === 'free' || t.key === 'research').map((tier) => (
            <FreeTierRow key={tier.key} tier={tier} onResearch={tier.key === 'research' ? () => setResearchModal(true) : undefined} />
          ))}
        </div>

        {/* Paid tiers — 3 columns, room to breathe */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-stretch">
          {PAID_TIERS.map((tier) => (
            <PaidCard
              key={tier.key}
              tier={tier}
              yearly={yearly}
              onCheckout={(t, y) => setCheckoutModal({ tier: t, yearly: y })}
            />
          ))}
        </div>

        {/* Guarantee */}
        <div className="mt-10 flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 px-5 py-4">
          <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="text-[12px] font-semibold text-emerald-800 dark:text-emerald-300">
              30-Tage-Garantie — kein Kleingedrucktes
            </p>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5 leading-relaxed">
              Falls unser System ausfällt und Sie einen Engpass verpassen, der auf unserer Plattform nicht aktuell war, erhalten Sie den Monat kostenfrei. Volle Rückerstattung innert 30 Tagen auf Anfrage, ohne Begründung.
            </p>
          </div>
        </div>

        <p className="mt-6 text-[12px] text-muted-foreground">
          Alle Tarife beinhalten GTIN, Pharmacode, ATC-Code, Severity Score und tagesaktuelle Engpass-Daten.{' '}
          <Link href="/api-docs" className="underline hover:text-foreground">
            Vollständige Endpunkte →
          </Link>
        </p>

        {/* ROI Calculator — für Klinik-System */}
        <div className="mt-16 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-4">
            Kalkulator
          </p>
          <h3 className="text-[18px] font-semibold tracking-tight text-foreground mb-2">
            Lohnt sich das Klinik-System für Ihre Institution?
          </h3>
          <p className="text-[13px] text-muted-foreground mb-6 leading-relaxed">
            Tägliches Engpass-Monitoring kostet Personalzeit. Rechnen Sie nach, ab wann sich das Klinik-System amortisiert.
          </p>
          <RoiCalculator />
        </div>

      </div>
    </section>
  )
}

export function FinalCtaSection() {
  const [checkoutModal, setCheckoutModal] = useState<CheckoutModalState | null>(null)
  const [researchModal, setResearchModal] = useState(false)
  const professionalTier = TIERS.find(t => t.key === 'professional')!

  return (
    <section className="border-t border-border/40">
      {checkoutModal && (
        <CheckoutModal state={checkoutModal} onClose={() => setCheckoutModal(null)} />
      )}
      {researchModal && (
        <ResearchModal onClose={() => setResearchModal(false)} />
      )}
      <div className="max-w-2xl mx-auto px-4 py-20 sm:py-28 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-6">
          Loslegen
        </p>
        <h2 className="text-[clamp(28px,3.5vw,48px)] font-semibold tracking-[-0.025em] text-foreground leading-[1.1] mb-5">
          Jetzt integrieren.
        </h2>
        <p className="text-[14px] text-muted-foreground leading-[1.6] mb-10">
          Kostenlos testen — ohne Key, ohne Login. Für produktive Integrationen gibt es Professional- und Institutional-Pläne.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setCheckoutModal({ tier: professionalTier, yearly: false })}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Professional abonnieren
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setResearchModal(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-muted/40 px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Research-Key beantragen
          </button>
        </div>
        <p className="text-[12px] text-muted-foreground mt-6">
          Fragen?{' '}
          <a href="mailto:api@engpassradar.ch" className="underline hover:text-foreground">
            api@engpassradar.ch
          </a>
        </p>
      </div>
    </section>
  )
}
