import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResend, FROM_ADDRESS, SITE_URL } from '@/lib/resend'

export const dynamic = 'force-dynamic'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ATC_REGEX = /^[A-Z][0-9]{2}[A-Z]{2}[0-9]{2}$/

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Alert service not configured' }, { status: 503 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const email = typeof b?.email === 'string' ? b.email.trim().toLowerCase() : ''
  const atcCode = typeof b?.atcCode === 'string' ? b.atcCode.trim().toUpperCase() : ''
  const atcName = typeof b?.atcName === 'string' ? b.atcName.trim() : atcCode

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Ungültige E-Mail-Adresse' }, { status: 400 })
  }
  if (!ATC_REGEX.test(atcCode)) {
    return NextResponse.json({ error: 'Ungültiger ATC-Code' }, { status: 400 })
  }

  // Upsert: create if not exists, ignore if already confirmed
  const existing = await prisma.watchlistSubscription.findUnique({
    where: { email_atcCode: { email, atcCode } },
  })

  if (existing?.confirmed) {
    return NextResponse.json({ success: true, alreadyConfirmed: true })
  }

  const sub = existing
    ? existing
    : await prisma.watchlistSubscription.create({ data: { email, atcCode } })

  const confirmUrl = `${SITE_URL}/watchlist/confirm?token=${sub.token}`

  await getResend().emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: `Alert bestätigen: ${atcName} Engpässe`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:18px;font-weight:700;margin-bottom:8px">engpass.radar Alert</p>
        <p>Bitte bestätigen Sie Ihren Alert für <strong>${atcName} (${atcCode})</strong>.</p>
        <p>Sie erhalten täglich eine E-Mail, sobald sich die Engpass-Lage für diesen Wirkstoff ändert.</p>
        <a href="${confirmUrl}" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#2d8f8f;color:white;text-decoration:none;border-radius:6px;font-weight:600">
          Alert bestätigen
        </a>
        <p style="color:#666;font-size:13px">Falls Sie diesen Alert nicht angefordert haben, können Sie diese E-Mail ignorieren.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#999;font-size:12px">engpass.radar · <a href="${SITE_URL}/datenschutz" style="color:#999">Datenschutz</a></p>
      </div>
    `,
  })

  return NextResponse.json({ success: true })
}
