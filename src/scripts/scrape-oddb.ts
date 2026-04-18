import { fetchOddbProducts, fetchOddbArticlePrices } from '../lib/oddb-scraper'
import { upsertOddbProducts, upsertOddbPrices, syncErloschenFromOddb } from '../lib/db'

async function main() {
  console.log('[oddb] Fetching products...')
  const products = await fetchOddbProducts()
  console.log(`[oddb] Fetched ${products.length} products`)
  const { upserted } = await upsertOddbProducts(products)
  console.log(`[oddb] Products upserted: ${upserted}`)

  console.log('[oddb] Fetching article prices + SALECD...')
  const prices = await fetchOddbArticlePrices()
  console.log(`[oddb] Fetched ${prices.length} articles`)
  const { upserted: pricesUpserted } = await upsertOddbPrices(prices)
  console.log(`[oddb] Prices/status upserted: ${pricesUpserted}`)

  console.log('[oddb] Syncing Nicht-mehr-erhältlich from authStatus...')
  const { upserted: erloschenUpserted } = await syncErloschenFromOddb()
  console.log(`[oddb] Nicht-mehr-erhältlich upserted: ${erloschenUpserted}`)
}

main().catch(err => {
  console.error('[oddb] Error:', err)
  process.exit(1)
})
