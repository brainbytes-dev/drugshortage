// Test environment defaults. Several modules (Prisma, scrapers, API key
// helpers) throw at import time if their env vars are missing, which
// short-circuits Jest's "Test suite failed to run". Set safe fakes here
// — individual tests can still override via process.env overrides in
// beforeEach.

const FAKES: Record<string, string> = {
  DATABASE_URL: 'postgres://test:test@localhost:5432/testdb',
  DIRECT_URL: 'postgres://test:test@localhost:5432/testdb',
  ENCHARGE_API_KEY: 'test-encharge-key',
  ENCHARGE_WRITE_KEY: 'test-encharge-write-key',
  RESEND_API_KEY: 'test-resend-key',
  STRIPE_SECRET_KEY: 'sk_test_fake',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_fake',
  UPSTASH_REDIS_REST_URL: 'https://fake.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'fake-token',
  CRON_SECRET: 'test-cron-secret',
  REPORT_SECRET: 'test-report-secret',
  // 32-byte (64 hex char) encryption key for api-keys.ts
  API_KEY_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
}

for (const [k, v] of Object.entries(FAKES)) {
  if (!process.env[k]) process.env[k] = v
}
