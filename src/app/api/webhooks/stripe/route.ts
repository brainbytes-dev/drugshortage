import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from "@/lib/prisma"
import { generateApiKey, signMagicToken, tierDailyLimit, encryptApiKeyValue } from '@/lib/api-keys'
import { getResend, FROM_ADDRESS, SITE_URL } from '@/lib/resend'
import { institutionalOnboardingEmail, institutionalOnboardingSubject } from '@/lib/email-templates'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'placeholder')

const PRICE_TO_TIER: Record<string, string> = {
  [process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY ?? '']: 'professional',
  [process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY ?? '']: 'professional',
  [process.env.STRIPE_PRICE_INSTITUTIONAL_MONTHLY ?? '']: 'institutional',
  [process.env.STRIPE_PRICE_INSTITUTIONAL_YEARLY ?? '']: 'institutional',
}

async function sendApiKeyMail(email: string, plaintext: string, tier: string, keyId: string) {
  const token = await signMagicToken(keyId, email)
  const dashboardUrl = `${SITE_URL}/api-keys?token=${token}`
  const resend = getResend()
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: 'Ihr Engpassradar API-Key',
    html: `
<p>Guten Tag,</p>
<p>vielen Dank für Ihr Abo. Hier ist Ihr API-Key:</p>
<pre style="background:#f4f4f5;padding:12px;border-radius:6px;font-size:14px;">${plaintext}</pre>
<p>Ihr Tier: <strong>${tier}</strong></p>
<p><a href="${dashboardUrl}">Zum API-Dashboard →</a> — dort sehen Sie Ihren Key jederzeit, verwalten Ihr Abo und überwachen Ihre Nutzung.</p>
<p>Schnellstart:</p>
<pre style="background:#f4f4f5;padding:12px;border-radius:6px;font-size:14px;">curl -H "Authorization: Bearer ${plaintext}" \\
  ${SITE_URL}/api/v1/shortages</pre>
<p>Engpassradar</p>
`,
  })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const email = session.customer_email ?? session.customer_details?.email
  if (!email) return

  const stripeCustomerId = session.customer as string
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 })
  const priceId = lineItems.data[0]?.price?.id ?? ''
  const tier = PRICE_TO_TIER[priceId] ?? 'professional'

  const customer = await prisma.stripeCustomer.upsert({
    where: { email },
    create: { email, stripeId: stripeCustomerId },
    update: { stripeId: stripeCustomerId },
  })

  const { plaintext, hash } = generateApiKey()
  const apiKey = await prisma.apiKey.create({
    data: {
      customerId: customer.id,
      keyHash: hash,
      keyEncrypted: encryptApiKeyValue(plaintext),
      tier,
      dailyLimit: tierDailyLimit(tier),
    },
  })

  await sendApiKeyMail(email, plaintext, tier, apiKey.id)

  if (tier === 'institutional') {
    const token = await signMagicToken(apiKey.id, email)
    const dashboardUrl = `${SITE_URL}/api-keys?token=${token}`
    const resend = getResend()
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: institutionalOnboardingSubject(),
      html: institutionalOnboardingEmail({ email, dashboardUrl }),
    })
  }
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const stripeCustomerId = sub.customer as string
  const priceId = sub.items.data[0]?.price.id ?? ''
  const tier = PRICE_TO_TIER[priceId] ?? 'professional'

  const customer = await prisma.stripeCustomer.findUnique({ where: { stripeId: stripeCustomerId } })
  if (!customer) return

  await prisma.apiKey.updateMany({
    where: { customerId: customer.id, active: true },
    data: { tier, dailyLimit: tierDailyLimit(tier) },
  })
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const stripeCustomerId = sub.customer as string
  const customer = await prisma.stripeCustomer.findUnique({ where: { stripeId: stripeCustomerId } })
  if (!customer) return

  await prisma.apiKey.updateMany({
    where: { customerId: customer.id },
    data: { tier: 'free', dailyLimit: tierDailyLimit('free') },
  })
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const stripeCustomerId = invoice.customer as string
  const customer = await prisma.stripeCustomer.findUnique({ where: { stripeId: stripeCustomerId } })
  if (!customer) return

  const resend = getResend()
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: customer.email,
    subject: 'Zahlungsproblem bei Ihrem Engpassradar-Abo',
    html: `
<p>Guten Tag,</p>
<p>leider konnte Ihre letzte Zahlung nicht verarbeitet werden.</p>
<p>Bitte aktualisieren Sie Ihre Zahlungsmethode im <a href="${SITE_URL}/api/api-keys/portal">Kunden-Portal</a>, damit Ihr Abo aktiv bleibt.</p>
<p>Engpassradar</p>
`,
  })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
      break
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
      break
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
      break
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice)
      break
  }

  return NextResponse.json({ received: true })
}
