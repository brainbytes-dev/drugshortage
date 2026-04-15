/**
 * SQL Injection Security Tests
 * Tests for SQL injection vulnerabilities in raw queries
 */

import { upsertShortagesOptimized } from '@/lib/db-optimized-upsert'
import { prisma } from '@/lib/prisma'
import type { Shortage } from '@/lib/types'

describe('SQL Injection Prevention', () => {
  beforeEach(async () => {
    await prisma.shortage.deleteMany()
  })

  test('prevents SQL injection via single quote in bezeichnung', async () => {
    const malicious: Shortage = {
      gtin: '111',
      pharmacode: '999',
      bezeichnung: "Test'; DROP TABLE Shortage; --",
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

    await upsertShortagesOptimized([malicious])

    // Table should still exist
    const count = await prisma.shortage.count()
    expect(count).toBe(1)

    // Data should be escaped
    const stored = await prisma.shortage.findUnique({ where: { gtin: '111' } })
    expect(stored?.bezeichnung).toBe("Test'; DROP TABLE Shortage; --")
  })

  test('prevents SQL injection via backslash escaping', async () => {
    const malicious: Shortage = {
      gtin: '222',
      pharmacode: '888',
      bezeichnung: "Test\\'; DELETE FROM Shortage; --",
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

    await upsertShortagesOptimized([malicious])

    const count = await prisma.shortage.count()
    expect(count).toBe(1)
  })

  test('prevents SQL injection via NULL byte injection', async () => {
    const malicious: Shortage = {
      gtin: '333',
      pharmacode: '777',
      bezeichnung: "Test\x00'; DROP TABLE Shortage; --",
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

    await upsertShortagesOptimized([malicious])

    const count = await prisma.shortage.count()
    expect(count).toBe(1)
  })

  test('handles multi-statement injection attempt', async () => {
    const malicious: Shortage = {
      gtin: '444',
      pharmacode: '666',
      bezeichnung: "'; INSERT INTO Shortage (gtin) VALUES ('injected'); --",
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

    await upsertShortagesOptimized([malicious])

    const count = await prisma.shortage.count()
    expect(count).toBe(1) // Should only have the one record, not "injected"

    const injected = await prisma.shortage.findUnique({ where: { gtin: 'injected' } })
    expect(injected).toBeNull()
  })

  test('handles Unicode SQL injection attempts', async () => {
    const malicious: Shortage = {
      gtin: '555',
      pharmacode: '555',
      bezeichnung: "Test\u0027; DROP TABLE Shortage; --", // Unicode single quote
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

    await upsertShortagesOptimized([malicious])

    const count = await prisma.shortage.count()
    expect(count).toBe(1)
  })
})
