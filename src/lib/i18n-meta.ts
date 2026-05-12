import { routing, type Locale } from '@/i18n/routing'

export const SITE_URL = 'https://engpassradar.ch'

// hreflang values for each locale. Swiss-specific where possible (de-CH, fr-CH,
// it-CH); English uses the generic 'en' since the audience is international.
export const LOCALE_HREFLANG: Record<Locale, string> = {
  de: 'de-CH',
  en: 'en',
  fr: 'fr-CH',
  it: 'it-CH',
}

export const LOCALE_OG: Record<Locale, string> = {
  de: 'de_CH',
  en: 'en_US',
  fr: 'fr_CH',
  it: 'it_CH',
}

/**
 * Resolve the localised pathname for a given canonical href + locale.
 * Mirrors the rules in `src/i18n/routing.ts`. Supports static and dynamic
 * routes via `[slug]`/`[atc]`/`[gtin]` placeholders.
 */
export function localisedPath(
  href: string,
  locale: Locale,
  params?: Record<string, string>
): string {
  const pathnames = routing.pathnames as Record<string, string | Record<Locale, string>>
  const config = pathnames[href]
  let template: string
  if (config === undefined) {
    template = href
  } else if (typeof config === 'string') {
    template = config
  } else {
    template = config[locale] ?? config[routing.defaultLocale] ?? href
  }

  let resolved = template
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      resolved = resolved.replaceAll(`[${key}]`, value)
    }
  }
  return resolved
}

/** Absolute URL for a given href + locale. Default locale skips the prefix. */
export function buildLocaleUrl(
  href: string,
  locale: Locale,
  params?: Record<string, string>
): string {
  const path = localisedPath(href, locale, params)
  if (locale === routing.defaultLocale) {
    return `${SITE_URL}${path}`
  }
  return `${SITE_URL}/${locale}${path}`
}

/**
 * Build the canonical URL plus alternates.languages map for a page in a given
 * locale. The canonical URL is the page's URL in its OWN locale (Google's
 * preferred semantics). x-default points to the default locale (DE).
 */
export function buildPageAlternates(
  href: string,
  locale: Locale,
  params?: Record<string, string>
): { canonical: string; languages: Record<string, string> } {
  const languages: Record<string, string> = {}
  for (const l of routing.locales) {
    languages[LOCALE_HREFLANG[l]] = buildLocaleUrl(href, l, params)
  }
  languages['x-default'] = buildLocaleUrl(href, routing.defaultLocale, params)
  return {
    canonical: buildLocaleUrl(href, locale, params),
    languages,
  }
}
