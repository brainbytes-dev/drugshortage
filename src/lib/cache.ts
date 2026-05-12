/**
 * ⚠️ DEPRECATED: Use cache-lru.ts instead for production
 *
 * Simple in-memory cache with TTL (NO SIZE LIMITS - memory leak risk)
 * This implementation is kept for testing only.
 *
 * For production, use:
 * - cache-lru.ts (LRU cache with memory limits) - RECOMMENDED
 * - Redis or Vercel KV for distributed caching
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    if (!entry) return null
    // `>=` so that ttlSeconds <= 0 expires immediately (expiresAt == Date.now()
    // at set-time would otherwise survive a same-millisecond read).
    if (Date.now() >= entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    return entry.data
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.cache.clear()
  }
}

// ✅ Singleton instance
export const memoryCache = new MemoryCache()

// ✅ Helper function for cache-aside pattern
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // Try cache first
  const cached = memoryCache.get<T>(key)
  if (cached !== null) return cached

  // Cache miss - fetch and store
  const data = await fetcher()
  memoryCache.set(key, data, ttlSeconds)
  return data
}
