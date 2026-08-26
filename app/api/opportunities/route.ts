import { NextResponse } from "next/server"

import { createOpportunitySlug, getRequestIp } from "@/lib/marketplace/helpers"
import { checkMarketplaceRateLimit } from "@/lib/marketplace/rate-limit"
import { firstZodError, opportunitySchema } from "@/lib/marketplace/validation"
import { createAdminClient } from "@/utils/supabase/admin"

export async function POST(request: Request) {
  const ip = getRequestIp(request)
  const rateLimit = checkMarketplaceRateLimit(`opportunity:${ip}`, 5)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "You've listed a few products already. Try again in an hour." }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const parsed = opportunitySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 })
  }

  if (parsed.data.website) {
    return NextResponse.json({ error: "This submission could not be accepted." }, { status: 400 })
  }

  const supabase = createAdminClient()
  const opportunity = {
    leaving_product: parsed.data.leavingProduct,
    monthly_spend: parsed.data.monthlySpend,
    reason: parsed.data.reason,
    customer_email: parsed.data.email.toLowerCase(),
    status: "active",
    is_demo: false,
  }

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const slug = createOpportunitySlug(parsed.data.leavingProduct)
    const { error } = await supabase.from("opportunities").insert({ ...opportunity, slug })

    if (!error) return NextResponse.json({ slug }, { status: 201 })
    if (error.code !== "23505") {
      console.error("Opportunity insert failed:", error)
      return NextResponse.json({ error: "Your listing couldn't be created. Try again." }, { status: 500 })
    }
  }

  return NextResponse.json({ error: "Your listing couldn't be created. Try again." }, { status: 500 })
}
