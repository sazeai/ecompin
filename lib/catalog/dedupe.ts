import type {
  ExistingProductRow,
  MatchDecision,
  NormalizedProduct,
} from "./types"
import { canonicalizeUrl, computeContentHash } from "./normalize"

/**
 * Four-tier identity chain (upgrade-plan A14):
 * 1. platform_product_id (per store)
 * 2. canonical product URL
 * 3. SKU (per store)
 * 4. content hash (URL + title + main image)
 *
 * Also respects legacy handle uniqueness used by CSV/Shopify paths.
 */
export class ProductIdentityIndex {
  private byPlatformId = new Map<string, ExistingProductRow>()
  private byUrl = new Map<string, ExistingProductRow>()
  private bySku = new Map<string, ExistingProductRow>()
  private byHash = new Map<string, ExistingProductRow>()
  private byHandle = new Map<string, ExistingProductRow>()
  private byId = new Map<string, ExistingProductRow>()

  constructor(existing: ExistingProductRow[]) {
    for (const row of existing) {
      this.index(row)
    }
  }

  get size() {
    return this.byId.size
  }

  get all(): ExistingProductRow[] {
    return [...this.byId.values()]
  }

  private index(row: ExistingProductRow) {
    this.byId.set(row.id, row)
    if (row.platform_product_id) {
      this.byPlatformId.set(row.platform_product_id, row)
    }
    if (row.product_url) {
      const url = canonicalizeUrl(row.product_url) || row.product_url
      this.byUrl.set(url.toLowerCase(), row)
    }
    if (row.sku) {
      this.bySku.set(row.sku.toLowerCase(), row)
    }
    if (row.content_hash) {
      this.byHash.set(row.content_hash, row)
    }
    if (row.handle) {
      this.byHandle.set(row.handle.toLowerCase(), row)
    }
  }

  /** Re-index after in-memory mutation during a sync batch. */
  upsertLocal(row: ExistingProductRow) {
    // Drop old maps pointing at this id
    const prev = this.byId.get(row.id)
    if (prev) this.removeLocal(prev)
    this.index(row)
  }

  removeLocal(row: ExistingProductRow) {
    this.byId.delete(row.id)
    if (row.platform_product_id) this.byPlatformId.delete(row.platform_product_id)
    if (row.product_url) {
      const url = canonicalizeUrl(row.product_url) || row.product_url
      this.byUrl.delete(url.toLowerCase())
    }
    if (row.sku) this.bySku.delete(row.sku.toLowerCase())
    if (row.content_hash) this.byHash.delete(row.content_hash)
    if (row.handle) this.byHandle.delete(row.handle.toLowerCase())
  }

  match(incoming: NormalizedProduct): MatchDecision {
    // Tier 1 — platform product id
    if (incoming.platformProductId) {
      const hit = this.byPlatformId.get(incoming.platformProductId)
      if (hit) return this.decide(hit, incoming, "platform_product_id")
    }

    // Tier 2 — product URL
    const urlKey = (canonicalizeUrl(incoming.productUrl) || incoming.productUrl).toLowerCase()
    const byUrl = this.byUrl.get(urlKey)
    if (byUrl) return this.decide(byUrl, incoming, "product_url")

    // Tier 3 — SKU
    if (incoming.sku) {
      const bySku = this.bySku.get(incoming.sku.toLowerCase())
      if (bySku) return this.decide(bySku, incoming, "sku")
    }

    // Legacy handle (CSV / old Shopify) — treat as strong when present
    if (incoming.handle) {
      const byHandle = this.byHandle.get(incoming.handle.toLowerCase())
      if (byHandle) return this.decide(byHandle, incoming, "handle")
    }

    // Tier 4 — content hash
    const hash =
      incoming.contentHash ||
      computeContentHash({
        productUrl: incoming.productUrl,
        title: incoming.title,
        imageUrl: incoming.imageUrl,
      })
    const byHash = this.byHash.get(hash)
    if (byHash) return this.decide(byHash, incoming, "content_hash")

    return { kind: "insert" }
  }

  private decide(
    existing: ExistingProductRow,
    incoming: NormalizedProduct,
    tier: NonNullable<MatchDecision["matchTier"]>
  ): MatchDecision {
    const incomingHash =
      incoming.contentHash ||
      computeContentHash({
        productUrl: incoming.productUrl,
        title: incoming.title,
        imageUrl: incoming.imageUrl,
      })

    const contentChanged = !existing.content_hash || existing.content_hash !== incomingHash

    // Unchanged only when hash matches AND core merchandising fields match enough
    // that we can skip a write (cost control).
    if (!contentChanged && existing.title === incoming.title) {
      // Still treat out-of-stock flips / URL repairs as updates below via caller
      // if needed — hash equality is the primary short-circuit.
      return {
        kind: "unchanged",
        existingId: existing.id,
        matchTier: tier,
        contentChanged: false,
      }
    }

    return {
      kind: "update",
      existingId: existing.id,
      matchTier: tier,
      contentChanged,
    }
  }
}

/**
 * Build the DB write payload for insert/update. Keeps pin-generation fields intact.
 */
export function toProductWritePayload(
  incoming: NormalizedProduct,
  ctx: {
    userId: string
    brandSettingsId: string | null
    catalogStoreId: string
    source: string
    existingId?: string
    nowIso: string
  }
) {
  const isActive = incoming.availability !== "out_of_stock"
  const lifecycle = isActive ? ("active" as const) : ("unavailable" as const)

  const base = {
    user_id: ctx.userId,
    brand_settings_id: ctx.brandSettingsId,
    catalog_store_id: ctx.catalogStoreId,
    source: ctx.source,
    source_product_id: incoming.platformProductId || incoming.handle || null,
    handle: incoming.handle,
    platform_product_id: incoming.platformProductId,
    sku: incoming.sku,
    title: incoming.title,
    description: incoming.description,
    price: incoming.price,
    currency: incoming.currency || "USD",
    product_url: incoming.productUrl,
    // Only set image_url when we have one — avoid wiping existing R2 images with null
    ...(incoming.imageUrl ? { image_url: incoming.imageUrl } : {}),
    tags: incoming.tags,
    content_hash: incoming.contentHash,
    last_seen_at: ctx.nowIso,
    missing_sync_count: 0,
    lifecycle_status: lifecycle,
    is_active: isActive,
    updated_at: ctx.nowIso,
  }

  if (ctx.existingId) {
    return { id: ctx.existingId, ...base }
  }
  return base
}
