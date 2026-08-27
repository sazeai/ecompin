import { NextResponse } from "next/server"
import { createProblemSubscription } from "@/lib/marketplace/email"
import { getRequestIp, isKnownBot } from "@/lib/marketplace/helpers"
import { jsonError, mutationAllowed } from "@/lib/marketplace/http"
import { checkMarketplaceRateLimit } from "@/lib/marketplace/rate-limit"
import { verifyTurnstile } from "@/lib/marketplace/turnstile"
import { getVisitorKey } from "@/lib/marketplace/visitor"
import { assessUserContent, firstZodError, supportSchema } from "@/lib/marketplace/validation"
import { createAdminClient } from "@/utils/supabase/admin"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!mutationAllowed(request)) return jsonError("Invalid request origin.", 403)
  if (isKnownBot(request)) return jsonError("Automated activity is not counted.", 403)
  const { id } = await params
  const ip = getRequestIp(request)
  const limit = await checkMarketplaceRateLimit(`support:${ip}`, 40, "10 m")
  if (!limit.allowed) return jsonError("Too many votes. Try again later.", 429)
  const parsed = supportSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return jsonError(firstZodError(parsed.error))
  if (parsed.data.website) return jsonError("This support could not be accepted.")
  if (!await verifyTurnstile(parsed.data.turnstileToken, ip)) return jsonError("Bot verification failed.", 403)
  const visitorKey = await getVisitorKey()
  const assessment = parsed.data.detail ? assessUserContent(parsed.data.detail) : { safe: true, reason: null }
  const detailStatus = parsed.data.detail ? (assessment.safe ? "published" : "pending") : "none"
  const supabase = createAdminClient()
  const { data: problem } = await supabase.from("problems").select("id,status").eq("id", id).eq("status", "published").maybeSingle()
  if (!problem) return jsonError("Problem not found.", 404)
  const { data, error } = await supabase.rpc("support_problem", { p_problem_id: id, p_visitor_key: visitorKey, p_detail: parsed.data.detail || null, p_detail_status: detailStatus })
  if (error) { console.error("Support failed", error); return jsonError("Your support could not be recorded.", 500) }
  if (parsed.data.email) await createProblemSubscription(id, parsed.data.email, new URL(request.url).origin).catch(console.error)
  return NextResponse.json(data?.[0] || { inserted: false })
}
