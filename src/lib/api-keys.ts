import { randomBytes, createHash } from 'crypto'
import { SignJWT, jwtVerify } from 'jose'

const TIER_LIMITS: Record<string, number> = {
  free: 100,
  research: 2000,
  professional: 10000,
  institutional: 100000,
  data_license: 999999999,
}

export function generateApiKey(): { plaintext: string; hash: string } {
  const plaintext = randomBytes(32).toString('hex')
  const hash = createHash('sha256').update(plaintext).digest('hex')
  return { plaintext, hash }
}

export function tierDailyLimit(tier: string): number {
  return TIER_LIMITS[tier] ?? 100
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.API_KEY_JWT_SECRET
  if (!secret) throw new Error('API_KEY_JWT_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export async function signMagicToken(keyId: string, email: string): Promise<string> {
  return new SignJWT({ keyId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(getJwtSecret())
}

export async function verifyMagicToken(token: string): Promise<{ keyId: string; email: string }> {
  const { payload } = await jwtVerify(token, getJwtSecret())
  if (typeof payload.keyId !== 'string' || typeof payload.email !== 'string') {
    throw new Error('Invalid token payload')
  }
  return { keyId: payload.keyId, email: payload.email }
}
