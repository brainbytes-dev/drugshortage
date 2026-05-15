import type { Metadata } from 'next'
import { buildPageAlternates } from '@/lib/i18n-meta'
import type { Locale } from '@/i18n/routing'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ArrowRight, Code2 } from 'lucide-react'

import { PricingSection, FinalCtaSection } from '@/components/pricing-section'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const t = await getTranslations('ApiHub')
  const { locale } = await params
  const { canonical, languages } = buildPageAlternates('/api', locale as Locale)
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical, languages },
  }
}

const CURL_REQUEST = `curl "https://engpassradar.ch/api/v1/shortages
  ?atc=C09
  &status=1,4
  &limit=1" \\
  -H "X-Api-Key: ihr_api_key"`

const JSON_RESPONSE = `{
  "data": [
    {
      "gtin": "7680654320016",
      "bezeichnung": "Olmesartan Mepha Lactab 20 mg",
      "firma": "Mepha Pharma AG",
      "atcCode": "C09CA08",
      "statusCode": 1,
      "tageSeitMeldung": 183,
      "score": {
        "total": 57,
        "label": "Mittel",
        "breakdown": {
          "duration": 22,
          "noAlternatives": 15
        }
      }
    }
  ],
  "total": 68,
  "meta": {
    "generatedAt": "2026-04-20T10:00:00Z"
  }
}`

export default async function ApiLandingPage() {
  const t = await getTranslations('ApiHub')

  const VALUE_PROPS = [
    { title: t('valueProp1Title'), body: t('valueProp1Body') },
    { title: t('valueProp2Title'), body: t('valueProp2Body') },
    { title: t('valueProp3Title'), body: t('valueProp3Body') },
  ]

  const FAQS = [
    { q: t('faq1Q'), a: t('faq1A') },
    { q: t('faq2Q'), a: t('faq2A') },
    { q: t('faq3Q'), a: t('faq3A') },
    { q: t('faq4Q'), a: t('faq4A') },
    { q: t('faq5Q'), a: t('faq5A') },
  ]

  const FACTS = [t('fact1'), t('fact2'), t('fact3'), t('fact4')]

  return (
    <main className="min-h-screen bg-background">

      {/* ── HERO ── */}
      <div className="w-full bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 pt-16 pb-16 sm:px-10 sm:pt-20">
          <div className="max-w-3xl">

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-3 mb-10">
              <span aria-hidden="true" className="relative flex h-2 w-2 shrink-0">
                <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-status-resolved opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-status-resolved" />
              </span>
              <span className="font-mono text-[11px] text-muted-foreground tracking-[0.04em] uppercase">
                {t('eyebrow')}
              </span>
            </div>

            <h1 className="font-serif text-[clamp(40px,5vw,68px)] font-semibold leading-[1.05] tracking-tight text-foreground mb-5">
              {t('h1')}
            </h1>
            <p className="text-base text-muted-foreground max-w-xl leading-relaxed mb-8">
              {t('subtitle')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-3 mb-10">
              <Link
                href="/api-docs"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 min-h-11 sm:min-h-10 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors min-w-32"
              >
                <Code2 className="h-4 w-4" />
                {t('ctaDocs')}
              </Link>
              <Link
                href={{ pathname: '/api', hash: 'pricing' }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border-strong bg-muted/40 px-5 min-h-11 sm:min-h-10 text-sm font-semibold text-foreground hover:bg-muted transition-colors min-w-32"
              >
                {t('ctaPricing')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Fact strip */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {FACTS.map((fact, i, arr) => (
                <span key={fact} className="flex items-center gap-2 text-xs text-muted-foreground">
                  {fact}
                  {i < arr.length - 1 && <span aria-hidden className="text-border-strong">·</span>}
                </span>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* ── VALUE PROPS ── */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-20 sm:py-24">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary mb-14">
            {t('valuePropsEyebrow')}
          </p>
          <h2 className="sr-only">{t('valuePropsEyebrow')}</h2>
          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-12">
            {VALUE_PROPS.map(({ title, body }, i) => (
              <li key={title}>
                <p className="font-mono text-[11px] text-primary mb-4">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="text-base font-semibold tracking-tight text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── CODE TERMINAL — integrated into brand, not GitHub-slate ── */}
      <section className="border-t border-border bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-20">

          {/* Section label */}
          <div className="flex items-center justify-between mb-8">
            <p className="font-mono text-[11px] font-medium text-muted-foreground uppercase tracking-[0.18em]">
              {t('terminalRequestLabel')}
            </p>
            <Link
              href="/api-docs"
              className="font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('terminalAllEndpoints')}
            </Link>
          </div>

          {/* Terminal window */}
          <div className="rounded-lg overflow-hidden border border-border-strong bg-background">

            {/* Chrome bar — using status tokens as the universal close/min/max signals */}
            <div className="flex items-center gap-2 px-4 py-3 bg-muted border-b border-border">
              <span className="h-3 w-3 rounded-full bg-status-active" aria-hidden />
              <span className="h-3 w-3 rounded-full bg-status-longterm" aria-hidden />
              <span className="h-3 w-3 rounded-full bg-status-resolved" aria-hidden />
              <div className="ml-3 flex gap-1">
                <span className="rounded-md bg-background px-4 py-1 font-mono text-[11px] text-foreground border border-border">
                  request.sh
                </span>
                <span className="rounded-md px-4 py-1 font-mono text-[11px] text-muted-foreground">
                  response.json
                </span>
              </div>
            </div>

            {/* Split panes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border bg-background">

              {/* Left: curl request */}
              <div className="p-6">
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-4">
                  {t('terminalRequestPane')}
                </p>
                <pre className="font-mono text-[13px] leading-relaxed overflow-x-auto whitespace-pre">
                  <span className="text-status-resolved">$</span>
                  {' '}
                  <span className="text-foreground">{CURL_REQUEST}</span>
                </pre>
              </div>

              {/* Right: JSON response */}
              <div className="p-6">
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-4">
                  {t('terminalResponsePane')} <span className="text-status-resolved ml-2">200 OK</span>
                </p>
                <pre className="font-mono text-[13px] leading-relaxed overflow-x-auto whitespace-pre">
                  {JSON_RESPONSE.split('\n').map((line, i) => {
                    const colored = line
                      .replace(/"([^"]+)":/g, '<k>"$1"</k>:')
                      .replace(/: "([^"]+)"/g, ': <v>"$1"</v>')
                      .replace(/: (\d+)/g, ': <n>$1</n>')
                    return (
                      <span
                        key={i}
                        dangerouslySetInnerHTML={{ __html: colored + '\n' }}
                        className="text-foreground/80 [&_k]:text-status-new [&_v]:text-status-resolved [&_n]:text-status-longterm"
                      />
                    )
                  })}
                </pre>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── MCP HINT ── */}
      <section className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{t('mcpTitle')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('mcpBody')}{' '}
              <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">find_alternatives</code>,{' '}
              <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">check_atc_group</code>,{' '}
              <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">get_company_status</code>{' '}
              {t('mcpToolsSuffix')}
            </p>
          </div>
          <Link
            href={{ pathname: '/api-docs', hash: 'mcp' }}
            className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-border-strong bg-muted/40 px-4 min-h-10 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            {t('mcpCta')}
          </Link>
        </div>
      </section>

      {/* ── PRICING ── */}
      <PricingSection />

      {/* ── FAQ ── */}
      <section className="border-t border-border bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 py-20 sm:py-28">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary mb-14">
            {t('faqEyebrow')}
          </p>
          <h2 className="sr-only">{t('faqEyebrow')}</h2>
          <div className="border-t border-border">
            {FAQS.map(({ q, a }, i) => (
              <details key={q} className="group border-b border-border">
                <summary className="flex items-baseline gap-4 py-6 cursor-pointer list-none select-none">
                  <span className="font-mono text-[11px] text-primary font-medium min-w-8 shrink-0 mt-1">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 text-base font-semibold leading-snug tracking-tight group-hover:text-primary transition-colors duration-150">
                    {q}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                    className="h-4 w-4 shrink-0 text-muted-foreground group-open:rotate-45 transition-transform duration-150 ease-out ml-4" aria-hidden>
                    <path strokeLinecap="round" d="M8 2v12M2 8h12" />
                  </svg>
                </summary>
                <p className="pl-12 pb-6 text-sm text-muted-foreground leading-relaxed sm:pr-10">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <FinalCtaSection />

    </main>
  )
}
