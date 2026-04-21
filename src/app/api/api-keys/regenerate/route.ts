import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateApiKey, verifyMagicToken, encryptApiKeyValue } from '@/lib/api-keys'
import { getResend, FROM_ADDRESS, SITE_URL } from '@/lib/resend'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  let keyId: string
  let email: string
  try {
    const payload = await verifyMagicToken(token)
    keyId = payload.keyId
    email = payload.email
  } catch {
    return NextResponse.json({ error: 'invalid_or_expired_token' }, { status: 401 })
  }

  const existing = await prisma.apiKey.findUnique({ where: { id: keyId } })
  if (!existing || !existing.active) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const { plaintext, hash } = generateApiKey()

  await prisma.apiKey.update({
    where: { id: keyId },
    data: { keyHash: hash, keyEncrypted: encryptApiKeyValue(plaintext) },
  })

  const resend = getResend()
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: 'Ihr neuer Engpassradar API-Key',
    html: `
<p>Guten Tag,</p>
<p>Ihr API-Key wurde erfolgreich neu generiert. Der alte Key ist ab sofort ungültig.</p>
<pre style="background:#f4f4f5;padding:12px;border-radius:6px;font-size:14px;">${plaintext}</pre>
<p><strong>Wichtig:</strong> Dieser Key wird nur einmal angezeigt. Bitte jetzt kopieren und sicher aufbewahren.</p>
<p><a href="${SITE_URL}/api-keys?token=${token}">Zum API-Dashboard</a></p>
<p>Falls Sie diese Aktion nicht selbst ausgelöst haben, kontaktieren Sie uns umgehend unter support@engpassradar.ch.</p>
<p>Engpassradar</p>
`,
  })

  return NextResponse.json({ plaintext })
}
