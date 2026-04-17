import { getWeeklyTimelineWithActive } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const weeks = Math.min(260, Math.max(4, parseInt(searchParams.get('weeks') ?? '52', 10)))
  const data = await getWeeklyTimelineWithActive(weeks)
  return NextResponse.json(data)
}
