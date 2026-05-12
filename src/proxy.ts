import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { createHash } from 'crypto'
import createIntlMiddleware from 'next-intl/middleware'
import { prisma } from '@/lib/prisma'
import { routing } from '@/i18n/routing'

// proxy.ts (Next.js 16) — always Node.js runtime, Prisma is allowed here.

const intlMiddleware = createIntlMiddleware(routing)

const TIER_LIMITS: Record<string, number> = {
  free: 100,
  research: 2000,
  professional: 10000,
  institutional: 100000,
  data_license: 999999999,
}

let freeRatelimit: Ratelimit | null = null

function getFreeRatelimit(): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null
  if (!freeRatelimit) {
    freeRatelimit = new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      }),
      limiter: Ratelimit.slidingWindow(100, '24 h'),
      prefix: 'rl:free',
    })
  }
  return freeRatelimit
}

function rateLimitHeaders(limit: number, remaining: number, resetSec: number) {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(Math.max(0, remaining)),
    'X-RateLimit-Reset': String(resetSec),
  }
}

function tooMany(tier: string, limit: number, resetSec: number) {
  return NextResponse.json(
    { error: 'rate_limit_exceeded', tier, limit, reset_at: new Date(resetSec * 1000).toISOString() },
    { status: 429, headers: rateLimitHeaders(limit, 0, resetSec) }
  )
}

async function handleProtectedApi(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization') ?? ''
  const bearerKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null

  // ── Free tier: IP-based sliding window ────────────────────────────────────
  if (!bearerKey) {
    const rl = getFreeRatelimit()
    if (!rl) return NextResponse.next()

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
    const { success, limit, remaining, reset } = await rl.limit(`ip:${ip}`)
    const resetSec = Math.floor(reset / 1000)

    if (!success) return tooMany('free', limit, resetSec)

    const res = NextResponse.next()
    Object.entries(rateLimitHeaders(limit, remaining, resetSec)).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }

  // ── Key-based tiers ───────────────────────────────────────────────────────
  const hash = createHash('sha256').update(bearerKey).digest('hex')
  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash: hash } })

  if (!apiKey || !apiKey.active) {
    return NextResponse.json({ error: 'invalid_api_key' }, { status: 401 })
  }

  const tier = apiKey.tier
  const limit = TIER_LIMITS[tier] ?? 100

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

  const tomorrow = Math.floor((today.getTime() + 86400000) / 1000)

  if (dailyCount >= limit) {
    return tooMany(tier, limit, tomorrow)
  }

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { dailyCount: { increment: 1 } },
  })

  const res = NextResponse.next()
  Object.entries(rateLimitHeaders(limit, limit - dailyCount - 1, tomorrow)).forEach(([k, v]) =>
    res.headers.set(k, v)
  )
  res.headers.set('X-Api-Tier', tier)
  return res
}

export async function proxy(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const { pathname } = req.nextUrl

  // mcp.engpassradar.ch → /api/mcp (all methods)
  if (host.startsWith('mcp.')) {
    const url = req.nextUrl.clone()
    url.pathname = '/api/mcp'
    return NextResponse.rewrite(url)
  }

  // Protected API routes: rate-limit only, no i18n
  if (pathname.startsWith('/api/v1/') || pathname.startsWith('/api/export/')) {
    return handleProtectedApi(req)
  }

  // Other API route handlers (route.ts under /api/*): pass through, no i18n
  // Note: the `/api` marketing PAGE is matched by i18n below (different path).
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Everything else (including the `/api` marketing page exactly): i18n routing
  return intlMiddleware(req)
}

export const config = {
  matcher: [
    // Protected API routes (rate-limited)
    '/api/v1/:path*',
    '/api/export/:path*',
    // i18n-handled routes: everything except internal paths and files with extensions.
    // We keep `/api/*` here so non-protected API routes still pass through `proxy()`
    // (they short-circuit to NextResponse.next()), and so `/api` exactly hits i18n.
    '/((?!_next|_vercel|.*\\..*).*)',
  ],
}
