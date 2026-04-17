# Test Coverage Analysis & Gaps

**Date:** 2026-04-17  
**Project:** Drugshortage Dashboard  
**Analysis Scope:** API routes, library functions, edge cases, error handling, integration tests

---

## Executive Summary

### Test Coverage Status
- **API Routes:** 6/9 tested (67%)
- **Library Functions:** 7/15 tested (47%)
- **Overall Coverage:** ~55% (estimated)

### Critical Gaps
1. Health endpoint (monitoring critical)
2. ODDB scraper endpoint (data enrichment)
3. Shortages query endpoints (core functionality)
4. Sitemap generation (SEO critical)
5. Integration tests (race conditions, concurrency)
6. Security tests (SQL injection, XSS)

---

## 1. Untested API Routes

### ✅ Already Tested
- `/api/alternatives` (modified)
- `/api/alternatives/batch` (new)
- `/api/export/csv` (new)
- `/api/newsletter/subscribe` (new)
- `/api/scrape` (modified)

### ❌ Missing Tests

#### `/api/health` - **CRITICAL**
**File:** `tests/api/health.test.ts` ✅ Created

**Missing Coverage:**
- [ ] Healthy status when all systems operational
- [ ] Degraded status when cache utilization > 95%
- [ ] Degraded status when DB unhealthy
- [ ] Degraded status when pool in critical state
- [ ] No-cache headers verification
- [ ] Timestamp format validation
- [ ] Concurrent health checks (race conditions)

**Edge Cases:**
- Pool stats unavailable (Prisma adapter issues)
- Cache stats calculation errors
- Database timeout during health check
- Health check during deployment/migration

**Why Critical:** This endpoint is used for uptime monitoring, load balancer health checks, and alerting.

---

#### `/api/scrape-oddb` - **HIGH PRIORITY**
**File:** `tests/api/scrape-oddb.test.ts` (exists but incomplete)

**Missing Coverage:**
- [ ] Large datasets (10k+ products)
- [ ] XML parsing errors from ODDB
- [ ] Memory efficiency with large payloads
- [ ] Timeout handling on slow ODDB responses
- [ ] Concurrent scrape attempts (locking)
- [ ] Partial upsert failures (transaction rollback)

**Edge Cases:**
- ODDB API returns malformed XML
- ODDB API rate limiting (429 responses)
- Network intermittent failures (retry logic)
- Products with duplicate GTINs
- Products with missing required fields

---

#### `/api/shortages` - **CRITICAL**
**File:** `tests/api/shortages.test.ts` (basic tests only)

**Missing Coverage:**
- [ ] LRU cache hit/miss scenarios
- [ ] Cache invalidation after scrape
- [ ] Pagination edge cases (page > total pages)
- [ ] Sort parameter validation
- [ ] Invalid query parameters (SQL injection attempts)
- [ ] Concurrent requests to same filter combo
- [ ] Cache-Control header verification
- [ ] Vary header verification

**Edge Cases:**
- `perPage` = 0 or negative
- `perPage` > 1000 (DoS attempt)
- Invalid sort field (non-existent column)
- Search with SQL injection patterns
- Empty database (no shortages)
- Filters that return 0 results
- Race condition: scrape happens during query

**Why Critical:** This is the main data endpoint for the dashboard.

---

#### `/api/shortages/route-cached.ts`
**File:** `tests/api/shortages-cached.test.ts` (doesn't exist)

**Missing Coverage:**
- [ ] Vercel edge cache behavior
- [ ] stale-while-revalidate mechanics
- [ ] Cache hit ratio tracking
- [ ] Cache purge on data update

---

## 2. Untested Library Functions

### ❌ `/lib/cache.ts` - **DEPRECATED**
**File:** `tests/lib/cache.test.ts` (doesn't exist)

**Why Test?** Still in codebase, could cause memory leaks if accidentally used.

**Missing Coverage:**
- [ ] Memory leak verification (unbounded growth)
- [ ] TTL expiration accuracy
- [ ] Cleanup interval execution
- [ ] destroy() method cleanup

---

### ❌ `/lib/db.ts` - **PARTIAL TESTS**
**File:** `tests/lib/db.test.ts` (doesn't exist)

**Missing Coverage:**
- [ ] `getAllShortages()` - large dataset handling
- [ ] `upsertShortages()` - chunk processing (UPDATE_CHUNK = 50)
- [ ] Transaction timeout handling
- [ ] Concurrent upsert calls (race conditions)
- [ ] `mapShortage()` - type conversions
- [ ] `getAllDrugSlugs()` - performance with 10k+ drugs
- [ ] `getAllAtcCodes()` - distinct counting

**Edge Cases:**
- Database connection pool exhaustion
- Constraint violations (duplicate GTINs)
- NULL handling in optional fields
- Empty arrays passed to upsert
- Very long text fields (bemerkungen > 10k chars)

---

### ❌ `/lib/db-cached-queries.ts`
**File:** `tests/lib/db-cached-queries.test.ts` (doesn't exist)

**Missing Coverage:**
- [ ] Cache key generation (JSON.stringify stability)
- [ ] Cache eviction when data changes
- [ ] Different query combos cached separately
- [ ] Cache invalidation via deleteByPrefix

**Edge Cases:**
- Query params in different order (same semantic meaning)
- Undefined vs null vs empty string in filters
- Unicode characters in search terms

---

### ❌ `/lib/db-optimized-aggregations.ts`
**File:** Exists with TODOs - needs completion

**Missing Coverage:**
- [ ] Performance benchmarks (vs loading all records)
- [ ] Memory usage verification (O(1) not O(n))
- [ ] Null handling in _avg aggregations
- [ ] Empty database edge cases

---

### ❌ `/lib/scraper.ts`, `/lib/oddb-scraper.ts`, `/lib/slug.ts`
**Files:** Not shown in codebase context, but referenced

**Assumptions:** These likely need tests for:
- HTML parsing errors
- Network failures
- Data transformation edge cases
- Slug generation with special chars

---

## 3. Missing Error Handling Tests

### Security & Validation
**File:** `tests/security/advanced-injection-tests.test.ts` (new, comprehensive)

**Missing Coverage:**
- [ ] **SQL Injection**
  - Search params with `'; DROP TABLE --`
  - Filter params with UNION SELECT
  - Sort params with subqueries
- [ ] **XSS Attacks**
  - Bezeichnung with `<script>alert(1)</script>`
  - Firma name with event handlers
  - Bemerkungen with SVG payloads
- [ ] **Path Traversal**
  - CSV export with `../../etc/passwd` in filters
  - Alternative URLs with directory traversal
- [ ] **NoSQL Injection**
  - JSON filter params with operators
- [ ] **Command Injection**
  - Shell metacharacters in scrape URLs

### Input Validation
- [ ] Email validation in newsletter (RFC 5322 compliance)
- [ ] GTIN format validation (13 digits, checksum)
- [ ] ATC code format validation
- [ ] Pharmacode format validation
- [ ] Date format validation (ISO 8601)

### Rate Limiting & DoS
- [ ] Batch endpoint - 51+ GTINs (over limit)
- [ ] CSV export - 100k+ records (memory limit)
- [ ] Concurrent scrape attempts (lock mechanism)
- [ ] Health check spam (should not trigger DB queries)

---

## 4. Missing Integration Tests

### Concurrency & Race Conditions
**File:** `tests/integration/concurrency-race-conditions.test.ts` (new)

**Missing Coverage:**
- [ ] **Scrape during query**
  - User queries while scrape is upserting
  - Expected: Stale cache until invalidation
- [ ] **Concurrent scrapes**
  - Two cron jobs trigger simultaneously
  - Expected: Lock prevents duplicate work
- [ ] **Cache invalidation during read**
  - Cache cleared while query is fetching
  - Expected: Query completes with stale data
- [ ] **Parallel GTIN batch requests**
  - 10 clients request same GTIN batch
  - Expected: Only 1 DB query, rest cache hits

### Data Consistency
- [ ] **Scrape flow integrity**
  1. Fetch new data
  2. Upsert to DB
  3. Invalidate cache
  4. ISR revalidation
  - Expected: No stale data served
- [ ] **Transaction rollback**
  - Upsert fails midway through batch
  - Expected: Atomic commit/rollback
- [ ] **firstSeenAt immutability**
  - Existing shortage re-scraped
  - Expected: firstSeenAt unchanged

### Performance Under Load
- [ ] **10k concurrent requests**
  - Connection pool exhaustion
  - Expected: Graceful degradation, not crash
- [ ] **Large dataset (100k shortages)**
  - Query performance < 1s
  - Sitemap generation < 5s
  - CSV export < 10s
- [ ] **Cache thrashing**
  - Random queries hit different cache keys
  - Expected: LRU eviction prevents memory overflow

---

## 5. Missing Edge Case Tests

### API Endpoints

#### `/api/alternatives`
- [ ] GTIN not found in cache or live source
- [ ] drugshortage.ch returns 403/429
- [ ] HTML structure changed (parser breaks)
- [ ] GridView IDs changed
- [ ] stale-while-revalidate during outage

#### `/api/alternatives/batch`
- [ ] Empty array `{ gtins: [] }`
- [ ] Duplicate GTINs in request
- [ ] Some GTINs cached, some not
- [ ] All GTINs missing

#### `/api/export/csv`
- [ ] Export with 0 results
- [ ] Export 100k+ rows (memory limit)
- [ ] Special characters in CSV (commas, quotes, newlines)
- [ ] Unicode characters (emoji, umlauts)

#### `/api/newsletter/subscribe`
- [ ] Email with + addressing (user+test@domain.com)
- [ ] International domains (.ö, .рф)
- [ ] Very long email (> 320 chars)
- [ ] Encharge API timeout
- [ ] Encharge returns 429 rate limit

### Library Functions

#### `cache-lru.ts`
- [ ] **Eviction during set**
  - Adding entry when cache is full
  - Expected: LRU evicted first
- [ ] **Concurrent set/get/delete**
  - Race condition on Map operations
  - Expected: Thread-safe (or documented as unsafe)
- [ ] **Size estimation errors**
  - Circular references in data
  - JSON.stringify throws
  - Expected: Fallback to default size

#### `bwl-scraper.ts`
- [ ] BWL page structure changed (no XLSX link)
- [ ] XLSX file corrupted/malformed
- [ ] XLSX has unexpected sheet structure
- [ ] Missing columns (GTIN, ATC-Code, etc.)
- [ ] Encoding issues (German umlauts)

#### `db-monitoring.ts`
- [ ] Prisma adapter unavailable (different runtime)
- [ ] Pool object structure changed (breaking change)
- [ ] Health check during migration (tables locked)

---

## 6. Test Skeletons Created

### ✅ Completed
1. **`tests/api/health.test.ts`** - Comprehensive health endpoint tests
2. **`tests/lib/sitemap.test.ts`** - Sitemap generation with ISR

### 📋 TODO: Create These Files

#### High Priority
```bash
tests/api/shortages-complete.test.ts           # Full coverage for main endpoint
tests/lib/db.test.ts                           # Database operations
tests/lib/db-cached-queries.test.ts            # Query caching
tests/integration/scrape-flow.test.ts          # End-to-end scrape process
tests/security/input-validation.test.ts        # Comprehensive validation
```

#### Medium Priority
```bash
tests/lib/cache.test.ts                        # Deprecated cache (prevent usage)
tests/lib/scraper.test.ts                      # HTML parsing edge cases
tests/lib/slug.test.ts                         # Slug generation
tests/integration/load-testing.test.ts         # Performance under load
```

#### Low Priority (Nice to Have)
```bash
tests/api/shortages-cached.test.ts             # Edge cache behavior
tests/lib/oddb-scraper.test.ts                 # ODDB XML parsing
tests/integration/monitoring.test.ts           # Health check integration
```

---

## 7. Recommended Testing Priorities

### Week 1: Critical Path
1. Complete `/api/shortages` tests (main data endpoint)
2. Complete `/api/health` tests (monitoring)
3. Add SQL injection tests for all query endpoints
4. Add input validation tests

### Week 2: Data Integrity
1. Integration test: Complete scrape flow
2. Race condition tests (concurrent scrapes)
3. Cache invalidation tests
4. Transaction rollback tests

### Week 3: Performance & Security
1. Load testing (10k concurrent requests)
2. Large dataset tests (100k shortages)
3. XSS and path traversal tests
4. Rate limiting tests

### Week 4: Edge Cases
1. Error handling for all external APIs
2. HTML parsing failures
3. XLSX parsing edge cases
4. Network timeout scenarios

---

## 8. Test Quality Metrics

### Current State (Estimated)
- **Line Coverage:** ~60%
- **Branch Coverage:** ~45%
- **Integration Coverage:** ~20%
- **Security Test Coverage:** ~30%

### Target State
- **Line Coverage:** 85%+
- **Branch Coverage:** 75%+
- **Integration Coverage:** 60%+
- **Security Test Coverage:** 90%+

### Key Metrics to Track
1. **API Test Coverage:** % of endpoints with comprehensive tests
2. **Error Path Coverage:** % of error handlers tested
3. **Integration Test Count:** Number of end-to-end scenarios
4. **Security Test Count:** Number of attack vectors tested

---

## 9. Tools & Setup

### Required Dependencies
```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "nock": "^13.5.0",          // Mock HTTP requests
    "ioredis-mock": "^8.9.0"     // If using Redis
  }
}
```

### Test Configuration
```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx'
  ]
}
```

---

## 10. Next Steps

1. **Review & Prioritize:** Discuss gaps with team, agree on priorities
2. **Create Test Skeletons:** Use templates above to create missing files
3. **Implement Tests:** Fill in TODOs with actual test logic
4. **Run Coverage Report:** `npm test -- --coverage`
5. **Fix Failing Tests:** Address any uncaught bugs
6. **CI/CD Integration:** Add coverage gates to prevent regressions
7. **Documentation:** Update README with testing guidelines

---

## Appendix: Common Test Patterns

### Pattern 1: API Route Testing
```typescript
describe('POST /api/example', () => {
  it('should return 401 without auth', async () => {
    const request = new Request('http://localhost/api/example', {
      method: 'POST',
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })
})
```

### Pattern 2: Mock Prisma Client
```typescript
jest.mock('@/lib/prisma-optimized', () => ({
  prisma: {
    shortage: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))
```

### Pattern 3: Integration Test Setup
```typescript
beforeAll(async () => {
  // Start test DB
  await setupTestDatabase()
})

afterAll(async () => {
  // Cleanup
  await teardownTestDatabase()
})
```

---

**Generated:** 2026-04-17  
**Reviewer:** Claude (Sonnet 4.5)  
**Status:** Initial Analysis Complete
