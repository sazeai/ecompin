import { NextResponse } from "next/server"
import { z } from "zod"
import { sendManagementLink } from "@/lib/marketplace/email"
import { getAppUrl, getRequestIp, isKnownBot } from "@/lib/marketplace/helpers"
import { jsonError, mutationAllowed } from "@/lib/marketplace/http"
import { createManagementToken } from "@/lib/marketplace/management"
import { checkMarketplaceRateLimit } from "@/lib/marketplace/rate-limit"
import { verifyTurnstile } from "@/lib/marketplace/turnstile"
import { firstZodError } from "@/lib/marketplace/validation"
import { createAdminClient } from "@/utils/supabase/admin"

export const runtime = "nodejs"

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(254),
  turnstileToken: z.string().optional().default(""),
  website: z.string().max(0).optional().default(""),
})

// Always the same response, whether or not the email owns a placement. Telling
// a caller "no such advertiser" would turn this into an email-enumeration oracle.
const GENERIC = { ok: true, message: "If that email manages a placement, a fresh management link is on its way." }

export async function POST(request: Request) {
  if (!mutationAllowed(request)) return jsonError("Invalid request origin.", 403)
  if (isKnownBot(request)) return jsonError("Automated requests are not accepted.", 403)

  const ip = getRequestIp(request)
  const limit = await checkMarketplaceRateLimit(`manage-link:${ip}`, 5)
  if (!limit.allowed) return jsonError("Too many link requests. Try again later.", 429)

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError(firstZodError(parsed.error))
  if (parsed.data.website) return NextResponse.json(GENERIC)
  if (!await verifyTurnstile(parsed.data.turnstileToken, ip)) return jsonError("Bot verification failed.", 403)

  const email = parsed.data.email.toLowerCase()
  // Per-address limit as well, so one address cannot be mail-bombed via rotating IPs.
  const perEmail = await checkMarketplaceRateLimit(`manage-link-email:${email}`, 3)
  if (!perEmail.allowed) return NextResponse.json(GENERIC)

  try {
    const supabase = createAdminClient()
    const { data: products } = await supabase.from("products").select("id,name,owner_email").eq("owner_email", email).eq("status", "active")
    const appUrl = getAppUrl(request.url)
    for (const product of products || []) {
      await sendManagementLink(product.owner_email, createManagementToken(product.id, product.owner_email), product.name, appUrl)
    }
  } catch (error) {
    // Never surface the failure shape to the caller; it would leak existence.
    console.error("Management link request failed", error)
  }

  return NextResponse.json(GENERIC)
}
