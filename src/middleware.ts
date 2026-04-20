import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { createHash } from 'crypto'

const TIER_LIMITS: Record<string, number> = {
  free: 100,
  research: 2000,
  professional: 10000,
  institutional: 100000,
  data_license: 999999999,
}

// Lazy-initialized to avoid edge-runtime issues at import time
let ratelimit: Ratelimit | null = null
function getRatelimit(): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null
  if (!ratelimit) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '60 s'),
      prefix: 'rl:free',
    })
  }
  return ratelimit
}

function sha256(val: string): string {
  return createHash('sha256').update(val).digest('hex')
}

function rateLimitHeaders(limit: number, remaining: number, resetAt: number) {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(Math.max(0, remaining)),
    'X-RateLimit-Reset': String(resetAt),
  }
}

function tooManyRequests(tier: string, limit: number, resetAt: number) {
  return NextResponse.json(
    { error: 'rate_limit_exceeded', tier, limit, reset_at: new Date(resetAt * 1000).toISOString() },
    {
      status: 429,
      headers: rateLimitHeaders(limit, 0, resetAt),
    }
  )
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isProtected =
    pathname.startsWith('/api/v1/') || pathname.startsWith('/api/export/')
  if (!isProtected) return NextResponse.next()

  const authHeader = req.headers.get('authorization') ?? ''
  const bearerKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null

  // ── Free tier: IP-based sliding window (no key) ───────────────────────────
  if (!bearerKey) {
    const rl = getRatelimit()
    if (rl) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
      const { success, limit, remaining, reset } = await rl.limit(`ip:${ip}`)
      const resetSec = Math.floor(reset / 1000)
      if (!success) return tooManyRequests('free', limit, resetSec)
      const res = NextResponse.next()
      Object.entries(rateLimitHeaders(limit, remaining, resetSec)).forEach(([k, v]) =>
        res.headers.set(k, v)
      )
      return res
    }
    return NextResponse.next()
  }

  // ── Key-based tiers ───────────────────────────────────────────────────────
  const hash = sha256(bearerKey)

  // Dynamic import avoids Prisma being bundled into the edge runtime.
  // We run in Node.js (Fluid Compute), so this is fine.
  const { prisma } = await import('@/lib/prisma')
  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash: hash } })

  if (!apiKey || !apiKey.active) {
    return NextResponse.json({ error: 'invalid_api_key' }, { status: 401 })
  }

  const tier = apiKey.tier
  const limit = TIER_LIMITS[tier] ?? 100

  // Daily reset
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const lastReset = new Date(apiKey.lastReset)
  lastReset.setHours(0, 0, 0, 0)

  let dailyCount = apiKey.dailyCount
  if (lastReset < today) {
    dailyCount = 0
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { dailyCount: 0, lastReset: today },
    })
  }

  if (dailyCount >= limit) {
    const resetAt = Math.floor((today.getTime() + 86400000) / 1000)
    return tooManyRequests(tier, limit, resetAt)
  }

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { dailyCount: { increment: 1 } },
  })

  const tomorrow = Math.floor((today.getTime() + 86400000) / 1000)
  const res = NextResponse.next()
  Object.entries(rateLimitHeaders(limit, limit - dailyCount - 1, tomorrow)).forEach(([k, v]) =>
    res.headers.set(k, v)
  )
  res.headers.set('X-Api-Tier', tier)
  return res
}

export const config = {
  matcher: ['/api/v1/:path*', '/api/export/:path*'],
}
