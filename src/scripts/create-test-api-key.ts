/**
 * Creates a test API key in the DB and prints the dashboard magic link.
 * Usage: npx tsx src/scripts/create-test-api-key.ts [tier]
 * Example: npx tsx src/scripts/create-test-api-key.ts professional
 */
import { prisma } from '../lib/prisma'
import { generateApiKey, signMagicToken, tierDailyLimit, encryptApiKeyValue } from '../lib/api-keys'
const tier = (process.argv[2] ?? 'professional') as string
const email = `test-${Date.now()}@example.com`
const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000'

async function main() {
  const { plaintext, hash } = generateApiKey()

  const customer = await prisma.stripeCustomer.upsert({
    where: { email },
    create: { email, stripeId: `test_${Date.now()}` },
    update: {},
  })

  const apiKey = await prisma.apiKey.create({
    data: {
      customerId: customer.id,
      keyHash: hash,
      keyEncrypted: encryptApiKeyValue(plaintext),
      tier,
      dailyLimit: tierDailyLimit(tier),
    },
  })

  const token = await signMagicToken(apiKey.id, email)

  console.log('\n=== Test API Key ===')
  console.log(`Tier:      ${tier}`)
  console.log(`Email:     ${email}`)
  console.log(`Plaintext: ${plaintext}`)
  console.log(`\nDashboard: ${SITE_URL}/api-keys?token=${token}`)
  console.log('\nLink in Browser öffnen um das Dashboard zu testen.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
