import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { SITE_URL } from '@/lib/resend'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const { email, priceId } = await req.json()
  if (!email || !priceId) {
    return NextResponse.json({ error: 'email and priceId required' }, { status: 400 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${SITE_URL}/api-keys/success`,
    cancel_url: `${SITE_URL}/api-keys`,
    billing_address_collection: 'required',
    tax_id_collection: { enabled: true },
    automatic_tax: { enabled: true },
  })

  return NextResponse.json({ url: session.url })
}
