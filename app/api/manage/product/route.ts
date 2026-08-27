import { NextResponse } from "next/server"
import { normalizeProductUrl } from "@/lib/marketplace/helpers"
import { jsonError, mutationAllowed } from "@/lib/marketplace/http"
import { verifyManagementToken } from "@/lib/marketplace/management"
import { firstZodError, productEditSchema } from "@/lib/marketplace/validation"
import { createAdminClient } from "@/utils/supabase/admin"

export async function PATCH(request: Request) {
  if (!mutationAllowed(request)) return jsonError("Invalid request origin.", 403)
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || ""
  const access = verifyManagementToken(token)
  if (!access) return jsonError("Management link is invalid or expired.", 401)
  const parsed = productEditSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError(firstZodError(parsed.error))
  let normalized: ReturnType<typeof normalizeProductUrl>
  try { normalized = normalizeProductUrl(parsed.data.destinationUrl) } catch (error) { return jsonError(error instanceof Error ? error.message : "Invalid URL.") }
  const supabase = createAdminClient()
  const { data: product } = await supabase.from("products").select("registrable_domain,owner_email").eq("id", access.productId).single()
  if (!product || product.owner_email.toLowerCase() !== access.email) return jsonError("Management access denied.", 403)
  if (normalized.registrableDomain !== product.registrable_domain) return jsonError("A management link cannot move a placement to a different product domain.")
  const { error } = await supabase.from("products").update({ name: parsed.data.name, tagline: parsed.data.tagline, destination_url: normalized.destinationUrl }).eq("id", access.productId)
  if (error) return jsonError("Product could not be updated.", 500)
  return NextResponse.json({ ok: true })
}
