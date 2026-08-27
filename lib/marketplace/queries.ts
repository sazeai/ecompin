import "server-only"

import { cache } from "react"
import { rotationPercentages } from "@/lib/marketplace/helpers"
import type { AdminPlacement, AdminProblem, BattlefieldEntry, FounderPlacementStats, ProblemDetail, ProblemSummary, PublicTrafficStats } from "@/types/marketplace"
import { createAdminClient } from "@/utils/supabase/admin"

type Row = Record<string, any>

function number(value: unknown) { return Number(value || 0) }

function toBattlefield(rows: Row[]): BattlefieldEntry[] {
  const sorted = [...rows].sort((a, b) => number(b.current_bid_cents) - number(a.current_bid_cents) || new Date(a.settled_at).getTime() - new Date(b.settled_at).getTime())
  const shares = rotationPercentages(Math.min(sorted.length, 5))
  return sorted.map((row, index) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products
    const impressions = number(row.impression_count)
    const clicks = number(row.click_count)
    return {
      placement_id: row.id,
      product_id: row.product_id,
      product_name: product?.name || "Unknown product",
      product_tagline: product?.tagline || "",
      destination_url: product?.destination_url || "#",
      registrable_domain: product?.registrable_domain || "",
      current_bid_cents: number(row.current_bid_cents),
      rank: index + 1,
      visibility_percentage: index < 5 ? (shares[index] || 0) : 0,
      eligible: index < 5,
      founding_claim: Boolean(row.founding_claim) && number(row.current_bid_cents) === 0,
      impression_count: impressions,
      click_count: clicks,
      ctr: impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : 0,
      settled_at: row.settled_at,
    }
  })
}

async function loadProblemSummaries(): Promise<ProblemSummary[]> {
  const supabase = createAdminClient()
  const { data: problems, error } = await supabase.from("problems").select("id,slug,statement,category,origin,launch_priority,support_count,impression_count,click_count,created_at,published_at").eq("status", "published").limit(200)
  if (error) throw error
  if (!problems?.length) return []
  const ids = problems.map((item: Row) => item.id)
  const since = new Date(Date.now() - 86_400_000).toISOString()
  const [{ data: placements, error: placementError }, { data: supports }, { data: clicks }] = await Promise.all([
    supabase.from("placements").select("id,problem_id,current_bid_cents,status").in("problem_id", ids).eq("status", "active"),
    supabase.from("problem_supports").select("problem_id").in("problem_id", ids).gte("created_at", since),
    supabase.from("placement_clicks").select("problem_id").in("problem_id", ids).gte("created_at", since),
  ])
  if (placementError) throw placementError
  const placementRows = placements || []
  const placementIds = placementRows.map((item: Row) => item.id)
  const { data: bids } = placementIds.length
    ? await supabase.from("bids").select("placement_id").in("placement_id", placementIds).eq("status", "settled").gte("settled_at", since)
    : { data: [] }

  const placementProblem = new Map(placementRows.map((item: Row) => [item.id, item.problem_id]))
  const supportsBy = new Map<string, number>()
  const clicksBy = new Map<string, number>()
  const bidsBy = new Map<string, number>()
  const activeBy = new Map<string, Row[]>()
  for (const item of supports || []) supportsBy.set(item.problem_id, (supportsBy.get(item.problem_id) || 0) + 1)
  for (const item of clicks || []) clicksBy.set(item.problem_id, (clicksBy.get(item.problem_id) || 0) + 1)
  for (const item of bids || []) {
    const problemId = placementProblem.get(item.placement_id)
    if (problemId) bidsBy.set(problemId, (bidsBy.get(problemId) || 0) + 1)
  }
  for (const item of placementRows) {
    const list = activeBy.get(item.problem_id) || []
    list.push(item)
    activeBy.set(item.problem_id, list)
  }

  const now = Date.now()
  return problems.map((row: Row) => {
    const active = activeBy.get(row.id) || []
    const topBid = active.reduce((max, item) => Math.max(max, number(item.current_bid_cents)), 0)
    const supports24h = supportsBy.get(row.id) || 0
    const clicks24h = clicksBy.get(row.id) || 0
    const bids24h = bidsBy.get(row.id) || 0
    // Freshness bonus decays linearly to zero across the first 24 published hours.
    const hoursOld = (now - new Date(row.published_at || row.created_at).getTime()) / 3_600_000
    const freshness = Math.max(0, 24 - hoursOld) / 6
    return {
      ...row,
      support_count: number(row.support_count), impression_count: number(row.impression_count), click_count: number(row.click_count),
      competitor_count: active.length, top_bid_cents: topBid, next_bid_cents: topBid > 0 ? topBid + 500 : 500,
      supports_24h: supports24h, clicks_24h: clicks24h, bids_24h: bids24h,
      trending_score: supports24h * 5 + clicks24h + bids24h * 10 + freshness,
    } as ProblemSummary
  })
}

// Public problem ordering is cached for two minutes so the board re-ranks on a
// visible cadence without every visitor paying for the aggregate queries.
const ORDERING_TTL_MS = 120_000
let orderingCache: { rows: ProblemSummary[]; expiresAt: number } | null = null
let orderingInFlight: Promise<ProblemSummary[]> | null = null

async function loadOrderedSummaries(): Promise<ProblemSummary[]> {
  if (orderingCache && orderingCache.expiresAt > Date.now()) return orderingCache.rows
  if (orderingInFlight) return orderingInFlight
  orderingInFlight = loadProblemSummaries()
    .then((rows) => {
      // Rank by rolling activity; fall back to curated launch priority while the market is quiet.
      rows.sort((a, b) => (b.trending_score - a.trending_score) || ((a.launch_priority || 999) - (b.launch_priority || 999)))
      orderingCache = { rows, expiresAt: Date.now() + ORDERING_TTL_MS }
      return rows
    })
    .finally(() => { orderingInFlight = null })
  return orderingInFlight
}

// Dedupe repeat calls within a single render pass on top of the cross-request TTL.
const cachedSummaries = cache(loadOrderedSummaries)

export function invalidateProblemOrdering() { orderingCache = null }

export async function getProblemSummaries(options: { search?: string; category?: string; limit?: number } = {}) {
  let rows = await cachedSummaries()
  const search = options.search?.trim().toLowerCase()
  if (search) rows = rows.filter((item) => item.statement.toLowerCase().includes(search) || item.category.toLowerCase().includes(search))
  if (options.category && options.category !== "All") rows = rows.filter((item) => item.category === options.category)
  return rows.slice(0, options.limit || 100)
}

export async function getProblemBySlug(slug: string): Promise<ProblemDetail | null> {
  const supabase = createAdminClient()
  const { data: problem, error } = await supabase.from("problems").select("*").eq("slug", slug).eq("status", "published").maybeSingle()
  if (error) throw error
  if (!problem) return null
  const [summaries, sourceResult, complaintResult, placementResult] = await Promise.all([
    getProblemSummaries(),
    supabase.from("problem_sources").select("id,source_url,source_label").eq("problem_id", problem.id).order("created_at"),
    supabase.from("problem_supports").select("id,detail,created_at").eq("problem_id", problem.id).eq("detail_status", "published").not("detail", "is", null).order("created_at", { ascending: false }).limit(30),
    supabase.from("placements").select("id,problem_id,product_id,current_bid_cents,status,founding_claim,settled_at,impression_count,click_count,products(id,name,tagline,destination_url,registrable_domain)").eq("problem_id", problem.id).eq("status", "active"),
  ])
  const summary = summaries.find((item) => item.id === problem.id)
  if (!summary) return null
  return {
    ...summary,
    sources: sourceResult.data || [],
    complaints: (complaintResult.data || []).map((item: Row) => ({ id: item.id, detail: item.detail, created_at: item.created_at })),
    battlefield: toBattlefield(placementResult.data || []),
  }
}

export async function getPublicTrafficStats(): Promise<PublicTrafficStats> {
  const supabase = createAdminClient()
  const liveSince = new Date(Date.now() - 45_000).toISOString()
  const daySince = new Date(Date.now() - 86_400_000).toISOString()
  const [{ count: live }, { count: visitors }] = await Promise.all([
    supabase.from("visitor_presence").select("visitor_key", { count: "exact", head: true }).gte("last_seen_at", liveSince),
    supabase.from("visitors").select("visitor_key", { count: "exact", head: true }).gte("last_seen_at", daySince),
  ])
  return { live_visitors: (live || 0) >= 5 ? live || 0 : null, visitors_24h: visitors || 0 }
}

export async function getBidStatus(quoteId: string) {
  const supabase = createAdminClient()
  const { data: quote } = await supabase.from("bid_quotes").select("id,status,problem_id,amount_cents,expires_at").eq("id", quoteId).maybeSingle()
  if (!quote) return null
  const { data: bid } = await supabase.from("bids").select("placement_id,status,settled_at").eq("quote_id", quoteId).maybeSingle()
  let rank: number | null = null
  if (bid?.placement_id) {
    const { data: placement } = await supabase.from("placements").select("problem_id,current_bid_cents,settled_at").eq("id", bid.placement_id).maybeSingle()
    if (placement) {
      const { data: ranked } = await supabase.from("placements").select("id,current_bid_cents,settled_at").eq("problem_id", placement.problem_id).eq("status", "active").order("current_bid_cents", { ascending: false }).order("settled_at", { ascending: true })
      rank = (ranked || []).findIndex((item: Row) => item.id === bid.placement_id) + 1 || null
    }
  }
  return { ...quote, bid, rank }
}

export async function getAdminMarketplaceData(): Promise<{ problems: AdminProblem[]; placements: AdminPlacement[] }> {
  const [summaries, supabase] = await Promise.all([getProblemSummaries(), Promise.resolve(createAdminClient())])
  const [{ data: problemRows }, { data: placementRows }] = await Promise.all([
    supabase.from("problems").select("*").order("created_at", { ascending: false }),
    supabase.from("placements").select("id,problem_id,product_id,current_bid_cents,status,founding_claim,settled_at,impression_count,click_count,problems(statement),products(id,name,tagline,destination_url,registrable_domain,owner_email)").order("settled_at", { ascending: false }),
  ])
  const summaryById = new Map(summaries.map((row) => [row.id, row]))
  const problems = (problemRows || []).map((row: Row) => ({
    ...(summaryById.get(row.id) || {
      id: row.id, slug: row.slug, statement: row.statement, category: row.category, origin: row.origin,
      launch_priority: row.launch_priority, support_count: number(row.support_count), impression_count: number(row.impression_count),
      click_count: number(row.click_count), competitor_count: 0, top_bid_cents: 0, next_bid_cents: 500,
      supports_24h: 0, clicks_24h: 0, bids_24h: 0, created_at: row.created_at, published_at: row.published_at,
    }),
    status: row.status, normalized_statement: row.normalized_statement, updated_at: row.updated_at,
  })) as AdminProblem[]
  const grouped = new Map<string, Row[]>()
  for (const row of placementRows || []) {
    const list = grouped.get(row.problem_id) || []
    list.push(row); grouped.set(row.problem_id, list)
  }
  const placements: AdminPlacement[] = []
  for (const rows of grouped.values()) {
    const battlefield = toBattlefield(rows)
    battlefield.forEach((entry, index) => {
      const row = rows.find((item: Row) => item.id === entry.placement_id)
      if (!row) return
      const product = Array.isArray(row.products) ? row.products[0] : row.products
      const problem = Array.isArray(row.problems) ? row.problems[0] : row.problems
      placements.push({ ...entry, problem_id: row.problem_id, problem_statement: problem?.statement || "", owner_email: product?.owner_email || "", status: row.status })
    })
  }
  return { problems, placements }
}

export async function getFounderStats(productId: string): Promise<{ product: Row; stats: FounderPlacementStats[] } | null> {
  const supabase = createAdminClient()
  const { data: product } = await supabase.from("products").select("id,name,tagline,destination_url,registrable_domain,owner_email,status").eq("id", productId).maybeSingle()
  if (!product) return null
  const { data: placements } = await supabase.from("placements").select("id,problem_id,product_id,current_bid_cents,status,founding_claim,settled_at,impression_count,click_count,problems(id,slug,statement,support_count)").eq("product_id", productId).order("settled_at", { ascending: false })
  const since = new Date(Date.now() - 86_400_000).toISOString()
  const ids = (placements || []).map((item: Row) => item.id)
  const [{ data: impressions }, { data: clicks }] = ids.length ? await Promise.all([
    supabase.from("placement_impressions").select("placement_id").in("placement_id", ids).gte("created_at", since),
    supabase.from("placement_clicks").select("placement_id").in("placement_id", ids).gte("created_at", since),
  ]) : [{ data: [] }, { data: [] }]
  const viewsBy = new Map<string, number>(), clicksBy = new Map<string, number>()
  for (const row of impressions || []) viewsBy.set(row.placement_id, (viewsBy.get(row.placement_id) || 0) + 1)
  for (const row of clicks || []) clicksBy.set(row.placement_id, (clicksBy.get(row.placement_id) || 0) + 1)
  const stats: FounderPlacementStats[] = []
  for (const row of placements || []) {
    const problem = Array.isArray(row.problems) ? row.problems[0] : row.problems
    const { data: competitors } = await supabase.from("placements").select("id,problem_id,product_id,current_bid_cents,status,founding_claim,settled_at,impression_count,click_count,products(id,name,tagline,destination_url,registrable_domain)").eq("problem_id", row.problem_id).eq("status", "active")
    const placement = toBattlefield(competitors || []).find((entry) => entry.placement_id === row.id)
    if (!placement || !problem) continue
    const views24 = viewsBy.get(row.id) || 0, clicks24 = clicksBy.get(row.id) || 0
    const topBid = (competitors || []).reduce((max: number, item: Row) => Math.max(max, number(item.current_bid_cents)), 0)
    stats.push({
      placement,
      problem: { id: problem.id, slug: problem.slug, statement: problem.statement, support_count: number(problem.support_count) },
      impressions_24h: views24, clicks_24h: clicks24,
      lifetime_impressions: number(row.impression_count), lifetime_clicks: number(row.click_count),
      ctr_24h: views24 ? Math.round((clicks24 / views24) * 1000) / 10 : 0,
      next_bid_cents: topBid > 0 ? topBid + 500 : 500,
      competitor_count: (competitors || []).length,
    })
  }
  return { product, stats }
}
