import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['de', 'en', 'fr', 'it'] as const,
  defaultLocale: 'de',
  localePrefix: 'as-needed',

  pathnames: {
    '/': '/',

    // Marketing / API hub
    '/api': {
      de: '/api',
      en: '/api',
      fr: '/api',
      it: '/api',
    },
    '/api-docs': {
      de: '/api-docs',
      en: '/api-docs',
      fr: '/api-docs',
      it: '/api-docs',
    },
    '/api-keys': {
      de: '/api-keys',
      en: '/api-keys',
      fr: '/api-keys',
      it: '/api-keys',
    },
    '/api-keys/success': {
      de: '/api-keys/success',
      en: '/api-keys/success',
      fr: '/api-keys/success',
      it: '/api-keys/success',
    },

    // Blog
    '/blog': '/blog',
    '/blog/[slug]': '/blog/[slug]',

    // Misc landing pages
    '/danke': {
      de: '/danke',
      en: '/thank-you',
      fr: '/merci',
      it: '/grazie',
    },
    '/datenschutz': {
      de: '/datenschutz',
      en: '/privacy',
      fr: '/confidentialite',
      it: '/privacy',
    },
    '/impressum': {
      de: '/impressum',
      en: '/imprint',
      fr: '/mentions-legales',
      it: '/note-legali',
    },
    '/nutzungsbedingungen': {
      de: '/nutzungsbedingungen',
      en: '/terms',
      fr: '/conditions-utilisation',
      it: '/termini-utilizzo',
    },
    '/methodik': {
      de: '/methodik',
      en: '/methodology',
      fr: '/methodologie',
      it: '/metodologia',
    },
    '/spenden': {
      de: '/spenden',
      en: '/donate',
      fr: '/faire-un-don',
      it: '/donare',
    },
    '/klinik-system': {
      de: '/klinik-system',
      en: '/hospital-system',
      fr: '/systeme-clinique',
      it: '/sistema-clinico',
    },
    '/subscription-confirmed': {
      de: '/subscription-confirmed',
      en: '/subscription-confirmed',
      fr: '/abonnement-confirme',
      it: '/abbonamento-confermato',
    },
    '/linkedin-banner': {
      de: '/linkedin-banner',
      en: '/linkedin-banner',
      fr: '/linkedin-banner',
      it: '/linkedin-banner',
    },

    // Watchlist sub-paths (transactional confirmation pages)
    '/watchlist/confirmed': {
      de: '/watchlist/bestaetigt',
      en: '/watchlist/confirmed',
      fr: '/watchlist/confirme',
      it: '/watchlist/confermato',
    },
    '/watchlist/unsubscribed': {
      de: '/watchlist/abgemeldet',
      en: '/watchlist/unsubscribed',
      fr: '/watchlist/desabonne',
      it: '/watchlist/disiscritto',
    },
    '/watchlist/error': {
      de: '/watchlist/fehler',
      en: '/watchlist/error',
      fr: '/watchlist/erreur',
      it: '/watchlist/errore',
    },

    // Domain entities (drugs, companies, active substances)
    '/medikament/[slug]': {
      de: '/medikament/[slug]',
      en: '/medication/[slug]',
      fr: '/medicament/[slug]',
      it: '/farmaco/[slug]',
    },
    '/firma/[slug]': {
      de: '/firma/[slug]',
      en: '/company/[slug]',
      fr: '/entreprise/[slug]',
      it: '/azienda/[slug]',
    },
    '/wirkstoff/[atc]': {
      de: '/wirkstoff/[atc]',
      en: '/active-substance/[atc]',
      fr: '/principe-actif/[atc]',
      it: '/principio-attivo/[atc]',
    },
    '/gtin/[gtin]': {
      de: '/gtin/[gtin]',
      en: '/gtin/[gtin]',
      fr: '/gtin/[gtin]',
      it: '/gtin/[gtin]',
    },
  },
})

export type Locale = (typeof routing.locales)[number]
export type Pathnames = keyof typeof routing.pathnames
