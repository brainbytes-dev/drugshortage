import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')

  const pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })

  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown — prisma.$disconnect() closes the pg Pool via PrismaPg adapter
let isShuttingDown = false

const shutdownHandler = async () => {
  if (isShuttingDown) return
  isShuttingDown = true
  try {
    await prisma.$disconnect()
  } catch {
    // ignore — process is exiting anyway
  } finally {
    process.exit(0)
  }
}

process.on('SIGTERM', shutdownHandler)
process.on('SIGINT', shutdownHandler)
