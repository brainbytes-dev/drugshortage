/**
 * Cached Database Operations Tests
 * Tests for cache-wrapped database queries
 */

import { getKPIStatsCached, getFirmaListCached, invalidateStatsCache } from '@/lib/db-cached-example'
import { prisma } from '@/lib/prisma'
import { memoryCache } from '@/lib/cache'

// TODO: integration tests — require running Postgres + seeded test data (PrismaClientKnownRequestError on connection)
describe.skip('Cached Database Operations', () => {
  beforeEach(async () => {
    await prisma.shortage.deleteMany()
    await prisma.scrapeRun.deleteMany()
    memoryCache.clear()
  })

  describe('getKPIStatsCached', () => {
    test('fetches KPI stats from database on first call', async () => {
      // Insert test data
      await prisma.shortage.create({
        data: {
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
          tageSeitMeldung: 100,
          detailUrl: '',
          isActive: true,
        },
      })

      const stats = await getKPIStatsCached()

      expect(stats.totalActive).toBe(1)
      expect(stats.topFirma).toBe('Test Firma')
      expect(stats.topFirmaCount).toBe(1)
    })

    test('returns cached result on subsequent calls', async () => {
      // Insert initial data
      await prisma.shortage.create({
        data: {
          gtin: '111',
          pharmacode: '999',
          bezeichnung: 'Test Med',
          firma: 'Test Firma A',
          atcCode: 'A01',
          gengrp: 'GRP1',
          statusCode: 1,
          statusText: '1',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 100,
          detailUrl: '',
          isActive: true,
        },
      })

      const stats1 = await getKPIStatsCached()

      // Insert more data (should not affect cached result)
      await prisma.shortage.create({
        data: {
          gtin: '222',
          pharmacode: '888',
          bezeichnung: 'Test Med 2',
          firma: 'Test Firma B',
          atcCode: 'B01',
          gengrp: 'GRP2',
          statusCode: 1,
          statusText: '1',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 50,
          detailUrl: '',
          isActive: true,
        },
      })

      const stats2 = await getKPIStatsCached()

      expect(stats1.totalActive).toBe(1)
      expect(stats2.totalActive).toBe(1) // Should still be cached value
    })

    test('calculates average days correctly', async () => {
      await prisma.shortage.createMany({
        data: [
          {
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
            tageSeitMeldung: 100,
            detailUrl: '',
            isActive: true,
          },
          {
            gtin: '222',
            pharmacode: '888',
            bezeichnung: 'Med 2',
            firma: 'Firma A',
            atcCode: 'A01',
            gengrp: 'GRP1',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 200,
            detailUrl: '',
            isActive: true,
          },
        ],
      })

      const stats = await getKPIStatsCached()
      expect(stats.avgDaysSinceMeldung).toBe(150) // (100 + 200) / 2
    })

    test('identifies top firma correctly with ties', async () => {
      await prisma.shortage.createMany({
        data: [
          {
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
            tageSeitMeldung: 100,
            detailUrl: '',
            isActive: true,
          },
          {
            gtin: '222',
            pharmacode: '888',
            bezeichnung: 'Med 2',
            firma: 'Firma B',
            atcCode: 'A01',
            gengrp: 'GRP1',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 100,
            detailUrl: '',
            isActive: true,
          },
          {
            gtin: '333',
            pharmacode: '777',
            bezeichnung: 'Med 3',
            firma: 'Firma B',
            atcCode: 'A01',
            gengrp: 'GRP1',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 100,
            detailUrl: '',
            isActive: true,
          },
        ],
      })

      const stats = await getKPIStatsCached()
      expect(stats.topFirma).toBe('Firma B')
      expect(stats.topFirmaCount).toBe(2)
    })

    test('counts unique ATC groups correctly', async () => {
      await prisma.shortage.createMany({
        data: [
          {
            gtin: '111',
            pharmacode: '999',
            bezeichnung: 'Med 1',
            firma: 'Firma A',
            atcCode: 'A01BC01',
            gengrp: 'GRP1',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 100,
            detailUrl: '',
            isActive: true,
          },
          {
            gtin: '222',
            pharmacode: '888',
            bezeichnung: 'Med 2',
            firma: 'Firma A',
            atcCode: 'A01BC02', // Same group (A01)
            gengrp: 'GRP1',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 100,
            detailUrl: '',
            isActive: true,
          },
          {
            gtin: '333',
            pharmacode: '777',
            bezeichnung: 'Med 3',
            firma: 'Firma A',
            atcCode: 'B02AA01', // Different group (B02)
            gengrp: 'GRP2',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 100,
            detailUrl: '',
            isActive: true,
          },
        ],
      })

      const stats = await getKPIStatsCached()
      // Note: This depends on how ATC codes are counted (first 3 chars? Full code?)
      expect(stats.uniqueAtcGroups).toBeGreaterThanOrEqual(2)
    })

    test('includes lastScrapedAt from most recent successful scrape', async () => {
      const now = new Date()
      await prisma.scrapeRun.create({
        data: {
          scrapedAt: now,
          totalCount: 10,
          newEntries: 5,
          removedEntries: 2,
          status: 'success',
        },
      })

      const stats = await getKPIStatsCached()
      expect(stats.lastScrapedAt).toEqual(now)
    })

    test('handles no scrape runs gracefully', async () => {
      const stats = await getKPIStatsCached()
      expect(stats.lastScrapedAt).toBeNull()
    })

    test('handles empty database gracefully', async () => {
      const stats = await getKPIStatsCached()
      expect(stats.totalActive).toBe(0)
      expect(stats.topFirma).toBe('N/A')
      expect(stats.topFirmaCount).toBe(0)
      expect(stats.uniqueAtcGroups).toBe(0)
      expect(stats.avgDaysSinceMeldung).toBe(0)
    })

    test('only counts active shortages', async () => {
      await prisma.shortage.createMany({
        data: [
          {
            gtin: '111',
            pharmacode: '999',
            bezeichnung: 'Active Med',
            firma: 'Firma A',
            atcCode: 'A01',
            gengrp: 'GRP1',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 100,
            detailUrl: '',
            isActive: true,
          },
          {
            gtin: '222',
            pharmacode: '888',
            bezeichnung: 'Inactive Med',
            firma: 'Firma A',
            atcCode: 'A01',
            gengrp: 'GRP1',
            statusCode: 9,
            statusText: '9',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 300,
            detailUrl: '',
            isActive: false,
          },
        ],
      })

      const stats = await getKPIStatsCached()
      expect(stats.totalActive).toBe(1)
    })
  })

  describe('getFirmaListCached', () => {
    test('fetches firma list from database on first call', async () => {
      await prisma.shortage.createMany({
        data: [
          {
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
            tageSeitMeldung: 100,
            detailUrl: '',
            isActive: true,
          },
          {
            gtin: '222',
            pharmacode: '888',
            bezeichnung: 'Med 2',
            firma: 'Firma B',
            atcCode: 'A01',
            gengrp: 'GRP1',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 100,
            detailUrl: '',
            isActive: true,
          },
        ],
      })

      const firmaList = await getFirmaListCached()
      expect(firmaList).toHaveLength(2)
      expect(firmaList).toContain('Firma A')
      expect(firmaList).toContain('Firma B')
    })

    test('returns sorted firma list', async () => {
      await prisma.shortage.createMany({
        data: [
          {
            gtin: '111',
            pharmacode: '999',
            bezeichnung: 'Med 1',
            firma: 'Zebra Pharma',
            atcCode: 'A01',
            gengrp: 'GRP1',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 100,
            detailUrl: '',
            isActive: true,
          },
          {
            gtin: '222',
            pharmacode: '888',
            bezeichnung: 'Med 2',
            firma: 'Alpha Pharma',
            atcCode: 'A01',
            gengrp: 'GRP1',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 100,
            detailUrl: '',
            isActive: true,
          },
        ],
      })

      const firmaList = await getFirmaListCached()
      expect(firmaList[0]).toBe('Alpha Pharma')
      expect(firmaList[1]).toBe('Zebra Pharma')
    })

    test('returns distinct firma names', async () => {
      await prisma.shortage.createMany({
        data: [
          {
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
            tageSeitMeldung: 100,
            detailUrl: '',
            isActive: true,
          },
          {
            gtin: '222',
            pharmacode: '888',
            bezeichnung: 'Med 2',
            firma: 'Firma A', // Duplicate
            atcCode: 'A01',
            gengrp: 'GRP1',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 100,
            detailUrl: '',
            isActive: true,
          },
        ],
      })

      const firmaList = await getFirmaListCached()
      expect(firmaList).toHaveLength(1)
      expect(firmaList).toEqual(['Firma A'])
    })

    test('only includes active shortages', async () => {
      await prisma.shortage.createMany({
        data: [
          {
            gtin: '111',
            pharmacode: '999',
            bezeichnung: 'Med 1',
            firma: 'Active Firma',
            atcCode: 'A01',
            gengrp: 'GRP1',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 100,
            detailUrl: '',
            isActive: true,
          },
          {
            gtin: '222',
            pharmacode: '888',
            bezeichnung: 'Med 2',
            firma: 'Inactive Firma',
            atcCode: 'A01',
            gengrp: 'GRP1',
            statusCode: 9,
            statusText: '9',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 100,
            detailUrl: '',
            isActive: false,
          },
        ],
      })

      const firmaList = await getFirmaListCached()
      expect(firmaList).toHaveLength(1)
      expect(firmaList).toContain('Active Firma')
      expect(firmaList).not.toContain('Inactive Firma')
    })

    test('returns cached result on subsequent calls', async () => {
      await prisma.shortage.create({
        data: {
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
          tageSeitMeldung: 100,
          detailUrl: '',
          isActive: true,
        },
      })

      const list1 = await getFirmaListCached()

      // Add another firma (should not affect cached result)
      await prisma.shortage.create({
        data: {
          gtin: '222',
          pharmacode: '888',
          bezeichnung: 'Med 2',
          firma: 'Firma B',
          atcCode: 'A01',
          gengrp: 'GRP1',
          statusCode: 1,
          statusText: '1',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 100,
          detailUrl: '',
          isActive: true,
        },
      })

      const list2 = await getFirmaListCached()

      expect(list1).toHaveLength(1)
      expect(list2).toHaveLength(1) // Should still be cached
    })
  })

  describe('invalidateStatsCache', () => {
    test('clears KPI stats cache', async () => {
      await prisma.shortage.create({
        data: {
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
          tageSeitMeldung: 100,
          detailUrl: '',
          isActive: true,
        },
      })

      const stats1 = await getKPIStatsCached()
      expect(stats1.totalActive).toBe(1)

      // Add more data
      await prisma.shortage.create({
        data: {
          gtin: '222',
          pharmacode: '888',
          bezeichnung: 'Med 2',
          firma: 'Firma B',
          atcCode: 'A01',
          gengrp: 'GRP1',
          statusCode: 1,
          statusText: '1',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 100,
          detailUrl: '',
          isActive: true,
        },
      })

      // Invalidate and re-fetch
      invalidateStatsCache()
      const stats2 = await getKPIStatsCached()
      expect(stats2.totalActive).toBe(2) // Should reflect new data
    })

    test('clears firma list cache', async () => {
      await prisma.shortage.create({
        data: {
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
          tageSeitMeldung: 100,
          detailUrl: '',
          isActive: true,
        },
      })

      const list1 = await getFirmaListCached()
      expect(list1).toHaveLength(1)

      // Add another firma
      await prisma.shortage.create({
        data: {
          gtin: '222',
          pharmacode: '888',
          bezeichnung: 'Med 2',
          firma: 'Firma B',
          atcCode: 'A01',
          gengrp: 'GRP1',
          statusCode: 1,
          statusText: '1',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 100,
          detailUrl: '',
          isActive: true,
        },
      })

      // Invalidate and re-fetch
      invalidateStatsCache()
      const list2 = await getFirmaListCached()
      expect(list2).toHaveLength(2)
    })
  })
})
