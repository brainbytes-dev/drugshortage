/**
 * Scraper Edge Cases Tests
 * Tests for malformed HTML, network errors, and data anomalies
 */

import {
  parseShortagesFromHtml,
  parseDetailFromHtml,
  parseOverviewStats,
} from '@/lib/scraper'

describe('Scraper Edge Cases', () => {
  describe('parseShortagesFromHtml', () => {
    test('handles completely empty HTML', () => {
      const html = ''
      const result = parseShortagesFromHtml(html)
      expect(result).toEqual([])
    })

    test('handles HTML with missing GridView1 table', () => {
      const html = '<html><body><table id="OtherTable"></table></body></html>'
      const result = parseShortagesFromHtml(html)
      expect(result).toEqual([])
    })

    test('handles table with only header row (no data)', () => {
      const html = `
        <table id="GridView1">
          <tr><th>Headers</th></tr>
        </table>
      `
      const result = parseShortagesFromHtml(html)
      expect(result).toEqual([])
    })

    test('handles rows with insufficient columns', () => {
      const html = `
        <table id="GridView1">
          <tr><th>Headers</th></tr>
          <tr>
            <td>Only</td>
            <td>Three</td>
            <td>Columns</td>
          </tr>
        </table>
      `
      const result = parseShortagesFromHtml(html)
      expect(result).toEqual([]) // Should skip incomplete rows
    })

    test('handles missing GTIN (skips row)', () => {
      const html = `
        <table id="GridView1">
          <tr><th>Headers</th></tr>
          <tr>
            <td><a href="detail.aspx">Test Med</a></td>
            <td>unbestimmt</td>
            <td><a href="alt.aspx">Alt</a></td>
            <td>1 aktuell</td>
            <td>01.01.2026</td>
            <td>Test Firma</td>
            <td></td><!-- Empty GTIN -->
            <td>999</td>
            <td>100</td>
            <td>A01</td>
            <td>GRP1</td>
          </tr>
        </table>
      `
      const result = parseShortagesFromHtml(html)
      expect(result).toEqual([])
    })

    test('handles invalid statusCode (non-numeric)', () => {
      const html = `
        <table id="GridView1">
          <tr><th>Headers</th></tr>
          <tr>
            <td><a href="detail.aspx">Test Med</a></td>
            <td>unbestimmt</td>
            <td><a href="alt.aspx">Alt</a></td>
            <td>invalid status</td>
            <td>01.01.2026</td>
            <td>Test Firma</td>
            <td>111</td>
            <td>999</td>
            <td>100</td>
            <td>A01</td>
            <td>GRP1</td>
          </tr>
        </table>
      `
      const result = parseShortagesFromHtml(html)
      expect(result).toEqual([]) // Should skip rows with invalid status
    })

    test('handles malformed HTML with unclosed tags', () => {
      const html = `
        <table id="GridView1">
          <tr><th>Headers</th>
          <tr>
            <td><a href="detail.aspx">Test Med</a>
            <td>unbestimmt
            <td><a href="alt.aspx">Alt</a></td>
            <td>1 aktuell</td>
            <td>01.01.2026</td>
            <td>Test Firma</td>
            <td>111</td>
            <td>999</td>
            <td>100</td>
            <td>A01</td>
            <td>GRP1</td>
      `
      // Cheerio should parse this gracefully
      const result = parseShortagesFromHtml(html)
      expect(result).toBeDefined()
    })

    test('handles links without href attribute', () => {
      const html = `
        <table id="GridView1">
          <tr><th>Headers</th></tr>
          <tr>
            <td><a>Test Med</a></td>
            <td>unbestimmt</td>
            <td><a>Alt</a></td>
            <td>1 aktuell</td>
            <td>01.01.2026</td>
            <td>Test Firma</td>
            <td>111</td>
            <td>999</td>
            <td>100</td>
            <td>A01</td>
            <td>GRP1</td>
          </tr>
        </table>
      `
      const result = parseShortagesFromHtml(html)
      expect(result).toHaveLength(1)
      expect(result[0].detailUrl).toBe('')
      expect(result[0].alternativenUrl).toBeUndefined()
    })

    test('handles relative URLs correctly', () => {
      const html = `
        <table id="GridView1">
          <tr><th>Headers</th></tr>
          <tr>
            <td><a href="detail_lieferengpass.aspx?ID=123">Test Med</a></td>
            <td>unbestimmt</td>
            <td><a href="alternativen.aspx?GTIN=111">Alt</a></td>
            <td>1 aktuell</td>
            <td>01.01.2026</td>
            <td>Test Firma</td>
            <td>111</td>
            <td>999</td>
            <td>100</td>
            <td>A01</td>
            <td>GRP1</td>
          </tr>
        </table>
      `
      const result = parseShortagesFromHtml(html)
      expect(result[0].detailUrl).toContain('https://www.drugshortage.ch/')
      expect(result[0].alternativenUrl).toContain('https://www.drugshortage.ch/')
    })

    test('handles absolute URLs unchanged', () => {
      const html = `
        <table id="GridView1">
          <tr><th>Headers</th></tr>
          <tr>
            <td><a href="https://external.com/detail">Test Med</a></td>
            <td>unbestimmt</td>
            <td><a href="https://external.com/alt">Alt</a></td>
            <td>1 aktuell</td>
            <td>01.01.2026</td>
            <td>Test Firma</td>
            <td>111</td>
            <td>999</td>
            <td>100</td>
            <td>A01</td>
            <td>GRP1</td>
          </tr>
        </table>
      `
      const result = parseShortagesFromHtml(html)
      expect(result[0].detailUrl).toBe('https://external.com/detail')
      expect(result[0].alternativenUrl).toBe('https://external.com/alt')
    })

    test('handles non-numeric tageSeitMeldung', () => {
      const html = `
        <table id="GridView1">
          <tr><th>Headers</th></tr>
          <tr>
            <td><a href="detail.aspx">Test Med</a></td>
            <td>unbestimmt</td>
            <td><a href="alt.aspx">Alt</a></td>
            <td>1 aktuell</td>
            <td>01.01.2026</td>
            <td>Test Firma</td>
            <td>111</td>
            <td>999</td>
            <td>not-a-number</td>
            <td>A01</td>
            <td>GRP1</td>
          </tr>
        </table>
      `
      const result = parseShortagesFromHtml(html)
      expect(result[0].tageSeitMeldung).toBe(0) // Should default to 0
    })

    test('handles whitespace and newlines in cell content', () => {
      const html = `
        <table id="GridView1">
          <tr><th>Headers</th></tr>
          <tr>
            <td>
              <a href="detail.aspx">
                Test Med
              </a>
            </td>
            <td>  unbestimmt  </td>
            <td><a href="alt.aspx">Alt</a></td>
            <td>1 aktuell</td>
            <td>01.01.2026</td>
            <td>  Test Firma  </td>
            <td>  111  </td>
            <td>999</td>
            <td>100</td>
            <td>A01</td>
            <td>GRP1</td>
          </tr>
        </table>
      `
      const result = parseShortagesFromHtml(html)
      expect(result[0].bezeichnung).toBe('Test Med')
      expect(result[0].firma).toBe('Test Firma')
      expect(result[0].gtin).toBe('111')
    })

    test('handles mixed valid and invalid rows', () => {
      const html = `
        <table id="GridView1">
          <tr><th>Headers</th></tr>
          <tr>
            <td><a href="detail.aspx">Valid Med</a></td>
            <td>unbestimmt</td>
            <td><a href="alt.aspx">Alt</a></td>
            <td>1 aktuell</td>
            <td>01.01.2026</td>
            <td>Test Firma</td>
            <td>111</td>
            <td>999</td>
            <td>100</td>
            <td>A01</td>
            <td>GRP1</td>
          </tr>
          <tr>
            <td>Invalid - no GTIN</td>
            <td>unbestimmt</td>
            <td></td>
            <td>2</td>
            <td>01.01.2026</td>
            <td>Test Firma</td>
            <td></td>
            <td>888</td>
            <td>50</td>
            <td>B01</td>
            <td>GRP2</td>
          </tr>
          <tr>
            <td><a href="detail.aspx">Another Valid</a></td>
            <td>KW 20</td>
            <td><a href="alt.aspx">Alt</a></td>
            <td>4 Wiederaufnahme</td>
            <td>15.02.2026</td>
            <td>Firma B</td>
            <td>222</td>
            <td>777</td>
            <td>30</td>
            <td>C01</td>
            <td>GRP3</td>
          </tr>
        </table>
      `
      const result = parseShortagesFromHtml(html)
      expect(result).toHaveLength(2) // Only valid rows
      expect(result[0].gtin).toBe('111')
      expect(result[1].gtin).toBe('222')
    })

    test('handles Unicode characters in text fields', () => {
      const html = `
        <table id="GridView1">
          <tr><th>Headers</th></tr>
          <tr>
            <td><a href="detail.aspx">Médikament™ – 500µg</a></td>
            <td>unbestimmt</td>
            <td><a href="alt.aspx">Alt</a></td>
            <td>1 aktuell</td>
            <td>01.01.2026</td>
            <td>Firma™ GmbH & Co. KG</td>
            <td>111</td>
            <td>999</td>
            <td>100</td>
            <td>A01</td>
            <td>GRP1</td>
          </tr>
        </table>
      `
      const result = parseShortagesFromHtml(html)
      expect(result[0].bezeichnung).toContain('Médikament™')
      expect(result[0].firma).toContain('Firma™ GmbH & Co. KG')
    })
  })

  describe('parseDetailFromHtml', () => {
    test('handles empty HTML', () => {
      const html = ''
      const result = parseDetailFromHtml(html)
      expect(result).toEqual({})
    })

    test('handles HTML with no matching labels', () => {
      const html = `
        <table>
          <tr>
            <td>Unknown Label</td>
            <td>Unknown Value</td>
          </tr>
        </table>
      `
      const result = parseDetailFromHtml(html)
      // Should not extract unknown fields
      expect(result.atcCode).toBeUndefined()
      expect(result.ersteMeldung).toBeUndefined()
    })

    test('handles &nbsp; in values correctly', () => {
      const html = `
        <table>
          <tr>
            <td>ATC-Code</td>
            <td>A01BC01&nbsp;</td>
          </tr>
        </table>
      `
      const result = parseDetailFromHtml(html)
      expect(result.atcCode).toBe('A01BC01')
    })

    test('handles "0" values correctly (should skip)', () => {
      const html = `
        <table>
          <tr>
            <td>ATC-Code</td>
            <td>0</td>
          </tr>
        </table>
      `
      const result = parseDetailFromHtml(html)
      expect(result.atcCode).toBeUndefined() // "0" should be treated as empty
    })

    test('handles partial field set', () => {
      const html = `
        <table>
          <tr>
            <td>erste Meldung</td>
            <td>01.01.2026</td>
          </tr>
          <tr>
            <td>ATC-Code</td>
            <td>A01BC01</td>
          </tr>
        </table>
      `
      const result = parseDetailFromHtml(html)
      expect(result.ersteMeldung).toBe('01.01.2026')
      expect(result.atcCode).toBe('A01BC01')
      expect(result.bemerkungen).toBeUndefined()
    })

    test('handles multi-line Bemerkungen field', () => {
      const html = `
        <table>
          <tr>
            <td>Bemerkungen</td>
            <td>Line 1
            Line 2
            Line 3</td>
          </tr>
        </table>
      `
      const result = parseDetailFromHtml(html)
      expect(result.bemerkungen).toBeDefined()
      expect(result.bemerkungen).toContain('Line 1')
    })

    test('extracts statusCode from "Status des Engpasses" field', () => {
      const html = `
        <table>
          <tr>
            <td>Status des Engpasses</td>
            <td>9 abgeschlossen</td>
          </tr>
        </table>
      `
      const result = parseDetailFromHtml(html)
      expect(result.statusCode).toBe(9)
      expect(result.statusText).toBe('9 abgeschlossen')
    })

    test('handles malformed status code', () => {
      const html = `
        <table>
          <tr>
            <td>Status des Engpasses</td>
            <td>X ungültig</td>
          </tr>
        </table>
      `
      const result = parseDetailFromHtml(html)
      // statusCode should be NaN, so not set
      expect(result.statusCode).toBeUndefined()
      expect(result.statusText).toBeUndefined()
    })

    test('handles empty table cells', () => {
      const html = `
        <table>
          <tr>
            <td>erste Meldung</td>
            <td></td>
          </tr>
          <tr>
            <td>ATC-Code</td>
            <td>   </td>
          </tr>
        </table>
      `
      const result = parseDetailFromHtml(html)
      expect(result.ersteMeldung).toBeUndefined()
      expect(result.atcCode).toBeUndefined()
    })
  })

  describe('parseOverviewStats', () => {
    test('handles missing tables gracefully', () => {
      const html = '<html><body></body></html>'
      const result = parseOverviewStats(html)
      expect(result.totalPackungen).toBe(0)
      expect(result.totalProdukte).toBe(0)
      expect(result.betroffeneAtcGruppen).toBe(0)
    })

    test('handles non-numeric values in stats', () => {
      const html = `
        <table>
          <tr><td>Header</td></tr>
          <tr><td>invalid</td><td>also-invalid</td></tr>
        </table>
      `
      const result = parseOverviewStats(html)
      expect(result.totalPackungen).toBe(0)
      expect(result.totalProdukte).toBe(0)
    })

    test('extracts numeric values with thousands separators', () => {
      const html = `
        <table>
          <tr><td>Header</td></tr>
          <tr><td>1,234</td><td>5,678</td></tr>
        </table>
      `
      const result = parseOverviewStats(html)
      expect(result.totalPackungen).toBe(1234)
      expect(result.totalProdukte).toBe(5678)
    })

    test('handles partial stats data', () => {
      // Production reads row index 1 (after header row); include dummy header rows
      const html = `
        <table><tr><th>Hdr</th></tr><tr><td>100</td><td>50</td></tr></table>
        <table><tr><th>Hdr</th></tr><tr><td>10</td></tr></table>
      `
      const result = parseOverviewStats(html)
      expect(result.totalPackungen).toBe(100)
      expect(result.totalProdukte).toBe(50)
      expect(result.betroffeneAtcGruppen).toBe(10)
    })
  })
})
