import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ScrollToTop } from '@/components/scroll-to-top'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lieferengpass Medikamente Schweiz | engpass.radar',
  description: 'Alle aktuellen Medikamenten-Lieferengpässe der Schweiz — täglich aus drugshortage.ch und BWL aktualisiert. Suche nach Wirkstoff, Firma oder ATC-Code. Kostenlos, kein Login.',
  metadataBase: new URL('https://engpassradar.ch'),
  openGraph: {
    type: 'website',
    siteName: 'engpass.radar',
    title: 'Lieferengpass Medikamente Schweiz | engpass.radar',
    description: 'Tagesaktuelle Medikamenten-Lieferengpässe der Schweiz — Severity Score, Alternativen, ATC-Filter. Aus drugshortage.ch, BWL und ODDB.',
    url: 'https://engpassradar.ch',
    locale: 'de_CH',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'engpass.radar — Schweizer Medikamenten-Lieferengpässe' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'engpass.radar — Schweizer Medikamenten-Lieferengpässe',
    description: 'Tagesaktuelle Engpässe, Severity Scores und Alternativen. Kostenlos, ohne Login.',
  },
  icons: {
    icon: [
      { url: '/favicon-light.svg', type: 'image/svg+xml', media: '(prefers-color-scheme: light)' },
      { url: '/favicon-dark.svg',  type: 'image/svg+xml', media: '(prefers-color-scheme: dark)' },
    ],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // hreflang: add <link rel="alternate" hreflang="fr" href="https://www.engpassradar.ch/fr/..." /> in <head> once FR/IT content exists
  return (
    <html lang="de" suppressHydrationWarning>
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
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "engpass.radar",
              "url": "https://www.engpassradar.ch",
              "description": "Aktuelle Lieferengpässe bei Medikamenten in der Schweiz — täglich aktualisiert.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://www.engpassradar.ch/?search={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            }).replace(/</g, '\u003c')
          }}
        />
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </div>
          <ScrollToTop />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
