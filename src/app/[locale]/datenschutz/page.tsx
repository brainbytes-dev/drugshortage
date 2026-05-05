import type { Metadata } from 'next'
import Script from 'next/script'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Datenschutz')
  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
  }
}

export default async function DatenschutzPage() {
  const t = await getTranslations('Datenschutz')

  // Full HTML body kept as a single translation key per locale.
  // Source content based on a datenschutz-generator.de template (Dr. Thomas Schwenke),
  // adapted for HM Consulting Rühe with Vercel and Supabase added under «Webhosting».
  // TODO_LEGAL: review by jurist for non-DE locales.
  const content = t.raw('content') as string

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: t('jsonLdName'),
    url: 'https://www.engpassradar.ch/datenschutz',
    isPartOf: { '@id': 'https://www.engpassradar.ch' },
  }

  return (
    <main className="bg-background">
      <Script
        id="ld-datenschutz"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <article
          className="
            [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:mb-2 [&_h1]:pb-8 [&_h1]:border-b
            [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3
            [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:text-[15px] [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4
            [&_ul]:text-[15px] [&_ul]:text-muted-foreground [&_ul]:mb-4 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:list-outside
            [&_li]:mb-2 [&_li]:leading-relaxed
            [&_a]:underline [&_a]:hover:text-foreground
            [&_strong]:text-foreground [&_strong]:font-semibold
            [&_.seal]:mt-10 [&_.seal]:pt-6 [&_.seal]:border-t [&_.seal]:border-border [&_.seal]:text-sm [&_.seal]:text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </main>
  )
}
