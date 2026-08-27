export type OpportunityStatus = "active" | "hidden"
export type OfferPaymentStatus = "pending_payment" | "paid" | "refunded"

export type Opportunity = {
  id: string
  slug: string
  leaving_product: string
  monthly_spend: number
  reason: string
  status: OpportunityStatus
  is_demo: boolean
  created_at: string
  offer_count: number
  offer_products: string[]
}

export type OpportunityPrivate = Opportunity & {
  customer_email: string
}

export type Offer = {
  id: string
  opportunity_id: string
  product_name: string
  product_url: string
  offer_text: string
  payment_status: OfferPaymentStatus
  is_hidden: boolean
  published_at: string | null
  created_at: string
}

export type OfferPrivate = Offer & {
  provider_email: string
  dodopayments_session_id: string | null
}
