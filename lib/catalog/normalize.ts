import { createHash } from "crypto"
import type { NormalizedProduct } from "./types"

/** Strip tracking params and normalize trailing slash / host casing. */
export function canonicalizeUrl(raw: string, base?: string): string | null {
  try {
    const url = base ? new URL(raw, base) : new URL(raw)
    if (!["http:", "https:"].includes(url.protocol)) return null
    url.hash = ""
    // Drop common tracking noise that breaks identity
    const drop = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "mc_cid",
      "mc_eid",
      "ref",
      "srsltid",
    ]
    for (const key of drop) url.searchParams.delete(key)
    // Stable host
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "")
    // No trailing slash except root
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1)
    }
    return url.toString()
  } catch {
    return null
  }
}

export function normalizeStoreUrl(input: string): string {
  let raw = (input || "").trim()
  if (!raw) throw new Error("Store URL is required")
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`
  const canonical = canonicalizeUrl(raw)
  if (!canonical) throw new Error("Invalid store URL")
  const u = new URL(canonical)
  // Store root only
  return `${u.protocol}//${u.host}`
}

export function stripHtml(html: string | null | undefined, max = 1000): string | null {
  if (!html) return null
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
  if (!text) return null
  return text.length > max ? text.slice(0, max) : text
}

export function parsePrice(value: unknown): number | null {
  if (value == null || value === "") return null
  if (typeof value === "number" && Number.isFinite(value)) return value
  const cleaned = String(value).replace(/[^0-9.,-]/g, "").replace(/,/g, "")
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : null
}

export function extractHandleFromUrl(productUrl: string): string | null {
  try {
    const u = new URL(productUrl)
    const parts = u.pathname.split("/").filter(Boolean)
    if (parts.length === 0) return null
    // /products/handle or /product/handle or last segment
    const idx = parts.findIndex((p) => p === "products" || p === "product" || p === "p")
    if (idx >= 0 && parts[idx + 1]) return decodeURIComponent(parts[idx + 1])
    return decodeURIComponent(parts[parts.length - 1])
  } catch {
    return null
  }
}

/**
 * Stable content fingerprint used for change detection + fallback identity.
 * Uses URL + title + main image only (price/description churn shouldn't fork identity).
 */
export function computeContentHash(input: {
  productUrl: string
  title: string
  imageUrl: string | null
}): string {
  const payload = [
    (input.productUrl || "").trim().toLowerCase(),
    (input.title || "").trim().toLowerCase(),
    (input.imageUrl || "").trim().toLowerCase(),
  ].join("|")
  return createHash("sha256").update(payload).digest("hex")
}

export function fingerprintList(urls: string[]): string {
  const sorted = [...urls].map((u) => u.toLowerCase()).sort()
  return createHash("sha256").update(sorted.join("\n")).digest("hex")
}

export function buildNormalizedProduct(partial: {
  title: string
  description?: string | null
  productUrl: string
  imageUrl?: string | null
  price?: number | null
  currency?: string | null
  handle?: string | null
  platformProductId?: string | null
  sku?: string | null
  tags?: string[]
  availability?: NormalizedProduct["availability"]
  baseUrl?: string
}): NormalizedProduct | null {
  const title = (partial.title || "").trim()
  if (!title) return null

  const productUrl = canonicalizeUrl(partial.productUrl, partial.baseUrl)
  if (!productUrl) return null

  const imageUrl = partial.imageUrl
    ? canonicalizeUrl(partial.imageUrl, partial.baseUrl) || partial.imageUrl
    : null

  const handle =
    partial.handle?.trim() ||
    extractHandleFromUrl(productUrl)

  const contentHash = computeContentHash({ productUrl, title, imageUrl })

  return {
    title,
    description: stripHtml(partial.description ?? null),
    productUrl,
    imageUrl,
    price: partial.price ?? null,
    currency: partial.currency?.trim() || null,
    handle,
    platformProductId: partial.platformProductId ? String(partial.platformProductId) : null,
    sku: partial.sku ? String(partial.sku).trim() : null,
    tags: (partial.tags || []).map((t) => t.trim()).filter(Boolean),
    availability: partial.availability || "unknown",
    contentHash,
  }
}

/** Dedupe a batch of normalized products preferring richer records. */
export function dedupeNormalizedBatch(products: NormalizedProduct[]): NormalizedProduct[] {
  const byKey = new Map<string, NormalizedProduct>()

  for (const p of products) {
    const key =
      (p.platformProductId && `id:${p.platformProductId}`) ||
      `url:${p.productUrl}` ||
      (p.sku && `sku:${p.sku}`) ||
      `hash:${p.contentHash}`

    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, p)
      continue
    }
    // Prefer record with image + description
    const score = (x: NormalizedProduct) =>
      (x.imageUrl ? 2 : 0) + (x.description ? 1 : 0) + (x.price != null ? 1 : 0) + (x.platformProductId ? 1 : 0)
    if (score(p) >= score(existing)) byKey.set(key, p)
  }

  return [...byKey.values()]
}
