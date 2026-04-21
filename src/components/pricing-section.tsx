'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, ArrowRight, Zap, GraduationCap } from 'lucide-react'
import { TIERS, type Tier } from '@/lib/pricing'

function yearlyMonthlyEquivalent(yearlyAmount: number) {
  return Math.floor(yearlyAmount / 12)
}

// First two tiers (free + research) are merged into one combined card
const FREE_TIERS = TIERS.filter(t => t.key === 'free' || t.key === 'research')
const PAID_TIERS = TIERS.filter(t => t.key !== 'free' && t.key !== 'research')

function FreeCombinedCard() {
  const [tab, setTab] = useState<'free' | 'research'>('free')
  const tier = FREE_TIERS.find(t => t.key === tab)!

  return (
    <div className="relative flex flex-col rounded-2xl border bg-card hover:shadow-md hover:border-border/80 transition-all duration-200">
      <div className="p-5 flex flex-col flex-1 space-y-4">

        {/* Internal tab toggle */}
        <div className="flex rounded-lg border bg-muted/40 p-0.5 gap-0.5">
          <button
            onClick={() => setTab('free')}
            className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-all ${
              tab === 'free'
                ? 'bg-background shadow text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setTab('research')}
            className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
              tab === 'research'
                ? 'bg-background shadow text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <GraduationCap className="h-3 w-3" />
            Research
          </button>
        </div>

        {/* Tier label */}
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {tier.label}
        </p>

        {/* Price */}
        <div className="min-h-[52px] space-y-0.5">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">Kostenlos</span>
          </div>
          <p className="text-[11px] text-muted-foreground">{tier.priceNote}</p>
        </div>

        {/* Rate limit pill */}
        <div className="rounded-lg bg-muted/60 px-3 py-2">
          <p className="text-[11px] font-semibold text-foreground">{tier.dailyLimit}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{tier.rateLimit}</p>
        </div>

        {/* Features */}
        <ul className="space-y-2 flex-1">
          {tier.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-500" />
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          href={tier.ctaHref}
          className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl border bg-background px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
        >
          {tier.cta}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}

function PaidCard({ tier, yearly }: { tier: Tier; yearly: boolean }) {
  const monthlyNum = tier.price !== null ? parseInt(tier.price, 10) : null
  const displayPrice =
    monthlyNum !== null && yearly && monthlyNum > 0 && tier.yearlyAmountCHF
      ? yearlyMonthlyEquivalent(tier.yearlyAmountCHF)
      : monthlyNum
  const annualSavings =
    monthlyNum !== null && yearly && monthlyNum > 0 && tier.yearlyAmountCHF
      ? monthlyNum * 12 - tier.yearlyAmountCHF
      : null

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

        <Link
          href={
            yearly && tier.paymentLinkYearly ? tier.paymentLinkYearly
            : !yearly && tier.paymentLinkMonthly ? tier.paymentLinkMonthly
            : tier.ctaHref
          }
          className={`mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${
            tier.highlight
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
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

export function PricingSection() {
  const [yearly, setYearly] = useState(false)

  return (
    <section id="pricing" className="max-w-5xl mx-auto px-4 py-16 space-y-10">

      {/* Header + billing toggle */}
      <div className="text-center space-y-5">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Tarife & Preise</h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Alle Preise in CHF, zzgl. MwSt. Monatliche Kündigung jederzeit möglich.
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

      {/* 4 cards: 1 combined free/research + 3 paid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
        <FreeCombinedCard />
        {PAID_TIERS.map((tier) => (
          <PaidCard key={tier.key} tier={tier} yearly={yearly} />
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
