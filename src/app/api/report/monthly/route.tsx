import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { queryShortages, getBwlGtins, getKPIStats } from '@/lib/db'
import { calculateScore, scoreLabel } from '@/lib/score'
import { ShortageReportPDF, type ReportShortage } from '@/lib/pdf-report'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const REPORT_SECRET = process.env.REPORT_SECRET

export async function GET(req: NextRequest) {
  if (REPORT_SECRET) {
    const auth = req.headers.get('authorization') ?? req.nextUrl.searchParams.get('secret')
    if (auth !== REPORT_SECRET && auth !== `Bearer ${REPORT_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const [{ data: shortages }, bwlGtins, kpi] = await Promise.all([
    queryShortages({ sort: 'tageSeitMeldung:desc', perPage: 200, page: 1 }),
    getBwlGtins().catch(() => [] as string[]),
    getKPIStats().catch(() => null),
  ])

  const bwlSet = new Set(bwlGtins)

  const scored: ReportShortage[] = shortages
    .map(s => {
      const breakdown = calculateScore(s, bwlSet.has(s.gtin))
      const { label } = scoreLabel(breakdown.total)
      return { ...s, score: breakdown.total, scoreLabel: label, bwl: bwlSet.has(s.gtin) }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  const now = new Date()
  const month = now.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })
  const generatedAt = now.toLocaleDateString('de-CH')

  const buffer = await renderToBuffer(
    <ShortageReportPDF
      shortages={scored}
      activeTotal={kpi?.totalActive ?? shortages.length}
      newThisWeek={0}
      month={month}
      generatedAt={generatedAt}
    />
  )

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="shortage-report-${now.toISOString().slice(0, 7)}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
