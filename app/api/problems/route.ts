import { NextResponse } from "next/server"
import { createProblemSubscription } from "@/lib/marketplace/email"
import { createProblemSlug, getRequestIp, isKnownBot, normalizeProblemStatement } from "@/lib/marketplace/helpers"
import { diceSimilarity, jsonError, mutationAllowed } from "@/lib/marketplace/http"
import { checkMarketplaceRateLimit } from "@/lib/marketplace/rate-limit"
import { verifyTurnstile } from "@/lib/marketplace/turnstile"
import { getVisitorKey } from "@/lib/marketplace/visitor"
import { assessUserContent, firstZodError, problemSchema } from "@/lib/marketplace/validation"
import { getProblemSummaries } from "@/lib/marketplace/queries"
import { createAdminClient } from "@/utils/supabase/admin"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const problems = await getProblemSummaries({ search: url.searchParams.get("q") || undefined, category: url.searchParams.get("category") || undefined })
  return NextResponse.json({ problems })
}

export async function POST(request: Request) {
  if (!mutationAllowed(request)) return jsonError("Invalid request origin.", 403)
  if (isKnownBot(request)) return jsonError("Automated submissions are not accepted.", 403)
  const ip = getRequestIp(request)
  const limit = await checkMarketplaceRateLimit(`problem:${ip}`, 5)
  if (!limit.allowed) return jsonError("You have submitted several problems. Try again later.", 429)
  const parsed = problemSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError(firstZodError(parsed.error))
  if (parsed.data.website) return jsonError("This submission could not be accepted.")
  if (!await verifyTurnstile(parsed.data.turnstileToken, ip)) return jsonError("Bot verification failed. Refresh and try again.", 403)

  const normalized = normalizeProblemStatement(parsed.data.statement)
  const supabase = createAdminClient()
  const { data: existingRows } = await supabase.from("problems").select("id,slug,normalized_statement").in("status", ["published", "pending"]).limit(300)
  const duplicate = (existingRows || []).map((item) => ({ ...item, similarity: diceSimilarity(normalized, item.normalized_statement) })).sort((a, b) => b.similarity - a.similarity)[0]
  if (duplicate?.similarity >= 0.72) return NextResponse.json({ duplicate: true, slug: duplicate.slug, problemId: duplicate.id }, { status: 409 })

  const assessment = assessUserContent(parsed.data.statement)
  if (!assessment.safe && assessment.reason?.includes("not allowed")) return jsonError(assessment.reason)
  const status = assessment.safe ? "published" : "pending"
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const slug = createProblemSlug(parsed.data.statement)
    const { data: problem, error } = await supabase.from("problems").insert({
      slug, statement: parsed.data.statement, normalized_statement: normalized, category: parsed.data.category,
      origin: parsed.data.origin, status, published_at: status === "published" ? new Date().toISOString() : null,
    }).select("id,slug").single()
    if (!error && problem) {
      if (status === "published" && parsed.data.origin === "user") {
        const visitorKey = await getVisitorKey()
        await supabase.rpc("support_problem", { p_problem_id: problem.id, p_visitor_key: visitorKey, p_detail: null, p_detail_status: "none" })
      }
      if (parsed.data.email) await createProblemSubscription(problem.id, parsed.data.email, new URL(request.url).origin).catch(console.error)
      return NextResponse.json({ ...problem, status }, { status: 201 })
    }
    if (error?.code !== "23505") { console.error("Problem insert failed", error); return jsonError("The problem could not be published.", 500) }
  }
  return jsonError("The problem could not be published.", 500)
}
