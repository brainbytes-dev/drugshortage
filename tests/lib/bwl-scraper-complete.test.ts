import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchBwlData } from '@/lib/bwl-scraper'
import * as XLSX from 'xlsx'

vi.mock('xlsx')

describe('BWL Scraper - Complete Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('XLSX URL Discovery', () => {
    it('should find XLSX URL from BWL page HTML', async () => {
      const html = `
        <html>
          <body>
            <a href="/dam/bwl/de/dokumente/Versorgungsstoerungen_Humanarzneimittel.xlsx">Download</a>
          </body>
        </html>
      `

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, text: async () => html }) // HTML page
        .mockResolvedValueOnce({ // XLSX file
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(0),
        })

      vi.mocked(XLSX.read).mockReturnValue({ Sheets: {}, SheetNames: ['Sheet1'] } as any)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([])

      await fetchBwlData()

      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.bwl.admin.ch/de/meldestelle-heilmittel',
        expect.any(Object)
      )
    })

    it('should handle &amp; entities in XLSX URL', async () => {
      const html = `<a href="/file.xlsx?param=1&amp;param2=2">Download</a>`

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, text: async () => html })
        .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })

      vi.mocked(XLSX.read).mockReturnValue({ Sheets: {}, SheetNames: ['Sheet1'] } as any)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([])

      await fetchBwlData()

      // Should decode &amp; to &
      const xlsxCall = (global.fetch as any).mock.calls[1][0]
      expect(xlsxCall).toContain('param=1&param2=2')
    })

    it('should handle absolute XLSX URLs', async () => {
      const html = '<a href="https://cdn.bwl.admin.ch/file.xlsx">Download</a>'

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, text: async () => html })
        .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })

      vi.mocked(XLSX.read).mockReturnValue({ Sheets: {}, SheetNames: ['Sheet1'] } as any)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([])

      await fetchBwlData()

      expect(global.fetch).toHaveBeenCalledWith(
        'https://cdn.bwl.admin.ch/file.xlsx',
        expect.any(Object)
      )
    })

    it('should throw error when no XLSX link found', async () => {
      const html = '<html><body>No links here</body></html>'

      global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => html })

      await expect(fetchBwlData()).rejects.toThrow('No XLSX link found')
    })

    it('should throw error when BWL page fetch fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 })

      await expect(fetchBwlData()).rejects.toThrow('BWL page fetch failed: 404')
    })

    it('should fallback to generic .xlsx pattern if specific pattern not found', async () => {
      const html = '<a href="/some-file.xlsx">Generic XLSX</a>'

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, text: async () => html })
        .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })

      vi.mocked(XLSX.read).mockReturnValue({ Sheets: {}, SheetNames: ['Sheet1'] } as any)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([])

      await fetchBwlData()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('.xlsx'),
        expect.any(Object)
      )
    })
  })

  describe('XLSX Download', () => {
    it('should download XLSX file successfully', async () => {
      const html = '<a href="/file.xlsx">Download</a>'

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, text: async () => html })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(100),
        })

      vi.mocked(XLSX.read).mockReturnValue({ Sheets: {}, SheetNames: ['Sheet1'] } as any)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([])

      await fetchBwlData()

      expect(vi.mocked(XLSX.read)).toHaveBeenCalled()
    })

    it('should throw error when XLSX download fails', async () => {
      const html = '<a href="/file.xlsx">Download</a>'

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, text: async () => html })
        .mockResolvedValueOnce({ ok: false, status: 503 })

      await expect(fetchBwlData()).rejects.toThrow('BWL XLSX download failed: 503')
    })

    it('should handle network timeout during download', async () => {
      const html = '<a href="/file.xlsx">Download</a>'

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, text: async () => html })
        .mockRejectedValueOnce(new Error('Network timeout'))

      await expect(fetchBwlData()).rejects.toThrow('Network timeout')
    })

    it('should set correct headers for XLSX download', async () => {
      const html = '<a href="/file.xlsx">Download</a>'

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, text: async () => html })
        .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })

      vi.mocked(XLSX.read).mockReturnValue({ Sheets: {}, SheetNames: ['Sheet1'] } as any)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([])

      await fetchBwlData()

      const xlsxFetchCall = (global.fetch as any).mock.calls[1]
      expect(xlsxFetchCall[1].headers).toEqual({
        'Accept-Language': 'de',
        'User-Agent': 'engpassradar.ch/1.0',
      })
    })
  })

  describe('XLSX Parsing', () => {
    it('should parse valid XLSX data correctly', async () => {
      const html = '<a href="/file.xlsx">Download</a>'

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, text: async () => html })
        .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })

      const mockSheet = {}
      vi.mocked(XLSX.read).mockReturnValue({
        Sheets: { Sheet1: mockSheet },
        SheetNames: ['Sheet1'],
      } as any)

      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([
        {
          'GTIN': '7680123456789',
          'ATC-Code': 'N02BE01',
          'Produktebezeichnung': 'Test Product',
          'Eintrittsdatum': '2026-01-01',
          'Voraussichtliche Dauer': '2 Monate',
          'Bemerkungen': 'Test remarks',
          'Datum Publikation': '2026-01-05',
          'Letzte Aktualisierung': '2026-01-10',
        },
      ])

      const result = await fetchBwlData()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        gtin: '7680123456789',
        atcCode: 'N02BE01',
        bezeichnung: 'Test Product',
        eintrittsdatum: '2026-01-01',
        voraussichtlicheDauer: '2 Monate',
        bemerkungen: 'Test remarks',
        datumPublikation: '2026-01-05',
        letzteAktualisierung: '2026-01-10',
      })
    })

    it('should filter out rows without GTIN', async () => {
      const html = '<a href="/file.xlsx">Download</a>'

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, text: async () => html })
        .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })

      vi.mocked(XLSX.read).mockReturnValue({ Sheets: {}, SheetNames: ['Sheet1'] } as any)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([
        { 'GTIN': '7680123456789', 'Produktebezeichnung': 'Valid' },
        { 'GTIN': '', 'Produktebezeichnung': 'Invalid - no GTIN' },
        { 'Produktebezeichnung': 'Invalid - missing GTIN' },
      ])

      const result = await fetchBwlData()

      expect(result).toHaveLength(1)
      expect(result[0].gtin).toBe('7680123456789')
    })

    it('should handle missing optional fields', async () => {
      const html = '<a href="/file.xlsx">Download</a>'

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, text: async () => html })
        .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })

      vi.mocked(XLSX.read).mockReturnValue({ Sheets: {}, SheetNames: ['Sheet1'] } as any)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([
        {
          'GTIN': '7680123456789',
          // All optional fields missing
        },
      ])

      const result = await fetchBwlData()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        gtin: '7680123456789',
        atcCode: '',
        bezeichnung: '',
        eintrittsdatum: null,
        voraussichtlicheDauer: null,
        bemerkungen: null,
        datumPublikation: null,
        letzteAktualisierung: null,
      })
    })

    it('should trim whitespace from all fields', async () => {
      const html = '<a href="/file.xlsx">Download</a>'

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, text: async () => html })
        .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })

      vi.mocked(XLSX.read).mockReturnValue({ Sheets: {}, SheetNames: ['Sheet1'] } as any)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([
        {
          'GTIN': '  7680123456789  ',
          'ATC-Code': '  N02BE01  ',
          'Produktebezeichnung': '  Test  ',
        },
      ])

      const result = await fetchBwlData()

      expect(result[0].gtin).toBe('7680123456789')
      expect(result[0].atcCode).toBe('N02BE01')
      expect(result[0].bezeichnung).toBe('Test')
    })

    it('should handle empty workbook', async () => {
      const html = '<a href="/file.xlsx">Download</a>'

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, text: async () => html })
        .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })

      vi.mocked(XLSX.read).mockReturnValue({ Sheets: {}, SheetNames: ['Sheet1'] } as any)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([])

      const result = await fetchBwlData()

      expect(result).toEqual([])
    })

    it('should handle malformed XLSX file', async () => {
      const html = '<a href="/file.xlsx">Download</a>'

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, text: async () => html })
        .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })

      vi.mocked(XLSX.read).mockImplementation(() => {
        throw new Error('Invalid XLSX format')
      })

      await expect(fetchBwlData()).rejects.toThrow('Invalid XLSX format')
    })

    it('should handle very large XLSX files', async () => {
      const html = '<a href="/file.xlsx">Download</a>'

      // Simulate 50MB file
      const largeBuffer = new ArrayBuffer(50 * 1024 * 1024)

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, text: async () => html })
        .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => largeBuffer })

      vi.mocked(XLSX.read).mockReturnValue({ Sheets: {}, SheetNames: ['Sheet1'] } as any)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([])

      await fetchBwlData()

      expect(vi.mocked(XLSX.read)).toHaveBeenCalledWith(
        expect.any(Buffer),
        { type: 'buffer' }
      )
    })

    it('should handle numeric GTIN values', async () => {
      const html = '<a href="/file.xlsx">Download</a>'

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, text: async () => html })
        .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })

      vi.mocked(XLSX.read).mockReturnValue({ Sheets: {}, SheetNames: ['Sheet1'] } as any)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([
        {
          'GTIN': 7680123456789, // Number instead of string
        },
      ])

      const result = await fetchBwlData()

      expect(result[0].gtin).toBe('7680123456789')
    })
  })

  describe('Error Handling', () => {
    it('should handle undefined or null values in row data', async () => {
      const html = '<a href="/file.xlsx">Download</a>'

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, text: async () => html })
        .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })

      vi.mocked(XLSX.read).mockReturnValue({ Sheets: {}, SheetNames: ['Sheet1'] } as any)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([
        {
          'GTIN': '7680123456789',
          'ATC-Code': undefined,
          'Produktebezeichnung': null,
        },
      ])

      const result = await fetchBwlData()

      expect(result[0].atcCode).toBe('')
      expect(result[0].bezeichnung).toBe('')
    })

    it('should handle sheet_to_json errors', async () => {
      const html = '<a href="/file.xlsx">Download</a>'

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, text: async () => html })
        .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })

      vi.mocked(XLSX.read).mockReturnValue({ Sheets: {}, SheetNames: ['Sheet1'] } as any)
      vi.mocked(XLSX.utils.sheet_to_json).mockImplementation(() => {
        throw new Error('JSON conversion failed')
      })

      await expect(fetchBwlData()).rejects.toThrow('JSON conversion failed')
    })
  })
})
