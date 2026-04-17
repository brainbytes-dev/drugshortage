import { fetchOddbProducts, fetchOddbArticlePrices } from '../lib/oddb-scraper'
import { upsertOddbProducts, upsertOddbPrices } from '../lib/db'

async function main() {
  console.log('Downloading oddb_product.xml (~41MB)...')
  const products = await fetchOddbProducts()
  console.log(`Parsed ${products.length} products`)

  console.log('Upserting products to DB...')
  const { upserted } = await upsertOddbProducts(products)
  console.log(`Products upserted: ${upserted}`)

  console.log('Downloading oddb_article.xml (~80MB) for prices...')
  const prices = await fetchOddbArticlePrices()
  console.log(`Parsed ${prices.length} price entries`)

  console.log('Upserting prices to DB...')
  const { upserted: pricesUpserted } = await upsertOddbPrices(prices)
  console.log(`Prices upserted: ${pricesUpserted}`)
}

main().catch(console.error).finally(() => process.exit(0))
