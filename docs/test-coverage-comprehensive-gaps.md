# Comprehensive Test Coverage Gap Analysis

## 1. Untested API Routes

### 1.1 `/api/scrape-oddb/route.ts` ❌ CRITICAL
**Status:** No test file exists  
**Risk:** High - handles external data ingestion, database writes

**Missing Coverage:**
- Authorization validation
- XLSX download failures
- Malformed XLSX data
- Price fetch failures (marked non-fatal)
- Database upsert errors
- Concurrent scrape requests

**Test Skeleton:** `tests/api/scrape-oddb.test.ts`

---

### 1.2 `/api/timeline/route.ts` ❌ HIGH
**Status:** No test file exists  
**Risk:** Medium - data aggregation endpoint

**Missing Coverage:**
- Week parameter validation (min/max bounds)
- Invalid week values (negative, non-numeric)
- Empty database scenarios
- Cache behavior
- Large dataset performance

**Test Skeleton:** `tests/api/timeline.test.ts`

---

### 1.3 `/api/v1/shortages/route.ts` ❌ HIGH
**Status:** No test file exists  
**Risk:** High - public API endpoint, potential abuse vector

**Missing Coverage:**
- Sort field injection
- Invalid sort values
- CORS header validation
- Rate limiting
- Query parameter injection
- Pagination edge cases (page=0, negative, huge numbers)

**Test Skeleton:** `tests/api/v1-shortages.test.ts`

---

### 1.4 `/app/rss.xml/route.ts` ❌ MEDIUM
**Status:** No test file exists  
**Risk:** Medium - XML injection, malformed data

**Missing Coverage:**
- XML escaping for special characters
- Large dataset (500 items)
- Empty database
- Malformed data in shortage records
- Feed validation (XML structure)

**Test Skeleton:** `tests/api/rss-feed.test.ts`

---

### 1.5 `/app/wirkstoff/[atc]/feed.xml/route.ts` ❌ MEDIUM
**Status:** No test file exists  
**Risk:** Medium - same as RSS feed

**Missing Coverage:**
- ATC code validation
- SQL injection in ATC parameter
- Empty results for ATC code
- XML structure validation

**Test Skeleton:** `tests/api/atc-feed.test.ts`

---

## 2. Untested Library Files

### 2.1 `lib/db-cached-example.ts` ❌ HIGH
**Status:** No test file exists  
**Risk:** High - caching logic affects performance and data freshness

**Missing Coverage:**
- Cache hit/miss scenarios
- Cache invalidation timing
- Concurrent cache access
- Memory pressure scenarios
- Stale data return conditions

**Test Skeleton:** `tests/lib/db-cached-example.test.ts`

---

### 2.2 `lib/db-cached-queries.ts` ❌ HIGH
**Status:** No test file exists  
**Risk:** High - query result caching

**Missing Coverage:**
- Cache key generation stability
- Cache key collisions
- Different query parameter combinations
- TTL expiration behavior
- Cache invalidation on data changes

**Test Skeleton:** `tests/lib/db-cached-queries.test.ts`

---

### 2.3 `lib/cache.ts` ⚠️ LOW
**Status:** Deprecated but no test  
**Risk:** Low - marked for removal

**Recommendation:** Remove file instead of testing (use cache-lru.ts)

---

## 3. Edge Cases in Tested Files

### 3.1 `/api/alternatives/batch/route.ts`
**Existing Tests:** ✅ Basic functionality covered  
**Missing Edge Cases:**

```typescript
// Missing: Empty array handling
POST /api/alternatives/batch
{ gtins: [] }
// Expected: 400 error

// Missing: Duplicate GTINs
POST /api/alternatives/batch
{ gtins: ["123", "123", "456"] }
// Expected: Deduplicated or processed as-is?

// Missing: Non-string GTINs
POST /api/alternatives/batch
{ gtins: [123, null, undefined] }
// Expected: Validation error

// Missing: Boundary test (exactly 50 GTINs)
POST /api/alternatives/batch
{ gtins: [/* 50 items */] }
// Expected: Success

// Missing: Malformed JSON
POST /api/alternatives/batch
Body: "invalid json"
// Expected: 400 error
```

---

### 3.2 `/api/alternatives/route.ts`
**Existing Tests:** ✅ Basic functionality covered  
**Missing Edge Cases:**

```typescript
// Missing: GTIN with special characters
GET /api/alternatives?gtin=7680<script>alert(1)</script>
// Expected: Safe handling

// Missing: Cache expiration edge case (exactly at 24h boundary)
// Expected: Fresh fetch triggered

// Missing: Stale cache fallback when fetch fails
// Expected: Return stale data with 5-min cache header

// Missing: HTML parsing failure (malformed HTML from source)
// Expected: Graceful error, return cached if available

// Missing: Empty grids in response
// Expected: Empty arrays, not null
```

---

### 3.3 `/api/export/csv/route.ts`
**Existing Tests:** ✅ Basic functionality covered  
**Missing Edge Cases:**

```typescript
// Missing: CSV injection test
// Data: =1+1, @SUM(A1:A10), +cmd|'/c calc'
// Expected: Values escaped/prefixed with '

// Missing: Unicode characters (emoji, umlauts)
// Data: "Paracétamol 500mg 💊"
// Expected: UTF-8 BOM, proper encoding

// Missing: Very long field values (>1000 chars)
// Expected: Proper escaping, no truncation

// Missing: Empty result set
// Expected: Header only

// Missing: Large dataset (10k+ rows)
// Expected: Streaming response, no memory overflow
```

---

### 3.4 `/api/health/route.ts`
**Existing Tests:** ✅ Basic functionality covered  
**Missing Edge Cases:**

```typescript
// Missing: Partial failure (DB healthy, pool critical)
// Expected: 503 status, detailed breakdown

// Missing: Concurrent health checks
// Expected: No race conditions, accurate stats

// Missing: Cache stats during eviction
// Expected: Accurate utilization percentage

// Missing: Pool exhaustion scenario
// Expected: healthStatus: 'critical'

// Missing: Database timeout
// Expected: healthy: false, latencyMs > 1000
```

---

### 3.5 `/api/newsletter/subscribe/route.ts`
**Existing Tests:** ✅ Basic functionality covered  
**Missing Edge Cases:**

```typescript
// Missing: Duplicate subscription
// Expected: Idempotent (no error)

// Missing: SQL injection in email
// Data: "test@example.com' OR '1'='1"
// Expected: Safe handling

// Missing: Extremely long email (>500 chars)
// Expected: Validation error

// Missing: Encharge API timeout
// Expected: 502 error, proper logging

// Missing: Encharge rate limit response
// Expected: Retry logic or graceful error
```

---

### 3.6 `/api/scrape/route.ts`
**Existing Tests:** ✅ Basic functionality covered  
**Missing Edge Cases:**

```typescript
// Missing: Partial failure (main scrape succeeds, BWL fails)
// Expected: Success response, log BWL failure

// Missing: Concurrent scrape requests
// Expected: Lock mechanism or idempotent behavior

// Missing: Cache invalidation failure
// Expected: Log error, scrape still succeeds

// Missing: Database transaction rollback
// Expected: Atomic upsert or consistent state

// Missing: revalidatePath failure
// Expected: Non-fatal, log warning
```

---

### 3.7 `/app/sitemap.ts`
**Existing Tests:** ⚠️ Partial coverage  
**Missing Edge Cases:**

```typescript
// Missing: Empty database (no drugs, no ATC codes)
// Expected: Only homepage URL

// Missing: Large dataset (>50k URLs)
// Expected: Performance < 5s, no memory overflow

// Missing: Cache behavior (1h TTL)
// Expected: Subsequent calls use cache

// Missing: ISR revalidation
// Expected: Regenerates after 24h

// Missing: Duplicate slugs/ATC codes
// Expected: Deduplicated URLs
```

---

## 4. Integration Test Gaps

### 4.1 End-to-End Scrape Flow ❌ CRITICAL
**Missing Coverage:**

```typescript
// Test: Scrape → Cache Invalidation → API Response
// 1. Trigger scrape
// 2. Verify cache cleared
// 3. Query API
// 4. Verify fresh data returned
```

**Test Skeleton:** `tests/integration/scrape-to-api-flow.test.ts`

---

### 4.2 Concurrent API Load ❌ HIGH
**Missing Coverage:**

```typescript
// Test: 100 concurrent requests to /api/shortages
// Verify: No connection pool exhaustion
// Verify: Cache hit rate > 80%
// Verify: All responses valid
```

**Test Skeleton:** `tests/integration/concurrent-api-load.test.ts`

---

### 4.3 Cache Eviction Under Pressure ❌ HIGH
**Missing Coverage:**

```typescript
// Test: Fill cache to 100MB limit
// Verify: LRU eviction works correctly
// Verify: Most-used entries remain
// Verify: No memory overflow
```

**Test Skeleton:** `tests/integration/cache-memory-pressure.test.ts`

---

### 4.4 RSS Feed Generation at Scale ❌ MEDIUM
**Missing Coverage:**

```typescript
// Test: Generate RSS with 10k+ items
// Verify: Valid XML structure
// Verify: Response time < 2s
// Verify: No memory leaks
```

**Test Skeleton:** `tests/integration/rss-feed-scale.test.ts`

---

### 4.5 Multi-User Filter Scenarios ❌ MEDIUM
**Missing Coverage:**

```typescript
// Test: 10 users with different filters simultaneously
// Verify: Correct cache keys
// Verify: No cache pollution
// Verify: Each gets correct filtered results
```

**Test Skeleton:** `tests/integration/multi-user-filtering.test.ts`

---

## 5. Security Test Gaps

### 5.1 SQL Injection in Query Parameters ❌ CRITICAL
**Missing Coverage:**

```typescript
// Test all query parameters:
// - status: "1 OR 1=1"
// - firma: "'; DROP TABLE shortage; --"
// - atc: "A01' UNION SELECT * FROM users--"
// - sort: "tageSeitMeldung; DROP TABLE--"
// Expected: Safe handling, no SQL execution
```

**Test Skeleton:** `tests/security/sql-injection-comprehensive.test.ts`

---

### 5.2 Path Traversal in Slug Parameters ❌ HIGH
**Missing Coverage:**

```typescript
// Test: /medikament/../../etc/passwd
// Test: /wirkstoff/../../../secret
// Expected: 404 or safe handling
```

**Test Skeleton:** `tests/security/path-traversal.test.ts`

---

### 5.3 XSS in CSV Export ❌ HIGH
**Missing Coverage:**

```typescript
// Test: Shortage with name: <script>alert(1)</script>
// Expected: Escaped in CSV output
// Test: Formula injection: =1+1
// Expected: Prefixed with ' to disable Excel execution
```

**Test Skeleton:** `tests/security/csv-xss-injection.test.ts`

---

### 5.4 XML Injection in RSS Feeds ❌ HIGH
**Missing Coverage:**

```typescript
// Test: Shortage with name: ]]></description><script>alert(1)</script>
// Expected: Proper XML escaping
// Test: CDATA injection
// Expected: No CDATA break-out
```

**Test Skeleton:** `tests/security/rss-xml-injection.test.ts`

---

### 5.5 Authorization Bypass ❌ CRITICAL
**Missing Coverage:**

```typescript
// Test: POST /api/scrape without Bearer token
// Test: POST /api/scrape with invalid token
// Test: POST /api/scrape with token in query string
// Expected: All return 401
```

**Test Skeleton:** `tests/security/authorization-bypass.test.ts`

---

### 5.6 Rate Limiting ❌ CRITICAL
**Missing Coverage:**

```typescript
// Test: 1000 requests to /api/newsletter/subscribe from same IP
// Expected: Rate limit after N requests
// Test: 100 concurrent scrapes
// Expected: Throttling or locking
```

**Test Skeleton:** `tests/security/rate-limiting.test.ts`

---

### 5.7 SSRF in Scraper URLs ❌ HIGH
**Missing Coverage:**

```typescript
// Test: Scraper fetches localhost URLs
// Test: Scraper fetches internal network (192.168.x.x)
// Test: Redirect to internal service
// Expected: Blocked or timeout
```

**Test Skeleton:** `tests/security/ssrf-scraper.test.ts`

---

## 6. Error Handling Test Gaps

### 6.1 Database Connection Failures
**Missing in all API routes:**

```typescript
// Test: Database connection lost mid-request
// Expected: 500 error, proper cleanup, connection pool recovery
```

---

### 6.2 External Service Timeouts
**Missing in scrapers:**

```typescript
// Test: drugshortage.ch takes >30s to respond
// Test: BWL XLSX download stalls
// Expected: Timeout, graceful fallback
```

---

### 6.3 Malformed External Data
**Missing in all scrapers:**

```typescript
// Test: HTML structure changed (missing GridView IDs)
// Test: XLSX missing required columns
// Test: Date fields in unexpected format
// Expected: Graceful error, alert/log, no crash
```

---

## 7. Performance Test Gaps

### 7.1 Query Performance Under Load
```typescript
// Test: /api/shortages with 100k records in DB
// Expected: Response time < 500ms with pagination
```

---

### 7.2 Cache Effectiveness
```typescript
// Test: Cache hit rate over 1000 requests
// Expected: >90% cache hits for repeated queries
```

---

### 7.3 Memory Leak Detection
```typescript
// Test: Run scraper 100 times
// Verify: Memory usage returns to baseline
// Verify: No dangling timers/intervals
```

---

## Summary Statistics

| Category | Total Files/Endpoints | Tested | Untested | Coverage % |
|----------|----------------------|--------|----------|------------|
| API Routes | 13 | 8 | 5 | 62% |
| Library Files | 6 | 3 | 3 | 50% |
| Edge Cases | ~150 scenarios | ~60 | ~90 | 40% |
| Integration Tests | 8 critical flows | 1 | 7 | 12% |
| Security Tests | 10 attack vectors | 1 | 9 | 10% |

**Overall Test Coverage Estimate:** ~45%

## Priority Recommendations

### P0 (Critical - Implement This Week)
1. SQL injection tests for all query parameters
2. Authorization bypass tests for protected endpoints
3. `/api/scrape-oddb/route.ts` complete test suite
4. End-to-end scrape → cache → API flow test
5. Rate limiting tests

### P1 (High - Implement Next Week)
1. `/api/v1/shortages/route.ts` complete test suite
2. `lib/db-cached-queries.ts` test suite
3. `lib/db-cached-example.ts` test suite
4. CSV XSS/injection tests
5. Concurrent API load tests

### P2 (Medium - Implement Next Sprint)
1. RSS feed test suites (both endpoints)
2. `/api/timeline/route.ts` test suite
3. Cache eviction under pressure tests
4. SSRF scraper tests
5. Multi-user filtering tests

### P3 (Low - Technical Debt)
1. Remove `lib/cache.ts` (deprecated)
2. Performance regression tests
3. Memory leak detection tests
4. Sitemap edge cases
5. Error recovery integration tests
