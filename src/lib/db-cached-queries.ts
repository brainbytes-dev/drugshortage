import { getCachedLRU } from './cache-lru'
import { queryShortages as queryShortagesRaw } from './db'
import type { ShortagesQuery, ShortagesResponse } from './types'

/**
 * ✅ Cache query results for identical parameters
 * Most users filter by the same criteria (status, firma, etc.)
 * Cache for 2 minutes since data only changes during scrapes
 */
export async function queryShortagesCached(
  query: ShortagesQuery
): Promise<ShortagesResponse> {
  // Create stable cache key from query params
  const cacheKey = `query:${JSON.stringify({
    search: query.search,
    status: query.status,
    firma: query.firma,
    atc: query.atc,
    page: query.page,
    sort: query.sort,
    perPage: query.perPage,
  })}`

  return getCachedLRU(
    cacheKey,
    () => queryShortagesRaw(query),
    120 // Cache for 2 minutes (data changes on scrape only)
  )
}
