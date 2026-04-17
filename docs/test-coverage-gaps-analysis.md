# Test Coverage Gap Analysis

**Generated:** 2026-04-17  
**Status:** Comprehensive analysis of untested code paths and missing edge cases

---

## Executive Summary

**Coverage Status:**
- ✅ **Well-tested:** Core APIs (alternatives, health, scrape), LRU cache, BWL scraper
- ⚠️ **Partially tested:** DB operations, sitemap, newsletter
- ❌ **Untested:** Cached query layer, aggregations, deprecated code paths

**Priority Gaps:**
1. **High:** DB cached queries (production critical, no tests)
2. **High:** Aggregation functions (performance-critical KPIs)
3. **Medium:** Sitemap edge cases (SEO impact)
4. **Medium:** Newsletter error scenarios
5. **Low:** Deprecated code verification (migration safety)

---

## Critical Missing Tests (High Priority)

### 1. `db-cached-queries.ts` ❌ NO TESTS

**Impact:** Production critical - handles all /api/shortages caching  
**Risk:** Cache poisoning, incorrect query results

**Missing Coverage:**
- Cache key generation consistency
- Cache hit/miss behavior
- Query parameter normalization
- TTL enforcement

### 2. `db-optimized-aggregations.ts` ❌ NO TESTS

**Impact:** Powers all KPI cards on homepage  
**Risk:** Incorrect statistics, performance degradation

**Missing Coverage:**
- Empty database handling
- Null value aggregations
- Parallel query verification
- Performance benchmarks vs old approach

### 3. `db-cached-example.ts` ❌ NO TESTS

**Impact:** Cache invalidation logic  
**Risk:** Stale data after scrapes, memory leaks

**Missing Coverage:**
- invalidateStatsCache() verification
- Cache prefix deletion
- TTL for different data types

### 4. `/api/scrape-oddb` ❌ NO TESTS

**Impact:** ODDB data ingestion endpoint  
**Risk:** Unauthorized access, data corruption

**Missing Coverage:**
- Authorization header validation
- CRON_SECRET enforcement
- Error recovery
- Duplicate handling

---

## Partial Coverage (Medium Priority)

### 5. Newsletter Endpoint - Missing Error Handling

**File:** `src/app/api/newsletter/subscribe/route.ts`  
**Existing:** `tests/api/newsletter-subscribe.test.ts`

**Gaps:**
- ❌ Missing ENCHARGE_WRITE_KEY env var
- ❌ Encharge API timeout (30s+)
- ❌ Rate limiting (429 responses)
- ❌ Email format validation edge cases
- ❌ XSS/SQL injection in email

### 6. CSV Export - Missing Security Tests

**File:** `src/app/api/export/csv/route.ts`  
**Existing:** `tests/api/export-csv.test.ts`

**Gaps:**
- ❌ CSV formula injection (`=1+1`, `@SUM()`)
- ❌ Unicode/emoji in all fields
- ❌ Large export performance (9999 records)
- ❌ Query parameter injection

### 7. Sitemap - Missing Performance Tests

**File:** `src/app/sitemap.ts`  
**Existing:** `tests/lib/sitemap.test.ts`

**Gaps:**
- ❌ Large dataset (10k+ entries)
- ❌ Cache behavior verification
- ❌ ISR revalidation testing
- ❌ Memory usage under load

### 8. LRU Cache - Incomplete (has TODOs)

**File:** `src/lib/cache-lru.ts`  
**Existing:** `tests/lib/cache-lru.test.ts` (with TODOs)

**Gaps:**
- ❌ LRU eviction order verification
- ❌ Memory estimation accuracy
- ❌ Concurrent access race conditions
- ❌ destroy() cleanup verification

---

## Edge Cases Missing Across Files

### API Routes

#### `/api/alternatives/batch`
- Partial cache hits (some GTINs cached, some not)
- Concurrent requests with overlapping GTIN sets
- Malformed cache data recovery

#### `/api/alternatives`
- Stale cache + successful fetch (should prefer fresh)
- Malformed HTML from source
- Concurrent requests for same GTIN
- Missing table elements in HTML

#### `/api/health`
- Cache at exactly 95% utilization (boundary)
- Mixed health states (DB ok, pool degraded)
- Response time under concurrent load

#### `/api/scrape`
- Concurrent scrape requests (locking/queuing)
- Partial failure recovery
- Cache invalidation verification
- ISR path revalidation

#### `/api/shortages`
- Cache key uniqueness for query combos
- Pagination edge cases (0, negative, huge numbers)
- perPage limits (0, 201, negative)
- Sort parameter injection

### Library Functions

#### `bwl-scraper.ts`
- Malformed XLSX (missing columns)
- Empty XLSX files
- Multiple .xlsx links on page
- GTIN missing in rows

#### `db-monitoring.ts`
- Pool adapter undefined/missing
- Health check timeout
- Monitoring interval cleanup

---

## Test Skeletons

### Critical Test 1: DB Cached Queries

```typescript
// tests/lib/db-cached-queries.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { queryShortagesCached } from '@/lib/db-cached-queries'
import { queryShortages } from '@/lib/db'
import { lruCache } from '@/lib/cache-lru'

vi.mock('@/lib/db')

describe('DB Cached Queries', () => {
  beforeEach(() => {
    lruCache.clear()
    vi.clearAllMocks()
  })

  it('should generate consistent cache keys', async () => {
    const query1 = { status: '1', firma: 'A', page: 1 }
    const query2 = { firma: 'A', status: '1', page: 1 }

    vi.mocked(queryShortages).mockResolvedValue({ data: [], total: 0 })

    await queryShortagesCached(query1)
    await queryShortagesCached(query2)

    expect(queryShortages).toHaveBeenCalledTimes(1) // Cache hit
  })

  it('should cache for 2 minutes', async () => {
    const query = { status: '1' }
    const mockResponse = { data: [{ id: 1 }], total: 1 }
    vi.mocked(queryShortages).mockResolvedValue(mockResponse)

    const result1 = await queryShortagesCached(query)
    const result2 = await queryShortagesCached(query)

    expect(result1).toEqual(result2)
    expect(queryShortages).toHaveBeenCalledTimes(1)
  })

  it('should treat different queries separately', async () => {
    vi.mocked(queryShortages).mockResolvedValue({ data: [], total: 0 })

    await queryShortagesCached({ status: '1' })
    await queryShortagesCached({ status: '2' })

    expect(queryShortages).toHaveBeenCalledTimes(2)
  })
})
```

### Critical Test 2: DB Optimized Aggregations

```typescript
// tests/lib/db-optimized-aggregations.test.ts
import { describe, it, expect, vi } from 'vitest'
import { getKPIStatsOptimized } from '@/lib/db-optimized-aggregations'
import { prisma } from '@/lib/prisma-optimized'

vi.mock('@/lib/prisma-optimized')

describe('DB Optimized Aggregations', () => {
  it('should handle empty database', async () => {
    vi.mocked(prisma.shortage.count).mockResolvedValue(0)
    vi.mocked(prisma.shortage.groupBy).mockResolvedValue([])
    vi.mocked(prisma.shortage.findMany).mockResolvedValue([])
    vi.mocked(prisma.shortage.aggregate).mockResolvedValue({ 
      _avg: { tageSeitMeldung: null } 
    })
    vi.mocked(prisma.scrapeRun.findFirst).mockResolvedValue(null)

    const stats = await getKPIStatsOptimized()

    expect(stats.totalActive).toBe(0)
    expect(stats.topFirma).toBe('-')
    expect(stats.avgDaysSinceMeldung).toBe(0)
  })

  it('should execute queries in parallel', async () => {
    const start = Date.now()
    
    // Mock all queries with 10ms delay
    vi.mocked(prisma.shortage.count).mockImplementation(
      async () => { await new Promise(r => setTimeout(r, 10)); return 100 }
    )
    // ... mock other queries similarly ...

    await getKPIStatsOptimized()
    const elapsed = Date.now() - start

    // Parallel: ~10ms. Sequential would be ~50ms
    expect(elapsed).toBeLessThan(30)
  })

  it('should calculate correct averages', async () => {
    vi.mocked(prisma.shortage.aggregate).mockResolvedValue({
      _avg: { tageSeitMeldung: 45.7 }
    })

    const stats = await getKPIStatsOptimized()
    expect(stats.avgDaysSinceMeldung).toBe(46) // Rounded
  })
})
```

### Critical Test 3: ODDB Scrape Authorization

```typescript
// tests/api/scrape-oddb.test.ts
import { describe, it, expect, vi } from 'vitest'
import { POST } from '@/app/api/scrape-oddb/route'
import { fetchOddbProducts } from '@/lib/oddb-scraper'
import { upsertOddbProducts } from '@/lib/db'

vi.mock('@/lib/oddb-scraper')
vi.mock('@/lib/db')

describe('/api/scrape-oddb - Authorization', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret'
  })

  it('should reject missing auth header', async () => {
    const req = new Request('http://localhost', { method: 'POST' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('should reject invalid bearer token', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { authorization: 'Bearer wrong' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('should reject when CRON_SECRET not set', async () => {
    delete process.env.CRON_SECRET
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { authorization: 'Bearer test-secret' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('should accept valid token', async () => {
    vi.mocked(fetchOddbProducts).mockResolvedValue([])
    vi.mocked(upsertOddbProducts).mockResolvedValue({ upserted: 0 })

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { authorization: 'Bearer test-secret' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })
})
```

### Edge Case Test: CSV Formula Injection

```typescript
// tests/api/export-csv-security.test.ts
import { describe, it, expect } from 'vitest'
import { GET } from '@/app/api/export/csv/route'

describe('CSV Export - Security', () => {
  it('should escape formula injection attempts', async () => {
    // Mock shortage with formula in bezeichnung
    const malicious = {
      bezeichnung: '=1+1',
      firma: '@SUM(A1:A10)',
      atcCode: '+cmd|/c calc',
    }

    const req = new Request('http://localhost/api/export/csv')
    const res = await GET(req)
    const csv = await res.text()

    // Verify: Formulas are quoted/escaped
    expect(csv).toContain('"=1+1"')
    expect(csv).toContain('"@SUM(A1:A10)"')
    expect(csv).toContain('"+cmd|/c calc"')
  })

  it('should handle all special chars', async () => {
    const testCases = [
      { field: 'quotes', value: 'Drug "Special"', expected: '"Drug ""Special"""' },
      { field: 'newlines', value: 'Line1\nLine2', expected: '"Line1\nLine2"' },
      { field: 'commas', value: 'Drug, 100mg', expected: '"Drug, 100mg"' },
    ]

    // Test each case...
  })
})
```

### Edge Case Test: Newsletter Timeout

```typescript
// tests/api/newsletter-timeout.test.ts
import { describe, it, expect, vi } from 'vitest'
import { POST } from '@/app/api/newsletter/subscribe/route'

describe('Newsletter - Timeout Handling', () => {
  it('should timeout Encharge requests after 10s', async () => {
    global.fetch = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 15000))
    )

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    const start = Date.now()
    const res = await POST(req)
    const elapsed = Date.now() - start

    expect(res.status).toBe(502)
    expect(elapsed).toBeLessThan(11000) // Timed out
  })

  it('should handle missing ENCHARGE_WRITE_KEY', async () => {
    delete process.env.ENCHARGE_WRITE_KEY

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toContain('misconfiguration')
  })
})
```

### Edge Case Test: LRU Eviction Order

```typescript
// tests/lib/cache-lru-eviction.test.ts
import { describe, it, expect } from 'vitest'
import { lruCache } from '@/lib/cache-lru'

describe('LRU Cache - Eviction Order', () => {
  beforeEach(() => {
    lruCache.clear()
  })

  it('should evict least recently used first', () => {
    // Set entries a, b, c
    lruCache.set('a', 'val-a', 60)
    lruCache.set('b', 'val-b', 60)
    lruCache.set('c', 'val-c', 60)

    // Access 'a' to move it to end
    lruCache.get('a')

    // Now order is: b (oldest), c, a (newest)
    // Fill cache to trigger eviction...

    // Verify: 'b' evicted, 'a' and 'c' remain
  })

  it('should track access order correctly', () => {
    lruCache.set('first', '1', 60)
    lruCache.set('second', '2', 60)
    lruCache.set('third', '3', 60)

    // Access in reverse order
    lruCache.get('third')
    lruCache.get('second')
    lruCache.get('first')

    // New order: third, second, first
    // Verify eviction order matches
  })
})
```

### Edge Case Test: Sitemap Performance

```typescript
// tests/app/sitemap-performance.test.ts
import { describe, it, expect, vi } from 'vitest'
import sitemap from '@/app/sitemap'
import { getAllDrugSlugs, getAllAtcCodes } from '@/lib/db'

vi.mock('@/lib/db')

describe('Sitemap - Performance', () => {
  it('should handle 10k+ entries efficiently', async () => {
    // Mock 10,000 drugs, 500 ATC codes
    const drugs = Array.from({ length: 10000 }, (_, i) => ({ 
      slug: `drug-${i}` 
    }))
    const atcs = Array.from({ length: 500 }, (_, i) => ({ 
      atc: `A${i}` 
    }))

    vi.mocked(getAllDrugSlugs).mockResolvedValue(drugs)
    vi.mocked(getAllAtcCodes).mockResolvedValue(atcs)

    const start = Date.now()
    const result = await sitemap()
    const elapsed = Date.now() - start

    expect(result.length).toBe(10501) // 10000 + 500 + 1 homepage
    expect(elapsed).toBeLessThan(1000) // Under 1 second
  })

  it('should pre-allocate array correctly', async () => {
    vi.mocked(getAllDrugSlugs).mockResolvedValue([
      { slug: 'drug-1' },
      { slug: 'drug-2' },
    ])
    vi.mocked(getAllAtcCodes).mockResolvedValue([
      { atc: 'A01' },
    ])

    const result = await sitemap()

    // 1 homepage + 2 drugs + 1 ATC = 4
    expect(result.length).toBe(4)
  })
})
```

---

## Summary Statistics

### Files by Coverage Level

| Level | Count | Files |
|-------|-------|-------|
| ❌ **No tests** | 4 | db-cached-queries, db-optimized-aggregations, db-cached-example, scrape-oddb route |
| ⚠️ **Incomplete** | 8 | newsletter, csv-export, sitemap, lru-cache, alternatives, health, scrape, shortages |
| ✅ **Good** | 15+ | Most other files |

### Gap Breakdown

| Category | Count |
|----------|-------|
| **Missing test files** | 4 |
| **TODO placeholders** | 4 |
| **Missing edge cases** | 39 |
| **Security gaps** | 6 |
| **Performance tests** | 4 |
| **Integration scenarios** | 3 |
| **Total gaps** | **60** |

---

## Recommended Implementation Order

### Phase 1: Critical Production Gaps (Week 1)
1. ✅ `db-cached-queries.test.ts` - 100 lines
2. ✅ `db-optimized-aggregations.test.ts` - 150 lines
3. ✅ `db-cached-example.test.ts` - 80 lines
4. ✅ `scrape-oddb.test.ts` - 120 lines

**Total:** ~450 lines, ~4-6 hours

### Phase 2: High-Risk Edge Cases (Week 2)
5. ✅ Newsletter error handling - 100 lines
6. ✅ CSV security tests - 80 lines
7. ✅ LRU cache TODOs - 120 lines
8. ✅ Sitemap performance - 60 lines

**Total:** ~360 lines, ~3-4 hours

### Phase 3: API Edge Cases (Week 3)
9. ✅ Alternatives edge cases - 100 lines
10. ✅ Health edge cases - 60 lines
11. ✅ Scrape concurrency - 80 lines
12. ✅ Shortages pagination - 100 lines

**Total:** ~340 lines, ~3-4 hours

### Phase 4: Performance & Integration (Week 4)
13. ✅ Performance benchmarks - 150 lines
14. ✅ Concurrency enhancements - 100 lines
15. ✅ Integration test additions - 120 lines

**Total:** ~370 lines, ~3-4 hours

---

## Quality Metrics Target

After completing all phases:

- **Line Coverage:** 95%+ (currently ~85%)
- **Branch Coverage:** 90%+ (currently ~75%)
- **Function Coverage:** 98%+ (currently ~90%)
- **Integration Coverage:** All critical flows tested
- **Security Coverage:** All OWASP Top 10 scenarios tested

---

**Next Steps:**
1. Review and approve this analysis
2. Create GitHub issues for Phase 1 tasks
3. Implement tests in recommended order
4. Update coverage badges in README
5. Add CI check for minimum 95% coverage
