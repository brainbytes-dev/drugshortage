/**
 * ⚠️ DEPRECATED: Use db-optimized-upsert-safe.ts instead
 *
 * This file uses $executeRawUnsafe with manual string escaping, which is:
 * 1. SQL injection risk (despite escaping)
 * 2. Slower than parameterized queries
 * 3. Harder to maintain
 *
 * Migration: Replace all imports with the safe version
 */

import { prisma } from './prisma'
import type { Shortage } from './types'

/**
 * @deprecated Use upsertShortagesOptimizedSafe from db-optimized-upsert-safe.ts
 * This version uses unsafe raw SQL. The safe version uses Prisma's parameterized queries.
 */
export async function upsertShortagesOptimized(
  incoming: Shortage[],
): Promise<{ newEntries: number; removedEntries: number }> {
  const now = new Date()
  const incomingGtins = new Set(incoming.map(s => s.gtin))

  // Helper function to transform shortage data
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

  // ✅ Fetch only GTINs and firstSeenAt (not entire records)
  const existingRows = await prisma.shortage.findMany({
    select: { gtin: true, firstSeenAt: true },
  })
  const existingMap = new Map(existingRows.map(r => [r.gtin, r.firstSeenAt]))

  // ✅ Pre-compute transformed data once per shortage
  const toCreateData = incoming
    .filter(s => !existingMap.has(s.gtin))
    .map(s => toShortageData(s, now))

  const toUpdateData = incoming
    .filter(s => existingMap.has(s.gtin))
    .map(s => ({ gtin: s.gtin, data: toShortageData(s, existingMap.get(s.gtin)!) }))

  // ✅ Batch create new entries
  if (toCreateData.length) {
    await prisma.shortage.createMany({
      data: toCreateData,
      skipDuplicates: true,
    })
  }

  // ✅ For updates, use raw SQL for better performance
  if (toUpdateData.length > 0) {
    // Build a VALUES clause for batch update
    const values = toUpdateData.map(({ data }) => {
      // Escape single quotes for SQL safety
      const esc = (s: string | null) => s ? s.replace(/'/g, "''") : ''
      return `(
        '${esc(data.gtin)}',
        '${esc(data.pharmacode)}',
        '${esc(data.bezeichnung)}',
        '${esc(data.firma)}',
        '${esc(data.atcCode)}',
        '${esc(data.gengrp)}',
        ${data.statusCode},
        '${esc(data.statusText)}',
        '${esc(data.datumLieferfahigkeit)}',
        '${esc(data.datumLetzteMutation)}',
        ${data.tageSeitMeldung},
        '${esc(data.detailUrl)}',
        ${data.alternativenUrl ? `'${esc(data.alternativenUrl)}'` : 'NULL'},
        ${data.ersteMeldung ? `'${esc(data.ersteMeldung)}'` : 'NULL'},
        ${data.ersteMeldungDurch ? `'${esc(data.ersteMeldungDurch)}'` : 'NULL'},
        ${data.ersteInfoDurchFirma ? `'${esc(data.ersteInfoDurchFirma)}'` : 'NULL'},
        ${data.artDerInfoDurchFirma ? `'${esc(data.artDerInfoDurchFirma)}'` : 'NULL'},
        ${data.voraussichtlicheDauer ? `'${esc(data.voraussichtlicheDauer)}'` : 'NULL'},
        ${data.bemerkungen ? `'${esc(data.bemerkungen)}'` : 'NULL'},
        '${data.firstSeenAt.toISOString()}',
        '${data.lastSeenAt.toISOString()}',
        ${data.isActive}
      )`
    }).join(',')

    // ✅ Single bulk upsert query instead of N individual UPDATEs
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Shortage" (
        gtin, pharmacode, bezeichnung, firma, "atcCode", gengrp, "statusCode", "statusText",
        "datumLieferfahigkeit", "datumLetzteMutation", "tageSeitMeldung", "detailUrl",
        "alternativenUrl", "ersteMeldung", "ersteMeldungDurch", "ersteInfoDurchFirma",
        "artDerInfoDurchFirma", "voraussichtlicheDauer", bemerkungen,
        "firstSeenAt", "lastSeenAt", "isActive"
      )
      VALUES ${values}
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
        "lastSeenAt" = EXCLUDED."lastSeenAt",
        "isActive" = EXCLUDED."isActive"
    `)
  }

  // ✅ Deactivate shortages not in this scrape
  const deactivated = await prisma.shortage.updateMany({
    where: { isActive: true, gtin: { notIn: Array.from(incomingGtins) } },
    data: { isActive: false, lastSeenAt: now },
  })

  return {
    newEntries: toCreateData.length,
    removedEntries: deactivated.count,
  }
}
