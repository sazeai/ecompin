import "server-only"

import { resend } from "@/lib/emails/client"
import { getProductHost } from "@/lib/marketplace/helpers"

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export async function sendOfferPublishedEmail(params: {
  customerEmail: string
  leavingProduct: string
  productName: string
  productUrl: string
  offerText: string
  opportunityUrl: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not configured; paid-offer notification skipped.")
    return
  }

  const from = process.env.EMAIL_FROM || "STEAL.LOL <offers@steal.lol>"
  const replyTo = process.env.EMAIL_REPLY_TO || undefined
  const productHost = getProductHost(params.productUrl)

  await resend.emails.send({
    from,
    to: params.customerEmail,
    replyTo,
    subject: `Someone wants to steal you from ${params.leavingProduct}`,
    html: `
      <div style="background:#f5f3ee;padding:40px 16px;font-family:Inter,Arial,sans-serif;color:#111">
        <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #dedbd3;border-radius:14px;overflow:hidden">
          <div style="padding:18px 24px;border-bottom:1px solid #ece9e2;font-weight:800;letter-spacing:-.03em">STEAL.LOL</div>
          <div style="padding:32px 24px">
            <p style="margin:0 0 8px;color:#e04f35;font-size:12px;font-weight:800;letter-spacing:.12em">NEW PAID OFFER</p>
            <h1 style="margin:0 0 20px;font-size:30px;line-height:1.1">${escapeHtml(params.productName)} made you an offer.</h1>
            <p style="margin:0 0 20px;color:#5f5b55;line-height:1.6">You’re currently listed as leaving <strong>${escapeHtml(params.leavingProduct)}</strong>.</p>
            <div style="margin:0 0 24px;padding:20px;background:#f7f5f0;border:1px solid #e8e4dc;border-radius:10px">
              <p style="margin:0 0 8px;font-weight:700">${escapeHtml(params.productName)} says:</p>
              <p style="margin:0;font-size:18px;line-height:1.5">“${escapeHtml(params.offerText)}”</p>
            </div>
            <a href="${escapeHtml(params.productUrl)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:13px 18px;border-radius:9px;font-weight:700">VIEW THEIR OFFER →</a>
            <p style="margin:14px 0 0"><a href="${escapeHtml(params.opportunityUrl)}" style="color:#5f5b55">View all offers</a></p>
          </div>
          <div style="padding:16px 24px;border-top:1px solid #ece9e2;color:#7a756d;font-size:12px">${escapeHtml(productHost)} is responsible for honoring this offer. STEAL.LOL does not share your email.</div>
        </div>
      </div>`,
  })
}
