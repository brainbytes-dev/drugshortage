export type TierKey = 'free' | 'research' | 'professional' | 'institutional' | 'data_license'

export interface Tier {
  key: TierKey
  label: string
  price: string | null  // null = Kontakt nötig
  priceNote: string
  dailyLimit: string
  rateLimit: string
  features: string[]
  cta: string
  ctaHref: string
  highlight?: boolean
  stripePriceMonthly?: string
  stripePriceYearly?: string
  yearlyAmountCHF?: number  // actual Stripe yearly charge for savings display
}

export const TIERS: Tier[] = [
  {
    key: 'free',
    label: 'Free',
    price: '0',
    priceNote: 'Kein Key erforderlich',
    dailyLimit: '100 Req/Tag',
    rateLimit: 'IP-basiert, kein Key',
    features: [
      'Alle öffentlichen Endpunkte',
      'JSON + CSV Export',
      'Kein API-Key notwendig',
      'Empfohlen für Tests & Prototypen',
    ],
    cta: 'Direkt loslegen',
    ctaHref: '/api-docs',
  },
  {
    key: 'research',
    label: 'Research',
    price: '0',
    priceNote: 'Akademischer Nachweis',
    dailyLimit: '2 000 Req/Tag',
    rateLimit: 'Key-basiert',
    features: [
      'Für Universitäten & Forschungsinstitutionen',
      'Höheres Limit ohne Kosten',
      'Schnellere Freischaltung bei .edu-Mail',
      'Forschungsnachweis erforderlich',
    ],
    cta: 'Research-Key beantragen',
    ctaHref: '/api-keys/research',
  },
  {
    key: 'professional',
    label: 'Professional',
    price: '39',
    priceNote: 'CHF / Monat',
    dailyLimit: '10 000 Req/Tag',
    rateLimit: 'Key-basiert',
    features: [
      'Für individuelle Entwickler & Apotheken',
      'Severity-Score & Breakdown',
      'Alternatives-Batch API (bis 50 GTINs)',
      'E-Mail-Support',
    ],
    cta: 'Professional abonnieren',
    ctaHref: '/api-keys?tier=professional',
    highlight: true,
    stripePriceMonthly: 'price_1TOe4p2EVyJLltFI9XPSgZgP',
    stripePriceYearly: 'price_1TOe4q2EVyJLltFIZMKM7PTV',
    yearlyAmountCHF: 390,
  },
  {
    key: 'institutional',
    label: 'Institutional',
    price: '199',
    priceNote: 'CHF / Monat',
    dailyLimit: '100 000 Req/Tag',
    rateLimit: 'Key-basiert',
    features: [
      'Für Kliniken & Softwarehersteller',
      'Prioritäts-Support',
      'SLA 99.9 % Verfügbarkeit',
      'Webhooks auf Anfrage',
    ],
    cta: 'Institutional abonnieren',
    ctaHref: '/api-keys?tier=institutional',
    stripePriceMonthly: 'price_1TOe4q2EVyJLltFIxRI4EHNZ',
    stripePriceYearly: 'price_1TOe4r2EVyJLltFIrRiprlr3',
    yearlyAmountCHF: 1990,
  },
  {
    key: 'data_license',
    label: 'Data License',
    price: null,
    priceNote: 'Individuelles Angebot',
    dailyLimit: 'Unbegrenzt',
    rateLimit: 'Individuell vereinbart',
    features: [
      'Vollständiger Datensatz',
      'Täglicher Bulk-Export',
      'White-Label & Redistribution',
      'Dedizierter Account Manager',
    ],
    cta: 'Kontakt aufnehmen',
    ctaHref: 'mailto:api@engpassradar.ch',
  },
]

/** Daily request limits per tier (for proxy.ts / api-keys lib) */
export const TIER_DAILY_LIMITS: Record<TierKey, number> = {
  free: 100,          // per hour, IP-based
  research: 2_000,
  professional: 10_000,
  institutional: 100_000,
  data_license: Infinity,
}
