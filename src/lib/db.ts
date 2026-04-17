import { prisma } from './prisma-optimized'
import { Prisma } from '@prisma/client'
import type { Shortage, ShortagesQuery, ShortagesResponse, KPIStats, OverviewStats } from './types'
import { toSlug } from './slug'

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
  let totalInserted = 0

  // ✅ Use createMany with skipDuplicates for bulk insert (100x faster)
  const existingGtins = new Set(
    (await prisma.shortage.findMany({ select: { gtin: true } }))
      .map(r => r.gtin)
  )

  const newEntries = incoming.filter(s => !existingGtins.has(s.gtin))

  if (newEntries.length > 0) {
    await prisma.shortage.createMany({
      data: newEntries.map(s => ({
        gtin: s.gtin,
        pharmacode: s.pharmacode || '',
        bezeichnung: s.bezeichnung,
        firma: s.firma,
        atcCode: s.atcCode,
        gengrp: s.gengrp || '',
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
        firstSeenAt: now,
        lastSeenAt: now,
        isActive: false, // Historical data
      })),
      skipDuplicates: true,
    })
    totalInserted = newEntries.length
  }

  return { inserted: totalInserted }
}


export async function queryShortages(query: ShortagesQuery): Promise<ShortagesResponse> {
  const perPage = query.perPage ?? 50
  const page = query.page ?? 1

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // statusCode 1–5 are the official drugshortage.ch codes; 0/8/9 are parse artifacts / "abgeschlossen"
  const where: Record<string, any> = { isActive: true, statusCode: { gte: 1, lte: 5 } }

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

  if (query.neu) {
    where['tageSeitMeldung'] = { lte: 7 }
  }

  // Build orderBy
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
    where: { isActive: true, statusCode: { gte: 1, lte: 5 } },
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
    where: { isActive: true, statusCode: { gte: 1, lte: 5 } },
    select: { firma: true },
    distinct: ['firma'],
    orderBy: { firma: 'asc' },
  })
  return rows.map(r => r.firma)
}

export async function getAtcList(): Promise<string[]> {
  const rows = await prisma.shortage.findMany({
    where: { isActive: true, statusCode: { gte: 1, lte: 5 } },
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

export async function saveScrapeRun(run: {
  scrapedAt: string
  totalCount: number
  newEntries: number
  removedEntries: number
  status: 'success' | 'error'
  errorMessage?: string
}): Promise<void> {
  await prisma.scrapeRun.create({
    data: {
      scrapedAt: new Date(run.scrapedAt),
      totalCount: run.totalCount,
      newEntries: run.newEntries,
      removedEntries: run.removedEntries,
      status: run.status,
      errorMessage: run.errorMessage ?? null,
    },
  })
}

// ── SEO / Sitemap helpers ─────────────────────────────────────────────────────

export async function getShortagesByAtc(atc: string): Promise<Shortage[]> {
  const rows = await prisma.shortage.findMany({
    where: {
      isActive: true,
      atcCode: { startsWith: atc },
    },
  })
  return rows.map(mapShortage)
}

export async function getAllAtcCodes(): Promise<Array<{ atc: string; bezeichnung: string }>> {
  const rows = await prisma.shortage.findMany({
    where: { isActive: true },
    select: { atcCode: true, bezeichnung: true },
    distinct: ['atcCode'],
    orderBy: { atcCode: 'asc' },
  })
  return rows.map(r => ({ atc: r.atcCode, bezeichnung: r.bezeichnung }))
}

// NOTE: Full table scan — intentional for now (~700 rows). Revisit with an indexed
// computed column or a separate slug lookup table if the table grows significantly.
export async function getShortageBySlug(slug: string): Promise<Shortage | null> {
  const rows = await prisma.shortage.findMany({
    where: { isActive: true },
  })
  const match = rows.find(r => toSlug(r.bezeichnung) === slug)
  return match ? mapShortage(match) : null
}

export async function getAllDrugSlugs(): Promise<Array<{ slug: string; bezeichnung: string; pharmacode: string }>> {
  const rows = await prisma.shortage.findMany({
    where: { isActive: true },
    select: { bezeichnung: true, pharmacode: true },
  })
  const seen = new Set<string>()
  const result: Array<{ slug: string; bezeichnung: string; pharmacode: string }> = []
  for (const r of rows) {
    const slug = toSlug(r.bezeichnung)
    if (seen.has(slug)) {
      console.warn(`[getAllDrugSlugs] slug collision: "${slug}" (${r.bezeichnung})`)
      continue
    }
    seen.add(slug)
    result.push({ slug, bezeichnung: r.bezeichnung, pharmacode: r.pharmacode })
  }
  return result
}

// ── ODDB Integration ─────────────────────────────────────────────────────────

export async function upsertOddbProducts(
  products: import('./oddb-scraper').OddbProductData[]
): Promise<{ upserted: number }> {
  const CHUNK = 200
  let upserted = 0

  for (let i = 0; i < products.length; i += CHUNK) {
    const chunk = products.slice(i, i + CHUNK)
    await Promise.all(
      chunk.map(p =>
        prisma.oddbProduct.upsert({
          where: { gtin: p.gtin },
          create: {
            gtin: p.gtin,
            prodno: p.prodno,
            bezeichnungDe: p.bezeichnungDe,
            atcCode: p.atcCode,
            substanz: p.substanz,
            zusammensetzung: p.zusammensetzung,
          },
          update: {
            prodno: p.prodno,
            bezeichnungDe: p.bezeichnungDe,
            atcCode: p.atcCode,
            substanz: p.substanz,
            zusammensetzung: p.zusammensetzung,
          },
        })
      )
    )
    upserted += chunk.length
  }

  return { upserted }
}

export async function getOddbByGtin(gtin: string): Promise<{
  prodno: string
  substanz: string | null
  zusammensetzung: string | null
  atcCode: string
} | null> {
  const row = await prisma.oddbProduct.findUnique({
    where: { gtin },
    select: { prodno: true, substanz: true, zusammensetzung: true, atcCode: true },
  })
  return row ?? null
}

// ── BWL Integration ───────────────────────────────────────────────────────────

export async function upsertBwlShortages(
  entries: import('./bwl-scraper').BwlShortageData[]
): Promise<{ upserted: number }> {
  const now = new Date()
  let upserted = 0

  for (const entry of entries) {
    if (!entry.gtin) continue
    await prisma.bwlShortage.upsert({
      where: { gtin: entry.gtin },
      create: {
        gtin: entry.gtin,
        atcCode: entry.atcCode,
        bezeichnung: entry.bezeichnung,
        eintrittsdatum: entry.eintrittsdatum ?? null,
        voraussichtlicheDauer: entry.voraussichtlicheDauer ?? null,
        bemerkungen: entry.bemerkungen ?? null,
        datumPublikation: entry.datumPublikation ?? null,
        letzteAktualisierung: entry.letzteAktualisierung ?? null,
        fetchedAt: now,
      },
      update: {
        atcCode: entry.atcCode,
        bezeichnung: entry.bezeichnung,
        eintrittsdatum: entry.eintrittsdatum ?? null,
        voraussichtlicheDauer: entry.voraussichtlicheDauer ?? null,
        bemerkungen: entry.bemerkungen ?? null,
        datumPublikation: entry.datumPublikation ?? null,
        letzteAktualisierung: entry.letzteAktualisierung ?? null,
        fetchedAt: now,
      },
    })
    upserted++
  }

  return { upserted }
}

export async function getBwlGtins(): Promise<string[]> {
  const rows = await prisma.bwlShortage.findMany({ select: { gtin: true } })
  return rows.map(r => r.gtin)
}

// ── Weekly Timeline ───────────────────────────────────────────────────────────

export interface WeeklyDataPoint {
  week: string   // ISO week label e.g. "2026-W04"
  count: number  // new shortages first seen that week
}

export async function getWeeklyTimeline(weeks = 52): Promise<WeeklyDataPoint[]> {
  const rows = await prisma.$queryRaw<WeeklyDataPoint[]>(Prisma.sql`
    WITH week_series AS (
      SELECT TO_CHAR(
        generate_series(
          DATE_TRUNC('week', NOW() - (${weeks} * INTERVAL '1 week')),
          DATE_TRUNC('week', NOW()),
          '1 week'::interval
        ),
        'IYYY-"KW"IW'
      ) AS week
    ),
    counts AS (
      SELECT
        TO_CHAR(DATE_TRUNC('week',
          CASE
            WHEN "ersteMeldung" ~ '^\d{2}\.\d{2}\.\d{4}$'
              THEN TO_DATE("ersteMeldung", 'DD.MM.YYYY')
            ELSE (NOW() - ("tageSeitMeldung" * INTERVAL '1 day'))::date
          END
        ), 'IYYY-"KW"IW') AS week,
        COUNT(*)::int AS count
      FROM "shortages"
      WHERE "isActive" = true
      GROUP BY 1
    )
    SELECT w.week, COALESCE(c.count, 0) AS count
    FROM week_series w
    LEFT JOIN counts c ON w.week = c.week
    ORDER BY w.week ASC
  `)
  return rows
}

export async function getHistoricalByGengrp(
  gengrp: string,
  excludeGtin: string
): Promise<Shortage[]> {
  if (!gengrp) return []
  const rows = await prisma.shortage.findMany({
    where: {
      gengrp,
      gtin: { not: excludeGtin },
      isActive: false,
    },
    orderBy: { tageSeitMeldung: 'desc' },
    take: 20,
  })
  return rows.map(mapShortage)
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
