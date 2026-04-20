import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { SITE_URL } from '@/lib/resend'

export const dynamic = 'force-dynamic'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const { amount } = await req.json()
  const cents = Math.round(Number(amount) * 100)
  if (!cents || cents < 500) {
    return NextResponse.json({ error: 'Minimum CHF 5' }, { status: 400 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'chf',
          product_data: { name: 'Unterstützung für Engpassradar' },
          unit_amount: cents,
        },
        quantity: 1,
      },
    ],
    success_url: `${SITE_URL}/danke`,
    cancel_url: `${SITE_URL}/api-docs`,
  })

  return NextResponse.json({ url: session.url })
}
