import "server-only"

import { createAdminClient } from "@/utils/supabase/admin"
import type { Offer, OfferPrivate, Opportunity, OpportunityPrivate } from "@/types/marketplace"

const opportunityPublicFields = "id, slug, leaving_product, monthly_spend, reason, status, is_demo, created_at"
const offerPublicFields = "id, opportunity_id, product_name, product_url, offer_text, payment_status, is_hidden, published_at, created_at"

export async function getMarketplaceOpportunities(): Promise<Opportunity[]> {
  const supabase = createAdminClient()
  const { data: opportunities, error } = await supabase
    .from("opportunities")
    .select(opportunityPublicFields)
    .eq("status", "active")
    .order("is_demo", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(60)

  if (error) throw error
  if (!opportunities?.length) return []

  const ids = opportunities.map((item: { id: string }) => item.id)
  const { data: paidOffers, error: offerError } = await supabase
    .from("offers")
    .select("opportunity_id, product_name")
    .in("opportunity_id", ids)
    .eq("payment_status", "paid")
    .eq("is_hidden", false)

  if (offerError) throw offerError

  const counts = new Map<string, number>()
  const products = new Map<string, string[]>()
  for (const offer of paidOffers || []) {
    counts.set(offer.opportunity_id, (counts.get(offer.opportunity_id) || 0) + 1)
    const names = products.get(offer.opportunity_id) || []
    if (!names.includes(offer.product_name)) names.push(offer.product_name)
    products.set(offer.opportunity_id, names)
  }

  return opportunities.map((item: Omit<Opportunity, "offer_count" | "offer_products">) => ({
    ...item,
    offer_count: counts.get(item.id) || 0,
    offer_products: products.get(item.id) || [],
  }))
}

export async function getOpportunityBySlug(slug: string): Promise<OpportunityPrivate | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("opportunities")
    .select(`${opportunityPublicFields}, customer_email`)
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const { count, error: countError } = await supabase
    .from("offers")
    .select("id", { count: "exact", head: true })
    .eq("opportunity_id", data.id)
    .eq("payment_status", "paid")
    .eq("is_hidden", false)

  if (countError) throw countError
  return { ...data, offer_count: count || 0, offer_products: [] }
}

export async function getPaidOffers(opportunityId: string): Promise<Offer[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("offers")
    .select(offerPublicFields)
    .eq("opportunity_id", opportunityId)
    .eq("payment_status", "paid")
    .eq("is_hidden", false)
    .order("published_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function getAdminMarketplaceData(): Promise<{
  opportunities: OpportunityPrivate[]
  offers: OfferPrivate[]
}> {
  const supabase = createAdminClient()
  const [{ data: opportunities, error: opportunityError }, { data: offers, error: offerError }] = await Promise.all([
    supabase.from("opportunities").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("offers").select("*").order("created_at", { ascending: false }).limit(300),
  ])

  if (opportunityError) throw opportunityError
  if (offerError) throw offerError

  return {
    opportunities: (opportunities || []).map((item) => ({ ...item, offer_count: 0, offer_products: [] })),
    offers: offers || [],
  }
}
