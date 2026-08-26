import { NextResponse } from "next/server"

import { getDodoClient } from "@/lib/dodopayments-server"
import { getAppUrl, getRequestIp } from "@/lib/marketplace/helpers"
import { checkMarketplaceRateLimit } from "@/lib/marketplace/rate-limit"
import { firstZodError, offerSchema } from "@/lib/marketplace/validation"
import { createAdminClient } from "@/utils/supabase/admin"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const ip = getRequestIp(request)
  const rateLimit = checkMarketplaceRateLimit(`offer:${ip}`, 20)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many payment attempts. Try again in an hour." }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const parsed = offerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 })
  }

  if (parsed.data.website) {
    return NextResponse.json({ error: "This submission could not be accepted." }, { status: 400 })
  }

  const productId = process.env.DODO_OFFER_PRODUCT_ID
  if (!productId) {
    console.error("DODO_OFFER_PRODUCT_ID is not configured")
    return NextResponse.json({ error: "Payment isn't configured yet. Try again shortly." }, { status: 503 })
  }

  const supabase = createAdminClient()
  const { data: opportunity, error: opportunityError } = await supabase
    .from("opportunities")
    .select("id, slug, leaving_product, status, is_demo")
    .eq("id", parsed.data.opportunityId)
    .maybeSingle()

  if (opportunityError) {
    console.error("Opportunity lookup failed:", opportunityError)
    return NextResponse.json({ error: "This listing couldn't be loaded." }, { status: 500 })
  }
  if (!opportunity || opportunity.status !== "active") {
    return NextResponse.json({ error: "This listing is no longer accepting offers." }, { status: 404 })
  }
  if (opportunity.is_demo) {
    return NextResponse.json({ error: "Demo listings don't accept paid offers. Pick a live listing instead." }, { status: 400 })
  }

  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .insert({
      opportunity_id: opportunity.id,
      product_name: parsed.data.productName,
      product_url: parsed.data.productUrl,
      offer_text: parsed.data.offerText,
      provider_email: parsed.data.email.toLowerCase(),
      payment_status: "pending_payment",
    })
    .select("id")
    .single()

  if (offerError || !offer) {
    console.error("Offer insert failed:", offerError)
    return NextResponse.json({ error: "Your offer couldn't be prepared. Try again." }, { status: 500 })
  }

  try {
    const appUrl = getAppUrl(request.url)
    const client = getDodoClient()
    const session = await client.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email: parsed.data.email },
      return_url: `${appUrl}/offer/success?offer_id=${encodeURIComponent(offer.id)}`,
      cancel_url: `${appUrl}/o/${encodeURIComponent(opportunity.slug)}?payment=cancelled`,
      metadata: {
        offer_id: offer.id,
        opportunity_id: opportunity.id,
        checkout_type: "competitor_offer",
      },
      feature_flags: {
        allow_discount_code: false,
        allow_phone_number_collection: false,
        redirect_immediately: true,
      },
      customization: {
        theme_config: { font_size: "md", radius: "10px" },
      },
    })

    if (!session.checkout_url) throw new Error("Dodo did not return a checkout URL")

    const { error: sessionError } = await supabase
      .from("offers")
      .update({ dodopayments_session_id: session.session_id })
      .eq("id", offer.id)
      .eq("payment_status", "pending_payment")

    if (sessionError) throw sessionError
    return NextResponse.json({ checkoutUrl: session.checkout_url, offerId: offer.id })
  } catch (error) {
    console.error("Dodo offer checkout failed:", error)
    return NextResponse.json({ error: "Payment couldn't be started. Try again." }, { status: 502 })
  }
}
