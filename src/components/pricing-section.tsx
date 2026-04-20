'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, ArrowRight, Zap } from 'lucide-react'
import { TIERS } from '@/lib/pricing'

const DISCOUNT = 0.15

function yearlyPrice(monthly: number) {
  return Math.floor(monthly * (1 - DISCOUNT))
}

export function PricingSection() {
  const [yearly, setYearly] = useState(false)

  return (
    <section id="pricing" className="max-w-6xl mx-auto px-4 py-16 space-y-10">

      {/* Header + toggle */}
      <div className="text-center space-y-5">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Tarife & Preise</h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Alle Preise in CHF, zzgl. MwSt. Monatliche Kündigung jederzeit möglich.
        </p>

        {/* Billing toggle */}
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
              −15 %
            </span>
          </button>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 items-stretch">
        {TIERS.map((tier) => {
          const monthlyNum = tier.price !== null ? parseInt(tier.price, 10) : null
          const displayPrice =
            monthlyNum !== null && yearly && monthlyNum > 0
              ? yearlyPrice(monthlyNum)
              : monthlyNum

          const annualSavings =
            monthlyNum !== null && yearly && monthlyNum > 0
              ? (monthlyNum - yearlyPrice(monthlyNum)) * 12
              : null

          return (
            <div
              key={tier.key}
              className={`relative flex flex-col rounded-2xl border transition-all duration-200 ${
                tier.highlight
                  ? 'border-primary bg-primary/5 shadow-lg ring-1 ring-primary/20'
                  : 'bg-card hover:shadow-md hover:border-border/80'
              }`}
            >
              {/* Beliebt badge */}
              {tier.highlight && (
                <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm">
                    <Zap className="h-3 w-3" />
                    Beliebt
                  </span>
                </div>
              )}

              <div className="p-5 flex flex-col flex-1 space-y-4">

                {/* Tier name */}
                <p className={`text-[11px] font-bold uppercase tracking-widest ${
                  tier.highlight ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {tier.label}
                </p>

                {/* Price block */}
                <div className="min-h-[52px] space-y-0.5">
                  {displayPrice !== null ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold tracking-tight text-foreground">
                          {displayPrice === 0 ? 'Kostenlos' : `CHF\u00A0${displayPrice}`}
                        </span>
                        {displayPrice > 0 && (
                          <span className="text-xs text-muted-foreground">/ Mo.</span>
                        )}
                      </div>
                      {annualSavings !== null && annualSavings > 0 ? (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Sie sparen CHF&nbsp;{annualSavings} pro Jahr
                        </p>
                      ) : (
                        !yearly && displayPrice > 0 && (
                          <p className="text-[11px] text-muted-foreground">{tier.priceNote}</p>
                        )
                      )}
                      {displayPrice === 0 && (
                        <p className="text-[11px] text-muted-foreground">{tier.priceNote}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-bold text-foreground">Auf Anfrage</p>
                      <p className="text-[11px] text-muted-foreground">{tier.priceNote}</p>
                    </>
                  )}
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
                      <CheckCircle2 className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                        tier.highlight ? 'text-primary' : 'text-emerald-500'
                      }`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={tier.ctaHref}
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
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Alle Tarife beinhalten GTIN, Pharmacode, ATC-Code, Severity Score und tagesaktuelle Engpass-Daten.{' '}
        <Link href="/api-docs" className="underline hover:text-foreground">Vollständige Endpunkte →</Link>
      </p>
    </section>
  )
}
