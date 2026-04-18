import { prisma } from './prisma-optimized'
import { Prisma } from '@prisma/client'
import type { Shortage, ShortagesQuery, ShortagesResponse, KPIStats, OverviewStats } from './types'
import { toSlug } from './slug'

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapShortage(s: {
  id: number
  gtin: string
  slug?: string | null
  pharmacode: string
  bezeichnung: string
  firma: string
  atcCode: string
  gengrp: string
  statusCode: number
  statusText: string | null
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
    slug: s.slug ?? undefined,
    pharmacode: s.pharmacode,
    bezeichnung: s.bezeichnung,
    firma: s.firma,
    atcCode: s.atcCode,
    gengrp: s.gengrp,
    statusCode: s.statusCode,
    statusText: s.statusText ?? '',
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
    slug: toSlug(s.bezeichnung),
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
        slug: toSlug(s.bezeichnung),
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
  // statusCode 1–5 are the official drugshortage.ch codes; 0/8/9 are parse artifacts / "abgeschlossen"
  const where: Record<string, unknown> = { isActive: true, statusCode: { gte: 1, lte: 5 } }

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
    uniqueAtcGroups,
    avgDaysSinceMeldung: avgDays,
    lastScrapedAt: lastRun?.scrapedAt.toISOString() ?? null,
  }
}

// ── Historical shortages ──────────────────────────────────────────────────────

export interface HistoricalQuery {
  search?: string
  firma?: string
  page?: number
  perPage?: number
  sort?: string
}

export interface HistoricalShortage {
  id: number
  gtin: string
  bezeichnung: string
  slug: string | null
  firma: string
  atcCode: string
  statusCode: number
  firstSeenAt: string
  lastSeenAt: string
  occurrenceCount: number
  durationDays: number | null // from latest closed episode
}

export async function queryHistoricalShortages(query: HistoricalQuery): Promise<{
  data: HistoricalShortage[]
  total: number
  page: number
  perPage: number
}> {
  const page = query.page ?? 1
  const perPage = query.perPage ?? 50

  const where: Record<string, unknown> = { isActive: false }
  if (query.search) {
    where['OR'] = [
      { bezeichnung: { contains: query.search, mode: 'insensitive' } },
      { firma: { contains: query.search, mode: 'insensitive' } },
    ]
  }
  if (query.firma) where['firma'] = query.firma

  let orderBy: Record<string, string> = { lastSeenAt: 'desc' }
  if (query.sort) {
    const [field, dir] = query.sort.split(':')
    if (['bezeichnung', 'firma', 'lastSeenAt', 'firstSeenAt', 'occurrenceCount'].includes(field)) {
      orderBy = { [field]: dir === 'desc' ? 'desc' : 'asc' }
    }
  }

  const [total, rows] = await Promise.all([
    prisma.shortage.count({ where }),
    prisma.shortage.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true, gtin: true, bezeichnung: true, slug: true, firma: true,
        atcCode: true, statusCode: true, firstSeenAt: true, lastSeenAt: true,
        occurrenceCount: true,
      },
    }),
  ])

  // Enrich with latest episode duration
  const gtins = rows.map(r => r.gtin)
  const episodes = gtins.length > 0
    ? await prisma.shortageEpisode.findMany({
        where: { gtin: { in: gtins }, endedAt: { not: null } },
        orderBy: { endedAt: 'desc' },
        select: { gtin: true, durationDays: true },
      })
    : []
  const durationMap = new Map<string, number | null>()
  for (const ep of episodes) {
    if (!durationMap.has(ep.gtin)) durationMap.set(ep.gtin, ep.durationDays)
  }

  return {
    data: rows.map(r => ({
      ...r,
      firstSeenAt: r.firstSeenAt.toISOString(),
      lastSeenAt: r.lastSeenAt.toISOString(),
      durationDays: durationMap.get(r.gtin) ?? null,
    })),
    total,
    page,
    perPage,
  }
}

/** Direct (uncached) last-scrape timestamp — always fresh, never LRU-cached */
export async function getHistoricalCount(): Promise<number> {
  return prisma.shortage.count({ where: { isActive: false } })
}

export async function getLastScrapedAt(): Promise<string | null> {
  const row = await prisma.scrapeRun.findFirst({
    where: { status: 'success' },
    orderBy: { scrapedAt: 'desc' },
    select: { scrapedAt: true },
  })
  return row?.scrapedAt.toISOString() ?? null
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

export async function getShortageBySlug(slug: string): Promise<Shortage | null> {
  const row = await prisma.shortage.findFirst({
    where: { slug },
    orderBy: { isActive: 'desc' }, // active entries first if slug appears multiple times
  })
  return row ? mapShortage(row) : null
}

export async function getAllDrugSlugs(): Promise<Array<{ slug: string; bezeichnung: string; pharmacode: string; lastSeenAt: Date }>> {
  const rows = await prisma.shortage.findMany({
    where: { isActive: true },
    select: { bezeichnung: true, pharmacode: true, lastSeenAt: true },
  })
  const seen = new Set<string>()
  const result: Array<{ slug: string; bezeichnung: string; pharmacode: string; lastSeenAt: Date }> = []
  for (const r of rows) {
    const slug = toSlug(r.bezeichnung)
    if (seen.has(slug)) {
      console.warn(`[getAllDrugSlugs] slug collision: "${slug}" (${r.bezeichnung})`)
      continue
    }
    seen.add(slug)
    result.push({ slug, bezeichnung: r.bezeichnung, pharmacode: r.pharmacode, lastSeenAt: r.lastSeenAt })
  }
  return result
}

// ── Firma Profile ─────────────────────────────────────────────────────────────

export async function getFirmaBySlug(slug: string): Promise<string | null> {
  const rows = await prisma.shortage.findMany({
    where: { isActive: true, statusCode: { gte: 1, lte: 5 } },
    select: { firma: true },
    distinct: ['firma'],
  })
  const match = rows.find(r => toSlug(r.firma) === slug)
  return match?.firma ?? null
}

export async function getFirmaActiveShortages(firma: string): Promise<Shortage[]> {
  const rows = await prisma.shortage.findMany({
    where: { isActive: true, statusCode: { gte: 1, lte: 5 }, firma },
    orderBy: { tageSeitMeldung: 'desc' },
  })
  return rows.map(mapShortage)
}

export async function getFirmaHistoricalCount(firma: string): Promise<number> {
  return prisma.shortage.count({ where: { isActive: false, firma } })
}

export async function getAllFirmaSlugs(): Promise<Array<{ slug: string; firma: string }>> {
  const rows = await prisma.shortage.findMany({
    where: { isActive: true, statusCode: { gte: 1, lte: 5 } },
    select: { firma: true },
    distinct: ['firma'],
  })
  const seen = new Set<string>()
  const result: Array<{ slug: string; firma: string }> = []
  for (const r of rows) {
    const slug = toSlug(r.firma)
    if (seen.has(slug)) continue
    seen.add(slug)
    result.push({ slug, firma: r.firma })
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
            authStatus: p.authStatus,
          },
          update: {
            prodno: p.prodno,
            bezeichnungDe: p.bezeichnungDe,
            atcCode: p.atcCode,
            substanz: p.substanz,
            zusammensetzung: p.zusammensetzung,
            authStatus: p.authStatus,
          },
        })
      )
    )
    upserted += chunk.length
  }

  return { upserted }
}

export async function upsertOddbPrices(
  prices: import('./oddb-scraper').OddbPriceData[]
): Promise<{ upserted: number }> {
  if (prices.length === 0) return { upserted: 0 }
  const CHUNK = 500
  let upserted = 0
  for (let i = 0; i < prices.length; i += CHUNK) {
    const chunk = prices.slice(i, i + CHUNK)
    const results = await Promise.allSettled(
      chunk.map(p =>
        prisma.oddbProduct.updateMany({
          where: { gtin: p.gtin },
          data: {
            ppub: p.ppub,
            pexf: p.pexf,
            // SALECD: 'A'=active → null, 'I'=inactive → 'E' (erloschen)
            ...(p.salecd != null ? { authStatus: p.salecd === 'I' ? 'E' : 'A' } : {}),
          },
        })
      )
    )
    upserted += results.filter(r => r.status === 'fulfilled' && r.value.count > 0).length
  }
  return { upserted }
}

export async function getOddbByGtin(gtin: string): Promise<{
  prodno: string
  bezeichnungDe: string | null
  substanz: string | null
  zusammensetzung: string | null
  atcCode: string
  ppub: number | null
  pexf: number | null
  authStatus: string | null
} | null> {
  const row = await prisma.oddbProduct.findUnique({
    where: { gtin },
    select: { prodno: true, bezeichnungDe: true, substanz: true, zusammensetzung: true, atcCode: true, ppub: true, pexf: true, authStatus: true },
  })
  return row ?? null
}

export async function getSubstanzByAtc(atcCode: string): Promise<string | null> {
  const row = await prisma.oddbProduct.findFirst({
    where: { atcCode, substanz: { not: null } },
    select: { substanz: true },
  })
  return row?.substanz ?? null
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
  week: string    // ISO week label e.g. "2026-KW04"
  count: number   // new shortages first seen that week
  active?: number // concurrently active shortages that week (from episodes)
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
          TO_DATE("ersteMeldung", 'DD.MM.YYYY')
        ), 'IYYY-"KW"IW') AS week,
        COUNT(*)::int AS count
      FROM "shortages"
      WHERE "ersteMeldung" ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$'
      GROUP BY 1
    )
    SELECT w.week, COALESCE(c.count, 0) AS count
    FROM week_series w
    LEFT JOIN counts c ON w.week = c.week
    ORDER BY w.week ASC
  `)
  return rows
}

/** Weekly timeline: new shortages per week (all, active + historical) via ersteMeldung */
export async function getWeeklyTimelineWithActive(weeks = 52): Promise<WeeklyDataPoint[]> {
  return prisma.$queryRaw<WeeklyDataPoint[]>(Prisma.sql`
    WITH week_series AS (
      SELECT TO_CHAR(
        generate_series(
          DATE_TRUNC('week', NOW() - (${weeks} * INTERVAL '1 week')),
          DATE_TRUNC('week', NOW()),
          '1 week'::interval
        ), 'IYYY-"KW"IW') AS week
    ),
    counts AS (
      SELECT TO_CHAR(DATE_TRUNC('week',
        TO_DATE("ersteMeldung", 'DD.MM.YYYY')
        ), 'IYYY-"KW"IW') AS week,
        COUNT(*)::int AS count
      FROM "shortages"
      WHERE "ersteMeldung" ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$'
      GROUP BY 1
    )
    SELECT ws.week, COALESCE(c.count, 0) AS count
    FROM week_series ws LEFT JOIN counts c ON ws.week = c.week
    ORDER BY ws.week ASC
  `)
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

// ── Off-Market Drugs ──────────────────────────────────────────────────────────

export async function upsertOffMarketDrugs(
  entries: import('./scraper').OffMarketEntry[]
): Promise<{ upserted: number }> {
  const CHUNK = 500
  let upserted = 0

  for (let i = 0; i < entries.length; i += CHUNK) {
    const chunk = entries.slice(i, i + CHUNK)
    await Promise.all(
      chunk.map(e =>
        prisma.offMarketDrug.upsert({
          where: { gtin_category: { gtin: e.gtin, category: e.category } },
          create: {
            gtin: e.gtin,
            bezeichnung: e.bezeichnung,
            firma: e.firma,
            atcCode: e.atcCode,
            datum: e.datum,
            category: e.category,
          },
          update: {
            bezeichnung: e.bezeichnung,
            firma: e.firma,
            atcCode: e.atcCode,
            datum: e.datum,
          },
        })
      )
    )
    upserted += chunk.length
  }
  return { upserted }
}

export interface OffMarketQuery {
  category: 'AUSSER_HANDEL' | 'VERTRIEBSEINSTELLUNG' | 'ERLOSCHEN'
  search?: string
  firma?: string
  page?: number
  perPage?: number
}

export async function queryOffMarketDrugs(query: OffMarketQuery): Promise<{
  data: import('@prisma/client').OffMarketDrug[]
  total: number
  page: number
  perPage: number
}> {
  const page = query.page ?? 1
  const perPage = query.perPage ?? 50

  const where: Record<string, unknown> = { category: query.category }
  if (query.firma) where['firma'] = query.firma
  if (query.search) {
    where['OR'] = [
      { bezeichnung: { contains: query.search, mode: 'insensitive' } },
      { firma: { contains: query.search, mode: 'insensitive' } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.offMarketDrug.findMany({
      where,
      orderBy: { bezeichnung: 'asc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.offMarketDrug.count({ where }),
  ])

  return { data, total, page, perPage }
}

export async function getOffMarketGtins(): Promise<Set<string>> {
  const rows = await prisma.offMarketDrug.findMany({
    select: { gtin: true },
    where: { category: 'AUSSER_HANDEL' },
  })
  return new Set(rows.map(r => r.gtin))
}

export async function getOffMarketStats(): Promise<{
  ausserHandel: number
  vertriebseingestellt: number
  erloschen: number
}> {
  const [ah, ve, er] = await Promise.all([
    prisma.offMarketDrug.count({ where: { category: 'AUSSER_HANDEL' } }),
    prisma.offMarketDrug.count({ where: { category: 'VERTRIEBSEINSTELLUNG' } }),
    prisma.offMarketDrug.count({ where: { category: 'ERLOSCHEN' } }),
  ])
  return { ausserHandel: ah, vertriebseingestellt: ve, erloschen: er }
}

export async function getOffMarketByGtin(gtin: string): Promise<import('@prisma/client').OffMarketDrug[]> {
  return prisma.offMarketDrug.findMany({
    where: { gtin },
    orderBy: { category: 'asc' },
  })
}

export async function syncErloschenFromOddb(): Promise<{ upserted: number }> {
  const CHUNK = 500
  let upserted = 0

  // GTINs already tracked via drugshortage.ch (AUSSER_HANDEL / VERTRIEBSEINSTELLUNG)
  const existing = await prisma.offMarketDrug.findMany({
    where: { category: { in: ['AUSSER_HANDEL', 'VERTRIEBSEINSTELLUNG'] } },
    select: { gtin: true },
  })
  const existingGtins = new Set(existing.map(r => r.gtin))

  const rows = await prisma.oddbProduct.findMany({
    where: { authStatus: 'E' },
    select: { gtin: true, bezeichnungDe: true, atcCode: true },
  })

  // Only process rows not already tracked via drugshortage.ch
  const newRows = rows.filter(r => !existingGtins.has(r.gtin))

  for (let i = 0; i < newRows.length; i += CHUNK) {
    const chunk = newRows.slice(i, i + CHUNK)
    await Promise.all(
      chunk.map(p =>
        prisma.offMarketDrug.upsert({
          where: { gtin_category: { gtin: p.gtin, category: 'ERLOSCHEN' } },
          create: {
            gtin: p.gtin,
            bezeichnung: p.bezeichnungDe,
            firma: '',
            atcCode: p.atcCode,
            datum: null,
            category: 'ERLOSCHEN',
          },
          update: {
            bezeichnung: p.bezeichnungDe,
            atcCode: p.atcCode,
          },
        })
      )
    )
    upserted += chunk.length
  }

  return { upserted: newRows.length }
}

// ── Episode queries ───────────────────────────────────────────────────────────

/** All episodes for a single drug, newest first */
export async function getEpisodesForGtin(gtin: string) {
  return prisma.shortageEpisode.findMany({
    where: { gtin },
    orderBy: { startedAt: 'desc' },
  })
}

/** Summary stats for a drug: total episodes, avg duration, longest episode */
export async function getEpisodeStats(gtin: string) {
  const episodes = await prisma.shortageEpisode.findMany({
    where: { gtin, endedAt: { not: null } },
    select: { durationDays: true },
  })
  const durations = episodes.map(e => e.durationDays ?? 0)
  return {
    totalEpisodes: durations.length,
    avgDurationDays: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null,
    maxDurationDays: durations.length ? Math.max(...durations) : null,
  }
}

/** Drugs with the most recurring shortage episodes (for analytics) */
export async function getTopRecurringDrugs(limit = 20) {
  return prisma.shortageEpisode.groupBy({
    by: ['gtin'],
    _count: { gtin: true },
    orderBy: { _count: { gtin: 'desc' } },
    take: limit,
  })
}
