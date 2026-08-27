export type ProblemOrigin = "curated" | "user" | "founder"
export type ProblemStatus = "published" | "pending" | "hidden"
export type PlacementStatus = "active" | "suspended" | "hidden"
export type BidStatus = "settled" | "suspended" | "revoked"
export type PaymentState = "processing" | "settled" | "failed" | "cancelled"

export type ProblemSource = { id: string; source_url: string; source_label: string }
export type ProblemComplaint = { id: string; detail: string; created_at: string }

export type ProblemSummary = {
  id: string
  slug: string
  statement: string
  category: string
  origin: ProblemOrigin
  launch_priority: number | null
  support_count: number
  impression_count: number
  click_count: number
  competitor_count: number
  top_bid_cents: number
  next_bid_cents: number
  supports_24h: number
  clicks_24h: number
  bids_24h: number
  trending_score: number
  created_at: string
  published_at: string | null
}

export type ProblemSectionId = "trending" | "contested" | "fresh" | "unclaimed"

export type ProblemSection = {
  id: ProblemSectionId
  title: string
  blurb: string
  problems: ProblemSummary[]
}

export type RotationShare = { rank: number; percentage: number }

export type FeaturedPlacement = {
  placement_id: string
  product_id: string
  product_name: string
  product_tagline: string
  destination_url: string
  registrable_domain: string
  claim_kind: "founding" | "paid"
  impression_count: number
  click_count: number
}

export type BattlefieldEntry = {
  placement_id: string
  product_id: string
  product_name: string
  product_tagline: string
  destination_url: string
  registrable_domain: string
  current_bid_cents: number
  rank: number
  visibility_percentage: number
  eligible: boolean
  founding_claim: boolean
  impression_count: number
  click_count: number
  ctr: number
  settled_at: string
}

export type ProblemDetail = ProblemSummary & {
  sources: ProblemSource[]
  complaints: ProblemComplaint[]
  battlefield: BattlefieldEntry[]
}

export type PublicTrafficStats = { live_visitors: number | null; visitors_24h: number }

export type BidQuote = {
  quote_id: string
  minimum_cents: number
  amount_cents: number
  expires_at: string
  checkout_url?: string
}

export type FounderPlacementStats = {
  placement: BattlefieldEntry
  problem: Pick<ProblemSummary, "id" | "slug" | "statement" | "support_count">
  impressions_24h: number
  clicks_24h: number
  lifetime_impressions: number
  lifetime_clicks: number
  ctr_24h: number
  /** Minimum a rebid on this problem must meet right now. */
  next_bid_cents: number
  /** Rank 1 with more than one competitor means there is nothing left to take. */
  competitor_count: number
}

export type AdminProblem = ProblemSummary & {
  status: ProblemStatus
  normalized_statement: string
  updated_at: string
}

export type AdminPlacement = BattlefieldEntry & {
  problem_id: string
  problem_statement: string
  owner_email: string
  status: PlacementStatus
}
