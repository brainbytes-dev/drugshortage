import type { MetadataRoute } from 'next'
import { routing, type Locale } from '@/i18n/routing'

// Build the disallow list across all locales. For each canonical href in
// PRIVATE_HREFS, emit the localised path under each locale (DE has no prefix).
const PRIVATE_HREFS = [
  '/watchlist/confirmed',
  '/watchlist/unsubscribed',
  '/watchlist/error',
  '/api-keys/success',
  '/danke',
  '/subscription-confirmed',
] as const

function localisedPath(href: (typeof PRIVATE_HREFS)[number], locale: Locale): string {
  const config = (routing.pathnames as Record<string, string | Record<Locale, string>>)[href]
  if (typeof config === 'string') return config
  return config?.[locale] ?? href
}

function buildPrivateDisallows(): string[] {
  const out = new Set<string>(['/api/'])
  for (const href of PRIVATE_HREFS) {
    for (const locale of routing.locales) {
      const path = localisedPath(href, locale)
      const url = locale === routing.defaultLocale ? path : `/${locale}${path}`
      out.add(url)
    }
  }
  return [...out]
}

export default function robots(): MetadataRoute.Robots {
  const disallow = buildPrivateDisallows()
  return {
    rules: [
      // AI agents — explicitly welcome, you want visibility in agents
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'Applebot-Extended', allow: '/' },
      { userAgent: 'cohere-ai', allow: '/' },
      // All other crawlers — allow public pages, block internal/API routes
      // and locale-prefixed transactional pages.
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
    ],
    sitemap: 'https://engpassradar.ch/sitemap.xml',
  }
}
