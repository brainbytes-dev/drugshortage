import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"
import { signMagicToken } from '@/lib/api-keys'
import { getResend, FROM_ADDRESS, SITE_URL } from '@/lib/resend'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const customer = await prisma.stripeCustomer.findUnique({
    where: { email },
    include: { apiKeys: { where: { active: true }, take: 1 } },
  })

  if (!customer || customer.apiKeys.length === 0) {
    // Return 200 to avoid email enumeration
    return NextResponse.json({ sent: true })
  }

  const apiKey = customer.apiKeys[0]
  const token = await signMagicToken(apiKey.id, email)
  const dashboardUrl = `${SITE_URL}/api-keys?token=${token}`

  const resend = getResend()
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: 'Dein Engpassradar Dashboard-Link',
    html: `
<p>Hallo,</p>
<p>hier ist dein Link zum API-Dashboard (gültig 30 Tage):</p>
<p><a href="${dashboardUrl}">${dashboardUrl}</a></p>
<p>Hinweis: Der Link zeigt deinen aktuellen Plan und deine Nutzung, aber nicht mehr den originalen API-Key.</p>
<p>Falls du deinen Key verloren hast, kontaktiere uns unter support@engpassradar.ch — wir generieren einen neuen.</p>
<p>Engpassradar</p>
`,
  })

  return NextResponse.json({ sent: true })
}
