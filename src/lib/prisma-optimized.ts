import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient; pool: Pool }

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')

  // ✅ Create a connection pool with limits to prevent memory leaks
  const pool = new Pool({
    connectionString,
    // ✅ Limit concurrent connections to prevent memory exhaustion
    max: 20, // Maximum pool size (adjust based on your database plan)
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    connectionTimeoutMillis: 5000, // Fail fast if can't connect
  })

  const adapter = new PrismaPg(pool)

  const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

  // Store pool reference for cleanup
  globalForPrisma.pool = pool

  return prisma
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// ✅ Graceful shutdown - close connections on process exit
if (process.env.NODE_ENV === 'production') {
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing database connections...')
    await prisma.$disconnect()
    if (globalForPrisma.pool) {
      await globalForPrisma.pool.end()
    }
  })
}
