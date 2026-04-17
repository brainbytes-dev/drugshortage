/**
 * One-off backfill: create ShortageEpisode rows from existing shortages data.
 * Run: npx dotenvx run -f .env.local -- tsx src/scripts/backfill-episodes.ts
 *
 * Strategy:
 *   isActive = true  → open episode  (startedAt = firstSeenAt, endedAt = null)
 *   isActive = false → closed episode (startedAt = firstSeenAt, endedAt = lastSeenAt)
 *
 * Safe to re-run: uses createMany with skipDuplicates on a unique index would be ideal,
 * but since there's no unique constraint we clear first if already run.
 */
import { prisma } from '../lib/prisma'

async function main() {
  const existingCount = await prisma.shortageEpisode.count()
  if (existingCount > 0) {
    console.log(`[backfill] shortage_episodes already has ${existingCount} rows — skipping.`)
    console.log('[backfill] Delete manually if you want to re-run: DELETE FROM shortage_episodes;')
    return
  }

  const shortages = await prisma.shortage.findMany({
    select: { gtin: true, firstSeenAt: true, lastSeenAt: true, isActive: true },
  })

  console.log(`[backfill] Creating episodes for ${shortages.length} shortages...`)

  const CHUNK = 500
  let created = 0

  for (let i = 0; i < shortages.length; i += CHUNK) {
    const chunk = shortages.slice(i, i + CHUNK)
    const result = await prisma.shortageEpisode.createMany({
      data: chunk.map(s => {
        const endedAt = s.isActive ? null : s.lastSeenAt
        const durationDays =
          endedAt !== null
            ? Math.round((endedAt.getTime() - s.firstSeenAt.getTime()) / 86_400_000)
            : null
        return {
          gtin: s.gtin,
          startedAt: s.firstSeenAt,
          endedAt,
          durationDays,
        }
      }),
    })
    created += result.count
    console.log(`[backfill] ${created} / ${shortages.length}`)
  }

  console.log(`[backfill] Done — ${created} episodes created.`)
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
