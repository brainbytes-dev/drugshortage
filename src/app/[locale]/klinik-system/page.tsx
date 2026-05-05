import type { Metadata } from 'next'
import { buildPageAlternates } from '@/lib/i18n-meta'
import type { Locale } from '@/i18n/routing'
import { getTranslations } from 'next-intl/server'
import { CheckCircle2, ArrowRight, Clock, BarChart3, Bell } from 'lucide-react'
import { KlinikSystemForm } from '@/components/klinik-system-form'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const t = await getTranslations('KlinikSystem')
  const { locale } = await params
  const { canonical, languages } = buildPageAlternates('/klinik-system', locale as Locale)
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical, languages },
  }
}

export default async function KlinikSystemPage() {
  const t = await getTranslations('KlinikSystem')

  const PAIN_POINTS = [
    {
      icon: Clock,
      title: t('pain1Title'),
      body: t('pain1Body'),
    },
    {
      icon: BarChart3,
      title: t('pain2Title'),
      body: t('pain2Body'),
    },
    {
      icon: Bell,
      title: t('pain3Title'),
      body: t('pain3Body'),
    },
  ]

  const INCLUDES = [
    t('include1'),
    t('include2'),
    t('include3'),
    t('include4'),
    t('include5'),
    t('include6'),
  ]

  const OBJECTIONS = [
    { q: t('objection1Q'), a: t('objection1A') },
    { q: t('objection2Q'), a: t('objection2A') },
    { q: t('objection3Q'), a: t('objection3A') },
    { q: t('objection4Q'), a: t('objection4A') },
  ]

  const STATS = [
    { value: t('stat1Value'), label: t('stat1Label') },
    { value: t('stat2Value'), label: t('stat2Label') },
    { value: t('stat3Value'), label: t('stat3Label') },
    { value: t('stat4Value'), label: t('stat4Label') },
  ]

  return (
    <>
      <main className="bg-background">

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-8 pt-20 pb-16 sm:pt-28 sm:pb-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-5">
            {t('heroEyebrow')}
          </p>
          <h1 className="text-[clamp(28px,4vw,52px)] font-semibold tracking-[-0.025em] text-foreground leading-[1.1] max-w-3xl mb-6">
            {t('heroH1')}
          </h1>
          <p className="text-[15px] text-muted-foreground leading-[1.65] max-w-xl mb-10">
            {t('heroSubtitle')}
          </p>
          <a
            href="#anfrage"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            {t('heroCta')}
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="mt-3 text-[12px] text-muted-foreground">
            {t('heroCtaNote')}
          </p>
        </section>

        {/* Pain points */}
        <section className="border-t border-border/40 bg-muted/[0.15]">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-10">
              {t('painPointsEyebrow')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {PAIN_POINTS.map(({ icon: Icon, title, body }) => (
                <div key={title}>
                  <Icon className="h-5 w-5 text-primary mb-4" />
                  <h3 className="text-[15px] font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-[1.65]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's included + form */}
        <section className="border-t border-border/40">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-5">
                  {t('includesEyebrow')}
                </p>
                <h2 className="text-[22px] font-semibold tracking-tight text-foreground mb-2 leading-snug">
                  {t('includesH2')}
                </h2>
                <p className="text-[13px] text-muted-foreground mb-6 leading-relaxed">
                  {t('includesSubtitle')}
                </p>
                <ul className="space-y-3">
                  {INCLUDES.map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-[13px] text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 rounded-xl border border-border/50 bg-muted/30 px-4 py-3 space-y-2">
                  <p className="text-[12px] text-muted-foreground">
                    <strong className="text-foreground">{t('comparisonLabel')}</strong> {t('comparisonBody')}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    <strong className="text-foreground">{t('purchaseLabel')}</strong> {t('purchaseBody')}
                  </p>
                </div>
              </div>

              {/* Application form */}
              <div id="anfrage" className="rounded-2xl border bg-card shadow-sm p-6 scroll-mt-20">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  {t('formEyebrow')}
                </p>
                <p className="text-[17px] font-semibold text-foreground mb-1">
                  {t('formTitle')}
                </p>
                <p className="text-[12px] text-muted-foreground mb-5 leading-relaxed">
                  {t('formSubtitle')}
                </p>
                <KlinikSystemForm />
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-t border-border/40 bg-muted/[0.15]">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-14 sm:py-16">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
              {STATS.map(({ value, label }) => (
                <div key={label}>
                  <p className="text-[28px] font-bold tracking-tight text-foreground tabular-nums">{value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Objection handling */}
        <section className="border-t border-border/40">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-10">
              {t('objectionsEyebrow')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
              {OBJECTIONS.map(({ q, a }) => (
                <div key={q}>
                  <p className="text-[14px] font-semibold text-foreground mb-2">{q}</p>
                  <p className="text-[13px] text-muted-foreground leading-[1.65]">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border/40 bg-muted/[0.15]">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16 sm:py-20 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-5">
              {t('finalEyebrow')}
            </p>
            <h2 className="text-[clamp(22px,3vw,36px)] font-semibold tracking-tight text-foreground mb-4">
              {t('finalH2')}
            </h2>
            <p className="text-[14px] text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
              {t('finalSubtitle')}
            </p>
            <a
              href="#anfrage"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              {t('finalCta')}
              <ArrowRight className="h-4 w-4" />
            </a>
            <p className="mt-3 text-[12px] text-muted-foreground">{t('finalCtaNote')}</p>
          </div>
        </section>

        {/* Back to pricing */}
        <section className="border-t border-border/40">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-muted-foreground">
              {t('backRow')}
            </p>
            <a
              href="/api#pricing"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline"
            >
              {t('backRowCta')}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>

      </main>
    </>
  )
}
