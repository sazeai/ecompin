import { NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { isAdminAuthenticated } from "@/lib/marketplace/admin-auth"
import { createAdminClient } from "@/utils/supabase/admin"

export const runtime = "nodejs"

function hasCronSecret(request: Request) {
  const configured = process.env.MAINTENANCE_CRON_SECRET
  if (!configured) return false
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || ""
  const a = Buffer.from(supplied)
  const b = Buffer.from(configured)
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Retention sweep. Callable either by a signed-in admin or by a scheduler
 * presenting MAINTENANCE_CRON_SECRET. Idempotent, so a missed run is harmless.
 */
export async function POST(request: Request) {
  if (!hasCronSecret(request) && !await isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }
  const { data, error } = await createAdminClient().rpc("purge_expired_traffic")
  if (error) {
    console.error("FIXTHIS retention sweep failed", error)
    return NextResponse.json({ error: "Retention sweep failed." }, { status: 500 })
  }
  const result = data?.[0] || {}
  console.info("FIXTHIS retention sweep", result)
  return NextResponse.json({ ok: true, ...result })
}
