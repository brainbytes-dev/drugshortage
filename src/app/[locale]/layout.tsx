import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import '../globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ScrollToTop } from '@/components/scroll-to-top'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { routing, type Locale } from '@/i18n/routing'
import { LOCALE_OG } from '@/lib/i18n-meta'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ['latin'] })

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}

  const t = await getTranslations({ locale, namespace: 'Meta' })

  return {
    title: t('title'),
    description: t('description'),
    metadataBase: new URL('https://engpassradar.ch'),
    openGraph: {
      type: 'website',
      siteName: 'engpass.radar',
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: 'https://engpassradar.ch',
      locale: LOCALE_OG[locale as Locale],
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: t('ogImageAlt'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('twitterTitle'),
      description: t('twitterDescription'),
    },
    icons: {
      icon: [
        { url: '/favicon-light.svg', type: 'image/svg+xml', media: '(prefers-color-scheme: light)' },
        { url: '/favicon-dark.svg', type: 'image/svg+xml', media: '(prefers-color-scheme: dark)' },
      ],
    },
    // No `alternates` here — every page below sets its own via
    // buildPageAlternates(), and a layout-level canonical would otherwise
    // bleed the home URL onto pages without their own metadata.
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const tDataset = await getTranslations({ locale, namespace: 'StructuredData' })

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="lazyOnload"
            />
            <Script id="gtag-init" strategy="lazyOnload">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                analytics_storage: 'granted',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                regions: ['CH']
              });
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { anonymize_ip: true });
            `}</Script>
          </>
        )}
      </head>
      <body className={`${inter.className} antialiased overflow-x-hidden`}>
        <script
        type="application/ld+json"
        suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'engpass.radar',
              url: 'https://www.engpassradar.ch',
              description: tDataset('siteDescription'),
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://www.engpassradar.ch/?search={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }).replace(/</g, '\\u003c'),
          }}
        />
        <NextIntlClientProvider>
          <ThemeProvider>
            <div className="min-h-screen flex flex-col">
              <SiteHeader />
              <div className="flex-1">{children}</div>
              <SiteFooter />
            </div>
            <ScrollToTop />
          </ThemeProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
