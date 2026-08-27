import "server-only"

import { createHmac, timingSafeEqual } from "crypto"

type Payload = { productId: string; email: string; expires: number }

function secret() {
  const value = process.env.MANAGEMENT_LINK_SECRET || process.env.VISITOR_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!value) throw new Error("MANAGEMENT_LINK_SECRET is not configured")
  return value
}

function signature(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url") }

export function createManagementToken(productId: string, email: string) {
  const payload = Buffer.from(JSON.stringify({ productId, email: email.toLowerCase(), expires: Date.now() + 30 * 86_400_000 } satisfies Payload)).toString("base64url")
  return `${payload}.${signature(payload)}`
}

export function verifyManagementToken(token: string): Payload | null {
  const [payload, supplied] = token.split(".")
  if (!payload || !supplied) return null
  const expected = signature(payload)
  const a = Buffer.from(supplied); const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Payload
    return parsed.expires > Date.now() && parsed.productId && parsed.email ? parsed : null
  } catch { return null }
}
