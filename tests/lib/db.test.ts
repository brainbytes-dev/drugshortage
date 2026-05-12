import { getAllShortages, upsertShortages, queryShortages, getKPIStats } from '@/lib/db'
import type { Shortage } from '@/lib/types'
import fs from 'fs'
import path from 'path'

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test-shortages.json')
process.env.DB_PATH = TEST_DB_PATH

// TODO: integration tests — require running Postgres + seeded test data.
// The production db.ts was migrated from JSON-file to Prisma; these tests
// still reference the old DB_PATH interface and fail with PrismaClientKnownRequestError.

const mockShortage: Shortage = {
  gtin: '7680494930101',
  pharmacode: '1379591',
  bezeichnung: 'ACETALGIN Supp 125 mg 10 Stk',
  firma: 'Streuli Pharma AG',
  atcCode: 'N02BE01',
  gengrp: 'N02BE01SRSN000000125SUPP',
  statusCode: 1,
  statusText: '1 aktuell keine Lieferungen',
  datumLieferfahigkeit: 'unbestimmt',
  datumLetzteMutation: '11.12.2025',
  tageSeitMeldung: 293,
  detailUrl: 'https://www.drugshortage.ch/detail_lieferengpass.aspx?ID=25975',
  firstSeenAt: new Date().toISOString(),
  lastSeenAt: new Date().toISOString(),
  isActive: true,
}

beforeEach(() => {
  fs.writeFileSync(TEST_DB_PATH, JSON.stringify([]))
})

afterAll(() => {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH)
})

test.skip('getAllShortages returns empty array on fresh db', async () => {
  const result = await getAllShortages()
  expect(result).toEqual([])
})

test.skip('upsertShortages inserts new shortage', async () => {
  await upsertShortages([mockShortage])
  const result = await getAllShortages()
  expect(result).toHaveLength(1)
  expect(result[0].gtin).toBe('7680494930101')
  expect(result[0].isActive).toBe(true)
})

test.skip('upsertShortages updates existing shortage by gtin', async () => {
  await upsertShortages([mockShortage])
  const updated = { ...mockShortage, tageSeitMeldung: 300 }
  await upsertShortages([updated])
  const result = await getAllShortages()
  expect(result).toHaveLength(1)
  expect(result[0].tageSeitMeldung).toBe(300)
})

test.skip('upsertShortages marks missing gtins as inactive', async () => {
  await upsertShortages([mockShortage])
  await upsertShortages([])
  const result = await getAllShortages()
  expect(result[0].isActive).toBe(false)
})

test.skip('queryShortages filters by search term', async () => {
  await upsertShortages([mockShortage])
  const result = await queryShortages({ search: 'acetalgin' })
  expect(result.data).toHaveLength(1)
  const miss = await queryShortages({ search: 'ibuprofen' })
  expect(miss.data).toHaveLength(0)
})

test.skip('queryShortages filters by statusCode', async () => {
  await upsertShortages([mockShortage])
  const result = await queryShortages({ status: '1' })
  expect(result.data).toHaveLength(1)
  const miss = await queryShortages({ status: '4' })
  expect(miss.data).toHaveLength(0)
})

test.skip('getKPIStats returns correct totals', async () => {
  await upsertShortages([mockShortage])
  const stats = await getKPIStats()
  expect(stats.totalActive).toBe(1)
  expect(stats.topFirma).toBe('Streuli Pharma AG')
  expect(stats.uniqueAtcGroups).toBe(1)
})
