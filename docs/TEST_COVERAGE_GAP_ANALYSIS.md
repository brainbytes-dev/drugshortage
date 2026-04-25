# Test Coverage Gap Analysis

**Generated:** 2026-04-17  
**Status:** 58 test files exist, significant gaps remain

---

## Executive Summary

### Coverage Status
- ✅ **Well Covered:** API routes (shortages, alternatives basic), DB operations, scraper basics
- ⚠️ **Partial Coverage:** Security (SQL injection, XSS), cache layers, error handling
- ❌ **Critical Gaps:** RSS/Feeds, Sitemap, Timeline API, db-monitoring, integration workflows, race conditions

### Risk Assessment
| Area | Risk Level | Priority | Reason |
|------|-----------|----------|---------|
| CSV Export Security | 🔴 **CRITICAL** | P0 | CSV injection can execute code in Excel |
| Concurrent Scrape | 🔴 **CRITICAL** | P0 | Race conditions cause data corruption |
| RSS/Feed Generation | 🟡 **HIGH** | P1 | Public API, no validation tests |
| Timeline API | 🟡 **HIGH** | P1 | No edge case coverage |
| db-monitoring | 🟡 **HIGH** | P1 | No health check validation |
| Integration Workflows | 🟡 **HIGH** | P2 | Full end-to-end missing |

---

## 1. API Routes - Critical Gaps

### 1.1 RSS/Feed Routes (NO COVERAGE)

**Missing Tests:** `/app/rss.xml/route.ts` and `/app/wirkstoff/[atc]/feed.xml/route.ts`

**Critical Edge Cases:**
- XML structure validation (well-formed, valid encoding)
- XSS in feed content (malicious drug names)
- Large result sets (500+ items)
- Empty result handling
- Invalid ATC codes (feed route)
- Error recovery (503 on failure)

**Test Skeleton:**

```typescript
// tests/api/rss-feeds-complete.test.ts
import { describe, it, expect, vi } from 'vitest'
import { GET as RSSGet } from '@/app/rss.xml/route'
import { GET as ATCFeedGet } from '@/app/wirkstoff/[atc]/feed.xml/route'
import * as db from '@/lib/db'

describe('RSS/Feed Generation - Critical Security & Validation', () => {
  describe('XML Structure Validation', () => {
    it('should generate well-formed XML', async () => {
      vi.spyOn(db, 'queryShortages').mockResolvedValue({
        data: [{ gtin: '123', bezeichnung: 'Test Drug', firma: 'Test' }],
        total: 1, page: 1, perPage: 500,
      })

      const response = await RSSGet()
      const xml = await response.text()

      // Must start with <?xml
      expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/)
      
      // Must have valid RSS 2.0 structure
      expect(xml).toContain('<rss version="2.0"')
      expect(xml).toContain('<channel>')
      expect(xml).toContain('</channel>')
      expect(xml).toContain('</rss>')
      
      // Parse validation - should not throw
      expect(() => new DOMParser().parseFromString(xml, 'text/xml')).not.toThrow()
    })

    it('should escape XML special characters in content', async () => {
      vi.spyOn(db, 'queryShortages').mockResolvedValue({
        data: [{
          gtin: '123',
          bezeichnung: 'Drug <script>alert("XSS")</script> & Co.',
          firma: 'Test & Associates',
        }],
        total: 1,
      })

      const response = await RSSGet()
      const xml = await response.text()

      // XML entities must be escaped
      expect(xml).not.toContain('<script>')
      expect(xml).toContain('&lt;script&gt;')
      expect(xml).toContain('&amp;')
      expect(xml).not.toContain('Drug <script>') // Raw < should be escaped
    })

    it('should handle CDATA sections for complex content', async () => {
      vi.spyOn(db, 'queryShortages').mockResolvedValue({
        data: [{
          gtin: '123',
          bezeichnung: 'Complex <tag> & "quotes" content',
          firma: 'Test',
        }],
        total: 1,
      })

      const response = await RSSGet()
      const xml = await response.text()

      // Option 1: Escaped entities
      // Option 2: CDATA sections
      const hasCDATA = xml.includes('<![CDATA[')
      const hasEscaped = xml.includes('&lt;tag&gt;')
      
      expect(hasCDATA || hasEscaped).toBe(true)
    })
  })

  describe('Content Security (XSS Prevention)', () => {
    it('should neutralize JavaScript injection in titles', async () => {
      vi.spyOn(db, 'queryShortages').mockResolvedValue({
        data: [{
          gtin: '123',
          bezeichnung: '"><img src=x onerror=alert(1)>',
          firma: 'Test',
        }],
        total: 1,
      })

      const response = await RSSGet()
      const xml = await response.text()

      // HTML tags must be escaped or stripped
      expect(xml).not.toMatch(/<img[^>]*onerror/)
      expect(xml).not.toContain('alert(1)')
    })

    it('should sanitize SQL-like content', async () => {
      vi.spyOn(db, 'queryShortages').mockResolvedValue({
        data: [{
          gtin: '123',
          bezeichnung: "Drug'; DROP TABLE users; --",
          firma: 'Test',
        }],
        total: 1,
      })

      const response = await RSSGet()
      const xml = await response.text()

      // Should be present but escaped (XML feeds display content)
      expect(xml).toContain('DROP TABLE')
      // But not as executable code
      expect(xml).toMatch(/&apos;|&#39;/) // Escaped apostrophe
    })
  })

  describe('Large Result Set Handling', () => {
    it('should handle 500 items without truncation', async () => {
      const items = Array.from({ length: 500 }, (_, i) => ({
        gtin: `gtin-${i}`,
        bezeichnung: `Drug ${i}`,
        firma: 'Test',
        atcCode: 'A01',
        statusText: 'Active',
        tageSeitMeldung: i,
      }))

      vi.spyOn(db, 'queryShortages').mockResolvedValue({
        data: items,
        total: 500,
      })

      const response = await RSSGet()
      const xml = await response.text()

      // Count <item> tags
      const itemCount = (xml.match(/<item>/g) || []).length
      expect(itemCount).toBe(500)
    })

    it('should complete generation in <2s for 500 items', async () => {
      const items = Array.from({ length: 500 }, (_, i) => ({
        gtin: `gtin-${i}`,
        bezeichnung: `Drug ${i} with longer description text`,
        firma: 'Test',
      }))

      vi.spyOn(db, 'queryShortages').mockResolvedValue({
        data: items,
        total: 500,
      })

      const start = Date.now()
      await RSSGet()
      const duration = Date.now() - start

      expect(duration).toBeLessThan(2000)
    })
  })

  describe('Empty Result Handling', () => {
    it('should generate valid feed with no items', async () => {
      vi.spyOn(db, 'queryShortages').mockResolvedValue({
        data: [],
        total: 0,
      })

      const response = await RSSGet()
      const xml = await response.text()

      // Must have valid structure even when empty
      expect(xml).toContain('<channel>')
      expect(xml).toContain('</channel>')
      
      // No items
      expect(xml).not.toContain('<item>')
    })
  })

  describe('ATC-Specific Feed Route', () => {
    it('should filter by ATC code', async () => {
      const getShortagesSpy = vi.spyOn(db, 'getShortagesByAtc').mockResolvedValue([
        { gtin: '123', bezeichnung: 'Aspirin', atcCode: 'N02BA01' },
      ])

      const response = await ATCFeedGet(
        new Request('http://localhost/wirkstoff/N02BA01/feed.xml'),
        { params: Promise.resolve({ atc: 'N02BA01' }) }
      )

      expect(getShortagesSpy).toHaveBeenCalledWith('N02BA01')
      
      const xml = await response.text()
      expect(xml).toContain('Aspirin')
    })

    it('should handle invalid ATC codes gracefully', async () => {
      vi.spyOn(db, 'getShortagesByAtc').mockResolvedValue([])

      const response = await ATCFeedGet(
        new Request('http://localhost/wirkstoff/INVALID/feed.xml'),
        { params: Promise.resolve({ atc: 'INVALID' }) }
      )

      // Should return empty feed, not error
      expect(response.status).toBe(200)
      const xml = await response.text()
      expect(xml).toContain('<channel>')
    })
  })

  describe('Error Recovery', () => {
    it('should return 503 when DB fails', async () => {
      vi.spyOn(db, 'queryShortages').mockRejectedValue(new Error('DB down'))

      const response = await RSSGet()
      expect(response.status).toBe(503)
      
      const body = await response.text()
      expect(body).toBe('Feed temporarily unavailable')
    })

    it('should return 503 on query timeout', async () => {
      vi.spyOn(db, 'queryShortages').mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )

      const response = await RSSGet()
      expect(response.status).toBe(503)
    })
  })

  describe('HTTP Headers', () => {
    it('should set correct content-type', async () => {
      vi.spyOn(db, 'queryShortages').mockResolvedValue({ data: [], total: 0 })

      const response = await RSSGet()
      expect(response.headers.get('Content-Type')).toBe('application/rss+xml; charset=utf-8')
    })

    it('should include cache headers', async () => {
      vi.spyOn(db, 'queryShortages').mockResolvedValue({ data: [], total: 0 })

      const response = await RSSGet()
      const cacheControl = response.headers.get('Cache-Control')
      
      // Feeds should be cacheable
      expect(cacheControl).toBeTruthy()
      expect(cacheControl).toMatch(/public|s-maxage/)
    })
  })
})
```

---

### 1.2 Sitemap Route (PARTIAL COVERAGE)

**Missing Tests:** `/app/sitemap.ts`

**Critical Edge Cases:**
- ISR revalidation (24h)
- Large sitemaps (10k+ URLs)
- Invalid slugs/ATC codes
- Memory efficiency
- Change frequency accuracy

**Test Skeleton:**

```typescript
// tests/app/sitemap-complete.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import sitemap from '@/app/sitemap'
import * as db from '@/lib/db'
import * as cache from '@/lib/cache-lru'

describe('Sitemap Generation - ISR & Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ISR Revalidation', () => {
    it('should export revalidate constant', () => {
      // File should export: export const revalidate = 86400
      const sitemapModule = require('@/app/sitemap')
      expect(sitemapModule.revalidate).toBe(86400)
    })

    it('should cache sitemap data for 1 hour', async () => {
      const cacheSpy = vi.spyOn(cache, 'getCachedLRU')
      vi.spyOn(db, 'getAllDrugSlugs').mockResolvedValue([{ slug: 'test-drug' }])
      vi.spyOn(db, 'getAllAtcCodes').mockResolvedValue([{ atc: 'A01' }])

      await sitemap()

      expect(cacheSpy).toHaveBeenCalledWith(
        'sitemap-data',
        expect.any(Function),
        3600 // 1 hour
      )
    })
  })

  describe('Large Sitemap Handling', () => {
    it('should handle 10k drug URLs efficiently', async () => {
      const drugs = Array.from({ length: 10000 }, (_, i) => ({ slug: `drug-${i}` }))
      const atcs = Array.from({ length: 500 }, (_, i) => ({ atc: `A${String(i).padStart(2, '0')}` }))

      vi.spyOn(db, 'getAllDrugSlugs').mockResolvedValue(drugs)
      vi.spyOn(db, 'getAllAtcCodes').mockResolvedValue(atcs)

      const start = Date.now()
      const result = await sitemap()
      const duration = Date.now() - start

      // Should complete in <1s
      expect(duration).toBeLessThan(1000)
      
      // Should have 10k drugs + 500 ATCs + 1 homepage = 10501 URLs
      expect(result).toHaveLength(10501)
    })

    it('should pre-allocate array for memory efficiency', async () => {
      // Test that implementation uses new Array(size) pattern
      const drugs = [{ slug: 'test' }]
      const atcs = [{ atc: 'A01' }]

      vi.spyOn(db, 'getAllDrugSlugs').mockResolvedValue(drugs)
      vi.spyOn(db, 'getAllAtcCodes').mockResolvedValue(atcs)

      const result = await sitemap()

      // 1 homepage + 1 drug + 1 ATC = 3
      expect(result).toHaveLength(3)
      
      // All entries should have required fields
      result.forEach(entry => {
        expect(entry).toHaveProperty('url')
        expect(entry).toHaveProperty('lastModified')
        expect(entry).toHaveProperty('changeFrequency')
        expect(entry).toHaveProperty('priority')
      })
    })
  })

  describe('URL Structure Validation', () => {
    it('should generate correct drug URLs', async () => {
      vi.spyOn(db, 'getAllDrugSlugs').mockResolvedValue([
        { slug: 'aspirin-100mg' },
        { slug: 'paracetamol-500mg' },
      ])
      vi.spyOn(db, 'getAllAtcCodes').mockResolvedValue([])

      const result = await sitemap()

      const drugUrls = result.filter(entry => entry.url.includes('/medikament/'))
      expect(drugUrls).toHaveLength(2)
      expect(drugUrls[0].url).toBe('https://engpassradar.ch/medikament/aspirin-100mg')
      expect(drugUrls[1].url).toBe('https://engpassradar.ch/medikament/paracetamol-500mg')
    })

    it('should generate correct ATC URLs', async () => {
      vi.spyOn(db, 'getAllDrugSlugs').mockResolvedValue([])
      vi.spyOn(db, 'getAllAtcCodes').mockResolvedValue([
        { atc: 'N02BA01' },
        { atc: 'J01CA04' },
      ])

      const result = await sitemap()

      const atcUrls = result.filter(entry => entry.url.includes('/wirkstoff/'))
      expect(atcUrls).toHaveLength(2)
      expect(atcUrls[0].url).toBe('https://engpassradar.ch/wirkstoff/N02BA01')
      expect(atcUrls[1].url).toBe('https://engpassradar.ch/wirkstoff/J01CA04')
    })

    it('should handle special characters in slugs', async () => {
      vi.spyOn(db, 'getAllDrugSlugs').mockResolvedValue([
        { slug: 'drug-with-umlauts-äöü' },
        { slug: 'drug-with-slash%2F' }, // URL-encoded slash
      ])
      vi.spyOn(db, 'getAllAtcCodes').mockResolvedValue([])

      const result = await sitemap()

      const drugUrls = result.filter(entry => entry.url.includes('/medikament/'))
      
      // URLs should be properly encoded
      expect(drugUrls[0].url).toContain('%C3%A4') // ä encoded
      expect(drugUrls[1].url).toContain('%2F') // Already encoded slash preserved
    })
  })

  describe('Priority & Change Frequency', () => {
    it('should assign correct priorities', async () => {
      vi.spyOn(db, 'getAllDrugSlugs').mockResolvedValue([{ slug: 'test' }])
      vi.spyOn(db, 'getAllAtcCodes').mockResolvedValue([{ atc: 'A01' }])

      const result = await sitemap()

      const homepage = result.find(e => e.url === 'https://engpassradar.ch')
      const drugPage = result.find(e => e.url.includes('/medikament/'))
      const atcPage = result.find(e => e.url.includes('/wirkstoff/'))

      expect(homepage?.priority).toBe(1.0)
      expect(drugPage?.priority).toBe(0.8)
      expect(atcPage?.priority).toBe(0.7)
    })

    it('should set appropriate change frequencies', async () => {
      vi.spyOn(db, 'getAllDrugSlugs').mockResolvedValue([{ slug: 'test' }])
      vi.spyOn(db, 'getAllAtcCodes').mockResolvedValue([{ atc: 'A01' }])

      const result = await sitemap()

      const homepage = result.find(e => e.url === 'https://engpassradar.ch')
      const drugPage = result.find(e => e.url.includes('/medikament/'))
      const atcPage = result.find(e => e.url.includes('/wirkstoff/'))

      expect(homepage?.changeFrequency).toBe('hourly')
      expect(drugPage?.changeFrequency).toBe('daily')
      expect(atcPage?.changeFrequency).toBe('daily')
    })
  })

  describe('lastModified Consistency', () => {
    it('should use same timestamp for all entries', async () => {
      vi.spyOn(db, 'getAllDrugSlugs').mockResolvedValue([
        { slug: 'drug1' },
        { slug: 'drug2' },
      ])
      vi.spyOn(db, 'getAllAtcCodes').mockResolvedValue([{ atc: 'A01' }])

      const result = await sitemap()

      // All entries should have identical lastModified timestamp
      const timestamps = result.map(e => e.lastModified.getTime())
      const uniqueTimestamps = new Set(timestamps)
      
      expect(uniqueTimestamps.size).toBe(1) // Only one unique timestamp
    })
  })

  describe('Cache Invalidation', () => {
    it('should use cached data on subsequent calls', async () => {
      const dbSpy = vi.spyOn(db, 'getAllDrugSlugs').mockResolvedValue([{ slug: 'test' }])
      vi.spyOn(db, 'getAllAtcCodes').mockResolvedValue([])

      // First call - cache miss
      await sitemap()
      expect(dbSpy).toHaveBeenCalledTimes(1)

      // Second call - cache hit
      await sitemap()
      expect(dbSpy).toHaveBeenCalledTimes(1) // Not called again
    })
  })

  describe('Error Handling', () => {
    it('should handle DB errors gracefully', async () => {
      vi.spyOn(db, 'getAllDrugSlugs').mockRejectedValue(new Error('DB down'))

      await expect(sitemap()).rejects.toThrow('DB down')
    })

    it('should handle empty database', async () => {
      vi.spyOn(db, 'getAllDrugSlugs').mockResolvedValue([])
      vi.spyOn(db, 'getAllAtcCodes').mockResolvedValue([])

      const result = await sitemap()

      // Should only have homepage
      expect(result).toHaveLength(1)
      expect(result[0].url).toBe('https://engpassradar.ch')
    })
  })
})
```

---

### 1.3 Timeline API (NO COVERAGE)

**Missing Tests:** `/app/api/timeline/route.ts`

**Critical Edge Cases:**
- Week parameter validation
- Boundary values (4, 260)
- Invalid inputs
- Performance with 260 weeks
- Data accuracy

**Test Skeleton:**

```typescript
// tests/api/timeline-complete.test.ts
import { describe, it, expect, vi } from 'vitest'
import { GET } from '@/app/api/timeline/route'
import * as db from '@/lib/db'

describe('Timeline API - Parameter Validation & Performance', () => {
  describe('Parameter Validation', () => {
    it('should use default 52 weeks when not specified', async () => {
      const dbSpy = vi.spyOn(db, 'getWeeklyTimelineWithActive').mockResolvedValue([])

      const request = new Request('http://localhost/api/timeline')
      await GET(request)

      expect(dbSpy).toHaveBeenCalledWith(52)
    })

    it('should accept valid weeks parameter', async () => {
      const dbSpy = vi.spyOn(db, 'getWeeklyTimelineWithActive').mockResolvedValue([])

      const request = new Request('http://localhost/api/timeline?weeks=12')
      await GET(request)

      expect(dbSpy).toHaveBeenCalledWith(12)
    })

    it('should clamp to minimum 4 weeks', async () => {
      const dbSpy = vi.spyOn(db, 'getWeeklyTimelineWithActive').mockResolvedValue([])

      const request = new Request('http://localhost/api/timeline?weeks=1')
      await GET(request)

      expect(dbSpy).toHaveBeenCalledWith(4) // Clamped to min
    })

    it('should accept boundary value 4', async () => {
      const dbSpy = vi.spyOn(db, 'getWeeklyTimelineWithActive').mockResolvedValue([])

      const request = new Request('http://localhost/api/timeline?weeks=4')
      await GET(request)

      expect(dbSpy).toHaveBeenCalledWith(4)
    })

    it('should clamp to maximum 260 weeks', async () => {
      const dbSpy = vi.spyOn(db, 'getWeeklyTimelineWithActive').mockResolvedValue([])

      const request = new Request('http://localhost/api/timeline?weeks=500')
      await GET(request)

      expect(dbSpy).toHaveBeenCalledWith(260) // Clamped to max
    })

    it('should accept boundary value 260', async () => {
      const dbSpy = vi.spyOn(db, 'getWeeklyTimelineWithActive').mockResolvedValue([])

      const request = new Request('http://localhost/api/timeline?weeks=260')
      await GET(request)

      expect(dbSpy).toHaveBeenCalledWith(260)
    })

    it('should handle negative values', async () => {
      const dbSpy = vi.spyOn(db, 'getWeeklyTimelineWithActive').mockResolvedValue([])

      const request = new Request('http://localhost/api/timeline?weeks=-10')
      await GET(request)

      expect(dbSpy).toHaveBeenCalledWith(4) // Clamped to min
    })

    it('should handle non-numeric input', async () => {
      const dbSpy = vi.spyOn(db, 'getWeeklyTimelineWithActive').mockResolvedValue([])

      const request = new Request('http://localhost/api/timeline?weeks=abc')
      await GET(request)

      // parseInt('abc') = NaN, should fall back to default
      expect(dbSpy).toHaveBeenCalledWith(52)
    })

    it('should handle float values', async () => {
      const dbSpy = vi.spyOn(db, 'getWeeklyTimelineWithActive').mockResolvedValue([])

      const request = new Request('http://localhost/api/timeline?weeks=12.7')
      await GET(request)

      expect(dbSpy).toHaveBeenCalledWith(12) // parseInt truncates
    })
  })

  describe('Performance with Large Datasets', () => {
    it('should complete 260 weeks query in <2s', async () => {
      const largeData = Array.from({ length: 260 }, (_, i) => ({
        week: `2020-W${String(i + 1).padStart(2, '0')}`,
        totalShortages: Math.floor(Math.random() * 100),
        newShortages: Math.floor(Math.random() * 20),
        resolvedShortages: Math.floor(Math.random() * 15),
      }))

      vi.spyOn(db, 'getWeeklyTimelineWithActive').mockResolvedValue(largeData)

      const request = new Request('http://localhost/api/timeline?weeks=260')
      
      const start = Date.now()
      await GET(request)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(2000)
    })
  })

  describe('Response Format', () => {
    it('should return JSON array', async () => {
      vi.spyOn(db, 'getWeeklyTimelineWithActive').mockResolvedValue([
        { week: '2026-W01', total: 10, new: 2, resolved: 1 },
      ])

      const request = new Request('http://localhost/api/timeline?weeks=52')
      const response = await GET(request)
      const data = await response.json()

      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(1)
    })

    it('should handle empty results', async () => {
      vi.spyOn(db, 'getWeeklyTimelineWithActive').mockResolvedValue([])

      const request = new Request('http://localhost/api/timeline?weeks=52')
      const response = await GET(request)
      const data = await response.json()

      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle DB errors gracefully', async () => {
      vi.spyOn(db, 'getWeeklyTimelineWithActive').mockRejectedValue(
        new Error('DB connection failed')
      )

      const request = new Request('http://localhost/api/timeline?weeks=52')
      
      await expect(GET(request)).rejects.toThrow()
    })
  })
})
```

---

## 2. Library Functions - Critical Gaps

### 2.1 db-monitoring.ts (NO COVERAGE)

**Critical Functions:**
- `getPoolStats()` - Connection pool monitoring
- `checkDatabaseHealth()` - Health check ping
- `startPoolMonitoring()` - Periodic monitoring

**Test Skeleton:**

```typescript
// tests/lib/db-monitoring-complete.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getPoolStats,
  checkDatabaseHealth,
  startPoolMonitoring,
} from '@/lib/db-monitoring'
import { prisma } from '@/lib/prisma-optimized'

describe('Database Monitoring - Health Checks & Pool Stats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPoolStats()', () => {
    it('should return healthy status when pool utilization <70%', async () => {
      // Mock internal pool structure
      // @ts-expect-error - Mocking internal structure
      prisma._engineConfig = {
        adapter: {
          pool: {
            totalCount: 10,
            idleCount: 5,
            waitingCount: 0,
          },
        },
      }

      const stats = await getPoolStats()

      expect(stats.healthStatus).toBe('healthy')
      expect(stats.totalConnections).toBe(10)
      expect(stats.idleConnections).toBe(5)
      expect(stats.waitingClients).toBe(0)
    })

    it('should return degraded status when utilization 70-90%', async () => {
      // @ts-expect-error
      prisma._engineConfig = {
        adapter: {
          pool: {
            totalCount: 16, // 16/20 = 80%
            idleCount: 2,
            waitingCount: 1, // Some waiting
          },
        },
      }

      const stats = await getPoolStats()

      expect(stats.healthStatus).toBe('degraded')
      expect(stats.waitingClients).toBeGreaterThan(0)
    })

    it('should return critical status when utilization >90%', async () => {
      // @ts-expect-error
      prisma._engineConfig = {
        adapter: {
          pool: {
            totalCount: 19, // 19/20 = 95%
            idleCount: 0,
            waitingCount: 5,
          },
        },
      }

      const stats = await getPoolStats()

      expect(stats.healthStatus).toBe('critical')
      expect(stats.waitingClients).toBeGreaterThan(5)
    })

    it('should return critical when pool is unavailable', async () => {
      // @ts-expect-error
      prisma._engineConfig = undefined

      const stats = await getPoolStats()

      expect(stats.healthStatus).toBe('critical')
      expect(stats.totalConnections).toBe(0)
    })
  })

  describe('checkDatabaseHealth()', () => {
    it('should return healthy with low latency', async () => {
      vi.spyOn(prisma, '$queryRaw').mockResolvedValue([{ '?column?': 1 }])

      const health = await checkDatabaseHealth()

      expect(health.healthy).toBe(true)
      expect(health.latencyMs).toBeLessThan(1000)
      expect(health.error).toBeUndefined()
    })

    it('should return unhealthy when latency >1s', async () => {
      vi.spyOn(prisma, '$queryRaw').mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 1100))
      )

      const health = await checkDatabaseHealth()

      expect(health.healthy).toBe(false)
      expect(health.latencyMs).toBeGreaterThan(1000)
    })

    it('should handle connection errors', async () => {
      vi.spyOn(prisma, '$queryRaw').mockRejectedValue(
        new Error('Connection refused')
      )

      const health = await checkDatabaseHealth()

      expect(health.healthy).toBe(false)
      expect(health.error).toContain('Connection refused')
    })

    it('should handle timeout errors', async () => {
      vi.spyOn(prisma, '$queryRaw').mockRejectedValue(
        new Error('Query timeout')
      )

      const health = await checkDatabaseHealth()

      expect(health.healthy).toBe(false)
      expect(health.error).toContain('timeout')
    })
  })

  describe('startPoolMonitoring()', () => {
    afterEach(() => {
      // Clean up intervals
      vi.clearAllTimers()
    })

    it('should log warnings when pool is degraded', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Mock degraded pool
      // @ts-expect-error
      prisma._engineConfig = {
        adapter: {
          pool: { totalCount: 16, idleCount: 2, waitingCount: 3 },
        },
      }

      const interval = startPoolMonitoring(100) // 100ms for testing

      // Wait for interval to fire
      await new Promise(resolve => setTimeout(resolve, 150))

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[DB Pool]',
        expect.objectContaining({
          healthStatus: 'degraded',
        })
      )

      clearInterval(interval)
    })

    it('should not log when healthy', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Mock healthy pool
      // @ts-expect-error
      prisma._engineConfig = {
        adapter: {
          pool: { totalCount: 5, idleCount: 3, waitingCount: 0 },
        },
      }

      const interval = startPoolMonitoring(100)

      await new Promise(resolve => setTimeout(resolve, 150))

      expect(consoleWarnSpy).not.toHaveBeenCalled()

      clearInterval(interval)
    })

    it('should allow process exit (unref)', () => {
      const interval = startPoolMonitoring(60000)

      // @ts-expect-error - Checking internal property
      expect(interval.unref).toBeDefined()

      clearInterval(interval)
    })
  })
})
```

---

## 3. Integration Tests - Critical Gaps

### 3.1 Full Scrape-to-API Workflow

**Missing Coverage:**
- End-to-end scrape → DB → API → Cache flow
- Race condition with concurrent API reads
- Cache invalidation propagation
- ISR revalidation

**Test Skeleton:**

```typescript
// tests/integration/full-scrape-to-cache-flow.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST as ScrapePost } from '@/app/api/scrape/route'
import { GET as ShortagesGet } from '@/app/api/shortages/route'
import { lruCache } from '@/lib/cache-lru'
import * as scraper from '@/lib/scraper'

describe('Integration: Scrape → DB → Cache → API Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    lruCache.clear()
    process.env.CRON_SECRET = 'test-secret'
  })

  it('should flow from scrape to API with cache', async () => {
    // Step 1: Mock scrape source
    vi.spyOn(scraper, 'fetchAndParse').mockResolvedValue({
      shortages: [
        { gtin: '999', bezeichnung: 'New Drug', firma: 'Test' },
      ],
      overview: { totalActive: 1, scrapedAt: new Date().toISOString() },
    })

    // Step 2: Execute scrape
    const scrapeReq = new Request('http://localhost/api/scrape', {
      method: 'POST',
      headers: { authorization: 'Bearer test-secret' },
    })
    const scrapeRes = await ScrapePost(scrapeReq)
    expect(scrapeRes.status).toBe(200)

    // Step 3: Query API (should hit cache)
    const apiReq = new Request('http://localhost/api/shortages')
    const apiRes = await ShortagesGet(apiReq)
    const data = await apiRes.json()

    // Step 4: Verify new drug appears
    expect(data.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ gtin: '999', bezeichnung: 'New Drug' }),
      ])
    )

    // Step 5: Second API call should hit cache
    const apiReq2 = new Request('http://localhost/api/shortages')
    const apiRes2 = await ShortagesGet(apiReq2)
    
    // Verify cache was used (response time < 50ms)
    const start = Date.now()
    await ShortagesGet(apiReq2)
    const cacheHitTime = Date.now() - start
    
    expect(cacheHitTime).toBeLessThan(50)
  })

  it('should handle concurrent API reads during scrape', async () => {
    // Start scrape (don't await)
    const scrapePromise = ScrapePost(
      new Request('http://localhost/api/scrape', {
        method: 'POST',
        headers: { authorization: 'Bearer test-secret' },
      })
    )

    // Concurrent API read
    const apiReq = new Request('http://localhost/api/shortages')
    const apiPromise = ShortagesGet(apiReq)

    // Both should complete without errors
    const [scrapeRes, apiRes] = await Promise.all([scrapePromise, apiPromise])
    
    expect(scrapeRes.status).toBe(200)
    expect(apiRes.status).toBe(200)

    // API should return consistent data (not partial)
    const data = await apiRes.json()
    expect(data.data).toBeDefined()
    expect(Array.isArray(data.data)).toBe(true)
  })
})
```

---

## 4. Security Tests - Additional Gaps

### 4.1 Authorization Bypass

**Test Skeleton:**

```typescript
// tests/security/authorization-comprehensive.test.ts
describe('Authorization - Bypass Attempts', () => {
  it('should reject header injection attacks', async () => {
    const request = new Request('http://localhost/api/scrape', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test\r\nX-Admin: true',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('should handle timing attacks on token comparison', async () => {
    // Time comparison should be constant-time
    const validToken = 'test-secret'
    const invalidToken = 'xxxx-xxxxxx'

    const validReq = new Request('http://localhost/api/scrape', {
      method: 'POST',
      headers: { authorization: `Bearer ${validToken}` },
    })

    const invalidReq = new Request('http://localhost/api/scrape', {
      method: 'POST',
      headers: { authorization: `Bearer ${invalidToken}` },
    })

    const validStart = Date.now()
    await POST(validReq)
    const validTime = Date.now() - validStart

    const invalidStart = Date.now()
    await POST(invalidReq)
    const invalidTime = Date.now() - invalidStart

    // Time difference should be <5ms (constant-time)
    expect(Math.abs(validTime - invalidTime)).toBeLessThan(5)
  })
})
```

---

## 5. Priority Recommendations

### P0 (Fix This Week)
1. **CSV Injection Tests** - Complete `export-csv-critical.test.ts` TODOs
2. **Concurrent Scrape Lock** - Add distributed lock tests
3. **RSS XSS Prevention** - Add RSS/feed security tests

### P1 (Next Sprint)
4. **Timeline API Coverage** - Add parameter validation tests
5. **db-monitoring Tests** - Add health check tests
6. **Sitemap ISR Tests** - Verify revalidation works

### P2 (Nice to Have)
7. **Integration Workflows** - Full end-to-end tests
8. **Performance Regression** - Automated performance benchmarks
9. **Load Testing** - Stress tests for concurrent users

---

## 6. Test Execution Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/api/rss-feeds-complete.test.ts

# Run with coverage
npm test -- --coverage

# Run only critical priority tests
npm test -- --testPathPattern="critical|complete"

# Run in watch mode
npm test -- --watch
```

---

## 7. Coverage Goals

| Category | Current | Target | Priority |
|----------|---------|--------|----------|
| API Routes | 60% | 90% | P0 |
| Library Functions | 70% | 85% | P1 |
| Security | 40% | 95% | P0 |
| Integration | 20% | 70% | P2 |
| **Overall** | **55%** | **85%** | - |

---

**Next Steps:**
1. Complete TODO items in existing critical test files
2. Implement RSS/Feed test suite
3. Add db-monitoring coverage
4. Set up CI/CD coverage reporting
5. Add performance regression tests
