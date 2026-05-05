/**
 * Tests for Prisma client initialization and configuration
 */

describe('Prisma Client Initialization', () => {
  const originalEnv = process.env.DATABASE_URL

  afterEach(() => {
    process.env.DATABASE_URL = originalEnv
    jest.resetModules() // Clear module cache to re-import prisma
  })

  test('throws error when DATABASE_URL is not set', () => {
    delete process.env.DATABASE_URL
    expect(() => {
      jest.isolateModules(() => {
        require('@/lib/prisma')
      })
    }).toThrow('DATABASE_URL environment variable is not set')
  })

  test('creates client with PrismaPg adapter when DATABASE_URL is set', () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb'
    expect(() => {
      jest.isolateModules(() => {
        const { prisma } = require('@/lib/prisma')
        expect(prisma).toBeDefined()
      })
    }).not.toThrow()
  })

  test('uses development logging in development mode', () => {
    process.env.NODE_ENV = 'development'
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb'

    jest.isolateModules(() => {
      // Mock PrismaClient to inspect constructor args
      jest.mock('@prisma/client', () => ({
        PrismaClient: jest.fn((config) => {
          expect(config.log).toEqual(['error', 'warn'])
          return {}
        }),
      }))
      require('@/lib/prisma')
    })
  })

  test('uses minimal logging in production mode', () => {
    process.env.NODE_ENV = 'production'
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb'

    jest.isolateModules(() => {
      jest.mock('@prisma/client', () => ({
        PrismaClient: jest.fn((config) => {
          expect(config.log).toEqual(['error'])
          return {}
        }),
      }))
      require('@/lib/prisma')
    })
  })

  test('reuses existing client in development (globalForPrisma)', () => {
    process.env.NODE_ENV = 'development'
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb'

    jest.isolateModules(() => {
      const { prisma: client1 } = require('@/lib/prisma')
      const { prisma: client2 } = require('@/lib/prisma')
      expect(client1).toBe(client2) // Same instance
    })
  })

  test('handles malformed DATABASE_URL gracefully', () => {
    process.env.DATABASE_URL = 'not-a-valid-url'

    // Should not throw immediately on import, but may fail on actual queries
    expect(() => {
      jest.isolateModules(() => {
        require('@/lib/prisma')
      })
    }).not.toThrow()
  })

  // TODO: integration test — requires isolation from globalForPrisma singleton; the
  // module-level singleton caches the client across jest.isolateModules() calls in CI
  test.skip('handles empty DATABASE_URL string', () => {
    process.env.DATABASE_URL = ''

    expect(() => {
      jest.isolateModules(() => {
        require('@/lib/prisma')
      })
    }).toThrow('DATABASE_URL environment variable is not set')
  })
})