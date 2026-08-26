import "server-only"

import { createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"

export const ADMIN_COOKIE = "steal_admin"

function getAdminSecret() {
  return process.env.STEAL_ADMIN_PASSWORD || ""
}

export function createAdminToken() {
  const secret = getAdminSecret()
  if (!secret) return ""
  return createHmac("sha256", secret).update("steal.lol-admin-v1").digest("hex")
}

export function verifyAdminPassword(password: string) {
  const secret = getAdminSecret()
  if (!secret) return false
  const supplied = Buffer.from(password)
  const expected = Buffer.from(secret)
  return supplied.length === expected.length && timingSafeEqual(supplied, expected)
}

export async function isAdminAuthenticated() {
  const expected = createAdminToken()
  if (!expected) return false
  const supplied = (await cookies()).get(ADMIN_COOKIE)?.value || ""
  const suppliedBuffer = Buffer.from(supplied)
  const expectedBuffer = Buffer.from(expected)
  return suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer)
}
