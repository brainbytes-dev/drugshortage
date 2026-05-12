import { GET } from '@/app/api/shortages/route'
import { upsertShortages } from '@/lib/db'
import type { Shortage } from '@/lib/types'

const mockShortage1: Shortage = {
  gtin: '111',
  pharmacode: '1001',
  bezeichnung: 'ACETALGIN Supp 125 mg',
  firma: 'Streuli Pharma AG',
  atcCode: 'N02BE01',
  gengrp: 'N02BE01SRSN000000125SUPP',
  statusCode: 1,
  statusText: '1 aktuell keine Lieferungen',
  datumLieferfahigkeit: 'unbestimmt',
  datumLetzteMutation: '11.12.2025',
  tageSeitMeldung: 293,
  detailUrl: 'https://test.com/1',
  firstSeenAt: new Date().toISOString(),
  lastSeenAt: new Date().toISOString(),
  isActive: true,
}

const mockShortage2: Shortage = {
  gtin: '222',
  pharmacode: '1002',
  bezeichnung: 'IBUPROFEN Tab 400 mg',
  firma: 'Sandoz AG',
  atcCode: 'M01AE01',
  gengrp: 'M01AE01TABS000000400',
  statusCode: 4,
  statusText: '4 Wiederaufnahme geplant',
  datumLieferfahigkeit: 'KW 20',
  datumLetzteMutation: '15.01.2026',
  tageSeitMeldung: 50,
  detailUrl: 'https://test.com/2',
  firstSeenAt: new Date().toISOString(),
  lastSeenAt: new Date().toISOString(),
  isActive: true,
}

const mockShortage3: Shortage = {
  gtin: '333',
  pharmacode: '1003',
  bezeichnung: 'PARACETAMOL Tab 500 mg',
  firma: 'Streuli Pharma AG',
  atcCode: 'N02BE01',
  gengrp: 'N02BE01TABS000000500',
  statusCode: 2,
  statusText: '2 vorübergehend',
  datumLieferfahigkeit: 'unbestimmt',
  datumLetzteMutation: '01.02.2026',
  tageSeitMeldung: 120,
  detailUrl: 'https://test.com/3',
  firstSeenAt: new Date().toISOString(),
  lastSeenAt: new Date().toISOString(),
  isActive: true,
}

beforeEach(async () => {
  await upsertShortages([mockShortage1, mockShortage2, mockShortage3])
})

// TODO: integration tests — require running Postgres + seeded test data (upsertShortages + GET hit Prisma)
describe.skip('GET /api/shortages - Extended', () => {
  test('filters by firma parameter', async () => {
    const req = new Request('http://localhost/api/shortages?firma=Sandoz AG')
    const res = await GET(req)
    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.data[0].firma).toBe('Sandoz AG')
  })

  test('filters by atc parameter', async () => {
    const req = new Request('http://localhost/api/shortages?atc=N02BE01')
    const res = await GET(req)
    const json = await res.json()
    expect(json.data).toHaveLength(2) // mockShortage1 and mockShortage3
    expect(json.data.every((s: Shortage) => s.atcCode === 'N02BE01')).toBe(true)
  })

  test('filters by multiple status codes (comma-separated)', async () => {
    const req = new Request('http://localhost/api/shortages?status=1,2')
    const res = await GET(req)
    const json = await res.json()
    expect(json.data).toHaveLength(2)
    const codes = json.data.map((s: Shortage) => s.statusCode)
    expect(codes).toContain(1)
    expect(codes).toContain(2)
    expect(codes).not.toContain(4)
  })

  test('sorts by tageSeitMeldung ascending', async () => {
    const req = new Request('http://localhost/api/shortages?sort=tageSeitMeldung:asc')
    const res = await GET(req)
    const json = await res.json()
    const days = json.data.map((s: Shortage) => s.tageSeitMeldung)
    expect(days).toEqual([50, 120, 293])
  })

  test('sorts by tageSeitMeldung descending (default)', async () => {
    const req = new Request('http://localhost/api/shortages?sort=tageSeitMeldung:desc')
    const res = await GET(req)
    const json = await res.json()
    const days = json.data.map((s: Shortage) => s.tageSeitMeldung)
    expect(days).toEqual([293, 120, 50])
  })

  test('sorts by firma alphabetically', async () => {
    const req = new Request('http://localhost/api/shortages?sort=firma:asc')
    const res = await GET(req)
    const json = await res.json()
    const firmen = json.data.map((s: Shortage) => s.firma)
    expect(firmen[0]).toBe('Sandoz AG')
    expect(firmen[1]).toBe('Streuli Pharma AG')
  })

  test('respects perPage parameter', async () => {
    const req = new Request('http://localhost/api/shortages?perPage=2')
    const res = await GET(req)
    const json = await res.json()
    expect(json.data).toHaveLength(2)
    expect(json.perPage).toBe(2)
  })

  test('clamps perPage to maximum of 200', async () => {
    const req = new Request('http://localhost/api/shortages?perPage=500')
    const res = await GET(req)
    const json = await res.json()
    expect(json.perPage).toBe(200)
  })

  test('clamps perPage to minimum of 1', async () => {
    const req = new Request('http://localhost/api/shortages?perPage=0')
    const res = await GET(req)
    const json = await res.json()
    expect(json.perPage).toBe(1)
  })

  test('handles pagination with page parameter', async () => {
    const req = new Request('http://localhost/api/shortages?page=2&perPage=2')
    const res = await GET(req)
    const json = await res.json()
    expect(json.page).toBe(2)
    expect(json.data).toHaveLength(1) // 3 total, 2 per page, page 2 has 1
  })

  test('includes KPI stats in response', async () => {
    const req = new Request('http://localhost/api/shortages')
    const res = await GET(req)
    const json = await res.json()
    expect(json.kpi).toBeDefined()
    expect(json.kpi.totalActive).toBeGreaterThan(0)
    expect(json.kpi.topFirma).toBeDefined()
    expect(json.kpi.uniqueAtcGroups).toBeGreaterThan(0)
  })

  test('includes firmaList in response', async () => {
    const req = new Request('http://localhost/api/shortages')
    const res = await GET(req)
    const json = await res.json()
    expect(json.firmaList).toBeDefined()
    expect(Array.isArray(json.firmaList)).toBe(true)
    expect(json.firmaList.length).toBeGreaterThan(0)
  })

  test('combines multiple filters (firma + status)', async () => {
    const req = new Request('http://localhost/api/shortages?firma=Streuli Pharma AG&status=1')
    const res = await GET(req)
    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.data[0].firma).toBe('Streuli Pharma AG')
    expect(json.data[0].statusCode).toBe(1)
  })

  test('returns empty array when no results match filters', async () => {
    const req = new Request('http://localhost/api/shortages?firma=Nonexistent Company')
    const res = await GET(req)
    const json = await res.json()
    expect(json.data).toHaveLength(0)
    expect(json.total).toBe(0)
  })

  test('handles invalid sort parameter gracefully', async () => {
    const req = new Request('http://localhost/api/shortages?sort=invalid:field')
    const res = await GET(req)
    expect(res.status).toBe(200) // Should not crash
  })

  test('handles invalid page parameter (non-numeric)', async () => {
    const req = new Request('http://localhost/api/shortages?page=abc')
    const res = await GET(req)
    const json = await res.json()
    expect(json.page).toBe(1) // Should default to 1
  })

  test('search works across multiple fields', async () => {
    const req = new Request('http://localhost/api/shortages?search=400')
    const res = await GET(req)
    const json = await res.json()
    expect(json.data.length).toBeGreaterThan(0)
  })
})
