import { prisma } from './prisma-optimized'
import type { Shortage } from './types'
import { Prisma } from '@prisma/client'
import { toSlug } from './slug'

/**
 * ✅ SQL-injection-safe bulk upsert using Prisma's parameterized queries.
 * Also manages ShortageEpisode rows and occurrenceCount:
 *   - New GTIN        → create Shortage + open Episode
 *   - Existing GTIN   → update Shortage (keep isActive = true)
 *   - Missing GTIN    → set isActive = false + close Episode
 *   - Reactivated     → set isActive = true + open new Episode + occurrenceCount++
 */
export async function upsertShortagesOptimizedSafe(
  incoming: Shortage[],
): Promise<{ newEntries: number; removedEntries: number }> {
  const now = new Date()
  const incomingGtinSet = new Set(incoming.map(s => s.gtin))

  // Fetch existing rows: GTIN, firstSeenAt, isActive
  const existingRows = await prisma.shortage.findMany({
    select: { gtin: true, firstSeenAt: true, isActive: true },
  })
  const existingMap = new Map(existingRows.map(r => [r.gtin, r]))

  // Deduplicate by GTIN (keep last occurrence) to prevent ON CONFLICT errors
  const deduped = Array.from(new Map(incoming.map(s => [s.gtin, s])).values())
  const toCreate     = deduped.filter(s => !existingMap.has(s.gtin))
  const toUpdate     = deduped.filter(s => existingMap.has(s.gtin))
  // GTINs that were active in DB but missing from this scrape
  const toDeactivate = existingRows.filter(r => r.isActive && !incomingGtinSet.has(r.gtin))
  // GTINs that were inactive in DB and are back in this scrape
  const toReactivate = deduped.filter(s => {
    const ex = existingMap.get(s.gtin)
    return ex && !ex.isActive
  })

  // ── 1. Create new shortages + open episodes ──────────────────────────────
  if (toCreate.length > 0) {
    await prisma.shortage.createMany({
      data: toCreate.map(s => ({
        gtin: s.gtin,
        slug: toSlug(s.bezeichnung) || null,
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
        firstSeenAt: now,
        lastSeenAt: now,
        isActive: true,
        occurrenceCount: 1,
      })),
      skipDuplicates: true,
    })

    await prisma.shortageEpisode.createMany({
      data: toCreate.map(s => ({ gtin: s.gtin, startedAt: now, endedAt: null, durationDays: null })),
    })
  }

  // ── 2. Batch update existing shortages ───────────────────────────────────
  if (toUpdate.length > 0) {
    const CHUNK_SIZE = 100
    for (let i = 0; i < toUpdate.length; i += CHUNK_SIZE) {
      const chunk = toUpdate.slice(i, i + CHUNK_SIZE)

      const values = chunk.map(s => {
        const firstSeenAt = existingMap.get(s.gtin)!.firstSeenAt
        return Prisma.sql`(
          ${s.gtin}, ${s.pharmacode}, ${s.bezeichnung}, ${s.firma},
          ${s.atcCode}, ${s.gengrp}, ${s.statusCode}, ${s.statusText},
          ${s.datumLieferfahigkeit ?? ''}, ${s.datumLetzteMutation ?? ''},
          ${s.tageSeitMeldung ?? 0}, ${s.detailUrl ?? ''},
          ${s.alternativenUrl}, ${s.ersteMeldung}, ${s.ersteMeldungDurch},
          ${s.ersteInfoDurchFirma}, ${s.artDerInfoDurchFirma},
          ${s.voraussichtlicheDauer}, ${s.bemerkungen},
          ${firstSeenAt}, ${now}, ${true}
        )`
      })

      const query = Prisma.sql`
        INSERT INTO "shortages" (
          gtin, pharmacode, bezeichnung, firma, "atcCode", gengrp,
          "statusCode", "statusText", "datumLieferfahigkeit",
          "datumLetzteMutation", "tageSeitMeldung", "detailUrl",
          "alternativenUrl", "ersteMeldung", "ersteMeldungDurch",
          "ersteInfoDurchFirma", "artDerInfoDurchFirma",
          "voraussichtlicheDauer", bemerkungen,
          "firstSeenAt", "lastSeenAt", "isActive"
        )
        VALUES ${Prisma.join(values)}
        ON CONFLICT (gtin) DO UPDATE SET
          pharmacode = EXCLUDED.pharmacode,
          bezeichnung = EXCLUDED.bezeichnung,
          firma = EXCLUDED.firma,
          "atcCode" = EXCLUDED."atcCode",
          gengrp = EXCLUDED.gengrp,
          "statusCode" = EXCLUDED."statusCode",
          "statusText" = EXCLUDED."statusText",
          "datumLieferfahigkeit" = EXCLUDED."datumLieferfahigkeit",
          "datumLetzteMutation" = EXCLUDED."datumLetzteMutation",
          "tageSeitMeldung" = EXCLUDED."tageSeitMeldung",
          "detailUrl" = EXCLUDED."detailUrl",
          "alternativenUrl" = EXCLUDED."alternativenUrl",
          "ersteMeldung" = EXCLUDED."ersteMeldung",
          "ersteMeldungDurch" = EXCLUDED."ersteMeldungDurch",
          "ersteInfoDurchFirma" = EXCLUDED."ersteInfoDurchFirma",
          "artDerInfoDurchFirma" = EXCLUDED."artDerInfoDurchFirma",
          "voraussichtlicheDauer" = EXCLUDED."voraussichtlicheDauer",
          bemerkungen = EXCLUDED.bemerkungen,
          "lastSeenAt" = EXCLUDED."lastSeenAt"
      `
      await prisma.$executeRaw(query)
    }
  }

  // ── 3. Reactivate returning shortages + open new episodes ────────────────
  if (toReactivate.length > 0) {
    await prisma.shortage.updateMany({
      where: { gtin: { in: toReactivate.map(s => s.gtin) } },
      data: { isActive: true, lastSeenAt: now, occurrenceCount: { increment: 1 } },
    })

    await prisma.shortageEpisode.createMany({
      data: toReactivate.map(s => ({ gtin: s.gtin, startedAt: now, endedAt: null, durationDays: null })),
    })
  }

  // ── 4. Deactivate removed shortages + close open episodes ────────────────
  if (toDeactivate.length > 0) {
    const gtins = toDeactivate.map(r => r.gtin)

    await prisma.shortage.updateMany({
      where: { gtin: { in: gtins } },
      data: { isActive: false, lastSeenAt: now },
    })

    // Close all open episodes for these GTINs
    const openEpisodes = await prisma.shortageEpisode.findMany({
      where: { gtin: { in: gtins }, endedAt: null },
      select: { id: true, startedAt: true },
    })

    await Promise.all(
      openEpisodes.map(ep =>
        prisma.shortageEpisode.update({
          where: { id: ep.id },
          data: {
            endedAt: now,
            durationDays: Math.round((now.getTime() - ep.startedAt.getTime()) / 86_400_000),
          },
        })
      )
    )
  }

  return {
    newEntries: toCreate.length,
    removedEntries: toDeactivate.length,
  }
}
