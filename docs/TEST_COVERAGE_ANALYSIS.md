# Test Coverage Analysis & Gaps

**Date:** 2026-04-17  
**Total Test Files:** 60  
**Identified TODOs:** ~1000  
**Critical Priority:** 24 test scenarios

---

## Executive Summary

The codebase has extensive test scaffolding but approximately 1000 incomplete test cases marked with TODO. This analysis identifies the highest-priority gaps across API routes, library functions, security, and integration tests.

## Critical Gaps by Category

### 1. API Route Testing (Priority: HIGH)

#### `/api/alternatives/batch` - Missing 8 tests
- ✅ Has: Basic input validation
- ❌ Missing:
  - Batch size limit enforcement (edge case: exactly 50, 51 GTINs)
  - Order preservation verification
  - Cache hit ratio testing
  - Concurrent batch request handling
  - Mixed cache hit/miss scenarios
  - DB connection pool exhaustion handling
  - Response time under load (50 GTINs)
  - Empty cache bulk query performance

#### `/api/alternatives` - Missing 12 tests
- ✅ Has: Basic gtin validation
- ❌ Missing:
  - Stale cache fallback when fetch fails
  - TTL boundary testing (23h59m vs 24h01m)
  - HTML parsing failures (malformed tables)
  - Cheerio selector edge cases
  - Concurrent fetch + cache write race conditions
  - Cache poisoning scenarios
  - Network timeout handling
  - Retry logic validation
  - Rate limiting from upstream
  - Memory leak prevention on large responses
  - Character encoding issues (UTF-8 vs ISO-8859-1)
  - drugshortage.ch format changes detection

#### `/api/scrape` - Missing 15 tests
- ✅ Has: Authorization check
- ❌ Missing:
  - Concurrent scrape prevention
  - Partial failure recovery (main succeeds, historical fails)
  - Cache invalidation verification
  - Transaction rollback on DB failure
  - Race condition with API reads during scrape
  - Memory spike monitoring during large scrapes
  - Historical data fetch failures (non-fatal)
  - BWL data fetch failures (non-fatal)
  - Off-market data fetch failures (non-fatal)
  - Erlöschen sync failures (non-fatal)
  - All 4 parallel operations complete with 1 failure
  - ScrapeRun record creation
  - ISR cache revalidation trigger
  - Episode tracking during scrape
  - Overview stats update failure handling

#### `/api/health` - Missing 9 tests
- ✅ Has: Basic health check structure
- ❌ Missing:
  - Degraded state detection (70-90% pool utilization)
  - Critical state detection (>90% pool utilization)
  - Individual component failure isolation
  - Cascading failure scenarios
  - Health check timeout handling
  - Concurrent health checks (stampede prevention)
  - Cache stats integration
  - Pool stats when pool unavailable
  - Response time degradation detection

#### `/api/newsletter/subscribe` - Missing 7 tests
- ✅ Has: Basic email validation
- ❌ Missing:
  - Malformed email edge cases
  - Missing ENCHARGE_WRITE_KEY handling
  - Encharge API rate limit responses
  - Encharge API 4xx/5xx error handling
  - Duplicate subscription handling
  - Request body size limits
  - DDoS protection (rate limiting)

#### `/api/export/csv` - Missing 10 tests
- ✅ Has: None (no test file found)
- ❌ Missing:
  - CSV escaping (quotes in data)
  - CSV escaping (commas in data)
  - CSV escaping (newlines in data)
  - Large export memory handling (9999 records)
  - Empty result set
  - Special characters (é, ä, ö, ü)
  - Excel compatibility verification
  - Streaming vs buffered export
  - UTF-8 BOM handling
  - Max query parameter validation

---

### 2. Library Testing (Priority: HIGH)

#### `lib/cache-lru.ts` - Missing 16 tests
- ✅ Has: Basic get/set, deleteByPrefix
- ❌ Missing:
  - LRU eviction order verification
  - Memory limit enforcement accuracy
  - Size estimation accuracy (±10% tolerance)
  - Concurrent access race conditions
  - Cleanup interval execution
  - Destroy() cleanup verification
  - deleteByPrefix() race conditions
  - Cache entry serialization failures
  - estimateSize() on circular references
  - Cleanup during high write load
  - Memory leak detection after 10k operations
  - unref() behavior in serverless
  - HMR cleanup in development
  - Cache warming strategies
  - Cache key collision handling
  - TTL precision (sub-second)

#### `lib/bwl-scraper.ts` - Missing 13 tests
- ✅ Has: None (only gap tests exist)
- ❌ Missing:
  - XLSX parsing with missing columns
  - XLSX parsing with extra columns
  - XLSX parsing with malformed dates
  - Row filtering (empty GTIN rows)
  - URL extraction from HTML fallback
  - Network failure with retry
  - Invalid XLSX file format
  - Encoding issues (German umlauts)
  - Workbook with multiple sheets
  - Cells with formulas vs values
  - Large XLSX file (>10MB)
  - HTTP redirect following
  - SSL certificate validation

#### `lib/db-monitoring.ts` - Missing 11 tests
- ✅ Has: Basic pool stats structure
- ❌ Missing:
  - Pool stats when pool is null/undefined
  - Health check query timeout
  - Concurrent health check handling
  - Pool utilization calculation edge cases
  - Monitoring interval cleanup
  - unref() behavior verification
  - Memory leak in monitoring loop
  - Health status transition logic
  - startPoolMonitoring() idempotency
  - Production vs development behavior
  - Error logging during stat collection

#### `lib/db-cached-queries.ts` - Missing 8 tests
- ✅ Has: None (minimal test file)
- ❌ Missing:
  - Cache key uniqueness for different queries
  - Cache invalidation after scrape
  - Concurrent cache misses (thundering herd)
  - Cache key collision detection
  - Query parameter normalization
  - Cache hit rate monitoring
  - Stale-while-revalidate behavior
  - Cache size growth over time

---

### 3. Integration Testing (Priority: CRITICAL)

#### Missing End-to-End Flows:
1. **Full Scrape → API → Frontend Flow**
   - Scrape triggers → DB upsert → Cache invalidation → API returns fresh data → ISR revalidates

2. **Concurrent User Scenarios**
   - 100 concurrent API reads during scrape
   - 50 concurrent batch requests
   - Cache stampede prevention

3. **Error Recovery Flows**
   - DB connection lost during scrape → recovery → resume
   - Cache server down → graceful degradation
   - Partial scrape failure → rollback vs partial commit

4. **Performance Under Load**
   - API response time with cold cache
   - API response time with warm cache
   - Memory usage during peak load
   - Connection pool exhaustion recovery

---

### 4. Security Testing (Priority: CRITICAL)

#### Missing Security Tests:
1. **Authorization Bypass**
   - Bearer token replay attacks
   - Missing authorization header handling
   - CRON_SECRET exposure risks

2. **Input Validation**
   - XSS via search parameters
   - SQL injection via filter params
   - Path traversal via file exports
   - CSV injection via exported data

3. **Rate Limiting**
   - API endpoint abuse (10k requests/minute)
   - Scrape endpoint DDoS prevention
   - Newsletter subscription spam prevention

4. **Data Integrity**
   - Cache poisoning attacks
   - CSRF protection for mutation endpoints
   - Timing attacks on authorization

---

### 5. Edge Cases & Error Handling (Priority: MEDIUM)

#### Missing Edge Cases:
1. **Database**
   - Connection pool exhausted
   - Query timeout (>30s)
   - Transaction deadlock
   - Replica lag handling

2. **Cache**
   - Cache eviction during read
   - Cache corruption/deserialization errors
   - Clock skew (TTL calculation)

3. **External APIs**
   - drugshortage.ch format change
   - Encharge API deprecation
   - BWL XLSX schema change
   - ODDB API rate limiting

4. **Concurrency**
   - Race condition: read during upsert
   - Race condition: two scrapes simultaneously
   - Deadlock: circular dependency

---

## Priority Matrix

| Area | Critical | High | Medium | Total |
|------|----------|------|--------|-------|
| API Routes | 15 | 25 | 12 | 52 |
| Library Functions | 12 | 28 | 18 | 58 |
| Integration Tests | 8 | 12 | 6 | 26 |
| Security Tests | 10 | 8 | 4 | 22 |
| Edge Cases | 3 | 15 | 20 | 38 |
| **TOTAL** | **48** | **88** | **60** | **196** |

---

## Recommended Test Implementation Order

### Phase 1 (Week 1): Critical Security & Data Integrity
1. Authorization bypass tests (scrape endpoint)
2. SQL injection comprehensive tests
3. Concurrent scrape prevention
4. Cache poisoning prevention
5. CSV injection in exports

### Phase 2 (Week 2): Core API Functionality
1. Alternatives batch endpoint edge cases
2. Scrape partial failure handling
3. Health check degraded state detection
4. Newsletter validation edge cases
5. CSV export edge cases

### Phase 3 (Week 3): Library & Performance
1. LRU cache concurrent access
2. BWL scraper error handling
3. DB monitoring edge cases
4. Cache invalidation flows
5. Query cache thundering herd

### Phase 4 (Week 4): Integration & E2E
1. Full scrape-to-API flow
2. Concurrent user scenarios
3. Error recovery flows
4. Performance under load

---

## Coverage Metrics (Estimated)

| Component | Current | Target | Gap |
|-----------|---------|--------|-----|
| API Routes | ~40% | 85% | 45% |
| Library Functions | ~35% | 90% | 55% |
| Integration Tests | ~20% | 75% | 55% |
| Security Tests | ~30% | 95% | 65% |
| **Overall** | **~35%** | **85%** | **50%** |

---

## Next Steps

1. Run `npm test -- --coverage` to get actual coverage report
2. Prioritize security tests (authorization, injection, rate limiting)
3. Implement critical path integration tests
4. Add performance regression tests
5. Set up CI/CD coverage gates (min 80% for new code)
