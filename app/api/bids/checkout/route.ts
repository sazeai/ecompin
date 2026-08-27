import { NextResponse } from "next/server"
import { getDodoClient } from "@/lib/dodopayments-server"
import { getAppUrl, getRequestIp, isKnownBot, normalizeProductUrl } from "@/lib/marketplace/helpers"
import { jsonError, mutationAllowed } from "@/lib/marketplace/http"
import { checkMarketplaceRateLimit } from "@/lib/marketplace/rate-limit"
import { verifyTurnstile } from "@/lib/marketplace/turnstile"
import { bidSchema, firstZodError } from "@/lib/marketplace/validation"
import { createAdminClient } from "@/utils/supabase/admin"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (!mutationAllowed(request)) return jsonError("Invalid request origin.", 403)
  if (isKnownBot(request)) return jsonError("Automated checkout is not allowed.", 403)
  const ip = getRequestIp(request)
  const limit = await checkMarketplaceRateLimit(`bid:${ip}`, 10)
  if (!limit.allowed) return jsonError("Too many checkout attempts. Try again later.", 429)
  const parsed = bidSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError(firstZodError(parsed.error))
  if (parsed.data.website) return jsonError("This checkout could not be started.")
  if (!await verifyTurnstile(parsed.data.turnstileToken, ip)) return jsonError("Bot verification failed.", 403)

  const productId = process.env.DODO_BID_PRODUCT_ID
  if (!productId) return jsonError("Payments are not configured yet.", 503)
  let product: ReturnType<typeof normalizeProductUrl>
  try { product = normalizeProductUrl(parsed.data.destinationUrl) } catch (error) { return jsonError(error instanceof Error ? error.message : "Enter a valid product URL.") }

  const supabase = createAdminClient()
  const { data: problem } = await supabase.from("problems").select("id,slug,status").eq("id", parsed.data.problemId).eq("status", "published").maybeSingle()
  if (!problem) return jsonError("Problem not found.", 404)
  const { data: quoteRows, error: quoteError } = await supabase.rpc("create_bid_quote", {
    p_problem_id: parsed.data.problemId,
    p_registrable_domain: product.registrableDomain,
    p_product_name: parsed.data.productName,
    p_product_tagline: parsed.data.productTagline,
    p_destination_url: product.destinationUrl,
    p_owner_email: parsed.data.email.toLowerCase(),
    p_amount_cents: parsed.data.amountCents,
  })
  if (quoteError || !quoteRows?.[0]) {
    const message = quoteError?.message?.includes("Minimum bid") ? quoteError.message : quoteError?.message?.includes("managed by another") ? quoteError.message : "The bid changed. Refresh and try again."
    return jsonError(message, 409)
  }
  const quote = quoteRows[0]
  try {
    const appUrl = getAppUrl(request.url)
    const session = await getDodoClient().checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1, amount: parsed.data.amountCents }],
      customer: { email: parsed.data.email },
      return_url: `${appUrl}/bid/success?quote=${encodeURIComponent(quote.quote_id)}`,
      cancel_url: `${appUrl}/problems/${problem.slug}?payment=cancelled`,
      confirm: true,
      minimal_address: true,
      metadata: { checkout_type: "fixthis_bid", quote_id: quote.quote_id, problem_id: problem.id, bid_amount_cents: String(parsed.data.amountCents) },
      feature_flags: { allow_discount_code: false, allow_phone_number_collection: false, redirect_immediately: true },
      customization: { theme_config: { font_size: "md", radius: "10px" } },
    })
    if (!session.checkout_url) throw new Error("Checkout URL missing")
    const { error: updateError } = await supabase.from("bid_quotes").update({ status: "checkout_created", checkout_session_id: session.session_id }).eq("id", quote.quote_id).eq("status", "held")
    if (updateError) throw updateError
    return NextResponse.json({ quoteId: quote.quote_id, minimumCents: quote.minimum_cents, amountCents: parsed.data.amountCents, expiresAt: quote.expires_at, checkoutUrl: session.checkout_url })
  } catch (error) {
    console.error("Dodo bid checkout failed", error)
    await supabase.from("bid_quotes").update({ status: "cancelled" }).eq("id", quote.quote_id)
    return jsonError("Payment checkout could not be started.", 502)
  }
}
