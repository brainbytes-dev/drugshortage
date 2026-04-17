/**
 * One-off script: fetch and populate off_market_drugs table.
 * Run: npx dotenvx run -- tsx src/scripts/populate-off-market.ts
 */
import { fetchAndParseOffMarket } from '../lib/scraper'
import { upsertOffMarketDrugs } from '../lib/db'

async function main() {
  console.log('[off-market] Fetching ausserHandel + Vertriebseinstellung...')
  const entries = await fetchAndParseOffMarket()
  console.log(`[off-market] Fetched ${entries.length} entries`)

  const ausserHandel = entries.filter(e => e.category === 'AUSSER_HANDEL').length
  const vertrieb = entries.filter(e => e.category === 'VERTRIEBSEINSTELLUNG').length
  console.log(`  AUSSER_HANDEL: ${ausserHandel}`)
  console.log(`  VERTRIEBSEINSTELLUNG: ${vertrieb}`)

  const { upserted } = await upsertOffMarketDrugs(entries)
  console.log(`[off-market] Upserted ${upserted} rows`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
