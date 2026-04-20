import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"
import { verifyMagicToken } from '@/lib/api-keys'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  let keyId: string
  try {
    const payload = await verifyMagicToken(token)
    keyId = payload.keyId
  } catch {
    return NextResponse.json({ error: 'invalid_or_expired_token' }, { status: 401 })
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: { id: keyId },
    select: { tier: true, dailyLimit: true, dailyCount: true, createdAt: true, active: true },
  })

  if (!apiKey) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  return NextResponse.json(apiKey)
}
