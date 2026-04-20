import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"
import { generateApiKey, signMagicToken, tierDailyLimit } from '@/lib/api-keys'
import { getResend, FROM_ADDRESS, SITE_URL } from '@/lib/resend'

// Auto-approve: .edu domains and common Swiss academic/hospital domains
const AUTO_APPROVE_PATTERNS = [
  /\.edu$/i,
  /\.ac\.\w+$/i,
  /unibas\.ch$/i,
  /uzh\.ch$/i,
  /unibe\.ch$/i,
  /epfl\.ch$/i,
  /ethz\.ch$/i,
  /insel\.ch$/i,
  /kssg\.ch$/i,
  /luks\.ch$/i,
]

function isAutoApprove(email: string): boolean {
  const domain = email.split('@')[1] ?? ''
  return AUTO_APPROVE_PATTERNS.some((p) => p.test(domain))
}

export async function POST(req: NextRequest) {
  const { email, reason } = await req.json()
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const autoApprove = isAutoApprove(email) || (typeof reason === 'string' && reason.length >= 20)
  if (!autoApprove) {
    return NextResponse.json(
      { error: 'Bitte eine institutionelle E-Mail-Adresse verwenden oder eine kurze Begründung angeben (mind. 20 Zeichen).' },
      { status: 422 }
    )
  }

  // Idempotent: don't create a second key for the same email
  const existing = await prisma.apiKey.findFirst({
    where: { tier: 'research', customer: { email } },
  })
  if (existing) {
    const token = await signMagicToken(existing.id, email)
    const dashboardUrl = `${SITE_URL}/api-keys?token=${token}`
    const resend = getResend()
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: 'Dein Engpassradar Research-Key (bereits vorhanden)',
      html: `<p>Du hast bereits einen Research-Key. <a href="${dashboardUrl}">Hier zum Dashboard</a>.</p>`,
    })
    return NextResponse.json({ sent: true })
  }

  const { plaintext, hash } = generateApiKey()
  const customer = await prisma.stripeCustomer.upsert({
    where: { email },
    // Research customers have no Stripe ID — use email as placeholder
    create: { email, stripeId: `research_${email}` },
    update: {},
  })

  const apiKey = await prisma.apiKey.create({
    data: {
      customerId: customer.id,
      keyHash: hash,
      tier: 'research',
      dailyLimit: tierDailyLimit('research'),
    },
  })

  const token = await signMagicToken(apiKey.id, email)
  const dashboardUrl = `${SITE_URL}/api-keys?token=${token}`
  const resend = getResend()
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: 'Dein kostenloser Engpassradar Research-Key',
    html: `
<p>Hallo,</p>
<p>dein Research-Key:</p>
<pre style="background:#f4f4f5;padding:12px;border-radius:6px;font-size:14px;">${plaintext}</pre>
<p>Limit: 2'000 Anfragen/Tag. Kein Ablaufdatum.</p>
<p><a href="${dashboardUrl}">API-Dashboard →</a></p>
<p>Wenn Sie die Daten in einer Publikation verwenden, freuen wir uns über eine Erwähnung von engpassradar.ch.</p>
<p>Engpassradar</p>
`,
  })

  return NextResponse.json({ sent: true })
}
