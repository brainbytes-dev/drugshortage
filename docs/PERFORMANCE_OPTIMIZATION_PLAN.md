# Performance Optimization Plan

## Priority Matrix

| Priority | Issue | Impact | Effort | Files to Change |
|----------|-------|--------|--------|-----------------|
| **🔴 HIGH** | N+1 queries in `upsertShortages` | 5-10x faster scrapes | Medium | `src/lib/db.ts` |
| **🔴 HIGH** | Missing database indexes | 3-10x faster queries | Low | New migration file |
| **🔴 HIGH** | Search debouncing | 90% fewer re-renders | Low | `src/components/search-bar.tsx` |
| **🟡 MEDIUM** | HTTP cache headers | 70-90% CDN hit rate | Low | `src/app/api/*/route.ts` |
| **🟡 MEDIUM** | In-memory KPI cache | ~200ms → ~1ms | Medium | `src/lib/db.ts`, `src/lib/cache.ts` |
| **🟡 MEDIUM** | Component memoization | 60-80% fewer computations | Low | `src/components/*-sheet.tsx` |
| **🟢 LOW** | Prisma connection pool limits | Prevents memory growth | Low | `src/lib/prisma.ts` |

---

## Quick Wins (< 1 hour)

### 1. Add Database Indexes (15 min)
```bash
# Run the migration
psql $DATABASE_URL -f prisma/migrations/add_performance_indexes.sql
```

**Expected improvement:**
- Active shortage queries: ~500ms → ~50ms (10x)
- Firma/ATC filters: ~300ms → ~30ms (10x)

---

### 2. Debounce Search (10 min)
Replace `src/components/search-bar.tsx` with `src/components/search-bar-optimized.tsx`

**Expected improvement:**
- Re-renders: ~10 per word typed → 1 final render
- Better UX on slow connections

---

### 3. Add HTTP Cache Headers (10 min)
Update API routes with cache headers:

```typescript
// In src/app/api/shortages/route.ts
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
  },
})
```

**Expected improvement:**
- CDN hit rate: 0% → 70-90%
- API response time: ~200ms → ~20ms (cached)

---

### 4. Memoize Filter Components (15 min)
Replace sheet components with optimized versions:
- `src/components/firma-ranking-sheet.tsx` → `-optimized.tsx`
- `src/components/atc-gruppen-sheet.tsx` → `-optimized.tsx`

**Expected improvement:**
- Filter rendering: ~50ms → ~5ms (10x)

---

## Medium Effort (2-4 hours)

### 5. Optimize `upsertShortages` (2 hours)
Replace the update loop in `src/lib/db.ts` with bulk SQL upsert from `src/lib/db-optimized-upsert.ts`

**Expected improvement:**
- Scrape time for 1000 records: ~30s → ~3s (10x)
- Database load: -80%

**Testing:**
```bash
# Test with staging database first
npm run test:db
# Then run manual scrape to verify
npm run scrape
```

---

### 6. Add In-Memory Cache Layer (2 hours)
1. Copy `src/lib/cache.ts` into project
2. Replace `getKPIStats()` and `getFirmaList()` calls with cached versions
3. Add cache invalidation to scrape route

**Expected improvement:**
- KPI API response: ~200ms → ~1ms (200x on cache hit)
- Database queries: -90%

**Implementation:**
```typescript
// In src/app/api/shortages/route.ts
import { getKPIStatsCached, getFirmaListCached } from '@/lib/db-cached-example'

const [response, kpi, firmaList] = await Promise.all([
  queryShortages(query),
  getKPIStatsCached(), // ✅ Cached version
  getFirmaListCached(), // ✅ Cached version
])
```

```typescript
// In src/app/api/scrape/route.ts
import { invalidateStatsCache } from '@/lib/db-cached-example'

// After successful scrape:
await upsertShortages(shortages)
invalidateStatsCache() // ✅ Clear cache after data change
```

---

## Advanced Optimizations (Future)

### 7. Migrate to Vercel KV / Redis (4-6 hours)
Replace in-memory cache with distributed cache for multi-region deployments.

**Benefits:**
- Shared cache across all Edge Functions
- Persistence across deployments
- Atomic cache invalidation

---

### 8. Implement ISR with On-Demand Revalidation (3 hours)
Use Next.js On-Demand Revalidation to bust ISR cache after scrapes.

```typescript
// In src/app/api/scrape/route.ts
import { revalidatePath } from 'next/cache'

// After successful scrape:
revalidatePath('/')
```

**Benefits:**
- Users always see fresh data
- No 1-hour staleness from current ISR setup

---

### 9. Add Full-Text Search with PostgreSQL (2-3 hours)
Replace client-side filtering with server-side full-text search.

```sql
-- Already in migration file
CREATE INDEX idx_shortage_bezeichnung_trgm
ON "Shortage" USING gin ("bezeichnung" gin_trgm_ops);
```

```typescript
// In src/lib/db.ts
where: {
  bezeichnung: { search: query.search }, // ✅ Database-level search
}
```

**Benefits:**
- Faster search: ~100ms → ~10ms
- Better search quality (fuzzy matching, typo tolerance)

---

## Performance Metrics to Track

After implementing optimizations, monitor these metrics:

### Database
- Query time (p50, p95, p99)
- Connection pool usage
- Query count per request

### API
- Response time per endpoint
- Cache hit rate (CDN + in-memory)
- Error rate

### Frontend
- Time to Interactive (TTI)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)

### Scraping
- Scrape duration
- Records processed per second
- Database transaction time

---

## Recommended Tools

```bash
# Database query analysis
npm i -D @prisma/debug

# Frontend performance
npm i -D @next/bundle-analyzer

# API monitoring (if using Vercel)
# https://vercel.com/docs/observability/runtime-logs
```

---

## Testing Plan

1. **Load Testing:**
   ```bash
   # Install k6 or autocannon
   npm i -g autocannon
   
   # Test API endpoint
   autocannon -c 100 -d 30 http://localhost:3000/api/shortages
   ```

2. **Database Performance:**
   ```sql
   -- Check query plans
   EXPLAIN ANALYZE SELECT * FROM "Shortage" WHERE "isActive" = true ORDER BY "tageSeitMeldung" DESC LIMIT 50;
   ```

3. **Frontend Profiling:**
   - Use React DevTools Profiler
   - Chrome DevTools Performance tab
   - Lighthouse audits

---

## Expected Overall Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Homepage load (p50) | 800ms | 200ms | **4x faster** |
| API response (cached) | 200ms | 10ms | **20x faster** |
| Search re-renders | 10/word | 1/word | **10x fewer** |
| Scrape time (1000 records) | 30s | 3s | **10x faster** |
| Database queries/request | 8-12 | 1-3 | **4x fewer** |
| CDN hit rate | 0% | 80% | **New capability** |

---

## Migration Checklist

- [ ] Backup production database
- [ ] Run database indexes migration
- [ ] Deploy search debouncing
- [ ] Add HTTP cache headers
- [ ] Deploy component memoization
- [ ] Test in staging environment
- [ ] Optimize `upsertShortages` (separate PR)
- [ ] Add in-memory cache layer (separate PR)
- [ ] Monitor performance metrics for 1 week
- [ ] Consider advanced optimizations based on metrics
