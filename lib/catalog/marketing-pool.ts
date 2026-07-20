import type { SupabaseClient } from "@supabase/supabase-js"
import type { CatalogPlatform } from "./types"

type AnySb = SupabaseClient<any, "public", any>

export const DEFAULT_MARKETING_POOL_CAP = 150

const BOOST_TAGS = [
  "best seller",
  "bestseller",
  "best-seller",
  "featured",
  "popular",
  "new arrival",
  "new",
  "staff pick",
  "top rated",
]

/**
 * Compute a marketing priority score for a product row.
 * Higher = more likely to be included in the pin rotation pool.
 */
export function scoreMarketingPriority(product: {
  tags?: string[] | null
  price?: number | null
  image_url?: string | null
  title?: string
  lifecycle_status?: string | null
  source?: string | null
}): number {
  let score = 0

  if (product.image_url) score += 30
  if (product.lifecycle_status === "active" || product.lifecycle_status === "updated") score += 20
  if (product.price && product.price > 0) score += 10

  const tags = (product.tags || []).map((t) => t.toLowerCase())
  for (const tag of tags) {
    if (BOOST_TAGS.some((b) => tag.includes(b))) score += 25
    if (tag.includes("new") || tag.includes("arrival")) score += 10
    if (tag.includes("sale") || tag.includes("discount")) score += 5
  }

  const title = (product.title || "").toLowerCase()
  if (/best ?seller|featured|new\b/.test(title)) score += 10

  // Prefer crawl-synced over pure manual for larger catalogs (heuristic, small)
  if (product.source === "shopify" || product.source === "store_crawl") score += 3

  return Math.round(score)
}

/**
 * Select / refresh the marketing pool for a store.
 *
 * - Keeps existing marketed products (sticky) unless they're unavailable/deleted
 *   or the user is far over cap.
 * - Promotes new high-priority products until cap is reached.
 * - Demotes weakest current marketed items only when needed to make room
 *   for clearly better ones (bounded rotation, default 10%).
 */
export async function refreshMarketingPool(
  supabase: AnySb,
  args: {
    userId: string
    /** When null, refresh across the user's whole catalog (CSV/manual + all stores) */
    catalogStoreId: string | null
    cap?: number
    /** Maximum portion of pool rotated in one sync (0–1) */
    rotationShare?: number
  }
): Promise<{ poolSize: number; promoted: number; demoted: number; cap: number }> {
  const cap = args.cap ?? DEFAULT_MARKETING_POOL_CAP
  const rotationShare = args.rotationShare ?? 0.1
  const maxRotations = Math.max(1, Math.floor(cap * rotationShare))

  let query = supabase
    .from("products")
    .select(
      "id, title, tags, price, image_url, lifecycle_status, is_active, marketed, marketing_priority, source"
    )
    .eq("user_id", args.userId)

  if (args.catalogStoreId) {
    query = query.eq("catalog_store_id", args.catalogStoreId)
  }

  const { data: products, error } = await query

  if (error || !products) {
    return { poolSize: 0, promoted: 0, demoted: 0, cap }
  }

  // Score every candidate
  const scored = products.map((p: any) => ({
    ...p,
    _score: scoreMarketingPriority({
      tags: p.tags,
      price: p.price,
      image_url: p.image_url,
      title: p.title,
      lifecycle_status: p.lifecycle_status,
      source: p.source,
    }),
  }))

  // Candidates eligible to be marketed
  const eligible = scored.filter(
    (p) =>
      p.is_active &&
      p.image_url &&
      (p.lifecycle_status === "active" || p.lifecycle_status === "updated" || !p.lifecycle_status)
  )

  const eligibleIds = new Set(eligible.map((p) => p.id))

  const currentlyMarketable = scored.filter((p) => p.marketed && eligibleIds.has(p.id))
  const currentlyIneligible = scored.filter((p) => p.marketed && !eligibleIds.has(p.id))
  const notMarketed = eligible.filter((p) => !p.marketed)

  let pool = [...currentlyMarketable]
  let demoted = 0
  let promoted = 0

  // Demote anything that became ineligible (unavailable/no image)
  const demoteIds = new Set<string>(currentlyIneligible.map((p) => p.id))

  // If over cap, drop lowest-priority current members (bounded)
  if (pool.length > cap) {
    pool.sort((a, b) => b._score - a._score)
    const excess = pool.slice(cap)
    for (const p of excess) {
      demoteIds.add(p.id)
      demoted++
    }
    pool = pool.slice(0, cap)
  }

  // Promote new candidates by score until cap
  const room = cap - pool.length
  if (room > 0 && notMarketed.length > 0) {
    notMarketed.sort((a, b) => b._score - a._score)
    const take = notMarketed.slice(0, room)
    for (const p of take) {
      pool.push(p)
      promoted++
    }
  }

  // If full, allow bounded rotation: swap weak current for clearly stronger new
  if (room === 0 && notMarketed.length > 0 && maxRotations > 0) {
    pool.sort((a, b) => a._score - b._score) // weakest first
    notMarketed.sort((a, b) => b._score - a._score)

    let swaps = 0
    for (let i = 0; i < Math.min(maxRotations, pool.length, notMarketed.length); i++) {
      const weakest = pool[i]
      const challenger = notMarketed[i]
      // Require challenger to be meaningfully better to avoid churn
      if (challenger._score > weakest._score + 15) {
        demoteIds.add(weakest.id)
        pool[i] = challenger
        demoted++
        promoted++
        swaps++
      } else {
        break
      }
    }
  }

  const promoteIds = new Set(pool.filter((p) => !p.marketed).map((p) => p.id))
  const keepIds = new Set(pool.map((p) => p.id))

  // Persist scores for all products in this store (cheap, useful for UI)
  const priorityUpdates = scored.map((p) => ({
    id: p.id,
    marketing_priority: p._score,
    marketed: keepIds.has(p.id),
    updated_at: new Date().toISOString(),
  }))

  // Apply demotions first (includes ineligible + rotated out)
  const finalDemoteIds = [...demoteIds].filter((id) => !keepIds.has(id))
  if (finalDemoteIds.length) {
    await supabase
      .from("products")
      .update({ marketed: false, updated_at: new Date().toISOString() })
      .in("id", finalDemoteIds)
  }

  // Apply promotions / priority refresh in chunks
  const chunkSize = 100
  for (let i = 0; i < priorityUpdates.length; i += chunkSize) {
    const chunk = priorityUpdates.slice(i, i + chunkSize)
    await supabase.from("products").upsert(chunk, { onConflict: "id" })
  }

  return {
    poolSize: keepIds.size,
    promoted: promoteIds.size || promoted,
    demoted: finalDemoteIds.length || demoted,
    cap,
  }
}

/**
 * Ensure new single-product imports (CSV/manual) join the pool when there's room.
 * Safe to call after insert; no-op if cap is already reached.
 */
export async function maybeAddToMarketingPool(
  supabase: AnySb,
  args: { userId: string; productId: string; catalogStoreId?: string | null; cap?: number }
): Promise<boolean> {
  const cap = args.cap ?? DEFAULT_MARKETING_POOL_CAP

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("user_id", args.userId)
    .eq("marketed", true)

  if ((count || 0) >= cap) return false

  const { data: product } = await supabase
    .from("products")
    .select("id, tags, price, image_url, lifecycle_status, source")
    .eq("id", args.productId)
    .single()

  if (!product) return false

  const score = scoreMarketingPriority({
    tags: product.tags,
    price: product.price,
    image_url: product.image_url,
    title: "",
    lifecycle_status: product.lifecycle_status,
    source: product.source,
  })

  const { error } = await supabase
    .from("products")
    .update({ marketed: true, marketing_priority: score })
    .eq("id", args.productId)

  return !error
}

export function platformToPoolCap(platform: CatalogPlatform | string | null): number {
  // Keep defaults simple and predictable for a solo SaaS
  return DEFAULT_MARKETING_POOL_CAP
}
