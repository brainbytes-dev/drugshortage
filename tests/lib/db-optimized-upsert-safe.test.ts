/**
 * Library Tests: db-optimized-upsert-safe.ts
 * Tests SQL injection prevention in bulk upserts
 */

import { upsertShortagesOptimizedSafe } from '@/lib/db-optimized-upsert-safe'
import { prisma } from '@/lib/prisma'
import type { Shortage } from '@/lib/types'

describe('upsertShortagesOptimizedSafe', () => {
  beforeEach(async () => {
    await prisma.shortage.deleteMany()
  })

  describe('SQL Injection Prevention', () => {
    test('prevents SQL injection in bezeichnung field', async () => {
      const maliciousShortage: Shortage = {
        gtin: '111',
        pharmacode: '999',
        bezeichnung: "'; DROP TABLE Shortage; --",
        firma: 'Test Firma',
        atcCode: 'A01',
        gengrp: 'GRP1',
        statusCode: 1,
        statusText: '1',
        datumLieferfahigkeit: '',
        datumLetzteMutation: '',
        tageSeitMeldung: 0,
        detailUrl: '',
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        isActive: true,
      }

      await upsertShortagesOptimizedSafe([maliciousShortage])

      const saved = await prisma.shortage.findUnique({ where: { gtin: '111' } })
      expect(saved).toBeDefined()
      expect(saved?.bezeichnung).toBe("'; DROP TABLE Shortage; --")

      // Verify table still exists
      const count = await prisma.shortage.count()
      expect(count).toBe(1)
    })

    test('prevents SQL injection in firma field', async () => {
      const maliciousShortage: Shortage = {
        gtin: '111',
        pharmacode: '999',
        bezeichnung: 'Test Med',
        firma: "' OR '1'='1",
        atcCode: 'A01',
        gengrp: 'GRP1',
        statusCode: 1,
        statusText: '1',
        datumLieferfahigkeit: '',
        datumLetzteMutation: '',
        tageSeitMeldung: 0,
        detailUrl: '',
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        isActive: true,
      }

      await upsertShortagesOptimizedSafe([maliciousShortage])

      const saved = await prisma.shortage.findUnique({ where: { gtin: '111' } })
      expect(saved?.firma).toBe("' OR '1'='1")
    })

    test('handles quotes in bemerkungen field', async () => {
      // TODO: Test single quotes, double quotes, backticks
    })

    test('handles escape sequences', async () => {
      // TODO: Test \', \", \\, \n, \r
    })
  })

  describe('Bulk Operations', () => {
    test('upserts large batch (100+ items) correctly', async () => {
      const shortages: Shortage[] = Array.from({ length: 150 }, (_, i) => ({
        gtin: String(i + 1).padStart(3, '0'),
        pharmacode: '999',
        bezeichnung: `Med ${i}`,
        firma: 'Firma A',
        atcCode: 'A01',
        gengrp: 'GRP1',
        statusCode: 1,
        statusText: '1',
        datumLieferfahigkeit: '',
        datumLetzteMutation: '',
        tageSeitMeldung: 0,
        detailUrl: '',
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        isActive: true,
      }))

      const result = await upsertShortagesOptimizedSafe(shortages)

      expect(result.newEntries).toBe(150)
      const count = await prisma.shortage.count()
      expect(count).toBe(150)
    })

    test('processes in chunks of 100', async () => {
      // TODO: Mock prisma.$executeRaw to verify chunk count
      // 250 items = 3 chunks (100, 100, 50)
    })

    test('handles mixed insert and update operations', async () => {
      // Create existing entry
      await prisma.shortage.create({
        data: {
          gtin: '111',
          pharmacode: '999',
          bezeichnung: 'Old Name',
          firma: 'Old Firma',
          atcCode: 'A01',
          gengrp: 'GRP1',
          statusCode: 1,
          statusText: '1',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 0,
          detailUrl: '',
          isActive: true,
        },
      })

      const shortages: Shortage[] = [
        {
          gtin: '111', // Update existing
          pharmacode: '999',
          bezeichnung: 'New Name',
          firma: 'New Firma',
          atcCode: 'A01',
          gengrp: 'GRP1',
          statusCode: 2,
          statusText: '2',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 0,
          detailUrl: '',
          firstSeenAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          isActive: true,
        },
        {
          gtin: '222', // Insert new
          pharmacode: '888',
          bezeichnung: 'Med 2',
          firma: 'Firma B',
          atcCode: 'B01',
          gengrp: 'GRP2',
          statusCode: 1,
          statusText: '1',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 0,
          detailUrl: '',
          firstSeenAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          isActive: true,
        },
      ]

      const result = await upsertShortagesOptimizedSafe(shortages)

      expect(result.newEntries).toBe(1)
      const updated = await prisma.shortage.findUnique({ where: { gtin: '111' } })
      expect(updated?.bezeichnung).toBe('New Name')
    })

    test('preserves firstSeenAt on update', async () => {
      const oldDate = new Date('2025-01-01')
      await prisma.shortage.create({
        data: {
          gtin: '111',
          pharmacode: '999',
          bezeichnung: 'Old',
          firma: 'Firma',
          atcCode: 'A01',
          gengrp: 'GRP1',
          statusCode: 1,
          statusText: '1',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 0,
          detailUrl: '',
          isActive: true,
          firstSeenAt: oldDate,
        },
      })

      const shortages: Shortage[] = [{
        gtin: '111',
        pharmacode: '999',
        bezeichnung: 'New',
        firma: 'Firma',
        atcCode: 'A01',
        gengrp: 'GRP1',
        statusCode: 1,
        statusText: '1',
        datumLieferfahigkeit: '',
        datumLetzteMutation: '',
        tageSeitMeldung: 0,
        detailUrl: '',
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        isActive: true,
      }]

      await upsertShortagesOptimizedSafe(shortages)

      const updated = await prisma.shortage.findUnique({ where: { gtin: '111' } })
      expect(updated?.firstSeenAt).toEqual(oldDate)
    })
  })

  describe('Deactivation Logic', () => {
    test('marks removed shortages as inactive', async () => {
      await prisma.shortage.create({
        data: {
          gtin: '111',
          pharmacode: '999',
          bezeichnung: 'To Remove',
          firma: 'Firma',
          atcCode: 'A01',
          gengrp: 'GRP1',
          statusCode: 1,
          statusText: '1',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 0,
          detailUrl: '',
          isActive: true,
        },
      })

      const shortages: Shortage[] = [{
        gtin: '222', // Different GTIN - 111 not in incoming list
        pharmacode: '888',
        bezeichnung: 'New Med',
        firma: 'Firma',
        atcCode: 'A01',
        gengrp: 'GRP1',
        statusCode: 1,
        statusText: '1',
        datumLieferfahigkeit: '',
        datumLetzteMutation: '',
        tageSeitMeldung: 0,
        detailUrl: '',
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        isActive: true,
      }]

      const result = await upsertShortagesOptimizedSafe(shortages)

      expect(result.removedEntries).toBe(1)
      const removed = await prisma.shortage.findUnique({ where: { gtin: '111' } })
      expect(removed?.isActive).toBe(false)
    })

    test('updates lastSeenAt on deactivation', async () => {
      await prisma.shortage.create({
        data: {
          gtin: '111',
          pharmacode: '999',
          bezeichnung: 'To Remove',
          firma: 'Firma',
          atcCode: 'A01',
          gengrp: 'GRP1',
          statusCode: 1,
          statusText: '1',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 0,
          detailUrl: '',
          isActive: true,
          lastSeenAt: new Date('2025-01-01'),
        },
      })

      await upsertShortagesOptimizedSafe([])

      const removed = await prisma.shortage.findUnique({ where: { gtin: '111' } })
      expect(removed?.lastSeenAt.getTime()).toBeGreaterThan(new Date('2025-01-01').getTime())
    })
  })

  describe('Special Characters', () => {
    test('handles all special characters safely', async () => {
      const specialChars = "'; \" \\ \n \r \t \0 % _ --"
      const shortage: Shortage = {
        gtin: '111',
        pharmacode: '999',
        bezeichnung: specialChars,
        firma: specialChars,
        atcCode: 'A01',
        gengrp: 'GRP1',
        statusCode: 1,
        statusText: '1',
        datumLieferfahigkeit: specialChars,
        datumLetzteMutation: specialChars,
        tageSeitMeldung: 0,
        detailUrl: specialChars,
        bemerkungen: specialChars,
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        isActive: true,
      }

      await upsertShortagesOptimizedSafe([shortage])

      const saved = await prisma.shortage.findUnique({ where: { gtin: '111' } })
      expect(saved?.bezeichnung).toBe(specialChars)
    })
  })

  describe('Performance', () => {
    test('completes bulk upsert within reasonable time', async () => {
      const shortages: Shortage[] = Array.from({ length: 1000 }, (_, i) => ({
        gtin: String(i).padStart(10, '0'),
        pharmacode: '999',
        bezeichnung: `Med ${i}`,
        firma: 'Firma',
        atcCode: 'A01',
        gengrp: 'GRP1',
        statusCode: 1,
        statusText: '1',
        datumLieferfahigkeit: '',
        datumLetzteMutation: '',
        tageSeitMeldung: 0,
        detailUrl: '',
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        isActive: true,
      }))

      const start = Date.now()
      await upsertShortagesOptimizedSafe(shortages)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(10000) // Should complete in < 10s
    })
  })
})
