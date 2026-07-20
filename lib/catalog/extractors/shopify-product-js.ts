import { CatalogHttpError, fetchJson, mapPool } from "../http"
import {
  buildNormalizedProduct,
  dedupeNormalizedBatch,
  extractHandleFromUrl,
  stripHtml,
} from "../normalize"
import type { ExtractorResult, NormalizedProduct, SitemapSnapshot } from "../types"
import { fingerprintList } from "../normalize"

interface ShopifyProductJs {
  id?: number | string
  title?: string
  handle?: string
  description?: string
  body_html?: string
  vendor?: string
  product_type?: string
  tags?: string[] | string
  variants?: Array<{
    id?: number | string
    price?: string
    sku?: string
    available?: boolean
  }>
  images?: Array<{ src?: string }>
  featured_image?: string
}

/**
 * Shopify public JSON endpoint per product:
 *   GET /products/{handle}.js
 *
 * Far more reliable than scraping HTML (avoids heavy pages + many 429s).
 * Used when /products.json is blocked but product URLs are known from sitemap.
 */
export async function extractViaShopifyProductJs(
  storeRoot: string,
  productUrls: string[],
  opts?: {
    maxProductPages?: number
    sitemapUrl?: string | null
    lastmodByUrl?: Record<string, string | undefined>
    previousFingerprint?: string | null
    forceFullCrawl?: boolean
  }
): Promise<ExtractorResult | null> {
  const warnings: string[] = []
  let pagesFetched = 0

  const uniqueUrls = [...new Set(productUrls.map((u) => u.split("?")[0]))]
  const fingerprint = fingerprintList(uniqueUrls)
  const snapshot: SitemapSnapshot = {
    sitemapUrl: opts?.sitemapUrl || null,
    productUrls: uniqueUrls,
    lastmodByUrl: opts?.lastmodByUrl || {},
    fingerprint,
  }

  if (
    !opts?.forceFullCrawl &&
    opts?.previousFingerprint &&
    opts.previousFingerprint === fingerprint
  ) {
    return {
      extractor: "sitemap_jsonld",
      products: [],
      pagesFetched: 0,
      sitemap: snapshot,
      warnings: ["Sitemap fingerprint unchanged — skipped product JSON crawl"],
      sitemapShortCircuited: true,
    }
  }

  const maxPages = opts?.maxProductPages ?? 2000
  const urls = uniqueUrls.slice(0, maxPages)
  if (uniqueUrls.length > maxPages) {
    warnings.push(
      `Sitemap has ${uniqueUrls.length} product URLs; fetching first ${maxPages} via .js`
    )
  }

  // Concurrency 2 + global throttle is enough; higher trips Shopify 429s
  const scraped = await mapPool(urls, 2, async (productUrl) => {
    const handle = extractHandleFromUrl(productUrl)
    if (!handle) return null

    const jsUrl = new URL(`/products/${encodeURIComponent(handle)}.js`, storeRoot).toString()
    try {
      const { data } = await fetchJson<ShopifyProductJs>(jsUrl, {
        timeoutMs: 12_000,
        retries: 3,
      })
      pagesFetched++
      return mapShopifyJs(data, storeRoot)
    } catch (err) {
      pagesFetched++
      // Fallback: try HTML JSON-LD only if .js missing (rare)
      if (err instanceof CatalogHttpError && err.status === 404) {
        return null
      }
      if (warnings.length < 25) {
        warnings.push(
          `Failed product.js ${handle}: ${err instanceof Error ? err.message : "error"}`
        )
      }
      return null
    }
  })

  const products = dedupeNormalizedBatch(
    scraped.filter(Boolean) as NormalizedProduct[]
  )

  if (products.length === 0) {
    warnings.push("Shopify product.js crawl returned 0 products")
    return {
      extractor: "sitemap_jsonld",
      products: [],
      pagesFetched,
      sitemap: snapshot,
      warnings,
      sitemapShortCircuited: false,
    }
  }

  return {
    extractor: "sitemap_jsonld",
    products,
    pagesFetched,
    sitemap: snapshot,
    warnings,
    sitemapShortCircuited: false,
  }
}

function mapShopifyJs(
  p: ShopifyProductJs,
  storeRoot: string
): NormalizedProduct | null {
  if (!p?.title || !p?.handle) return null
  const variant = p.variants?.[0]
  const image =
    p.featured_image ||
    p.images?.[0]?.src ||
    null
  const tags = Array.isArray(p.tags)
    ? p.tags
    : typeof p.tags === "string"
      ? p.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : []
  if (p.product_type) tags.unshift(p.product_type)

  return buildNormalizedProduct({
    title: p.title,
    description: stripHtml(p.description || p.body_html || null),
    productUrl: new URL(`/products/${p.handle}`, storeRoot).toString(),
    imageUrl: image,
    price: variant?.price ? parseFloat(variant.price) : null,
    currency: "USD",
    handle: p.handle,
    platformProductId: p.id != null ? String(p.id) : null,
    sku: variant?.sku || null,
    tags,
    availability:
      variant?.available === false
        ? "out_of_stock"
        : variant?.available === true
          ? "in_stock"
          : "unknown",
    baseUrl: storeRoot,
  })
}
