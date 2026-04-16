import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const writeKey = process.env.ENCHARGE_WRITE_KEY
  if (!writeKey) {
    console.error('[newsletter] ENCHARGE_WRITE_KEY not set')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const res = await fetch('https://ingest.encharge.io/v1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Encharge-Token': writeKey,
    },
    body: JSON.stringify({
      name: 'Subscribed to newsletter',
      user: { email },
      properties: {
        tags: 'engpass-signal',
        source: 'engpassradar.ch',
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[newsletter] Encharge error:', res.status, body)
    return NextResponse.json({ error: 'Subscription failed' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
