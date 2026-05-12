import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchOddbProducts } from '@/lib/oddb-scraper'
import { XMLParser } from 'fast-xml-parser'

jest.mock('fast-xml-parser')

describe('ODDB Scraper - Complete Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('XML Fetching', () => {
    it('should fetch XML from correct URL', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<PRODUCT></PRODUCT>',
      })

      vi.mocked(XMLParser).mockImplementation(() => ({
        parse: vi.fn().mockReturnValue({ PRODUCT: { PRD: [] } }),
      }) as any)

      await fetchOddbProducts()

      expect(global.fetch).toHaveBeenCalledWith(
        'https://download.hin.ch/download/oddb2xml/oddb_product.xml',
        { headers: { 'User-Agent': 'engpassradar.ch/1.0' } }
      )
    })

    it('should throw error when fetch fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 })

      await expect(fetchOddbProducts()).rejects.toThrow('ODDB product fetch failed: 404')
    })

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(fetchOddbProducts()).rejects.toThrow('Network error')
    })

    // TODO: this test sets a 30s timeout which exceeds Jest's 5s limit;
    // refactor to use fake timers or a shorter delay to make it deterministic
    it.skip('should handle timeout', async () => {
      global.fetch = vi.fn().mockImplementation(
        () => new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 30000)
        )
      )

      await expect(fetchOddbProducts()).rejects.toThrow('Timeout')
    })
  })

  describe('XML Parsing', () => {
    it('should parse valid XML with multiple products', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<xml/>',
      })

      const mockParser = {
        parse: vi.fn().mockReturnValue({
          PRODUCT: {
            PRD: [
              {
                GTIN: '7680123456789',
                PRODNO: '0060201',
                DSCRD: 'Test Product 1',
                ATC: 'N02BE01',
                SubstanceSwissmedic: 'Paracetamol',
                CompositionSwissmedic: 'Paracetamol 500mg',
              },
              {
                GTIN: '7680987654321',
                PRODNO: '0060202',
                DSCRD: 'Test Product 2',
                ATC: 'N02AA01',
              },
            ],
          },
        }),
      }

      vi.mocked(XMLParser).mockImplementation(() => mockParser as any)

      const result = await fetchOddbProducts()

      expect(result).toHaveLength(2)
      expect(result[0].gtin).toBe('7680123456789')
      expect(result[1].gtin).toBe('7680987654321')
    })

    it('should handle single product (non-array normalization)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<xml/>',
      })

      const mockParser = {
        parse: vi.fn().mockReturnValue({
          PRODUCT: {
            PRD: { // Single object, not array
              GTIN: '7680123456789',
              PRODNO: '0060201',
              DSCRD: 'Single Product',
              ATC: 'N02BE01',
            },
          },
        }),
      }

      vi.mocked(XMLParser).mockImplementation(() => mockParser as any)

      const result = await fetchOddbProducts()

      expect(result).toHaveLength(1)
      expect(result[0].gtin).toBe('7680123456789')
    })

    it('should filter out entries without GTIN', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<xml/>',
      })

      const mockParser = {
        parse: vi.fn().mockReturnValue({
          PRODUCT: {
            PRD: [
              { GTIN: '7680123456789', DSCRD: 'Valid' },
              { GTIN: '', DSCRD: 'Invalid - empty GTIN' },
              { DSCRD: 'Invalid - no GTIN field' },
            ],
          },
        }),
      }

      vi.mocked(XMLParser).mockImplementation(() => mockParser as any)

      const result = await fetchOddbProducts()

      expect(result).toHaveLength(1)
      expect(result[0].bezeichnungDe).toBe('Valid')
    })

    it('should handle missing optional fields', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<xml/>',
      })

      const mockParser = {
        parse: vi.fn().mockReturnValue({
          PRODUCT: {
            PRD: [
              {
                GTIN: '7680123456789',
                // All optional fields missing
              },
            ],
          },
        }),
      }

      vi.mocked(XMLParser).mockImplementation(() => mockParser as any)

      const result = await fetchOddbProducts()

      // authStatus is always mapped (null when AUTOSATP absent)
      expect(result[0]).toEqual({
        gtin: '7680123456789',
        prodno: '',
        bezeichnungDe: '',
        atcCode: '',
        substanz: null,
        zusammensetzung: null,
        authStatus: null,
      })
    })

    it('should trim whitespace from fields', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<xml/>',
      })

      const mockParser = {
        parse: vi.fn().mockReturnValue({
          PRODUCT: {
            PRD: [
              {
                GTIN: '  7680123456789  ',
                PRODNO: '  0060201  ',
                DSCRD: '  Test Product  ',
                ATC: '  N02BE01  ',
                SubstanceSwissmedic: '  Paracetamol  ',
              },
            ],
          },
        }),
      }

      vi.mocked(XMLParser).mockImplementation(() => mockParser as any)

      const result = await fetchOddbProducts()

      expect(result[0].gtin).toBe('7680123456789')
      expect(result[0].prodno).toBe('0060201')
      expect(result[0].bezeichnungDe).toBe('Test Product')
      expect(result[0].atcCode).toBe('N02BE01')
      expect(result[0].substanz).toBe('Paracetamol')
    })

    it('should handle empty PRODUCT node', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<xml/>',
      })

      const mockParser = {
        parse: vi.fn().mockReturnValue({
          PRODUCT: {},
        }),
      }

      vi.mocked(XMLParser).mockImplementation(() => mockParser as any)

      const result = await fetchOddbProducts()

      expect(result).toEqual([])
    })

    it('should handle missing PRODUCT node', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<xml/>',
      })

      const mockParser = {
        parse: vi.fn().mockReturnValue({}),
      }

      vi.mocked(XMLParser).mockImplementation(() => mockParser as any)

      const result = await fetchOddbProducts()

      expect(result).toEqual([])
    })

    it('should handle malformed XML', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<PRODUCT><unclosed>',
      })

      const mockParser = {
        parse: vi.fn().mockImplementation(() => {
          throw new Error('XML parsing error')
        }),
      }

      vi.mocked(XMLParser).mockImplementation(() => mockParser as any)

      await expect(fetchOddbProducts()).rejects.toThrow('XML parsing error')
    })

    it('should handle very large XML files', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<PRODUCT>' + '<PRD><GTIN>123</GTIN></PRD>'.repeat(100000) + '</PRODUCT>',
      })

      const largeArray = Array(100000).fill(null).map((_, i) => ({
        GTIN: `768000000${i}`,
        DSCRD: `Product ${i}`,
      }))

      const mockParser = {
        parse: vi.fn().mockReturnValue({
          PRODUCT: { PRD: largeArray },
        }),
      }

      vi.mocked(XMLParser).mockImplementation(() => mockParser as any)

      const result = await fetchOddbProducts()

      expect(result.length).toBe(100000)
    })
  })

  describe('Data Transformation', () => {
    it('should map all fields correctly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<xml/>',
      })

      const mockParser = {
        parse: vi.fn().mockReturnValue({
          PRODUCT: {
            PRD: [
              {
                GTIN: '7680123456789',
                PRODNO: '0060201',
                DSCRD: 'Paracetamol Tabletten',
                ATC: 'N02BE01',
                SubstanceSwissmedic: 'Paracetamolum',
                CompositionSwissmedic: 'Paracetamolum 500mg per compressum',
              },
            ],
          },
        }),
      }

      vi.mocked(XMLParser).mockImplementation(() => mockParser as any)

      const result = await fetchOddbProducts()

      // Production fetchOddbProducts also maps AUTOSATP → authStatus (null when absent)
      expect(result[0]).toEqual({
        gtin: '7680123456789',
        prodno: '0060201',
        bezeichnungDe: 'Paracetamol Tabletten',
        atcCode: 'N02BE01',
        substanz: 'Paracetamolum',
        zusammensetzung: 'Paracetamolum 500mg per compressum',
        authStatus: null,
      })
    })

    it('should handle numeric values as strings', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<xml/>',
      })

      const mockParser = {
        parse: vi.fn().mockReturnValue({
          PRODUCT: {
            PRD: [
              {
                GTIN: 7680123456789, // Number
                PRODNO: 60201, // Number
                DSCRD: 'Product',
              },
            ],
          },
        }),
      }

      vi.mocked(XMLParser).mockImplementation(() => mockParser as any)

      const result = await fetchOddbProducts()

      expect(typeof result[0].gtin).toBe('string')
      expect(typeof result[0].prodno).toBe('string')
      expect(result[0].gtin).toBe('7680123456789')
      expect(result[0].prodno).toBe('60201')
    })

    it('should handle null substanz and zusammensetzung correctly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<xml/>',
      })

      const mockParser = {
        parse: vi.fn().mockReturnValue({
          PRODUCT: {
            PRD: [
              {
                GTIN: '7680123456789',
                DSCRD: 'Product',
                // SubstanceSwissmedic and CompositionSwissmedic missing
              },
            ],
          },
        }),
      }

      vi.mocked(XMLParser).mockImplementation(() => mockParser as any)

      const result = await fetchOddbProducts()

      expect(result[0].substanz).toBeNull()
      expect(result[0].zusammensetzung).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string values', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<xml/>',
      })

      const mockParser = {
        parse: vi.fn().mockReturnValue({
          PRODUCT: {
            PRD: [
              {
                GTIN: '7680123456789',
                PRODNO: '',
                DSCRD: '',
                ATC: '',
              },
            ],
          },
        }),
      }

      vi.mocked(XMLParser).mockImplementation(() => mockParser as any)

      const result = await fetchOddbProducts()

      expect(result[0].prodno).toBe('')
      expect(result[0].bezeichnungDe).toBe('')
      expect(result[0].atcCode).toBe('')
    })

    it('should handle special characters in text fields', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<xml/>',
      })

      const mockParser = {
        parse: vi.fn().mockReturnValue({
          PRODUCT: {
            PRD: [
              {
                GTIN: '7680123456789',
                DSCRD: 'Vitamin B12 <500μg> & Co',
                SubstanceSwissmedic: 'Cyanocobalamin (α-form)',
              },
            ],
          },
        }),
      }

      vi.mocked(XMLParser).mockImplementation(() => mockParser as any)

      const result = await fetchOddbProducts()

      expect(result[0].bezeichnungDe).toContain('<500μg>')
      expect(result[0].substanz).toContain('(α-form)')
    })
  })
})
