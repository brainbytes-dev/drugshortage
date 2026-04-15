/**
 * Tests for database concurrency, edge cases, and error handling
 */

import { upsertShortages, queryShortages, getKPIStats, getFirmaList } from '@/lib/db'
import { prisma } from '@/lib/prisma'
import type { Shortage } from '@/lib/types'

describe('Database Concurrency and Edge Cases', () => {
  beforeEach(async () => {
    await prisma.shortage.deleteMany()
  })

  describe('Concurrent upsertShortages', () => {
    test('handles concurrent upserts of same GTIN without duplicates', async () => {
      const shortage: Shortage = {
        gtin: '111',
        pharmacode: '999',
        bezeichnung: 'Concurrent Med',
        firma: 'Test Firma',
        atcCode: 'A01',
        gengrp: 'GRP1',
        statusCode: 1,
        statusText: '1',
        datumLieferfahigkeit: '',
        datumLetzteMutation: '',
        tageSeitMeldung: 10,
        detailUrl: '',
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        isActive: true,
      }

      await Promise.all([
        upsertShortages([shortage]),
        upsertShortages([shortage]),
        upsertShortages([shortage]),
      ])

      const count = await prisma.shortage.count({ where: { gtin: '111' } })
      expect(count).toBe(1)
    })

    test('handles concurrent upserts of different GTINs', async () => {
      const shortage1: Shortage = {
        gtin: '111',
        pharmacode: '999',
        bezeichnung: 'Med 1',
        firma: 'Firma A',
        atcCode: 'A01',
        gengrp: 'GRP1',
        statusCode: 1,
        statusText: '1',
        datumLieferfahigkeit: '',
        datumLetzteMutation: '',
        tageSeitMeldung: 10,
        detailUrl: '',
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        isActive: true,
      }

      const shortage2: Shortage = {
        ...shortage1,
        gtin: '222',
        bezeichnung: 'Med 2',
      }

      const shortage3: Shortage = {
        ...shortage1,
        gtin: '333',
        bezeichnung: 'Med 3',
      }

      await Promise.all([
        upsertShortages([shortage1]),
        upsertShortages([shortage2]),
        upsertShortages([shortage3]),
      ])

      const count = await prisma.shortage.count()
      expect(count).toBe(3)
    })

    test('preserves firstSeenAt across concurrent updates', async () => {
      const originalDate = new Date('2026-01-01T00:00:00Z')
      await prisma.shortage.create({
        data: {
          gtin: '111',
          pharmacode: '999',
          bezeichnung: 'Med',
          firma: 'Firma',
          atcCode: 'A01',
          gengrp: 'GRP1',
          statusCode: 1,
          statusText: '1',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 10,
          detailUrl: '',
          firstSeenAt: originalDate,
          isActive: true,
        },
      })

      const update: Shortage = {
        gtin: '111',
        pharmacode: '999',
        bezeichnung: 'Med Updated',
        firma: 'Firma',
        atcCode: 'A01',
        gengrp: 'GRP1',
        statusCode: 2,
        statusText: '2',
        datumLieferfahigkeit: '',
        datumLetzteMutation: '',
        tageSeitMeldung: 20,
        detailUrl: '',
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        isActive: true,
      }

      await Promise.all([
        upsertShortages([update]),
        upsertShortages([update]),
      ])

      const result = await prisma.shortage.findUnique({ where: { gtin: '111' } })
      expect(result?.firstSeenAt).toEqual(originalDate)
    })
  })

  describe('upsertShortages with large batches', () => {
    test('handles batch of 100+ shortages', async () => {
      const shortages: Shortage[] = Array.from({ length: 150 }, (_, i) => ({
        gtin: `${i}`,
        pharmacode: `${i * 100}`,
        bezeichnung: `Med ${i}`,
        firma: 'Batch Firma',
        atcCode: 'A01',
        gengrp: 'GRP1',
        statusCode: 1,
        statusText: '1',
        datumLieferfahigkeit: '',
        datumLetzteMutation: '',
        tageSeitMeldung: 10,
        detailUrl: '',
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        isActive: true,
      }))

      const { newEntries } = await upsertShortages(shortages)
      expect(newEntries).toBe(150)

      const count = await prisma.shortage.count()
      expect(count).toBe(150)
    })

    test('chunks updates correctly for large batches', async () => {
      // Create 100 existing entries
      const existing: Shortage[] = Array.from({ length: 100 }, (_, i) => ({
        gtin: `${i}`,
        pharmacode: `${i * 100}`,
        bezeichnung: `Med ${i}`,
        firma: 'Firma',
        atcCode: 'A01',
        gengrp: 'GRP1',
        statusCode: 1,
        statusText: '1',
        datumLieferfahigkeit: '',
        datumLetzteMutation: '',
        tageSeitMeldung: 10,
        detailUrl: '',
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        isActive: true,
      }))
      await upsertShortages(existing)

      // Update all with new data
      const updates: Shortage[] = existing.map(s => ({
        ...s,
        tageSeitMeldung: 20,
      }))
      await upsertShortages(updates)

      const all = await prisma.shortage.findMany()
      expect(all.every(s => s.tageSeitMeldung === 20)).toBe(true)
    })
  })

  describe('queryShortages edge cases', () => {
    test('handles empty search string', async () => {
      await upsertShortages([
        {
          gtin: '111',
          pharmacode: '999',
          bezeichnung: 'Test Med',
          firma: 'Test Firma',
          atcCode: 'A01',
          gengrp: 'GRP1',
          statusCode: 1,
          statusText: '1',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 10,
          detailUrl: '',
          firstSeenAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          isActive: true,
        },
      ])

      const result = await queryShortages({ search: '' })
      expect(result.data).toHaveLength(1) // Empty search should return all
    })

    test('handles whitespace-only search', async () => {
      await upsertShortages([
        {
          gtin: '111',
          pharmacode: '999',
          bezeichnung: 'Test Med',
          firma: 'Test Firma',
          atcCode: 'A01',
          gengrp: 'GRP1',
          statusCode: 1,
          statusText: '1',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 10,
          detailUrl: '',
          firstSeenAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          isActive: true,
        },
      ])

      const result = await queryShortages({ search: '   ' })
      expect(result.data).toHaveLength(1)
    })

    test('handles special characters in search', async () => {
      await upsertShortages([
        {
          gtin: '111',
          pharmacode: '999',
          bezeichnung: 'Test Med (Special)',
          firma: 'Test Firma',
          atcCode: 'A01',
          gengrp: 'GRP1',
          statusCode: 1,
          statusText: '1',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 10,
          detailUrl: '',
          firstSeenAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          isActive: true,
        },
      ])

      const result = await queryShortages({ search: '(Special)' })
      expect(result.data).toHaveLength(1)
    })

    test('handles invalid status codes gracefully', async () => {
      await upsertShortages([
        {
          gtin: '111',
          pharmacode: '999',
          bezeichnung: 'Test Med',
          firma: 'Test Firma',
          atcCode: 'A01',
          gengrp: 'GRP1',
          statusCode: 1,
          statusText: '1',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 10,
          detailUrl: '',
          firstSeenAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          isActive: true,
        },
      ])

      const result = await queryShortages({ status: 'invalid,99' })
      expect(result.data).toHaveLength(0)
    })

    test('handles page beyond available data', async () => {
      await upsertShortages([
        {
          gtin: '111',
          pharmacode: '999',
          bezeichnung: 'Test Med',
          firma: 'Test Firma',
          atcCode: 'A01',
          gengrp: 'GRP1',
          statusCode: 1,
          statusText: '1',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 10,
          detailUrl: '',
          firstSeenAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          isActive: true,
        },
      ])

      const result = await queryShortages({ page: 999 })
      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(1)
      expect(result.page).toBe(999)
    })

    test('handles invalid sort parameter gracefully', async () => {
      await upsertShortages([
        {
          gtin: '111',
          pharmacode: '999',
          bezeichnung: 'Test Med',
          firma: 'Test Firma',
          atcCode: 'A01',
          gengrp: 'GRP1',
          statusCode: 1,
          statusText: '1',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 10,
          detailUrl: '',
          firstSeenAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          isActive: true,
        },
      ])

      // Should fall back to default sort
      const result = await queryShortages({ sort: 'invalidField:asc' })
      expect(result.data).toHaveLength(1)
    })
  })

  describe('getKPIStats edge cases', () => {
    test('returns zero values when no active shortages', async () => {
      const stats = await getKPIStats()
      expect(stats.totalActive).toBe(0)
      expect(stats.topFirma).toBe('N/A')
      expect(stats.topFirmaCount).toBe(0)
      expect(stats.uniqueAtcGroups).toBe(0)
      expect(stats.avgDaysSinceMeldung).toBe(0)
    })

    test('calculates correct average with mixed values', async () => {
      await prisma.shortage.createMany({
        data: [
          {
            gtin: '111',
            pharmacode: '1',
            bezeichnung: 'Med 1',
            firma: 'Firma A',
            atcCode: 'A01',
            gengrp: 'GRP1',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 10,
            detailUrl: '',
            isActive: true,
          },
          {
            gtin: '222',
            pharmacode: '2',
            bezeichnung: 'Med 2',
            firma: 'Firma A',
            atcCode: 'A01',
            gengrp: 'GRP1',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 30,
            detailUrl: '',
            isActive: true,
          },
        ],
      })

      const stats = await getKPIStats()
      expect(stats.avgDaysSinceMeldung).toBe(20) // (10 + 30) / 2
    })

    test('ignores inactive shortages in KPI calculation', async () => {
      await prisma.shortage.createMany({
        data: [
          {
            gtin: '111',
            pharmacode: '1',
            bezeichnung: 'Active Med',
            firma: 'Active Firma',
            atcCode: 'A01',
            gengrp: 'GRP1',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 10,
            detailUrl: '',
            isActive: true,
          },
          {
            gtin: '222',
            pharmacode: '2',
            bezeichnung: 'Inactive Med',
            firma: 'Inactive Firma',
            atcCode: 'B02',
            gengrp: 'GRP2',
            statusCode: 9,
            statusText: '9',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 200,
            detailUrl: '',
            isActive: false,
          },
        ],
      })

      const stats = await getKPIStats()
      expect(stats.totalActive).toBe(1)
      expect(stats.topFirma).toBe('Active Firma')
      expect(stats.uniqueAtcGroups).toBe(1)
    })
  })

  describe('getFirmaList edge cases', () => {
    test('returns empty array when no active shortages', async () => {
      const result = await getFirmaList()
      expect(result).toEqual([])
    })

    test('removes duplicate firma names', async () => {
      await prisma.shortage.createMany({
        data: [
          {
            gtin: '111',
            pharmacode: '1',
            bezeichnung: 'Med 1',
            firma: 'Duplicate Firma',
            atcCode: 'A01',
            gengrp: 'GRP1',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 10,
            detailUrl: '',
            isActive: true,
          },
          {
            gtin: '222',
            pharmacode: '2',
            bezeichnung: 'Med 2',
            firma: 'Duplicate Firma',
            atcCode: 'A02',
            gengrp: 'GRP2',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 20,
            detailUrl: '',
            isActive: true,
          },
        ],
      })

      const result = await getFirmaList()
      expect(result).toEqual(['Duplicate Firma'])
    })

    test('handles empty firma names', async () => {
      await prisma.shortage.create({
        data: {
          gtin: '111',
          pharmacode: '1',
          bezeichnung: 'Med',
          firma: '',
          atcCode: 'A01',
          gengrp: 'GRP1',
          statusCode: 1,
          statusText: '1',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 10,
          detailUrl: '',
          isActive: true,
        },
      })

      const result = await getFirmaList()
      expect(result).toContain('')
    })
  })
})