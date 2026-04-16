import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ScrollToTop } from '@/components/scroll-to-top'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

const inter = Inter({ subsets: ['latin'] })

// ---------------------------------------------------------------------------
// Analytics & Ads — fill in IDs to activate
// ---------------------------------------------------------------------------
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '' // e.g. G-XXXXXXXXXX
const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID ?? '' // e.g. ca-pub-XXXXXXXXXXXXXXXX

export const metadata: Metadata = {
  title: 'engpass.radar — Swiss Drug Shortage Tracker',
  description: 'Aktuelle Lieferengpässe bei Medikamenten in der Schweiz — täglich aktualisiert.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* Google AdSense — activated via NEXT_PUBLIC_ADSENSE_ID env var */}
        {ADSENSE_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
        )}
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* Google Analytics — activated via NEXT_PUBLIC_GA_ID env var */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}

        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </div>
          <ScrollToTop />
        </ThemeProvider>
      </body>
    </html>
  )
}
