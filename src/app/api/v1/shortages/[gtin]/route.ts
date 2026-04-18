import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-optimized'
import { calculateScore, scoreLabel } from '@/lib/score'
import type { Shortage } from '@/lib/types'

const HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

interface PageProps {
  params: Promise<{ gtin: string }>
}

export async function GET(_req: Request, { params }: PageProps) {
  const { gtin } = await params

  if (!gtin || !/^\d{7,14}$/.test(gtin)) {
    return NextResponse.json({ error: 'Invalid GTIN format' }, { status: 400, headers: HEADERS })
  }

  const row = await prisma.shortage.findUnique({ where: { gtin } })
  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: HEADERS })
  }

  const shortage: Shortage = {
    id: row.id,
    gtin: row.gtin,
    slug: row.slug ?? undefined,
    pharmacode: row.pharmacode,
    bezeichnung: row.bezeichnung,
    firma: row.firma,
    atcCode: row.atcCode,
    gengrp: row.gengrp,
    statusCode: row.statusCode,
    statusText: row.statusText ?? '',
    datumLieferfahigkeit: row.datumLieferfahigkeit,
    datumLetzteMutation: row.datumLetzteMutation,
    tageSeitMeldung: row.tageSeitMeldung,
    detailUrl: row.detailUrl,
    alternativenUrl: row.alternativenUrl ?? undefined,
    ersteMeldung: row.ersteMeldung ?? undefined,
    ersteMeldungDurch: row.ersteMeldungDurch ?? undefined,
    ersteInfoDurchFirma: row.ersteInfoDurchFirma ?? undefined,
    artDerInfoDurchFirma: row.artDerInfoDurchFirma ?? undefined,
    voraussichtlicheDauer: row.voraussichtlicheDauer ?? undefined,
    bemerkungen: row.bemerkungen ?? undefined,
    firstSeenAt: row.firstSeenAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
    isActive: row.isActive,
  }

  // Check BWL flag
  const bwl = await prisma.bwlShortage.findUnique({ where: { gtin } }).catch(() => null)
  const isBwl = bwl !== null
  const score = calculateScore(shortage, isBwl)
  const { label: scoreLabel_ } = scoreLabel(score.total)

  return NextResponse.json(
    {
      data: {
        ...shortage,
        isBwl,
        score: {
          total: score.total,
          label: scoreLabel_,
          breakdown: {
            transparency: score.transparency,
            duration: score.duration,
            noAlternatives: score.noAlternatives,
            critical: score.critical,
          },
        },
      },
      meta: {
        generatedAt: new Date().toISOString(),
        source: 'engpassradar.ch',
        docsUrl: 'https://engpassradar.ch/api-docs',
      },
    },
    { headers: HEADERS }
  )
}
