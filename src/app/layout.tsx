import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ScrollToTop } from '@/components/scroll-to-top'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lieferengpass Medikamente Schweiz | engpass.radar',
  description: 'Alle aktuellen Medikamenten-Lieferengpässe der Schweiz — täglich aus drugshortage.ch und BWL aktualisiert. Suche nach Wirkstoff, Firma oder ATC-Code. Kostenlos, kein Login.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
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
      </body>
    </html>
  )
}
