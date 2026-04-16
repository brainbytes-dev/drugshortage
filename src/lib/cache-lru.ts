/**
 * ✅ LRU Cache with memory limits to prevent unbounded growth
 * Evicts least-recently-used entries when size limit is reached
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
  size: number // Approximate size in bytes
}

class LRUCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private maxSize: number // Max total size in bytes
  private currentSize = 0
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(maxSizeMB = 100) {
    this.maxSize = maxSizeMB * 1024 * 1024 // Convert MB to bytes

    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)

    // ✅ Unref the interval so it doesn't prevent process exit
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref()
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    if (!entry) return null

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.delete(key)
      return null
    }

    // ✅ Move to end (most recently used) by deleting and re-inserting
    this.cache.delete(key)
    this.cache.set(key, entry)

    return entry.data
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    // Calculate approximate size
    const size = this.estimateSize(data)

    // ✅ If this single entry exceeds max size, reject it
    if (size > this.maxSize) {
      console.warn(`[LRUCache] Entry too large (${(size / 1024 / 1024).toFixed(2)}MB), rejecting`)
      return
    }

    // Remove old entry if exists
    const existing = this.cache.get(key)
    if (existing) {
      this.currentSize -= existing.size
      this.cache.delete(key)
    }

    // ✅ Evict LRU entries until we have space
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      this.evictLRU()
    }

    // Add new entry
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
      size,
    })
    this.currentSize += size
  }

  delete(key: string): void {
    const entry = this.cache.get(key)
    if (entry) {
      this.currentSize -= entry.size
      this.cache.delete(key)
    }
  }

  /**
   * ✅ Delete all entries with keys starting with a prefix
   * Useful for invalidating query caches (e.g., deleteByPrefix('query:'))
   */
  deleteByPrefix(prefix: string): number {
    let deleted = 0
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.delete(key)
        deleted++
      }
    }
    return deleted
  }

  clear(): void {
    this.cache.clear()
    this.currentSize = 0
  }

  private evictLRU(): void {
    // ✅ First key in Map is the least recently used (oldest)
    const firstKey = this.cache.keys().next().value
    if (firstKey !== undefined) {
      this.delete(firstKey)
    }
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.delete(key)
      }
    }
  }

  private estimateSize(data: unknown): number {
    // ✅ Rough size estimation
    try {
      const str = JSON.stringify(data)
      // UTF-16 uses 2 bytes per character
      return str.length * 2
    } catch {
      // If can't stringify, estimate conservatively
      return 1024 // 1KB default
    }
  }

  getStats() {
    return {
      entries: this.cache.size,
      currentSizeMB: (this.currentSize / 1024 / 1024).toFixed(2),
      maxSizeMB: (this.maxSize / 1024 / 1024).toFixed(2),
      utilizationPercent: ((this.currentSize / this.maxSize) * 100).toFixed(1),
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

// ✅ Singleton with 100MB limit (adjust based on your needs)
export const lruCache = new LRUCache(100)

// ✅ Helper function for cache-aside pattern
export async function getCachedLRU<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // Try cache first
  const cached = lruCache.get<T>(key)
  if (cached !== null) return cached

  // Cache miss - fetch and store
  const data = await fetcher()
  lruCache.set(key, data, ttlSeconds)
  return data
}

// ✅ Export stats for monitoring
export function getCacheStats() {
  return lruCache.getStats()
}

// ✅ Cleanup handlers to prevent memory leaks
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  // Serverless: cleanup before function exits
  process.on('beforeExit', () => {
    lruCache.destroy()
  })
}

// ✅ Development: cleanup on module hot reload
if (process.env.NODE_ENV !== 'production') {
  // @ts-expect-error - module.hot is a webpack feature
  if (typeof module !== 'undefined' && module.hot) {
    // @ts-expect-error - module.hot.dispose is a webpack HMR API
    module.hot.dispose(() => {
      lruCache.destroy()
    })
  }
}
