import { NextResponse } from 'next/server'
import { getKPIStatsOptimized } from '@/lib/db-optimized-aggregations'
import { getOverviewStats } from '@/lib/db'
import { getCachedLRU } from '@/lib/cache-lru'

const HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

export async function GET() {
  try {
    const [kpi, overview] = await getCachedLRU(
      'api-v1-stats',
      () => Promise.all([getKPIStatsOptimized(), getOverviewStats()]),
      300 // 5 min cache
    )

    return NextResponse.json(
      {
        data: {
          active: kpi.totalActive,
          uniqueAtcGroups: kpi.uniqueAtcGroups,
          avgDaysSinceMeldung: Math.round(kpi.avgDaysSinceMeldung),
          lastUpdated: kpi.lastScrapedAt,
          // Duration breakdown
          duration: overview
            ? {
                under2Weeks: overview.dauerUnter2Wochen,
                weeks2to6: overview.dauer2bis6Wochen,
                weeks6to26: overview.dauerUeber6WochenBis6Monate,
                months6to12: overview.dauerUeber6MonateBis1Jahr,
                over1Year: overview.dauerUeber1Bis2Jahre,
              }
            : null,
          // Regulatory
          regulatory: overview
            ? {
                bwl: overview.bwl,
                pflichtlager: overview.pflichtlager,
                kassenpflichtig: overview.kassenpflichtigSL,
              }
            : null,
          // Top ATC groups
          topAtcGroups: overview?.atcGruppen?.slice(0, 10) ?? null,
        },
        meta: {
          generatedAt: new Date().toISOString(),
          source: 'engpassradar.ch',
          docsUrl: 'https://engpassradar.ch/api-docs',
        },
      },
      { headers: HEADERS }
    )
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: HEADERS }
    )
  }
}
