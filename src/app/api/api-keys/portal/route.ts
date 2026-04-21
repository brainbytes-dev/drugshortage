import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from "@/lib/prisma"
import { verifyMagicToken } from '@/lib/api-keys'
import { SITE_URL } from '@/lib/resend'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  let keyId: string
  try {
    const payload = await verifyMagicToken(token)
    keyId = payload.keyId
  } catch {
    return NextResponse.json({ error: 'invalid_or_expired_token' }, { status: 401 })
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: { id: keyId },
    include: { customer: true },
  })

  if (!apiKey?.customer || !apiKey.customer.stripeId.startsWith('cus_')) {
    // Research / free users have no real Stripe subscription
    return NextResponse.redirect(`${SITE_URL}/api-keys?token=${token}&portal=no_subscription`)
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: apiKey.customer.stripeId,
    return_url: `${SITE_URL}/api-keys?token=${token}`,
    ...(process.env.STRIPE_PORTAL_CONFIGURATION_ID
      ? { configuration: process.env.STRIPE_PORTAL_CONFIGURATION_ID }
      : {}),
  })

  return NextResponse.redirect(portalSession.url)
}
