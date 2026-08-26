import "server-only"

import { NextResponse } from "next/server"
import { Webhook } from "standardwebhooks"

import { sendOfferPublishedEmail } from "@/lib/marketplace/email"
import { getAppUrl } from "@/lib/marketplace/helpers"
import { createAdminClient } from "@/utils/supabase/admin"

export const runtime = "nodejs"

type LooseObject = Record<string, unknown>

function asObject(value: unknown): LooseObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as LooseObject : {}
}

function getWebhookHeaders(request: Request) {
  return {
    "webhook-id": request.headers.get("webhook-id") || "",
    "webhook-signature": request.headers.get("webhook-signature") || "",
    "webhook-timestamp": request.headers.get("webhook-timestamp") || "",
  }
}

export async function POST(request: Request) {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET || process.env.DODO_WEBHOOK_SECRET
  if (!secret) {
    console.error("Dodo webhook secret is not configured")
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 })
  }

  const rawBody = await request.text()
  const webhookHeaders = getWebhookHeaders(request)
  if (!webhookHeaders["webhook-id"] || !webhookHeaders["webhook-signature"] || !webhookHeaders["webhook-timestamp"]) {
    return NextResponse.json({ error: "Missing webhook signature." }, { status: 400 })
  }

  try {
    await new Webhook(secret).verify(rawBody, webhookHeaders)
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 })
  }

  let payload: LooseObject
  try {
    payload = asObject(JSON.parse(rawBody))
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 })
  }

  const eventType = payload.type || payload.event_type || payload.event
  if (eventType !== "payment.succeeded") {
    return NextResponse.json({ ok: true, ignored: true })
  }

  const payloadData = asObject(payload.data)
  const resource = asObject(payloadData.object || payload.data || payload.object || payload)
  if (String(resource.status || "").toLowerCase() !== "succeeded") {
    return NextResponse.json({ ok: true, ignored: true })
  }

  const metadata = asObject(resource.metadata || payload.metadata)
  const offerId = typeof metadata.offer_id === "string" ? metadata.offer_id : ""
  if (!offerId || metadata.checkout_type !== "competitor_offer") {
    return NextResponse.json({ ok: true, ignored: true })
  }

  const configuredProductId = process.env.DODO_OFFER_PRODUCT_ID
  const paidProductIds = (Array.isArray(resource.product_cart) ? resource.product_cart : [])
    .map((item) => asObject(item).product_id)
    .filter(Boolean)
  if (configuredProductId && paidProductIds.length > 0 && !paidProductIds.includes(configuredProductId)) {
    return NextResponse.json({ error: "Payment product mismatch." }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error: eventError } = await supabase.from("dodopayments_events").insert({
    dodopayments_event_id: webhookHeaders["webhook-id"],
  })

  if (eventError?.code === "23505") {
    return NextResponse.json({ ok: true, idempotent: true })
  }
  if (eventError) {
    console.error("Webhook idempotency insert failed:", eventError)
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 })
  }

  try {
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select("id, opportunity_id, product_name, product_url, offer_text, payment_status, dodopayments_session_id, opportunities(leaving_product, customer_email, slug, status, is_demo)")
      .eq("id", offerId)
      .maybeSingle()

    if (offerError || !offer) throw offerError || new Error("Offer not found")

    const opportunity = Array.isArray(offer.opportunities) ? offer.opportunities[0] : offer.opportunities
    if (!opportunity || opportunity.status !== "active" || opportunity.is_demo) {
      throw new Error("Offer opportunity is unavailable")
    }

    const checkoutSessionId = resource.checkout_session_id || asObject(resource.checkout_session).id
    if (checkoutSessionId && offer.dodopayments_session_id && checkoutSessionId !== offer.dodopayments_session_id) {
      throw new Error("Checkout session mismatch")
    }

    if (offer.payment_status !== "paid") {
      const { error: publishError } = await supabase
        .from("offers")
        .update({ payment_status: "paid", published_at: new Date().toISOString() })
        .eq("id", offer.id)
        .eq("payment_status", "pending_payment")

      if (publishError) throw publishError

      try {
        await sendOfferPublishedEmail({
          customerEmail: opportunity.customer_email,
          leavingProduct: opportunity.leaving_product,
          productName: offer.product_name,
          productUrl: offer.product_url,
          offerText: offer.offer_text,
          opportunityUrl: `${getAppUrl(request.url)}/o/${opportunity.slug}`,
        })
      } catch (emailError) {
        console.error("Paid-offer notification failed:", emailError)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Offer webhook processing failed:", error)
    await supabase.from("dodopayments_events").delete().eq("dodopayments_event_id", webhookHeaders["webhook-id"])
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 })
  }
}
