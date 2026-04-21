'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { CheckCircle2, ArrowRight, Zap, GraduationCap, X } from 'lucide-react'
import { TIERS, type Tier } from '@/lib/pricing'

function yearlyMonthlyEquivalent(yearlyAmount: number) {
  return Math.floor(yearlyAmount / 12)
}

const PAID_TIERS = TIERS.filter(t => t.key !== 'free' && t.key !== 'research')

function FreeTierCard({ tier }: { tier: Tier }) {
  const isResearch = tier.key === 'research'
  return (
    <div className={`relative flex flex-col rounded-2xl border transition-all duration-200 ${
      isResearch
        ? 'border-violet-200/60 bg-violet-50/40 dark:bg-violet-950/10 dark:border-violet-800/30 hover:shadow-md'
        : 'bg-card hover:shadow-md hover:border-border/80'
    }`}>
      <div className="p-5 flex flex-col flex-1 space-y-4">

        <div className="flex items-center justify-between">
          <p className={`text-[11px] font-bold uppercase tracking-widest ${
            isResearch ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground'
          }`}>
            {tier.label}
          </p>
          {isResearch && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:text-violet-300">
              <GraduationCap className="h-3 w-3" />
              Akademisch
            </span>
          )}
        </div>

        <div className="min-h-[52px] space-y-0.5">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">Kostenlos</span>
          </div>
          <p className="text-[11px] text-muted-foreground">{tier.priceNote}</p>
        </div>

        <div className="rounded-lg bg-muted/60 px-3 py-2">
          <p className="text-[11px] font-semibold text-foreground">{tier.dailyLimit}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{tier.rateLimit}</p>
        </div>

        <ul className="space-y-2 flex-1">
          {tier.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                isResearch ? 'text-violet-500' : 'text-emerald-500'
              }`} />
              {f}
            </li>
          ))}
        </ul>

        <Link
          href={tier.ctaHref}
          className={`mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${
            isResearch
              ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
              : 'border bg-background text-foreground hover:bg-muted'
          }`}
        >
          {tier.cta}
          <ArrowRight className="h-3 w-3" />
        </Link>
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

  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload()
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  return (
    <section id="pricing" className="max-w-5xl mx-auto px-4 py-16 space-y-10">

      {checkoutModal && (
        <CheckoutModal state={checkoutModal} onClose={() => setCheckoutModal(null)} />
      )}

      {/* Header + billing toggle */}
      <div className="text-center space-y-5">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Tarife & Preise</h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Alle Preise in CHF. Monatliche Kündigung jederzeit möglich.
        </p>
        <div className="inline-flex items-center gap-1 rounded-full border bg-muted/40 p-1">
          <button
            onClick={() => setYearly(false)}
            className={`rounded-full px-5 py-2 text-xs font-semibold transition-all ${
              !yearly
                ? 'bg-background shadow text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monatlich
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`rounded-full px-5 py-2 text-xs font-semibold transition-all flex items-center gap-2 ${
              yearly
                ? 'bg-background shadow text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Jährlich
            <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 text-[10px] font-bold leading-none">
              2 Mt. gratis
            </span>
          </button>
        </div>
      </div>

      {/* 5 cards: Free + Research (each own card) + 3 paid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 items-stretch">
        {TIERS.filter(t => t.key === 'free' || t.key === 'research').map((tier) => (
          <FreeTierCard key={tier.key} tier={tier} />
        ))}
        {PAID_TIERS.map((tier) => (
          <PaidCard
            key={tier.key}
            tier={tier}
            yearly={yearly}
            onCheckout={(t, y) => setCheckoutModal({ tier: t, yearly: y })}
          />
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Alle Tarife beinhalten GTIN, Pharmacode, ATC-Code, Severity Score und tagesaktuelle Engpass-Daten.{' '}
        <Link href="/api-docs" className="underline hover:text-foreground">
          Vollständige Endpunkte →
        </Link>
      </p>
    </section>
  )
}

export function FinalCtaSection() {
  const [checkoutModal, setCheckoutModal] = useState<CheckoutModalState | null>(null)
  const professionalTier = TIERS.find(t => t.key === 'professional')!

  return (
    <section className="border-t bg-primary">
      {checkoutModal && (
        <CheckoutModal state={checkoutModal} onClose={() => setCheckoutModal(null)} />
      )}
      <div className="max-w-2xl mx-auto px-4 py-14 text-center space-y-5">
        <h2 className="text-xl font-bold text-primary-foreground">Bereit für den Echtbetrieb?</h2>
        <p className="text-sm text-primary-foreground/80">
          Starten Sie kostenlos — kein Key, kein Login. Oder sichern Sie sich einen Professional-Key für produktiven Einsatz.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setCheckoutModal({ tier: professionalTier, yearly: false })}
            className="inline-flex items-center gap-2 rounded-lg bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow"
          >
            Professional abonnieren — CHF 39/Mo
            <ArrowRight className="h-4 w-4" />
          </button>
          <Link
            href="/api-keys?tab=research"
            className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/30 px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
          >
            Research-Key beantragen
          </Link>
        </div>
        <p className="text-xs text-primary-foreground/60">
          Fragen?{' '}
          <a href="mailto:api@engpassradar.ch" className="underline hover:text-primary-foreground">
            api@engpassradar.ch
          </a>
        </p>
      </div>
    </section>
  )
}
