import { POST } from '@/app/api/scrape/route'
import { fetchAndParse, fetchAndParseCompleted } from '@/lib/scraper'
import { upsertShortages, saveOverviewStats, upsertCompletedShortages } from '@/lib/db'

jest.mock('@/lib/scraper')
jest.mock('@/lib/db')

const mockFetchAndParse = fetchAndParse as jest.MockedFunction<typeof fetchAndParse>
const mockFetchAndParseCompleted = fetchAndParseCompleted as jest.MockedFunction<typeof fetchAndParseCompleted>
const mockUpsertShortages = upsertShortages as jest.MockedFunction<typeof upsertShortages>
const mockSaveOverviewStats = saveOverviewStats as jest.MockedFunction<typeof saveOverviewStats>
const mockUpsertCompletedShortages = upsertCompletedShortages as jest.MockedFunction<typeof upsertCompletedShortages>

describe('POST /api/scrape', () => {
  const VALID_SECRET = 'test-secret-123'
  const originalEnv = process.env.CRON_SECRET

  beforeAll(() => {
    process.env.CRON_SECRET = VALID_SECRET
  })

  afterAll(() => {
    process.env.CRON_SECRET = originalEnv
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns 401 when authorization header is missing', async () => {
    const req = new Request('http://localhost/api/scrape', {
      method: 'POST',
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Unauthorized')
  })

  test('returns 401 when authorization token is invalid', async () => {
    const req = new Request('http://localhost/api/scrape', {
      method: 'POST',
      headers: { authorization: 'Bearer wrong-secret' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  test('returns 401 when CRON_SECRET env var is not set', async () => {
    delete process.env.CRON_SECRET
    const req = new Request('http://localhost/api/scrape', {
      method: 'POST',
      headers: { authorization: 'Bearer anything' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    process.env.CRON_SECRET = VALID_SECRET // Restore
  })

  test('successfully scrapes active and historical data', async () => {
    mockFetchAndParse.mockResolvedValue({
      shortages: [
        {
          gtin: '123',
          pharmacode: '456',
          bezeichnung: 'Test Med',
          firma: 'TestCo',
          atcCode: 'A01',
          gengrp: 'grp1',
          statusCode: 1,
          statusText: '1 aktuell',
          datumLieferfahigkeit: 'unbestimmt',
          datumLetzteMutation: '01.01.2026',
          tageSeitMeldung: 10,
          detailUrl: 'https://test.com',
          firstSeenAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          isActive: true,
        },
      ],
      overview: {
        scrapedAt: '',
        totalPackungen: 100,
        totalProdukte: 50,
        betroffeneAtcGruppen: 5,
        pflichtlager: 10,
        bwl: 5,
        bwlWho: 3,
        who: 2,
        kassenpflichtigSL: 20,
        kassenpflichtigSLTotal: 100,
        prozentSLNichtLieferbar: 20,
        dauerUnter2Wochen: 5,
        dauer2bis6Wochen: 10,
        dauerUeber6WochenBis6Monate: 15,
        dauerUeber6MonateBis1Jahr: 8,
        dauerUeber1Bis2Jahre: 4,
        dauerUeber2Jahre: 2,
        swissmedicListeA: 10,
        swissmedicListeATotal: 50,
        swissmedicListeB: 15,
        swissmedicListeBTotal: 60,
        swissmedicListeC: 8,
        swissmedicListeCTotal: 30,
        swissmedicUebrige: 5,
        swissmedicUebrigeTotal: 20,
        firmenRanking: [],
        atcGruppen: [],
      },
    })
    mockUpsertShortages.mockResolvedValue({ newEntries: 1, removedEntries: 0 })
    mockSaveOverviewStats.mockResolvedValue()
    mockFetchAndParseCompleted.mockResolvedValue([])
    mockUpsertCompletedShortages.mockResolvedValue({ inserted: 0 })

    const req = new Request('http://localhost/api/scrape', {
      method: 'POST',
      headers: { authorization: `Bearer ${VALID_SECRET}` },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.total).toBe(1)
    expect(json.newEntries).toBe(1)
    expect(json.removedEntries).toBe(0)
  })

  test('returns 500 when active scrape fails', async () => {
    mockFetchAndParse.mockRejectedValue(new Error('Scrape failed'))

    const req = new Request('http://localhost/api/scrape', {
      method: 'POST',
      headers: { authorization: `Bearer ${VALID_SECRET}` },
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Scrape failed')
  })

  test('continues when historical scrape fails (non-fatal)', async () => {
    mockFetchAndParse.mockResolvedValue({
      shortages: [],
      overview: {
        scrapedAt: '',
        totalPackungen: 0,
        totalProdukte: 0,
        betroffeneAtcGruppen: 0,
        pflichtlager: 0,
        bwl: 0,
        bwlWho: 0,
        who: 0,
        kassenpflichtigSL: 0,
        kassenpflichtigSLTotal: 0,
        prozentSLNichtLieferbar: 0,
        dauerUnter2Wochen: 0,
        dauer2bis6Wochen: 0,
        dauerUeber6WochenBis6Monate: 0,
        dauerUeber6MonateBis1Jahr: 0,
        dauerUeber1Bis2Jahre: 0,
        dauerUeber2Jahre: 0,
        swissmedicListeA: 0,
        swissmedicListeATotal: 0,
        swissmedicListeB: 0,
        swissmedicListeBTotal: 0,
        swissmedicListeC: 0,
        swissmedicListeCTotal: 0,
        swissmedicUebrige: 0,
        swissmedicUebrigeTotal: 0,
        firmenRanking: [],
        atcGruppen: [],
      },
    })
    mockUpsertShortages.mockResolvedValue({ newEntries: 0, removedEntries: 0 })
    mockSaveOverviewStats.mockResolvedValue()
    mockFetchAndParseCompleted.mockRejectedValue(new Error('Historical fetch failed'))

    const req = new Request('http://localhost/api/scrape', {
      method: 'POST',
      headers: { authorization: `Bearer ${VALID_SECRET}` },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.historicalInserted).toBe(0)
  })

  test('handles database upsert errors', async () => {
    mockFetchAndParse.mockResolvedValue({
      shortages: [],
      overview: {} as any,
    })
    mockUpsertShortages.mockRejectedValue(new Error('DB error'))

    const req = new Request('http://localhost/api/scrape', {
      method: 'POST',
      headers: { authorization: `Bearer ${VALID_SECRET}` },
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  test('includes historical data count in success response', async () => {
    mockFetchAndParse.mockResolvedValue({ shortages: [], overview: {} as any })
    mockUpsertShortages.mockResolvedValue({ newEntries: 0, removedEntries: 0 })
    mockSaveOverviewStats.mockResolvedValue()
    mockFetchAndParseCompleted.mockResolvedValue([])
    mockUpsertCompletedShortages.mockResolvedValue({ inserted: 42 })

    const req = new Request('http://localhost/api/scrape', {
      method: 'POST',
      headers: { authorization: `Bearer ${VALID_SECRET}` },
    })
    const res = await POST(req)
    const json = await res.json()
    expect(json.historicalInserted).toBe(42)
  })
})
