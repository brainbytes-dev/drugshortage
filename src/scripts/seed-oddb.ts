import { fetchOddbProducts } from '../lib/oddb-scraper'
import { upsertOddbProducts } from '../lib/db'

async function main() {
  console.log('Downloading oddb_product.xml (~41MB)...')
  const products = await fetchOddbProducts()
  console.log(`Parsed ${products.length} products`)

  console.log('Upserting to DB...')
  const { upserted } = await upsertOddbProducts(products)
  console.log(`Done! Upserted: ${upserted}`)
}

main().catch(console.error).finally(() => process.exit(0))
