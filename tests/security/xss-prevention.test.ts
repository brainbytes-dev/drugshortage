/**
 * XSS Prevention Tests
 * Tests that scraped HTML content is properly sanitized
 */

import { parseShortagesFromHtml, parseDetailFromHtml } from '@/lib/scraper'

describe('XSS Prevention in Scraper', () => {
  test('escapes script tags in bezeichnung', () => {
    const html = `
      <table id="GridView1">
        <tr><th>Headers</th></tr>
        <tr>
          <td><a href="detail.aspx">Med <script>alert('xss')</script></a></td>
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
      </table>
    `

    const shortages = parseShortagesFromHtml(html)
    expect(shortages[0].bezeichnung).not.toContain('<script>')
    expect(shortages[0].bezeichnung).not.toContain('alert')
  })

  test('escapes HTML entities in firma field', () => {
    const html = `
      <table id="GridView1">
        <tr><th>Headers</th></tr>
        <tr>
          <td><a href="detail.aspx">Test Med</a></td>
          <td>unbestimmt</td>
          <td><a href="alt.aspx">Alt</a></td>
          <td>1 aktuell</td>
          <td>01.01.2026</td>
          <td>&lt;img src=x onerror=alert(1)&gt; Firma</td>
          <td>111</td>
          <td>999</td>
          <td>100</td>
          <td>A01</td>
          <td>GRP1</td>
        </tr>
      </table>
    `

    const shortages = parseShortagesFromHtml(html)
    expect(shortages[0].firma).not.toContain('<img')
    expect(shortages[0].firma).not.toContain('onerror')
  })

  test('handles javascript: protocol in URLs', () => {
    const html = `
      <table id="GridView1">
        <tr><th>Headers</th></tr>
        <tr>
          <td><a href="javascript:alert('xss')">Test Med</a></td>
          <td>unbestimmt</td>
          <td><a href="javascript:void(0)">Alt</a></td>
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

    const shortages = parseShortagesFromHtml(html)
    expect(shortages[0].detailUrl).not.toContain('javascript:')
    expect(shortages[0].alternativenUrl).not.toContain('javascript:')
  })

  test('sanitizes bemerkungen field in detail page', () => {
    const html = `
      <table>
        <tr>
          <td>Bemerkungen</td>
          <td><script>alert('xss')</script>Dangerous content</td>
        </tr>
      </table>
    `

    const detail = parseDetailFromHtml(html)
    expect(detail.bemerkungen).not.toContain('<script>')
  })

  test('handles data: URLs in detail links', () => {
    const html = `
      <table id="GridView1">
        <tr><th>Headers</th></tr>
        <tr>
          <td><a href="data:text/html,<script>alert('xss')</script>">Test</a></td>
          <td>unbestimmt</td>
          <td><a href="data:text/html,bad">Alt</a></td>
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

    const shortages = parseShortagesFromHtml(html)
    expect(shortages[0].detailUrl).not.toContain('data:')
  })

  test('prevents event handler injection in parsed fields', () => {
    const html = `
      <table>
        <tr>
          <td>Art der Info durch die Firma</td>
          <td onload="alert('xss')">Normal text</td>
        </tr>
      </table>
    `

    const detail = parseDetailFromHtml(html)
    expect(detail.artDerInfoDurchFirma).not.toContain('onload')
    expect(detail.artDerInfoDurchFirma).toBe('Normal text')
  })
})
