import { prisma } from './prisma-optimized'
import type { Shortage } from './types'
import { Prisma } from '@prisma/client'

/**
 * ✅ SQL-injection-safe bulk upsert using Prisma's parameterized queries
 */
export async function upsertShortagesOptimizedSafe(
  incoming: Shortage[],
): Promise<{ newEntries: number; removedEntries: number }> {
  const now = new Date()
  const incomingGtins = incoming.map(s => s.gtin)

  // Fetch only GTINs and firstSeenAt
  const existingRows = await prisma.shortage.findMany({
    select: { gtin: true, firstSeenAt: true },
  })
  const existingMap = new Map(existingRows.map(r => [r.gtin, r.firstSeenAt]))

  // Deduplicate by GTIN (keep last occurrence) to prevent ON CONFLICT errors
  const deduped = Array.from(new Map(incoming.map(s => [s.gtin, s])).values())
  const toCreate = deduped.filter(s => !existingMap.has(s.gtin))
  const toUpdate = deduped.filter(s => existingMap.has(s.gtin))

  // ✅ Batch create with createMany
  if (toCreate.length > 0) {
    await prisma.shortage.createMany({
      data: toCreate.map(s => ({
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
        firstSeenAt: now,
        lastSeenAt: now,
        isActive: true,
      })),
      skipDuplicates: true,
    })
  }

  // ✅ Batch update using Prisma's parameterized raw query
  if (toUpdate.length > 0) {
    // Process in chunks to avoid query size limits
    const CHUNK_SIZE = 100
    for (let i = 0; i < toUpdate.length; i += CHUNK_SIZE) {
      const chunk = toUpdate.slice(i, i + CHUNK_SIZE)

      // Build parameterized values for safe SQL execution
      const values = chunk.map(s => {
        const firstSeenAt = existingMap.get(s.gtin)!
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

  // ✅ Deactivate removed shortages
  const deactivated = await prisma.shortage.updateMany({
    where: {
      isActive: true,
      gtin: { notIn: incomingGtins },
    },
    data: { isActive: false, lastSeenAt: now },
  })

  return {
    newEntries: toCreate.length,
    removedEntries: deactivated.count,
  }
}
