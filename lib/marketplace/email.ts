import "server-only"

import { randomBytes } from "crypto"
import { EMAIL_FROM, EMAIL_REPLY_TO, resend } from "@/lib/emails/client"
import { getAppUrl, sha256 } from "@/lib/marketplace/helpers"
import { createAdminClient } from "@/utils/supabase/admin"

async function send(payload: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) { console.warn(`Email skipped: ${payload.subject}`); return }
  await resend.emails.send({ from: EMAIL_FROM, replyTo: EMAIL_REPLY_TO, ...payload })
}

export async function createProblemSubscription(problemId: string, email: string, appUrl = getAppUrl()) {
  const token = randomBytes(32).toString("base64url")
  const supabase = createAdminClient()
  const { error } = await supabase.from("problem_subscriptions").upsert({
    problem_id: problemId, email: email.toLowerCase(), verification_token_hash: sha256(token), verified_at: null,
  }, { onConflict: "problem_id,email" })
  if (error) throw error
  await send({
    to: email,
    subject: "Confirm your FIXTHIS problem alert",
    html: `<p>Confirm that you want an email when this problem gets its first solution.</p><p><a href="${appUrl}/api/subscriptions/verify?token=${encodeURIComponent(token)}">Confirm alert</a></p><p>If you did not request this, ignore this email.</p>`,
  })
}

export async function sendManagementLink(email: string, token: string, productName: string, appUrl = getAppUrl()) {
  await send({
    to: email,
    subject: `Manage ${productName} on FIXTHIS`,
    html: `<p>Your paid placement is live. Use this private link to edit the product, see traffic, or bid again.</p><p><a href="${appUrl}/manage/${encodeURIComponent(token)}">Manage ${productName}</a></p><p>This link expires in 30 days. Do not forward it.</p>`,
  })
}

export async function notifyProblemSubscribers(problemId: string, statement: string, productName: string, slug: string, appUrl = getAppUrl()) {
  const supabase = createAdminClient()
  const { data } = await supabase.from("problem_subscriptions").select("id,email").eq("problem_id", problemId).not("verified_at", "is", null).is("notified_at", null)
  for (const subscriber of data || []) {
    try {
      await send({ to: subscriber.email, subject: `${productName} claimed a problem you follow`, html: `<p>${productName} is now a featured paid solution for:</p><blockquote>${statement}</blockquote><p><a href="${appUrl}/problems/${slug}">See the problem</a></p>` })
      await supabase.from("problem_subscriptions").update({ notified_at: new Date().toISOString() }).eq("id", subscriber.id)
    } catch (error) { console.error("Problem subscriber notification failed", error) }
  }
}
