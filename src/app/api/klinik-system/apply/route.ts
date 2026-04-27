import { NextRequest, NextResponse } from 'next/server'
import { getResend, FROM_ADDRESS, SITE_URL } from '@/lib/resend'

const ADMIN_EMAIL = 'api@engpassradar.ch'

export async function POST(req: NextRequest) {
  const body = await req.json() as { name?: string; email?: string; institution?: string; problem?: string }
  const { name, email, institution, problem } = body

  if (!name?.trim() || !email?.trim() || !institution?.trim() || !problem?.trim()) {
    return NextResponse.json({ error: 'Alle Felder sind erforderlich.' }, { status: 400 })
  }

  const resend = getResend()

  await Promise.all([
    // Admin notification
    resend.emails.send({
      from: FROM_ADDRESS,
      to: ADMIN_EMAIL,
      subject: `Neue Klinik-System-Anfrage: ${institution}`,
      html: `
<p><strong>Name:</strong> ${name}</p>
<p><strong>E-Mail:</strong> <a href="mailto:${email}">${email}</a></p>
<p><strong>Institution:</strong> ${institution}</p>
<p><strong>Hauptproblem:</strong></p>
<blockquote style="border-left:3px solid #2d8f8f;padding-left:12px;color:#374151;">${problem}</blockquote>
<p style="margin-top:16px;">
  <a href="mailto:${ADMIN_EMAIL}?subject=Re: Klinik-System ${institution}">Direkt antworten →</a>
</p>
      `.trim(),
    }),

    // Applicant confirmation
    resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      replyTo: ADMIN_EMAIL,
      subject: 'Ihre Anfrage bei engpass.radar — wir melden uns',
      html: `
<p>Guten Tag${name ? ` ${name}` : ''},</p>
<p>vielen Dank für Ihre Anfrage. Wir erstellen innerhalb von 24&nbsp;Stunden einen personalisierten Shortage Report für <strong>${institution}</strong> und melden uns direkt bei Ihnen.</p>
<p>Falls Sie in der Zwischenzeit Fragen haben: <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a></p>
<p>Mit freundlichen Grüssen<br>Henrik Rühe<br>engpass.radar</p>
<hr style="border:none;border-top:1px solid #eee;margin:24px 0">
<p style="font-size:11px;color:#9ca3af;">
  engpass.radar · <a href="${SITE_URL}" style="color:#9ca3af;">${SITE_URL}</a>
</p>
      `.trim(),
    }),
  ])

  return NextResponse.json({ ok: true })
}
