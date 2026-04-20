import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResend, FROM_ADDRESS, SITE_URL } from '@/lib/resend'
import { alertEmail, alertSubject } from '@/lib/email-templates'

export const dynamic = 'force-dynamic'

// Vercel Cron sends GET; keep POST for manual/internal calls
export const GET = POST

export async function POST(req: NextRequest) {
  // Secured: only Vercel cron or internal calls
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Alert service not configured' }, { status: 503 })
  }

  // Get all confirmed subscribers grouped by ATC code
  const subs = await prisma.watchlistSubscription.findMany({
    where: { confirmed: true },
  })

  if (subs.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0 })
  }

  const now = new Date()
  let sent = 0
  let skipped = 0

  for (const sub of subs) {
    const since = sub.lastAlertAt ?? new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Find new shortages (episodes started after last alert) for this ATC code
    const newShortages = await prisma.shortage.findMany({
      where: {
        atcCode: sub.atcCode,
        isActive: true,
        firstSeenAt: { gt: since },
      },
      select: { bezeichnung: true, firma: true, slug: true, statusCode: true },
      take: 10,
    })

    // Find resolved shortages (episodes that ended after last alert)
    const resolvedShortages = await prisma.shortage.findMany({
      where: {
        atcCode: sub.atcCode,
        isActive: false,
        lastSeenAt: { gt: since },
      },
      select: { bezeichnung: true, firma: true, slug: true },
      take: 10,
    })

    if (newShortages.length === 0 && resolvedShortages.length === 0) {
      skipped++
      continue
    }

    // Get ATC display name from oddb products
    const atcRow = await prisma.oddbProduct.findFirst({
      where: { atcCode: sub.atcCode },
      select: { substanz: true },
    })
    const atcName = atcRow?.substanz ?? sub.atcCode

    const unsubUrl = `${SITE_URL}/api/watchlist/unsubscribe?token=${sub.token}`
    const dashboardUrl = `${SITE_URL}/wirkstoff/${sub.atcCode}`

    await getResend().emails.send({
      from: FROM_ADDRESS,
      to: sub.email,
      subject: alertSubject(atcName, newShortages.length, resolvedShortages.length),
      html: alertEmail({
        atcCode: sub.atcCode,
        atcName,
        newShortages,
        resolvedShortages,
        dashboardUrl,
        unsubUrl,
      }),
    })

    await prisma.watchlistSubscription.update({
      where: { id: sub.id },
      data: { lastAlertAt: now },
    })

    sent++
  }

  return NextResponse.json({ sent, skipped })
}
