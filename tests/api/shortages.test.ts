import { GET } from '@/app/api/shortages/route'
import { upsertShortages } from '@/lib/db'
import type { Shortage } from '@/lib/types'
import fs from 'fs'
import path from 'path'

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test-api-shortages.json')
const ORIGINAL_DB_PATH = process.env.DB_PATH

const mockShortage: Shortage = {
  gtin: '7680494930101',
  pharmacode: '1379591',
  bezeichnung: 'ACETALGIN Supp 125 mg',
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

beforeAll(() => {
  process.env.DB_PATH = TEST_DB_PATH
})

beforeEach(async () => {
  fs.writeFileSync(TEST_DB_PATH, JSON.stringify([]))
  await upsertShortages([mockShortage])
})

afterAll(() => {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH)
  process.env.DB_PATH = ORIGINAL_DB_PATH
})

// TODO: integration test — requires running Postgres (upsertShortages + GET hit Prisma; DB_PATH was old JSON-based interface)
test.skip('GET /api/shortages returns data array', async () => {
  const req = new Request('http://localhost/api/shortages')
  const res = await GET(req)
  const json = await res.json()
  expect(json.data).toHaveLength(1)
  expect(json.total).toBe(1)
  expect(json.page).toBe(1)
})

// TODO: integration test — requires running Postgres
test.skip('GET /api/shortages filters by search param', async () => {
  const req = new Request('http://localhost/api/shortages?search=acetalgin')
  const res = await GET(req)
  const json = await res.json()
  expect(json.data).toHaveLength(1)
})

// TODO: integration test — requires running Postgres
test.skip('GET /api/shortages returns empty for no match', async () => {
  const req = new Request('http://localhost/api/shortages?search=ibuprofen')
  const res = await GET(req)
  const json = await res.json()
  expect(json.data).toHaveLength(0)
  expect(json.total).toBe(0)
})
