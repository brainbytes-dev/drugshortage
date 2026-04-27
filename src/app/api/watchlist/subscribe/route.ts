import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResend, FROM_ADDRESS, SITE_URL } from '@/lib/resend'
import { confirmationEmail } from '@/lib/email-templates'

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

  // Check upgrade gate: max 3 free confirmed alerts per email
  const FREE_LIMIT = 3
  const existing = await prisma.watchlistSubscription.findUnique({
    where: { email_atcCode: { email, atcCode } },
  })

  if (existing?.confirmed) {
    return NextResponse.json({ success: true, alreadyConfirmed: true })
  }

  if (!existing) {
    const confirmedCount = await prisma.watchlistSubscription.count({
      where: { email, confirmed: true },
    })
    if (confirmedCount >= FREE_LIMIT) {
      return NextResponse.json(
        { error: 'upgradeRequired', confirmedCount, limit: FREE_LIMIT },
        { status: 402 }
      )
    }
  }

  const sub = existing
    ? existing
    : await prisma.watchlistSubscription.create({ data: { email, atcCode } })

  const confirmUrl = `${SITE_URL}/watchlist/confirm?token=${sub.token}`

  await getResend().emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: `Engpass-Alert bestätigen: ${atcName} (${atcCode})`,
    html: confirmationEmail(atcCode, atcName, confirmUrl),
  })

  return NextResponse.json({ success: true })
}
