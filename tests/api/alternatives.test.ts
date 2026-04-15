import { GET } from '@/app/api/alternatives/route'
import { prisma } from '@/lib/prisma'

describe('GET /api/alternatives', () => {
  afterEach(async () => {
    await prisma.alternativesCache.deleteMany()
  })

  test('returns 400 when gtin parameter is missing', async () => {
    const req = new Request('http://localhost/api/alternatives')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('gtin required')
  })

  test('returns cached data when cache is fresh (<24h)', async () => {
    const mockData = {
      gleicheFirma: [{ bezeichnung: 'Test', firma: 'TestFirma', gtin: '123' }],
      coMarketing: [],
      alleAlternativen: [],
    }
    await prisma.alternativesCache.create({
      data: {
        gtin: '7680494930101',
        data: mockData as object,
        fetchedAt: new Date(), // Fresh
      },
    })

    const req = new Request('http://localhost/api/alternatives?gtin=7680494930101')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.gleicheFirma).toHaveLength(1)
  })

  test('fetches live data when cache is stale (>24h)', async () => {
    const staleDate = new Date(Date.now() - 25 * 60 * 60 * 1000) // 25h ago
    await prisma.alternativesCache.create({
      data: {
        gtin: '7680494930101',
        data: { gleicheFirma: [], coMarketing: [], alleAlternativen: [] } as object,
        fetchedAt: staleDate,
      },
    })

    // Mock fetch to prevent actual network call
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<html><table id="GridView1"></table></html>'),
      } as Response),
    )

    const req = new Request('http://localhost/api/alternatives?gtin=7680494930101')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(global.fetch).toHaveBeenCalled()
  })

  test('returns stale cache when live fetch fails', async () => {
    const staleData = {
      gleicheFirma: [{ bezeichnung: 'Stale', firma: 'Old', gtin: '999' }],
      coMarketing: [],
      alleAlternativen: [],
    }
    const staleDate = new Date(Date.now() - 30 * 60 * 60 * 1000) // 30h ago
    await prisma.alternativesCache.create({
      data: {
        gtin: '7680494930101',
        data: staleData as object,
        fetchedAt: staleDate,
      },
    })

    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')))

    const req = new Request('http://localhost/api/alternatives?gtin=7680494930101')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.gleicheFirma[0].bezeichnung).toBe('Stale')
  })

  test('returns 502 when fetch fails and no cache exists', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')))

    const req = new Request('http://localhost/api/alternatives?gtin=9999999999999')
    const res = await GET(req)
    expect(res.status).toBe(502)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  test('handles malformed HTML gracefully', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<html>broken</html>'),
      } as Response),
    )

    const req = new Request('http://localhost/api/alternatives?gtin=7680494930101')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.gleicheFirma).toBeDefined()
  })

  test('handles HTTP error status from source', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 503,
      } as Response),
    )

    const req = new Request('http://localhost/api/alternatives?gtin=7680494930101')
    const res = await GET(req)
    expect(res.status).toBe(502)
  })

  test('upserts cache after successful fetch', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<html><table id="GridView1"></table></html>'),
      } as Response),
    )

    const req = new Request('http://localhost/api/alternatives?gtin=7680494930101')
    await GET(req)

    const cached = await prisma.alternativesCache.findUnique({
      where: { gtin: '7680494930101' },
    })
    expect(cached).toBeDefined()
    expect(cached?.data).toBeDefined()
  })
})
