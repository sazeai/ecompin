import "server-only"
import { createHmac, randomBytes } from "crypto"
import { cookies } from "next/headers"

export const VISITOR_COOKIE = "fixthis_visitor"

function visitorSecret() {
  const value = process.env.VISITOR_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.FIXTHIS_ADMIN_PASSWORD
  if (!value) throw new Error("VISITOR_HASH_SECRET is not configured")
  return value
}

export function hashVisitorToken(token: string) { return createHmac("sha256", visitorSecret()).update(token).digest("hex") }
export async function getVisitorKey() {
  const token = (await cookies()).get(VISITOR_COOKIE)?.value
  if (!token || token.length < 32) throw new Error("Anonymous visitor cookie is missing")
  return hashVisitorToken(token)
}
export function newVisitorToken() { return randomBytes(24).toString("base64url") }
export function dailyIpKey(ip: string) {
  const day = new Date().toISOString().slice(0, 10)
  return createHmac("sha256", visitorSecret()).update(`${day}:${ip}`).digest("hex")
}
