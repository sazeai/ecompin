import { fetchText, mapPool } from "../http"
import { canonicalizeUrl, fingerprintList } from "../normalize"
import { extractProductFromMeta, extractProductsFromJsonLd } from "./jsonld"
import type { ExtractorResult, NormalizedProduct, SitemapSnapshot } from "../types"

const PRODUCT_PATH_RE =
  /\/(products?|shop|collections\/[^/]+\/products|p|item|goods)\/[^/?#]+/i

/**
 * Discover product URLs from sitemap index / product sitemaps, then
 * scrape JSON-LD (and OG meta fallback) from each product page.
 */
export async function extractViaSitemap(
  storeRoot: string,
  opts?: {
    robotsSitemaps?: string[]
    maxProductPages?: number
    previousFingerprint?: string | null
    forceFullCrawl?: boolean
  }
): Promise<ExtractorResult | null> {
  const warnings: string[] = []
  let pagesFetched = 0

  const discovered = await discoverProductSitemap(storeRoot, opts?.robotsSitemaps || [], (n) => {
    pagesFetched += n
  })

  if (!discovered || discovered.productUrls.length === 0) {
    return null
  }

  const fingerprint = fingerprintList(discovered.productUrls)
  const snapshot: SitemapSnapshot = {
    sitemapUrl: discovered.sitemapUrl,
    productUrls: discovered.productUrls,
    lastmodByUrl: discovered.lastmodByUrl,
    fingerprint,
  }

  // Sitemap-diff short-circuit: same URL set as last successful crawl
  if (
    !opts?.forceFullCrawl &&
    opts?.previousFingerprint &&
    opts.previousFingerprint === fingerprint
  ) {
    return {
      extractor: "sitemap_jsonld",
      products: [],
      pagesFetched,
      sitemap: snapshot,
      warnings: ["Sitemap fingerprint unchanged — skipped product page crawl"],
      sitemapShortCircuited: true,
    }
  }

  const maxPages = opts?.maxProductPages ?? 300
  const urls = discovered.productUrls.slice(0, maxPages)
  if (discovered.productUrls.length > maxPages) {
    warnings.push(
      `Sitemap has ${discovered.productUrls.length} product URLs; crawling first ${maxPages}`
    )
  }

  const scraped = await mapPool(urls, 3, async (productUrl) => {
    try {
      const { text, finalUrl } = await fetchText(productUrl, { timeoutMs: 12_000 })
      pagesFetched++
      const fromLd = extractProductsFromJsonLd(text, finalUrl)
      if (fromLd.length > 0) {
        // Prefer the product whose URL matches the page
        const match =
          fromLd.find((p) => p.productUrl === canonicalizeUrl(finalUrl)) || fromLd[0]
        return match
      }
      return extractProductFromMeta(text, finalUrl)
    } catch (err) {
      warnings.push(
        `Failed product page ${productUrl}: ${err instanceof Error ? err.message : "error"}`
      )
      return null
    }
  })

  const products = scraped.filter(Boolean) as NormalizedProduct[]
  if (products.length === 0 && !opts?.previousFingerprint) {
    // Still return snapshot so caller can store fingerprint, but signal weak result
    warnings.push("Sitemap found product URLs but no product data could be extracted")
  }

  if (products.length === 0 && !snapshot.productUrls.length) return null

  return {
    extractor: "sitemap_jsonld",
    products,
    pagesFetched,
    sitemap: snapshot,
    warnings,
    sitemapShortCircuited: false,
  }
}

async function discoverProductSitemap(
  storeRoot: string,
  robotsSitemaps: string[],
  onFetch: (n: number) => void
): Promise<{
  sitemapUrl: string | null
  productUrls: string[]
  lastmodByUrl: Record<string, string | undefined>
} | null> {
  const candidates = [
    ...robotsSitemaps,
    new URL("/sitemap.xml", storeRoot).toString(),
    new URL("/sitemap_index.xml", storeRoot).toString(),
    new URL("/sitemap-index.xml", storeRoot).toString(),
    new URL("/product-sitemap.xml", storeRoot).toString(),
    new URL("/sitemap_products_1.xml", storeRoot).toString(),
    new URL("/sitemaps/sitemap.xml", storeRoot).toString(),
  ]

  const seen = new Set<string>()
  const uniqueCandidates = candidates.filter((u) => {
    const c = canonicalizeUrl(u) || u
    if (seen.has(c)) return false
    seen.add(c)
    return true
  })

  for (const candidate of uniqueCandidates) {
    try {
      const { text } = await fetchText(candidate, {
        timeoutMs: 12_000,
        accept: "application/xml,text/xml,*/*",
      })
      onFetch(1)

      const parsed = await expandSitemap(text, storeRoot, onFetch, 0)
      if (parsed.productUrls.length > 0) {
        return {
          sitemapUrl: candidate,
          productUrls: parsed.productUrls,
          lastmodByUrl: parsed.lastmodByUrl,
        }
      }
    } catch {
      /* try next */
    }
  }

  return null
}

async function expandSitemap(
  xml: string,
  storeRoot: string,
  onFetch: (n: number) => void,
  depth: number
): Promise<{ productUrls: string[]; lastmodByUrl: Record<string, string | undefined> }> {
  const productUrls: string[] = []
  const lastmodByUrl: Record<string, string | undefined> = {}

  // Sitemap index → recurse into child sitemaps (prefer product ones)
  const indexLocs = matchTags(xml, "sitemap")
  if (indexLocs.length > 0 && depth < 2) {
    const ranked = [...indexLocs].sort((a, b) => scoreSitemapName(b.loc) - scoreSitemapName(a.loc))
    // Cap child sitemaps to avoid runaway
    for (const child of ranked.slice(0, 15)) {
      if (!child.loc) continue
      // Skip non-product heavy sitemaps when we already have product-named ones later
      try {
        const { text } = await fetchText(child.loc, {
          timeoutMs: 12_000,
          accept: "application/xml,text/xml,*/*",
        })
        onFetch(1)
        const nested = await expandSitemap(text, storeRoot, onFetch, depth + 1)
        for (const u of nested.productUrls) productUrls.push(u)
        Object.assign(lastmodByUrl, nested.lastmodByUrl)
      } catch {
        /* skip child */
      }
    }
    return {
      productUrls: uniqueUrls(productUrls),
      lastmodByUrl,
    }
  }

  // urlset
  const urls = matchTags(xml, "url")
  for (const entry of urls) {
    if (!entry.loc) continue
    const canonical = canonicalizeUrl(entry.loc, storeRoot)
    if (!canonical) continue
    if (!looksLikeProductUrl(canonical)) continue
    productUrls.push(canonical)
    if (entry.lastmod) lastmodByUrl[canonical] = entry.lastmod
  }

  return {
    productUrls: uniqueUrls(productUrls),
    lastmodByUrl,
  }
}

function matchTags(
  xml: string,
  parentTag: "url" | "sitemap"
): Array<{ loc: string; lastmod?: string }> {
  const results: Array<{ loc: string; lastmod?: string }> = []
  // Namespace-tolerant
  const blockRe = new RegExp(`<(?:\\w+:)?${parentTag}[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${parentTag}>`, "gi")
  let block: RegExpExecArray | null
  while ((block = blockRe.exec(xml))) {
    const body = block[1]
    const loc = body.match(/<(?:\w+:)?loc[^>]*>\s*([^<\s]+)\s*<\/(?:\w+:)?loc>/i)?.[1]
    const lastmod = body.match(/<(?:\w+:)?lastmod[^>]*>\s*([^<\s]+)\s*<\/(?:\w+:)?lastmod>/i)?.[1]
    if (loc) {
      results.push({
        loc: decodeXml(loc.trim()),
        lastmod: lastmod ? decodeXml(lastmod.trim()) : undefined,
      })
    }
  }
  return results
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function scoreSitemapName(url: string): number {
  const u = url.toLowerCase()
  if (u.includes("product")) return 100
  if (u.includes("pdp")) return 80
  if (u.includes("item")) return 60
  if (u.includes("shop")) return 40
  if (u.includes("page") || u.includes("blog") || u.includes("post") || u.includes("category")) return -50
  return 0
}

export function looksLikeProductUrl(url: string): boolean {
  try {
    const u = new URL(url)
    const path = u.pathname
    if (path === "/" || path.length < 2) return false
    // Explicit non-product
    if (/\/(cart|checkout|account|login|blogs?|pages|collections\/?$|search|policies)/i.test(path)) {
      return false
    }
    if (PRODUCT_PATH_RE.test(path)) return true
    // Shopify product sitemap entries are almost always /products/handle
    if (/\/products\/[^/]+$/i.test(path)) return true
    // Woo often /product/handle
    if (/\/product\/[^/]+$/i.test(path)) return true
    // Heuristic: deep path with slug, not a file
    if (!/\.[a-z0-9]{2,5}$/i.test(path) && path.split("/").filter(Boolean).length >= 2) {
      // Only accept if sitemap itself was product-named (caller filters); be conservative here
      return /product|sku|item/i.test(path)
    }
    return false
  } catch {
    return false
  }
}

function uniqueUrls(urls: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const u of urls) {
    const k = u.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(u)
  }
  return out
}
