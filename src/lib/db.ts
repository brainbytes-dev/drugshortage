import { prisma } from './prisma'
import type { Shortage, ShortagesQuery, ShortagesResponse, KPIStats, OverviewStats } from './types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapShortage(s: {
  id: number
  gtin: string
  pharmacode: string
  bezeichnung: string
  firma: string
  atcCode: string
  gengrp: string
  statusCode: number
  statusText: string
  datumLieferfahigkeit: string
  datumLetzteMutation: string
  tageSeitMeldung: number
  detailUrl: string
  alternativenUrl: string | null
  ersteMeldung: string | null
  ersteMeldungDurch: string | null
  ersteInfoDurchFirma: string | null
  artDerInfoDurchFirma: string | null
  voraussichtlicheDauer: string | null
  bemerkungen: string | null
  firstSeenAt: Date
  lastSeenAt: Date
  isActive: boolean
}): Shortage {
  return {
    id: s.id,
    gtin: s.gtin,
    pharmacode: s.pharmacode,
    bezeichnung: s.bezeichnung,
    firma: s.firma,
    atcCode: s.atcCode,
    gengrp: s.gengrp,
    statusCode: s.statusCode,
    statusText: s.statusText,
    datumLieferfahigkeit: s.datumLieferfahigkeit,
    datumLetzteMutation: s.datumLetzteMutation,
    tageSeitMeldung: s.tageSeitMeldung,
    detailUrl: s.detailUrl,
    alternativenUrl: s.alternativenUrl ?? undefined,
    ersteMeldung: s.ersteMeldung ?? undefined,
    ersteMeldungDurch: s.ersteMeldungDurch ?? undefined,
    ersteInfoDurchFirma: s.ersteInfoDurchFirma ?? undefined,
    artDerInfoDurchFirma: s.artDerInfoDurchFirma ?? undefined,
    voraussichtlicheDauer: s.voraussichtlicheDauer ?? undefined,
    bemerkungen: s.bemerkungen ?? undefined,
    firstSeenAt: s.firstSeenAt.toISOString(),
    lastSeenAt: s.lastSeenAt.toISOString(),
    isActive: s.isActive,
  }
}

// ── Shortages ─────────────────────────────────────────────────────────────────

export async function getAllShortages(): Promise<Shortage[]> {
  const rows = await prisma.shortage.findMany()
  return rows.map(mapShortage)
}

export async function upsertShortages(
  incoming: Shortage[],
): Promise<{ newEntries: number; removedEntries: number }> {
  const now = new Date()
  const incomingGtins = new Set(incoming.map(s => s.gtin))

  const toShortageData = (s: Shortage, firstSeenAt: Date) => ({
    gtin: s.gtin,
    pharmacode: s.pharmacode,
    bezeichnung: s.bezeichnung,
    firma: s.firma,
    atcCode: s.atcCode,
    gengrp: s.gengrp,
    statusCode: s.statusCode,
    statusText: s.statusText,
    datumLieferfahigkeit: s.datumLieferfahigkeit ?? '',
    datumLetzteMutation: s.datumLetzteMutation ?? '',
    tageSeitMeldung: s.tageSeitMeldung ?? 0,
    detailUrl: s.detailUrl ?? '',
    alternativenUrl: s.alternativenUrl ?? null,
    ersteMeldung: s.ersteMeldung ?? null,
    ersteMeldungDurch: s.ersteMeldungDurch ?? null,
    ersteInfoDurchFirma: s.ersteInfoDurchFirma ?? null,
    artDerInfoDurchFirma: s.artDerInfoDurchFirma ?? null,
    voraussichtlicheDauer: s.voraussichtlicheDauer ?? null,
    bemerkungen: s.bemerkungen ?? null,
    firstSeenAt,
    lastSeenAt: now,
    isActive: true,
  })

  // 1. Fetch all existing GTINs in one query
  const existingRows = await prisma.shortage.findMany({
    select: { gtin: true, firstSeenAt: true },
  })
  const existingMap = new Map(existingRows.map(r => [r.gtin, r.firstSeenAt]))

  const toCreate = incoming.filter(s => !existingMap.has(s.gtin))
  const toUpdate = incoming.filter(s => existingMap.has(s.gtin))

  // 2. Batch create new entries
  if (toCreate.length) {
    await prisma.shortage.createMany({
      data: toCreate.map(s => toShortageData(s, now)),
      skipDuplicates: true,
    })
  }

  // 3. Update existing entries in chunks to avoid transaction timeouts
  const UPDATE_CHUNK = 50
  for (let i = 0; i < toUpdate.length; i += UPDATE_CHUNK) {
    const chunk = toUpdate.slice(i, i + UPDATE_CHUNK)
    await Promise.all(
      chunk.map(s =>
        prisma.shortage.update({
          where: { gtin: s.gtin },
          data: toShortageData(s, existingMap.get(s.gtin)!),
        }),
      ),
    )
  }

  // 4. Deactivate shortages not in this scrape
  const deactivated = await prisma.shortage.updateMany({
    where: { isActive: true, gtin: { notIn: Array.from(incomingGtins) } },
    data: { isActive: false, lastSeenAt: now },
  })

  const { newEntries, removedEntries } = { newEntries: toCreate.length, removedEntries: deactivated.count }

  return { newEntries, removedEntries }
}

export async function upsertCompletedShortages(incoming: Shortage[]): Promise<{ inserted: number }> {
  const now = new Date()
  const CHUNK = 500
  let totalInserted = 0

  // Build a GTIN → {pharmacode, gengrp} map from existing DB rows so we can
  // backfill these fields for historical entries that were never scraped as active.
  const existingRows = await prisma.shortage.findMany({
    select: { gtin: true, pharmacode: true, gengrp: true },
  })
  const knownMap = new Map(existingRows.map(r => [r.gtin, { pharmacode: r.pharmacode, gengrp: r.gengrp }]))

  const toRow = (s: Shortage) => {
    const known = knownMap.get(s.gtin)
    return {
      gtin: s.gtin,
      // Prefer known values from DB (from when it was active) over empty strings
      pharmacode: s.pharmacode || known?.pharmacode || '',
      bezeichnung: s.bezeichnung,
      firma: s.firma,
      atcCode: s.atcCode,
      gengrp: s.gengrp || known?.gengrp || '',
      statusCode: s.statusCode,
      statusText: s.statusText,
      datumLieferfahigkeit: s.datumLieferfahigkeit,
      datumLetzteMutation: s.datumLetzteMutation,
      tageSeitMeldung: s.tageSeitMeldung,
      detailUrl: s.detailUrl,
      alternativenUrl: s.alternativenUrl ?? null,
      ersteMeldung: s.ersteMeldung ?? null,
      ersteMeldungDurch: s.ersteMeldungDurch ?? null,
      ersteInfoDurchFirma: s.ersteInfoDurchFirma ?? null,
      artDerInfoDurchFirma: s.artDerInfoDurchFirma ?? null,
      voraussichtlicheDauer: s.voraussichtlicheDauer ?? null,
      bemerkungen: s.bemerkungen ?? null,
      firstSeenAt: now,
      lastSeenAt: now,
      isActive: false,
    }
  }

  // Split into enriched (have atcCode from detail page) vs raw (no detail enrichment)
  const enriched = incoming.filter(s => s.atcCode)
  const raw = incoming.filter(s => !s.atcCode)

  // Raw entries: insert-only, skip if already in DB
  for (let i = 0; i < raw.length; i += CHUNK) {
    const chunk = raw.slice(i, i + CHUNK)
    const result = await prisma.shortage.createMany({
      data: chunk.map(toRow),
      skipDuplicates: true,
    })
    totalInserted += result.count
  }

  // Enriched entries: upsert so detail data is written even if row already exists
  for (const s of enriched) {
    const row = toRow(s)
    await prisma.shortage.upsert({
      where: { gtin: s.gtin },
      create: row,
      update: {
        atcCode: row.atcCode,
        pharmacode: row.pharmacode || undefined,
        gengrp: row.gengrp || undefined,
        statusCode: row.statusCode,
        statusText: row.statusText,
        // Don't override isActive=true — active scrape controls that flag
        datumLieferfahigkeit: row.datumLieferfahigkeit || undefined,
        ersteMeldung: row.ersteMeldung ?? null,
        ersteMeldungDurch: row.ersteMeldungDurch ?? null,
        ersteInfoDurchFirma: row.ersteInfoDurchFirma ?? null,
        artDerInfoDurchFirma: row.artDerInfoDurchFirma ?? null,
        voraussichtlicheDauer: row.voraussichtlicheDauer ?? null,
        detailUrl: row.detailUrl || undefined,
        lastSeenAt: now,
      },
    })
    totalInserted++
  }

  return { inserted: totalInserted }
}

export async function queryShortages(query: ShortagesQuery): Promise<ShortagesResponse> {
  const perPage = query.perPage ?? 50
  const page = query.page ?? 1

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { isActive: true }

  if (query.search) {
    const term = query.search
    where['OR'] = [
      { bezeichnung: { contains: term, mode: 'insensitive' } },
      { firma: { contains: term, mode: 'insensitive' } },
      { atcCode: { contains: term, mode: 'insensitive' } },
    ]
  }

  if (query.status) {
    const codes = query.status.split(',').map(Number)
    where['statusCode'] = { in: codes }
  }

  if (query.firma) {
    where['firma'] = query.firma
  }

  if (query.atc) {
    where['atcCode'] = { startsWith: query.atc }
  }

  // Build orderBy
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderBy: Record<string, string> | undefined
  if (query.sort) {
    const [field, dir] = query.sort.split(':')
    orderBy = { [field]: dir === 'desc' ? 'desc' : 'asc' }
  }

  const [total, rows] = await Promise.all([
    prisma.shortage.count({ where }),
    prisma.shortage.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ])

  return { data: rows.map(mapShortage), total, page, perPage }
}

export async function getKPIStats(): Promise<KPIStats> {
  const active = await prisma.shortage.findMany({
    where: { isActive: true },
    select: { firma: true, atcCode: true, tageSeitMeldung: true },
  })

  const firmaCounts = active.reduce<Record<string, number>>((acc, s) => {
    acc[s.firma] = (acc[s.firma] ?? 0) + 1
    return acc
  }, {})

  const topFirma = Object.entries(firmaCounts).sort((a, b) => b[1] - a[1])[0]
  const uniqueAtcGroups = new Set(active.map(s => s.atcCode)).size
  const avgDays =
    active.length > 0
      ? Math.round(active.reduce((sum, s) => sum + (s.tageSeitMeldung ?? 0), 0) / active.length)
      : 0

  // Get last scrape run
  const lastRun = await prisma.scrapeRun.findFirst({
    where: { status: 'success' },
    orderBy: { scrapedAt: 'desc' },
    select: { scrapedAt: true },
  })

  return {
    totalActive: active.length,
    topFirma: topFirma?.[0] ?? '-',
    topFirmaCount: topFirma?.[1] ?? 0,
    uniqueAtcGroups,
    avgDaysSinceMeldung: avgDays,
    lastScrapedAt: lastRun?.scrapedAt.toISOString() ?? null,
  }
}

export async function getFirmaList(): Promise<string[]> {
  const rows = await prisma.shortage.findMany({
    where: { isActive: true },
    select: { firma: true },
    distinct: ['firma'],
    orderBy: { firma: 'asc' },
  })
  return rows.map(r => r.firma)
}

export async function getAtcList(): Promise<string[]> {
  const rows = await prisma.shortage.findMany({
    where: { isActive: true },
    select: { atcCode: true },
    distinct: ['atcCode'],
    orderBy: { atcCode: 'asc' },
  })
  return rows.map(r => r.atcCode)
}

// ── Overview Stats ────────────────────────────────────────────────────────────

export async function saveOverviewStats(stats: OverviewStats): Promise<void> {
  await prisma.overviewStats.create({
    data: {
      scrapedAt: new Date(stats.scrapedAt),
      totalPackungen: stats.totalPackungen,
      totalProdukte: stats.totalProdukte,
      betroffeneAtcGruppen: stats.betroffeneAtcGruppen,
      pflichtlager: stats.pflichtlager,
      bwl: stats.bwl,
      bwlWho: stats.bwlWho,
      who: stats.who,
      kassenpflichtigSL: stats.kassenpflichtigSL,
      kassenpflichtigSLTotal: stats.kassenpflichtigSLTotal,
      prozentSLNichtLieferbar: stats.prozentSLNichtLieferbar,
      dauerUnter2Wochen: stats.dauerUnter2Wochen,
      dauer2bis6Wochen: stats.dauer2bis6Wochen,
      dauerUeber6WochenBis6Monate: stats.dauerUeber6WochenBis6Monate,
      dauerUeber6MonateBis1Jahr: stats.dauerUeber6MonateBis1Jahr,
      dauerUeber1Bis2Jahre: stats.dauerUeber1Bis2Jahre,
      dauerUeber2Jahre: stats.dauerUeber2Jahre,
      swissmedicListeA: stats.swissmedicListeA,
      swissmedicListeATotal: stats.swissmedicListeATotal,
      swissmedicListeB: stats.swissmedicListeB,
      swissmedicListeBTotal: stats.swissmedicListeBTotal,
      swissmedicListeC: stats.swissmedicListeC,
      swissmedicListeCTotal: stats.swissmedicListeCTotal,
      swissmedicUebrige: stats.swissmedicUebrige,
      swissmedicUebrigeTotal: stats.swissmedicUebrigeTotal,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      firmenRanking: stats.firmenRanking as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      atcGruppen: stats.atcGruppen as any,
    },
  })
}

export async function getOverviewStats(): Promise<OverviewStats | null> {
  const row = await prisma.overviewStats.findFirst({
    orderBy: { scrapedAt: 'desc' },
  })

  if (!row) return null

  return {
    scrapedAt: row.scrapedAt.toISOString(),
    totalPackungen: row.totalPackungen,
    totalProdukte: row.totalProdukte,
    betroffeneAtcGruppen: row.betroffeneAtcGruppen,
    pflichtlager: row.pflichtlager,
    bwl: row.bwl,
    bwlWho: row.bwlWho,
    who: row.who,
    kassenpflichtigSL: row.kassenpflichtigSL,
    kassenpflichtigSLTotal: row.kassenpflichtigSLTotal,
    prozentSLNichtLieferbar: row.prozentSLNichtLieferbar,
    dauerUnter2Wochen: row.dauerUnter2Wochen,
    dauer2bis6Wochen: row.dauer2bis6Wochen,
    dauerUeber6WochenBis6Monate: row.dauerUeber6WochenBis6Monate,
    dauerUeber6MonateBis1Jahr: row.dauerUeber6MonateBis1Jahr,
    dauerUeber1Bis2Jahre: row.dauerUeber1Bis2Jahre,
    dauerUeber2Jahre: row.dauerUeber2Jahre,
    swissmedicListeA: row.swissmedicListeA,
    swissmedicListeATotal: row.swissmedicListeATotal,
    swissmedicListeB: row.swissmedicListeB,
    swissmedicListeBTotal: row.swissmedicListeBTotal,
    swissmedicListeC: row.swissmedicListeC,
    swissmedicListeCTotal: row.swissmedicListeCTotal,
    swissmedicUebrige: row.swissmedicUebrige,
    swissmedicUebrigeTotal: row.swissmedicUebrigeTotal,
    firmenRanking: row.firmenRanking as unknown as OverviewStats['firmenRanking'],
    atcGruppen: row.atcGruppen as unknown as OverviewStats['atcGruppen'],
  }
}
