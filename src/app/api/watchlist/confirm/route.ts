import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.redirect(new URL('/watchlist/error', req.url))
  }

  const sub = await prisma.watchlistSubscription.findUnique({ where: { token } })
  if (!sub) {
    return NextResponse.redirect(new URL('/watchlist/error', req.url))
  }

  if (!sub.confirmed) {
    await prisma.watchlistSubscription.update({
      where: { token },
      data: { confirmed: true },
    })
  }

  return NextResponse.redirect(new URL(`/watchlist/confirmed?atc=${sub.atcCode}`, req.url))
}
