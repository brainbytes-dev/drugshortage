import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
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
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/watchlist/confirmed',
          '/watchlist/unsubscribed',
          '/watchlist/error',
          '/api-keys/success',
          '/danke',
          '/subscription-confirmed',
        ],
      },
    ],
    sitemap: 'https://engpassradar.ch/sitemap.xml',
  }
}
