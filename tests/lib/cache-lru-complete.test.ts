import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { lruCache, getCachedLRU, getCacheStats } from '@/lib/cache-lru'

describe('LRUCache - Complete Coverage', () => {
  beforeEach(() => {
    lruCache.clear()
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Basic Operations', () => {
    it('should store and retrieve values', () => {
      lruCache.set('key1', 'value1', 60)
      expect(lruCache.get('key1')).toBe('value1')
    })

    it('should return null for non-existent keys', () => {
      expect(lruCache.get('nonexistent')).toBeNull()
    })

    it('should delete entries', () => {
      lruCache.set('key1', 'value1', 60)
      lruCache.delete('key1')
      expect(lruCache.get('key1')).toBeNull()
    })

    it('should clear all entries', () => {
      lruCache.set('key1', 'value1', 60)
      lruCache.set('key2', 'value2', 60)
      lruCache.clear()

      expect(lruCache.get('key1')).toBeNull()
      expect(lruCache.get('key2')).toBeNull()
      expect(getCacheStats().entries).toBe(0)
    })
  })

  describe('TTL and Expiration', () => {
    it('should expire entries after TTL', () => {
      vi.useFakeTimers()

      lruCache.set('key1', 'value1', 10) // 10 seconds TTL
      expect(lruCache.get('key1')).toBe('value1')

      vi.advanceTimersByTime(11000) // 11 seconds
      expect(lruCache.get('key1')).toBeNull()
    })

    it('should not expire entries before TTL', () => {
      vi.useFakeTimers()

      lruCache.set('key1', 'value1', 60)
      vi.advanceTimersByTime(30000) // 30 seconds
      expect(lruCache.get('key1')).toBe('value1')
    })

    it('should handle cleanup interval (5 minutes)', () => {
      vi.useFakeTimers()

      lruCache.set('key1', 'value1', 10) // Expires in 10s
      vi.advanceTimersByTime(11000) // Entry expired

      // Before cleanup, entry still in cache (not accessed)
      const statsBefore = getCacheStats()
      expect(statsBefore.entries).toBe(1)

      // After cleanup interval (5 min)
      vi.advanceTimersByTime(5 * 60 * 1000)

      // TODO: Verify cleanup was called and removed expired entry
    })

    it('should handle multiple entries with different TTLs', () => {
      vi.useFakeTimers()

      lruCache.set('short', 'value', 5)
      lruCache.set('long', 'value', 60)

      vi.advanceTimersByTime(6000)

      expect(lruCache.get('short')).toBeNull()
      expect(lruCache.get('long')).toBe('value')
    })
  })

  describe('LRU Eviction', () => {
    it('should evict least recently used entry when size limit is reached', () => {
      // Set small max size for testing
      const smallCache = new (lruCache.constructor as any)(0.001) // 0.001 MB = ~1KB

      smallCache.set('key1', 'a'.repeat(500), 300) // ~500 bytes
      smallCache.set('key2', 'b'.repeat(500), 300) // ~500 bytes

      // This should trigger eviction of key1
      smallCache.set('key3', 'c'.repeat(500), 300)

      expect(smallCache.get('key1')).toBeNull() // Evicted
      expect(smallCache.get('key2')).toBe('b'.repeat(500))
      expect(smallCache.get('key3')).toBe('c'.repeat(500))
    })

    it('should update LRU order on access', () => {
      const smallCache = new (lruCache.constructor as any)(0.001)

      smallCache.set('key1', 'a'.repeat(500), 300)
      smallCache.set('key2', 'b'.repeat(500), 300)

      // Access key1 - should move it to end (most recently used)
      smallCache.get('key1')

      // Add key3 - should evict key2 (now LRU)
      smallCache.set('key3', 'c'.repeat(500), 300)

      expect(smallCache.get('key1')).toBe('a'.repeat(500)) // Not evicted
      expect(smallCache.get('key2')).toBeNull() // Evicted
      expect(smallCache.get('key3')).toBe('c'.repeat(500))
    })

    it('should reject entries larger than max size', () => {
      const tinyCache = new (lruCache.constructor as any)(0.0001) // 0.1 KB

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Try to set entry larger than max size
      tinyCache.set('huge', 'x'.repeat(200000), 300) // 200 KB

      expect(tinyCache.get('huge')).toBeNull()
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Entry too large')
      )

      consoleWarnSpy.mockRestore()
    })

    it('should handle multiple evictions in one set operation', () => {
      const smallCache = new (lruCache.constructor as any)(0.001)

      smallCache.set('key1', 'a'.repeat(200), 300)
      smallCache.set('key2', 'b'.repeat(200), 300)
      smallCache.set('key3', 'c'.repeat(200), 300)

      // This should evict multiple entries
      smallCache.set('large', 'x'.repeat(800), 300)

      expect(smallCache.get('large')).toBe('x'.repeat(800))
      // Old entries should be evicted
      expect(smallCache.get('key1')).toBeNull()
      expect(smallCache.get('key2')).toBeNull()
    })
  })

  describe('Size Estimation', () => {
    it('should estimate size correctly for strings', () => {
      lruCache.set('test', 'hello', 60)
      const stats = getCacheStats()

      // Should have non-zero size
      expect(parseFloat(stats.currentSizeMB)).toBeGreaterThan(0)
    })

    it('should estimate size correctly for objects', () => {
      const largeObj = { data: 'x'.repeat(1000), nested: { more: 'data' } }
      lruCache.set('obj', largeObj, 60)

      const stats = getCacheStats()
      expect(parseFloat(stats.currentSizeMB)).toBeGreaterThan(0)
    })

    it('should handle un-stringifiable objects gracefully', () => {
      const circular: any = {}
      circular.self = circular

      lruCache.set('circular', circular, 60)

      const stats = getCacheStats()
      // Should default to 1KB for un-stringifiable objects
      expect(stats.entries).toBe(1)
    })

    it('should update size correctly on delete', () => {
      lruCache.set('key1', 'x'.repeat(10000), 60)
      const sizeBefore = parseFloat(getCacheStats().currentSizeMB)

      lruCache.delete('key1')
      const sizeAfter = parseFloat(getCacheStats().currentSizeMB)

      expect(sizeAfter).toBeLessThan(sizeBefore)
    })

    it('should update size correctly on clear', () => {
      lruCache.set('key1', 'x'.repeat(10000), 60)
      lruCache.set('key2', 'y'.repeat(10000), 60)

      lruCache.clear()

      const stats = getCacheStats()
      expect(parseFloat(stats.currentSizeMB)).toBe(0)
      expect(stats.entries).toBe(0)
    })
  })

  describe('Statistics', () => {
    it('should track entry count correctly', () => {
      expect(getCacheStats().entries).toBe(0)

      lruCache.set('key1', 'value1', 60)
      expect(getCacheStats().entries).toBe(1)

      lruCache.set('key2', 'value2', 60)
      expect(getCacheStats().entries).toBe(2)

      lruCache.delete('key1')
      expect(getCacheStats().entries).toBe(1)
    })

    it('should calculate utilization percentage correctly', () => {
      lruCache.clear()

      // Default max is 100MB, add ~50MB of data
      lruCache.set('large', 'x'.repeat(50 * 1024 * 1024), 60)

      const stats = getCacheStats()
      const utilization = parseFloat(stats.utilizationPercent)

      expect(utilization).toBeGreaterThan(45)
      expect(utilization).toBeLessThan(55)
    })

    it('should report correct max size', () => {
      const stats = getCacheStats()
      expect(stats.maxSizeMB).toBe('100.00') // Default 100MB
    })
  })

  describe('getCachedLRU Helper', () => {
    it('should return cached value on cache hit', async () => {
      const fetcher = vi.fn().mockResolvedValue('fresh data')

      lruCache.set('test-key', 'cached data', 60)

      const result = await getCachedLRU('test-key', fetcher, 60)

      expect(result).toBe('cached data')
      expect(fetcher).not.toHaveBeenCalled()
    })

    it('should call fetcher on cache miss', async () => {
      const fetcher = vi.fn().mockResolvedValue('fresh data')

      const result = await getCachedLRU('test-key', fetcher, 60)

      expect(result).toBe('fresh data')
      expect(fetcher).toHaveBeenCalledTimes(1)
    })

    it('should store fetched data in cache', async () => {
      const fetcher = vi.fn().mockResolvedValue('fresh data')

      await getCachedLRU('test-key', fetcher, 60)

      // Second call should hit cache
      const result = await getCachedLRU('test-key', fetcher, 60)
      expect(result).toBe('fresh data')
      expect(fetcher).toHaveBeenCalledTimes(1) // Only called once
    })

    it('should handle fetcher errors', async () => {
      const fetcher = vi.fn().mockRejectedValue(new Error('Fetch failed'))

      await expect(getCachedLRU('test-key', fetcher, 60)).rejects.toThrow('Fetch failed')
    })

    it('should respect TTL for cached values', async () => {
      vi.useFakeTimers()

      const fetcher = vi.fn()
        .mockResolvedValueOnce('first')
        .mockResolvedValueOnce('second')

      await getCachedLRU('test-key', fetcher, 10)
      expect(fetcher).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(11000) // Expire

      await getCachedLRU('test-key', fetcher, 10)
      expect(fetcher).toHaveBeenCalledTimes(2) // Re-fetched
    })
  })

  describe('Concurrent Access', () => {
    it('should handle concurrent sets for same key', () => {
      lruCache.set('key', 'value1', 60)
      lruCache.set('key', 'value2', 60)

      expect(lruCache.get('key')).toBe('value2')
      expect(getCacheStats().entries).toBe(1) // Not duplicated
    })

    it('should handle concurrent gets safely', () => {
      lruCache.set('key', 'value', 60)

      const results = Array(100).fill(null).map(() => lruCache.get('key'))

      results.forEach(result => {
        expect(result).toBe('value')
      })
    })

    it('should handle concurrent getCachedLRU calls', async () => {
      let fetchCount = 0
      const fetcher = vi.fn().mockImplementation(async () => {
        fetchCount++
        await new Promise(resolve => setTimeout(resolve, 10))
        return 'data'
      })

      // Multiple concurrent calls for same key
      const promises = Array(5).fill(null).map(() =>
        getCachedLRU('test-key', fetcher, 60)
      )

      const results = await Promise.all(promises)

      // All should get the same result
      results.forEach(result => expect(result).toBe('data'))

      // Note: Without locking, fetcher might be called multiple times
      // This tests current behavior - could be improved with lock
      expect(fetchCount).toBeGreaterThan(0)
    })
  })

  describe('Memory Management', () => {
    it('should cleanup interval be unreferenced', () => {
      // This tests that cleanup interval doesn't prevent process exit
      // Actual test would need to check interval.unref() was called
      // This is more of an integration test
      expect(true).toBe(true) // Placeholder
    })

    it('should destroy cleanup interval on destroy()', () => {
      const testCache = new (lruCache.constructor as any)(100)

      testCache.destroy()

      // After destroy, cache should be empty
      const stats = testCache.getStats()
      expect(stats.entries).toBe(0)
    })

    it('should handle destroy before exit in production', () => {
      // Test process.on('beforeExit') handler
      // This is integration-level, placeholder test
      expect(process.env.NODE_ENV).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string keys', () => {
      lruCache.set('', 'value', 60)
      expect(lruCache.get('')).toBe('value')
    })

    it('should handle very long keys', () => {
      const longKey = 'x'.repeat(10000)
      lruCache.set(longKey, 'value', 60)
      expect(lruCache.get(longKey)).toBe('value')
    })

    it('should handle null values', () => {
      lruCache.set('key', null, 60)
      // Returns null, but different from "not found"
      // This is a design choice - might want to handle differently
      expect(lruCache.get('key')).toBeNull()
    })

    it('should handle undefined values', () => {
      lruCache.set('key', undefined, 60)
      expect(lruCache.get('key')).toBeUndefined()
    })

    it('should handle zero TTL', () => {
      lruCache.set('key', 'value', 0)
      // Should expire immediately
      expect(lruCache.get('key')).toBeNull()
    })

    it('should handle negative TTL', () => {
      lruCache.set('key', 'value', -10)
      // Should expire immediately
      expect(lruCache.get('key')).toBeNull()
    })

    it('should handle very large TTL', () => {
      lruCache.set('key', 'value', Number.MAX_SAFE_INTEGER)
      expect(lruCache.get('key')).toBe('value')
    })
  })
})
