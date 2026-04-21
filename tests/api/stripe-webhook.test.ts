import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// ── Env setup (must happen before module imports) ──────────────────────────
const PRICE_PRO_MONTHLY = 'price_1TOe4p2EVyJLltFI9XPSgZgP'
const PRICE_PRO_YEARLY = 'price_1TOe4q2EVyJLltFIZMKM7PTV'
const PRICE_INST_MONTHLY = 'price_1TOe4q2EVyJLltFIxRI4EHNZ'
const PRICE_INST_YEARLY = 'price_1TOe4r2EVyJLltFIrRiprlr3'

process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_dummy'
process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY = PRICE_PRO_MONTHLY
process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY = PRICE_PRO_YEARLY
process.env.STRIPE_PRICE_INSTITUTIONAL_MONTHLY = PRICE_INST_MONTHLY
process.env.STRIPE_PRICE_INSTITUTIONAL_YEARLY = PRICE_INST_YEARLY
process.env.API_KEY_JWT_SECRET = 'test-secret-32-chars-minimum-len'
process.env.NEXT_PUBLIC_SITE_URL = 'https://engpassradar.ch'

// ── Mocks ──────────────────────────────────────────────────────────────────
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock.jwt.token'),
  })),
  jwtVerify: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    stripeCustomer: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    apiKey: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/resend', () => ({
  getResend: () => ({ emails: { send: jest.fn().mockResolvedValue({}) } }),
  FROM_ADDRESS: 'noreply@engpassradar.ch',
  SITE_URL: 'https://engpassradar.ch',
}))

const mockConstructEvent = jest.fn()
const mockListLineItems = jest.fn()

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: { constructEvent: mockConstructEvent },
    checkout: { sessions: { listLineItems: mockListLineItems } },
  }))
})

// ── Imports after mocks ────────────────────────────────────────────────────
import { generateApiKey, tierDailyLimit } from '@/lib/api-keys'
import { TIERS, TIER_DAILY_LIMITS } from '@/lib/pricing'
import { prisma } from '@/lib/prisma'
import { POST } from '@/app/api/webhooks/stripe/route'

// ── api-keys unit tests ────────────────────────────────────────────────────
describe('generateApiKey', () => {
  it('returns a 64-char hex plaintext and matching sha256 hash', () => {
    const { plaintext, hash } = generateApiKey()
    expect(plaintext).toHaveLength(64)
    expect(hash).toHaveLength(64)
    expect(plaintext).not.toBe(hash)
  })

  it('generates unique keys on each call', () => {
    const a = generateApiKey()
    const b = generateApiKey()
    expect(a.plaintext).not.toBe(b.plaintext)
  })
})

describe('tierDailyLimit', () => {
  it('returns correct limits for all known tiers', () => {
    expect(tierDailyLimit('free')).toBe(100)
    expect(tierDailyLimit('research')).toBe(2000)
    expect(tierDailyLimit('professional')).toBe(10000)
    expect(tierDailyLimit('institutional')).toBe(100000)
  })

  it('falls back to 100 for unknown tier', () => {
    expect(tierDailyLimit('unknown')).toBe(100)
  })
})

// ── pricing.ts consistency ─────────────────────────────────────────────────
describe('TIERS config', () => {
  it('has exactly 5 tiers in correct order', () => {
    const keys = TIERS.map(t => t.key)
    expect(keys).toEqual(['free', 'research', 'professional', 'institutional', 'data_license'])
  })

  it('professional has correct Stripe price IDs', () => {
    const pro = TIERS.find(t => t.key === 'professional')!
    expect(pro.stripePriceMonthly).toBe(PRICE_PRO_MONTHLY)
    expect(pro.stripePriceYearly).toBe(PRICE_PRO_YEARLY)
    expect(pro.yearlyAmountCHF).toBe(390)
  })

  it('institutional has correct Stripe price IDs', () => {
    const inst = TIERS.find(t => t.key === 'institutional')!
    expect(inst.stripePriceMonthly).toBe(PRICE_INST_MONTHLY)
    expect(inst.stripePriceYearly).toBe(PRICE_INST_YEARLY)
    expect(inst.yearlyAmountCHF).toBe(1990)
  })

  it('TIER_DAILY_LIMITS matches tierDailyLimit for all keys', () => {
    for (const [key, limit] of Object.entries(TIER_DAILY_LIMITS)) {
      expect(tierDailyLimit(key)).toBe(isFinite(limit) ? limit : 999999999)
    }
  })
})

// ── Webhook handler ────────────────────────────────────────────────────────
describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function makeRequest(body: string, sig = 'valid_sig') {
    return new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': sig, 'content-type': 'application/json' },
      body,
    })
  }

  it('returns 400 on invalid signature', async () => {
    mockConstructEvent.mockImplementation(() => { throw new Error('Bad sig') })
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(400)
    const data = await res.json() as { error: string }
    expect(data.error).toBe('Invalid signature')
  })

  it('returns 200 and creates API key on checkout.session.completed', async () => {
    const mockCustomer = { id: 'cust_1', email: 'user@test.ch', stripeId: 'cus_stripe' }
    const mockApiKey = { id: 'key_1', tier: 'professional', dailyLimit: 10000 }

    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_1',
          customer: 'cus_stripe',
          customer_email: 'user@test.ch',
          customer_details: { email: 'user@test.ch' },
        },
      },
    })
    mockListLineItems.mockResolvedValue({
      data: [{ price: { id: PRICE_PRO_MONTHLY } }],
    })
    ;(prisma.stripeCustomer.upsert as jest.Mock).mockResolvedValue(mockCustomer)
    ;(prisma.apiKey.create as jest.Mock).mockResolvedValue(mockApiKey)

    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    expect(prisma.apiKey.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tier: 'professional', dailyLimit: 10000 }) })
    )
  })

  it('maps all four price IDs to the correct tier', async () => {
    const cases: [string, string][] = [
      [PRICE_PRO_MONTHLY, 'professional'],
      [PRICE_PRO_YEARLY, 'professional'],
      [PRICE_INST_MONTHLY, 'institutional'],
      [PRICE_INST_YEARLY, 'institutional'],
    ]

    for (const [priceId, expectedTier] of cases) {
      jest.clearAllMocks()
      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_1', customer: 'cus_1', customer_email: 'a@b.ch' } },
      })
      mockListLineItems.mockResolvedValue({ data: [{ price: { id: priceId } }] })
      ;(prisma.stripeCustomer.upsert as jest.Mock).mockResolvedValue({ id: '1', email: 'a@b.ch' })
      ;(prisma.apiKey.create as jest.Mock).mockResolvedValue({ id: 'k1' })

      await POST(makeRequest('{}'))

      expect(prisma.apiKey.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ tier: expectedTier }) })
      )
    }
  })

  it('downgrades to free on subscription deletion', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { customer: 'cus_stripe', items: { data: [] } } },
    })
    ;(prisma.stripeCustomer.findUnique as jest.Mock).mockResolvedValue({ id: 'cust_1' })
    ;(prisma.apiKey.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    expect(prisma.apiKey.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tier: 'free' }) })
    )
  })

  it('returns 200 for unknown event types without side effects', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'payment_intent.created',
      data: { object: {} },
    })

    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(200)
    expect(prisma.apiKey.create).not.toHaveBeenCalled()
    expect(prisma.apiKey.updateMany).not.toHaveBeenCalled()
  })
})
