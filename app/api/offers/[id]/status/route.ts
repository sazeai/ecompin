import { NextResponse } from "next/server"

import { createAdminClient } from "@/utils/supabase/admin"

export const dynamic = "force-dynamic"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("offers")
    .select("payment_status, opportunity_id, opportunities(slug, leaving_product)")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("Offer status lookup failed:", error)
    return NextResponse.json({ error: "Offer status couldn't be loaded." }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: "Offer not found." }, { status: 404 })

  const opportunity = Array.isArray(data.opportunities) ? data.opportunities[0] : data.opportunities
  return NextResponse.json({
    status: data.payment_status,
    opportunitySlug: opportunity?.slug || null,
    leavingProduct: opportunity?.leaving_product || null,
  })
}
