import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResend, FROM_ADDRESS, SITE_URL } from '@/lib/resend'

export const dynamic = 'force-dynamic'

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

    const newRows = newShortages.map(s =>
      `<tr><td style="padding:6px 0;border-bottom:1px solid #f0f0f0"><strong>${s.bezeichnung}</strong> <span style="color:#666;font-size:13px">(${s.firma})</span></td><td style="padding:6px 0 6px 12px;border-bottom:1px solid #f0f0f0;color:#dc2626;font-size:13px">Status ${s.statusCode ?? '—'}</td></tr>`
    ).join('')

    const resolvedRows = resolvedShortages.map(s =>
      `<tr><td style="padding:6px 0;border-bottom:1px solid #f0f0f0"><strong>${s.bezeichnung}</strong> <span style="color:#666;font-size:13px">(${s.firma})</span></td><td style="padding:6px 0 6px 12px;border-bottom:1px solid #f0f0f0;color:#16a34a;font-size:13px">Aufgelöst</td></tr>`
    ).join('')

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:18px;font-weight:700;margin-bottom:4px">engpass.radar</p>
        <p style="color:#666;font-size:14px;margin-top:0">Engpass-Alert: ${atcName} (${sub.atcCode})</p>

        ${newShortages.length > 0 ? `
        <p style="font-weight:600;margin-bottom:8px">🔴 ${newShortages.length} neuer Engpass${newShortages.length > 1 ? 'e' : ''}</p>
        <table style="width:100%;border-collapse:collapse">${newRows}</table>
        ` : ''}

        ${resolvedShortages.length > 0 ? `
        <p style="font-weight:600;margin:16px 0 8px">✅ ${resolvedShortages.length} aufgelöst</p>
        <table style="width:100%;border-collapse:collapse">${resolvedRows}</table>
        ` : ''}

        <a href="${dashboardUrl}" style="display:inline-block;margin:24px 0 8px;padding:10px 20px;background:#2d8f8f;color:white;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">
          Alle ${atcName}-Engpässe ansehen
        </a>

        <hr style="border:none;border-top:1px solid #eee;margin:24px 0 12px"/>
        <p style="color:#999;font-size:12px">
          Sie erhalten diese E-Mail, weil Sie einen Engpass-Alert für ${sub.atcCode} eingerichtet haben. ·
          <a href="${unsubUrl}" style="color:#999">Abmelden</a> ·
          <a href="${SITE_URL}/datenschutz" style="color:#999">Datenschutz</a>
        </p>
      </div>
    `

    await getResend().emails.send({
      from: FROM_ADDRESS,
      to: sub.email,
      subject: `Engpass-Alert ${atcName}: ${newShortages.length > 0 ? `${newShortages.length} neu` : ''}${newShortages.length > 0 && resolvedShortages.length > 0 ? ', ' : ''}${resolvedShortages.length > 0 ? `${resolvedShortages.length} aufgelöst` : ''}`,
      html,
    })

    await prisma.watchlistSubscription.update({
      where: { id: sub.id },
      data: { lastAlertAt: now },
    })

    sent++
  }

  return NextResponse.json({ sent, skipped })
}
