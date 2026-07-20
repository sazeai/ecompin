import { fetchJson, CatalogHttpError } from "../http"
import { buildNormalizedProduct, dedupeNormalizedBatch, stripHtml } from "../normalize"
import type { ExtractorResult, NormalizedProduct } from "../types"

interface ShopifyProductsJson {
  products?: Array<{
    id?: number | string
    title?: string
    handle?: string
    body_html?: string
    product_type?: string
    tags?: string
    variants?: Array<{
      id?: number | string
      price?: string
      sku?: string
      available?: boolean
    }>
    images?: Array<{ src?: string }>
    image?: { src?: string }
  }>
}

/**
 * Public Shopify endpoint: GET {store}/products.json?limit=250&page=N
 * No auth. Works for a large share of Shopify storefronts.
 */
export async function extractViaProductsJson(
  storeRoot: string,
  opts?: { maxPages?: number }
): Promise<ExtractorResult | null> {
  const maxPages = opts?.maxPages ?? 40 // 40 * 250 = 10k products hard cap
  const products: NormalizedProduct[] = []
  const warnings: string[] = []
  let pagesFetched = 0

  for (let page = 1; page <= maxPages; page++) {
    const url = new URL("/products.json", storeRoot)
    url.searchParams.set("limit", "250")
    url.searchParams.set("page", String(page))

    try {
      const { data } = await fetchJson<ShopifyProductsJson>(url.toString(), {
        timeoutMs: 15_000,
      })
      pagesFetched++

      const batch = data.products || []
      if (batch.length === 0) break

      for (const p of batch) {
        if (!p?.title || !p?.handle) continue
        const image =
          p.image?.src ||
          p.images?.[0]?.src ||
          null
        const variant = p.variants?.[0]
        const tags = p.tags
          ? p.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : []
        if (p.product_type) tags.unshift(p.product_type)

        const normalized = buildNormalizedProduct({
          title: p.title,
          description: stripHtml(p.body_html),
          productUrl: new URL(`/products/${p.handle}`, storeRoot).toString(),
          imageUrl: image,
          price: variant?.price ? parseFloat(variant.price) : null,
          currency: "USD",
          handle: p.handle,
          platformProductId: p.id != null ? String(p.id) : null,
          sku: variant?.sku || null,
          tags,
          availability:
            variant?.available === false ? "out_of_stock" : variant?.available === true ? "in_stock" : "unknown",
          baseUrl: storeRoot,
        })
        if (normalized) products.push(normalized)
      }

      // Shopify returns fewer than limit on last page
      if (batch.length < 250) break
    } catch (err) {
      if (err instanceof CatalogHttpError && (err.status === 404 || err.status === 401 || err.status === 403 || err.status === 430)) {
        // Endpoint blocked / missing — not an error for fallback chain
        if (page === 1) return null
        warnings.push(`products.json stopped at page ${page}: HTTP ${err.status}`)
        break
      }
      if (page === 1) return null
      warnings.push(
        `products.json page ${page} failed: ${err instanceof Error ? err.message : "unknown"}`
      )
      break
    }
  }

  if (products.length === 0) return null

  return {
    extractor: "products_json",
    products: dedupeNormalizedBatch(products),
    pagesFetched,
    warnings,
  }
}
