import { NextResponse } from "next/server"
import { sha256 } from "@/lib/marketplace/helpers"
import { createAdminClient } from "@/utils/supabase/admin"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get("token") || ""
  if (token.length >= 32) await createAdminClient().from("problem_subscriptions").update({ verified_at: new Date().toISOString() }).eq("verification_token_hash", sha256(token))
  return NextResponse.redirect(new URL("/?alert=confirmed", request.url))
}
