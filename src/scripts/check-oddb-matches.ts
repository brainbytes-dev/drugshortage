import { prisma } from '../lib/prisma-optimized'

async function main() {
  const totalOddb = await prisma.oddbProduct.count()

  const activeShortages = await prisma.shortage.findMany({
    where: { isActive: true },
    select: { gtin: true, bezeichnung: true },
  })
  console.log(`ODDB products in DB: ${totalOddb}`)
  console.log(`Active shortages: ${activeShortages.length}`)

  const oddbGtins = new Set(
    (await prisma.oddbProduct.findMany({ select: { gtin: true } })).map(o => o.gtin)
  )

  const matched = activeShortages.filter(s => oddbGtins.has(s.gtin))
  console.log(`Matches: ${matched.length} / ${activeShortages.length} active shortages`)
  console.log()

  // Show 5 sample matches with enrichment
  for (const s of matched.slice(0, 5)) {
    const oddb = await prisma.oddbProduct.findUnique({ where: { gtin: s.gtin } })
    console.log(`${s.bezeichnung}`)
    console.log(`  Wirkstoff: ${oddb?.substanz ?? '–'}`)
    console.log(`  Swissmedic: ${oddb?.prodno ?? '–'}`)
    console.log()
  }
}

main().catch(console.error).finally(() => process.exit(0))
