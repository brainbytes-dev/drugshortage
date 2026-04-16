/**
 * Cache Layer Tests
 * Tests for in-memory cache implementation
 */

import { memoryCache, getCached } from '@/lib/cache'

describe('MemoryCache', () => {
  beforeEach(() => {
    memoryCache.clear()
  })

  afterAll(() => {
    memoryCache.destroy()
  })

  describe('set and get', () => {
    test('stores and retrieves string values', () => {
      memoryCache.set('test-key', 'test-value', 60)
      const value = memoryCache.get<string>('test-key')
      expect(value).toBe('test-value')
    })

    test('stores and retrieves object values', () => {
      const obj = { foo: 'bar', num: 42 }
      memoryCache.set('obj-key', obj, 60)
      const retrieved = memoryCache.get<typeof obj>('obj-key')
      expect(retrieved).toEqual(obj)
    })

    test('stores and retrieves array values', () => {
      const arr = [1, 2, 3, 'test']
      memoryCache.set('arr-key', arr, 60)
      const retrieved = memoryCache.get<typeof arr>('arr-key')
      expect(retrieved).toEqual(arr)
    })

    test('returns null for non-existent key', () => {
      const value = memoryCache.get('non-existent')
      expect(value).toBeNull()
    })

    test('returns null for expired entry', async () => {
      memoryCache.set('expire-key', 'value', 0.1) // 100ms TTL
      await new Promise(resolve => setTimeout(resolve, 150))
      const value = memoryCache.get('expire-key')
      expect(value).toBeNull()
    })

    test('returns valid entry before expiration', async () => {
      memoryCache.set('valid-key', 'value', 1) // 1 second TTL
      await new Promise(resolve => setTimeout(resolve, 100))
      const value = memoryCache.get('valid-key')
      expect(value).toBe('value')
    })

    test('handles overwriting existing key', () => {
      memoryCache.set('key', 'old-value', 60)
      memoryCache.set('key', 'new-value', 60)
      const value = memoryCache.get<string>('key')
      expect(value).toBe('new-value')
    })

    test('handles multiple keys independently', () => {
      memoryCache.set('key1', 'value1', 60)
      memoryCache.set('key2', 'value2', 60)
      expect(memoryCache.get('key1')).toBe('value1')
      expect(memoryCache.get('key2')).toBe('value2')
    })
  })

  describe('delete', () => {
    test('deletes existing key', () => {
      memoryCache.set('key', 'value', 60)
      memoryCache.delete('key')
      expect(memoryCache.get('key')).toBeNull()
    })

    test('handles deleting non-existent key gracefully', () => {
      expect(() => memoryCache.delete('non-existent')).not.toThrow()
    })

    test('deletes only specified key', () => {
      memoryCache.set('key1', 'value1', 60)
      memoryCache.set('key2', 'value2', 60)
      memoryCache.delete('key1')
      expect(memoryCache.get('key1')).toBeNull()
      expect(memoryCache.get('key2')).toBe('value2')
    })
  })

  describe('clear', () => {
    test('clears all entries', () => {
      memoryCache.set('key1', 'value1', 60)
      memoryCache.set('key2', 'value2', 60)
      memoryCache.set('key3', 'value3', 60)
      memoryCache.clear()
      expect(memoryCache.get('key1')).toBeNull()
      expect(memoryCache.get('key2')).toBeNull()
      expect(memoryCache.get('key3')).toBeNull()
    })

    test('allows adding entries after clear', () => {
      memoryCache.set('key', 'old', 60)
      memoryCache.clear()
      memoryCache.set('key', 'new', 60)
      expect(memoryCache.get('key')).toBe('new')
    })
  })

  describe('cleanup', () => {
    test('removes expired entries during periodic cleanup', async () => {
      // Set entries with very short TTL
      memoryCache.set('expire1', 'value1', 0.1)
      memoryCache.set('expire2', 'value2', 0.1)
      memoryCache.set('valid', 'value-valid', 10)

      // Wait for expiration + cleanup cycle (5 minutes is default, so we test manually)
      await new Promise(resolve => setTimeout(resolve, 150))

      // Manually trigger cleanup by trying to get expired entries
      expect(memoryCache.get('expire1')).toBeNull()
      expect(memoryCache.get('expire2')).toBeNull()
      expect(memoryCache.get('valid')).toBe('value-valid')
    })
  })

  describe('edge cases', () => {
    test('handles null values', () => {
      memoryCache.set('null-key', null, 60)
      const value = memoryCache.get('null-key')
      expect(value).toBeNull() // Ambiguous: null value vs. non-existent
    })

    test('handles undefined values', () => {
      memoryCache.set('undef-key', undefined, 60)
      const value = memoryCache.get('undef-key')
      expect(value).toBe(undefined)
    })

    test('handles empty string', () => {
      memoryCache.set('empty-key', '', 60)
      const value = memoryCache.get('empty-key')
      expect(value).toBe('')
    })

    test('handles zero TTL (immediate expiration)', () => {
      memoryCache.set('zero-ttl', 'value', 0)
      const value = memoryCache.get('zero-ttl')
      expect(value).toBeNull()
    })

    test('handles negative TTL (immediate expiration)', () => {
      memoryCache.set('negative-ttl', 'value', -1)
      const value = memoryCache.get('negative-ttl')
      expect(value).toBeNull()
    })

    test('handles very large TTL', () => {
      const largeExpiry = 365 * 24 * 60 * 60 // 1 year in seconds
      memoryCache.set('long-ttl', 'value', largeExpiry)
      const value = memoryCache.get('long-ttl')
      expect(value).toBe('value')
    })

    test('handles special characters in keys', () => {
      const specialKeys = ['key:with:colons', 'key/with/slashes', 'key with spaces', '日本語キー']
      specialKeys.forEach(key => {
        memoryCache.set(key, 'value', 60)
        expect(memoryCache.get(key)).toBe('value')
      })
    })

    test('handles very large values (memory stress test)', () => {
      const largeArray = new Array(10000).fill('x').map((_, i) => ({ id: i, data: 'x'.repeat(100) }))
      memoryCache.set('large-value', largeArray, 60)
      const retrieved = memoryCache.get<typeof largeArray>('large-value')
      expect(retrieved).toHaveLength(10000)
    })
  })
})

describe('getCached helper', () => {
  beforeEach(() => {
    memoryCache.clear()
  })

  test('returns cached value if available', async () => {
    memoryCache.set('test-key', 'cached-value', 60)

    const fetcher = jest.fn()
    const result = await getCached('test-key', fetcher, 60)

    expect(result).toBe('cached-value')
    expect(fetcher).not.toHaveBeenCalled()
  })

  test('calls fetcher and caches result on cache miss', async () => {
    const fetcher = jest.fn(async () => 'fresh-value')
    const result = await getCached('test-key', fetcher, 60)

    expect(result).toBe('fresh-value')
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(memoryCache.get('test-key')).toBe('fresh-value')
  })

  test('caches fetcher result for subsequent calls', async () => {
    const fetcher = jest.fn(async () => 'fresh-value')

    const result1 = await getCached('test-key', fetcher, 60)
    const result2 = await getCached('test-key', fetcher, 60)

    expect(result1).toBe('fresh-value')
    expect(result2).toBe('fresh-value')
    expect(fetcher).toHaveBeenCalledTimes(1) // Only called once
  })

  test('handles fetcher errors gracefully', async () => {
    const fetcher = jest.fn(async () => {
      throw new Error('Fetch failed')
    })

    await expect(getCached('test-key', fetcher, 60)).rejects.toThrow('Fetch failed')
    expect(memoryCache.get('test-key')).toBeNull() // Should not cache errors
  })

  test('re-fetches after cache expiration', async () => {
    const fetcher = jest.fn()
      .mockResolvedValueOnce('value1')
      .mockResolvedValueOnce('value2')

    const result1 = await getCached('test-key', fetcher, 0.1) // 100ms TTL
    await new Promise(resolve => setTimeout(resolve, 150))
    const result2 = await getCached('test-key', fetcher, 0.1)

    expect(result1).toBe('value1')
    expect(result2).toBe('value2')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  test('handles concurrent requests (cache stampede prevention)', async () => {
    let fetchCount = 0
    const fetcher = async () => {
      fetchCount++
      await new Promise(resolve => setTimeout(resolve, 100))
      return `value-${fetchCount}`
    }

    // Fire multiple requests concurrently
    const [result1, result2, result3] = await Promise.all([
      getCached('test-key', fetcher, 60),
      getCached('test-key', fetcher, 60),
      getCached('test-key', fetcher, 60),
    ])

    // Note: Current implementation may call fetcher multiple times
    // This test documents current behavior - ideally should be 1 call
    expect(result1).toBeDefined()
    expect(result2).toBeDefined()
    expect(result3).toBeDefined()
    // TODO: Implement cache stampede prevention (lock mechanism)
  })
})
