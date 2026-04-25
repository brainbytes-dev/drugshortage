import { fetchOddbProducts, fetchOddbArticlePrices } from '../lib/oddb-scraper'
import { prisma } from '../lib/prisma'

const CHUNK = 500

/** Bulk upsert via single INSERT ... ON CONFLICT per chunk — works within pooler connection limits. */
async function bulkUpsertProducts(products: Awaited<ReturnType<typeof fetchOddbProducts>>) {
  let total = 0
  for (let i = 0; i < products.length; i += CHUNK) {
    const chunk = products.slice(i, i + CHUNK)
    const values = chunk.map((p) => [
      p.gtin, p.prodno, p.bezeichnungDe, p.atcCode,
      p.substanz ?? null, p.zusammensetzung ?? null, p.authStatus ?? null,
    ])

    // Build parameterized query
    const placeholders = values.map((_, idx) => {
      const base = idx * 7
      return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},NOW())`
    }).join(',')
    const flat = values.flat()

    await prisma.$executeRawUnsafe(`
      INSERT INTO oddb_products (gtin, prodno, "bezeichnungDe", "atcCode", substanz, zusammensetzung, "authStatus", "fetchedAt")
      VALUES ${placeholders}
      ON CONFLICT (gtin) DO UPDATE SET
        prodno         = EXCLUDED.prodno,
        "bezeichnungDe" = EXCLUDED."bezeichnungDe",
        "atcCode"      = EXCLUDED."atcCode",
        substanz       = EXCLUDED.substanz,
        zusammensetzung = EXCLUDED.zusammensetzung,
        "authStatus"   = EXCLUDED."authStatus",
        "fetchedAt"    = NOW()
    `, ...flat)

    total += chunk.length
    if (total % 10000 === 0 || total === products.length) {
      process.stdout.write(`\r  ${total.toLocaleString()} / ${products.length.toLocaleString()}`)
    }
  }
  console.log()
  return total
}

async function bulkUpsertPrices(prices: Awaited<ReturnType<typeof fetchOddbArticlePrices>>) {
  let total = 0
  for (let i = 0; i < prices.length; i += CHUNK) {
    const chunk = prices.slice(i, i + CHUNK)
    const gtins  = chunk.map(p => p.gtin)
    const ppubs  = chunk.map(p => p.ppub)
    const pexfs  = chunk.map(p => p.pexf)
    const firmas = chunk.map(p => p.firma ?? null)
    const salecds = chunk.map(p => p.salecd ?? null)

    // Single UPDATE per chunk via unnest arrays
    await prisma.$executeRawUnsafe(`
      UPDATE oddb_products SET
        ppub        = data.ppub::float8,
        pexf        = data.pexf::float8,
        firma       = COALESCE(data.firma, oddb_products.firma),
        "authStatus" = CASE
                        WHEN data.salecd = 'I' THEN 'E'
                        WHEN data.salecd = 'A' THEN 'A'
                        ELSE oddb_products."authStatus"
                      END,
        "fetchedAt" = NOW()
      FROM (
        SELECT
          UNNEST($1::text[])   AS gtin,
          UNNEST($2::float8[]) AS ppub,
          UNNEST($3::float8[]) AS pexf,
          UNNEST($4::text[])   AS firma,
          UNNEST($5::text[])   AS salecd
      ) AS data
      WHERE oddb_products.gtin = data.gtin
    `, gtins, ppubs, pexfs, firmas, salecds)

    total += chunk.length
    if (total % 10000 === 0 || total === prices.length) {
      process.stdout.write(`\r  ${total.toLocaleString()} / ${prices.length.toLocaleString()}`)
    }
  }
  console.log()
  return total
}

async function main() {
  console.log('Downloading oddb_product.xml (~41 MB)...')
  const products = await fetchOddbProducts()
  console.log(`Parsed ${products.length.toLocaleString()} products`)

  console.log('Bulk-upserting products...')
  const upserted = await bulkUpsertProducts(products)
  console.log(`Done: ${upserted.toLocaleString()} rows`)

  console.log('Downloading oddb_article.xml (~80 MB) for prices + firma...')
  const prices = await fetchOddbArticlePrices()
  console.log(`Parsed ${prices.length.toLocaleString()} price/firma entries`)

  console.log('Updating prices + firma...')
  const updated = await bulkUpsertPrices(prices)
  console.log(`Done: ${updated.toLocaleString()} rows`)

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
