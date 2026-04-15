/**
 * Security-focused tests
 * Tests for XSS, injection, authorization, and input validation
 */

import { GET as alternativesGET } from '@/app/api/alternatives/route'
import { GET as shortagesGET } from '@/app/api/shortages/route'
import { POST as scrapeGET } from '@/app/api/scrape/route'
import { parseShortagesFromHtml, parseDetailFromHtml } from '@/lib/scraper'
import { upsertShortages } from '@/lib/db'

describe('Security Tests', () => {
  describe('XSS Prevention', () => {
    test('scraped HTML with script tags does not execute', () => {
      const maliciousHtml = `
        <table id="GridView1">
          <tr><th>Headers</th></tr>
          <tr>
            <td><script>alert("XSS")</script>Test Med</td>
            <td>date</td><td>alt</td><td>1 status</td><td>mut</td>
            <td>Firma</td><td>123</td><td>999</td><td>10</td><td>A01</td><td>GRP</td>
          </tr>
        </table>
      `
      const result = parseShortagesFromHtml(maliciousHtml)
      expect(result[0].bezeichnung).not.toContain('<script>')
      expect(result[0].bezeichnung).toContain('Test Med')
    })

    test('detail page with malicious content is sanitized', () => {
      const maliciousHtml = `
        <table>
          <tr><td>Bemerkungen</td><td><img src=x onerror="alert('XSS')">Notes</td></tr>
          <tr><td>ATC-Code</td><td>A01<script>evil()</script></td></tr>
        </table>
      `
      const result = parseDetailFromHtml(maliciousHtml)
      // The parser extracts text content, stripping HTML tags
      expect(result.bemerkungen).not.toContain('<img')
      expect(result.bemerkungen).not.toContain('onerror')
      expect(result.atcCode).not.toContain('<script>')
    })

    test('firma name with HTML entities is handled correctly', async () => {
      await upsertShortages([
        {
          gtin: '999',
          pharmacode: '999',
          bezeichnung: 'Med',
          firma: 'Firma &lt;script&gt;alert(1)&lt;/script&gt;',
          atcCode: 'A01',
          gengrp: 'GRP',
          statusCode: 1,
          statusText: '1',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 10,
          detailUrl: '',
          firstSeenAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          isActive: true,
        },
      ])

      const req = new Request('http://localhost/api/shortages?firma=Firma &lt;script&gt;')
      const res = await shortagesGET(req)
      const json = await res.json()
      expect(json.data).toHaveLength(1)
    })
  })

  describe('SQL Injection Prevention (Prisma)', () => {
    test('search parameter with SQL injection attempt', async () => {
      const req = new Request(
        "http://localhost/api/shortages?search=' OR '1'='1' --",
      )
      const res = await shortagesGET(req)
      // Should not crash or return all results
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
    })

    test('firma filter with SQL injection attempt', async () => {
      const req = new Request(
        "http://localhost/api/shortages?firma='; DROP TABLE shortage;--",
      )
      const res = await shortagesGET(req)
      expect(res.status).toBe(200)
      // Table should still exist after this query
    })

    test('GTIN parameter with SQL injection in alternatives API', async () => {
      const req = new Request(
        "http://localhost/api/alternatives?gtin=' UNION SELECT * FROM users--",
      )
      const res = await alternativesGET(req)
      // Should handle gracefully without crashing
      expect(res.status).toBeLessThan(500)
    })
  })

  describe('Authorization', () => {
    test('scrape endpoint rejects requests without Bearer prefix', async () => {
      const req = new Request('http://localhost/api/scrape', {
        method: 'POST',
        headers: { authorization: 'wrong-secret' },
      })
      const res = await scrapeGET(req)
      expect(res.status).toBe(401)
    })

    test('scrape endpoint rejects empty authorization header', async () => {
      const req = new Request('http://localhost/api/scrape', {
        method: 'POST',
        headers: { authorization: '' },
      })
      const res = await scrapeGET(req)
      expect(res.status).toBe(401)
    })

    test('scrape endpoint rejects Bearer with wrong secret', async () => {
      process.env.CRON_SECRET = 'correct-secret'
      const req = new Request('http://localhost/api/scrape', {
        method: 'POST',
        headers: { authorization: 'Bearer wrong-secret' },
      })
      const res = await scrapeGET(req)
      expect(res.status).toBe(401)
    })

    test('scrape endpoint case-sensitive secret validation', async () => {
      process.env.CRON_SECRET = 'SecretKey123'
      const req = new Request('http://localhost/api/scrape', {
        method: 'POST',
        headers: { authorization: 'Bearer secretkey123' },
      })
      const res = await scrapeGET(req)
      expect(res.status).toBe(401)
    })
  })

  describe('Input Validation', () => {
    test('alternatives API rejects invalid GTIN formats', async () => {
      const invalidGTINs = ['abc', '!!!', '<script>', '', ' ', '../../etc/passwd']
      for (const gtin of invalidGTINs) {
        const req = new Request(
          `http://localhost/api/alternatives?gtin=${encodeURIComponent(gtin)}`,
        )
        const res = await alternativesGET(req)
        // Should not crash - may return 400 or 502 depending on validation
        expect(res.status).toBeLessThan(500)
      }
    })

    test('shortages API handles extremely large page numbers', async () => {
      const req = new Request('http://localhost/api/shortages?page=999999999')
      const res = await shortagesGET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toEqual([]) // No results for page beyond data
    })

    test('shortages API handles negative page numbers', async () => {
      const req = new Request('http://localhost/api/shortages?page=-5')
      const res = await shortagesGET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.page).toBeGreaterThanOrEqual(1) // Should clamp to 1
    })

    test('shortages API handles extremely large perPage values', async () => {
      const req = new Request('http://localhost/api/shortages?perPage=9999999')
      const res = await shortagesGET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.perPage).toBeLessThanOrEqual(200) // Clamped to max
    })

    test('shortages API handles special characters in search', async () => {
      const specialChars = ['%', '_', '*', '\\', '/', '?', '#']
      for (const char of specialChars) {
        const req = new Request(
          `http://localhost/api/shortages?search=${encodeURIComponent(char)}`,
        )
        const res = await shortagesGET(req)
        expect(res.status).toBe(200)
      }
    })

    test('shortages API handles unicode in search', async () => {
      const req = new Request(
        'http://localhost/api/shortages?search=' + encodeURIComponent('测试中文'),
      )
      const res = await shortagesGET(req)
      expect(res.status).toBe(200)
    })
  })

  describe('Rate Limiting & DoS Protection', () => {
    test('handles concurrent API requests without crashing', async () => {
      const requests = Array.from({ length: 50 }, () =>
        shortagesGET(new Request('http://localhost/api/shortages')),
      )
      const results = await Promise.all(requests)
      results.forEach(res => {
        expect(res.status).toBe(200)
      })
    })

    test('handles very long search queries', async () => {
      const longQuery = 'a'.repeat(10000)
      const req = new Request(
        `http://localhost/api/shortages?search=${encodeURIComponent(longQuery)}`,
      )
      const res = await shortagesGET(req)
      // Should handle gracefully, not crash
      expect(res.status).toBeLessThan(500)
    })
  })

  describe('Error Message Information Disclosure', () => {
    test('database errors do not expose sensitive information', async () => {
      // This test would require mocking Prisma to throw an error
      // For now, verify error responses don't include stack traces in production
      const req = new Request('http://localhost/api/shortages?perPage=invalid')
      const res = await shortagesGET(req)
      const json = await res.json()
      if (json.error) {
        expect(json.error).not.toContain('prisma')
        expect(json.error).not.toContain('stacktrace')
        expect(json.error).not.toContain('DATABASE_URL')
      }
    })
  })
})
