import { NextRequest, NextResponse } from 'next/server'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const apiKey = process.env.ENCHARGE_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Newsletter service not configured' },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const email =
    body && typeof body === 'object' && 'email' in body
      ? (body as { email: unknown }).email
      : undefined

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  try {
    const res = await fetch('https://api.encharge.io/v1/people', {
      method: 'POST',
      headers: {
        'X-Encharge-Token': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim(), tags: ['newsletter'] }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[newsletter] encharge error', res.status, text)
      return NextResponse.json(
        { error: 'Failed to subscribe. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[newsletter] fetch error', err)
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again later.' },
      { status: 500 }
    )
  }
}
