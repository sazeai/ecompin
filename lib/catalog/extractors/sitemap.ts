import { fetchText, mapPool } from "../http"
import { canonicalizeUrl, fingerprintList } from "../normalize"
import { extractProductFromMeta, extractProductsFromJsonLd } from "./jsonld"
import { extractViaShopifyProductJs } from "./shopify-product-js"
import type { ExtractorResult, NormalizedProduct, SitemapSnapshot } from "../types"

const PRODUCT_PATH_RE =
  /\/(products?|shop|collections\/[^/]+\/products|p|item|goods)\/[^/?#]+/i

/**
 * Discover product URLs from sitemap index / product sitemaps, then
 * hydrate product data.
 *
 * Shopify path: prefer /products/{handle}.js (JSON) — avoids HTML 429 storms.
 * Generic path: HTML JSON-LD + OG meta with low concurrency.
 */
export async function extractViaSitemap(
  storeRoot: string,
  opts?: {
    robotsSitemaps?: string[]
    maxProductPages?: number
    previousFingerprint?: string | null
    forceFullCrawl?: boolean
    preferShopifyJs?: boolean
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

  // Sitemap-diff short-circuit: same URL set as last *successful product* crawl.
  // Caller must pass previousFingerprint only when the store already has products.
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

  const shopifyLike =
    opts?.preferShopifyJs !== false &&
    discovered.productUrls.some((u) => /\/products\/[^/]+/i.test(u))

  if (shopifyLike) {
    const viaJs = await extractViaShopifyProductJs(storeRoot, discovered.productUrls, {
      maxProductPages: opts?.maxProductPages ?? 2000,
      sitemapUrl: discovered.sitemapUrl,
      lastmodByUrl: discovered.lastmodByUrl,
      previousFingerprint: opts?.previousFingerprint,
      forceFullCrawl: true, // fingerprint already checked above
    })
    if (viaJs) {
      return {
        ...viaJs,
        pagesFetched: pagesFetched + (viaJs.pagesFetched || 0),
        warnings: [...warnings, ...(viaJs.warnings || [])].slice(0, 40),
      }
    }
  }

  const maxPages = opts?.maxProductPages ?? 300
  const urls = discovered.productUrls.slice(0, maxPages)
  if (discovered.productUrls.length > maxPages) {
    warnings.push(
      `Sitemap has ${discovered.productUrls.length} product URLs; crawling first ${maxPages}`
    )
  }

  // HTML fallback — concurrency 1 to reduce 429s
  const scraped = await mapPool(urls, 1, async (productUrl) => {
    try {
      const { text, finalUrl } = await fetchText(productUrl, {
        timeoutMs: 12_000,
        retries: 2,
      })
      pagesFetched++
      const fromLd = extractProductsFromJsonLd(text, finalUrl)
      if (fromLd.length > 0) {
        const match =
          fromLd.find((p) => p.productUrl === canonicalizeUrl(finalUrl)) || fromLd[0]
        return match
      }
      return extractProductFromMeta(text, finalUrl)
    } catch (err) {
      if (warnings.length < 30) {
        warnings.push(
          `Failed product page ${productUrl}: ${err instanceof Error ? err.message : "error"}`
        )
      }
      return null
    }
  })

  const products = scraped.filter(Boolean) as NormalizedProduct[]
  if (products.length === 0) {
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
        retries: 2,
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

  const indexLocs = matchTags(xml, "sitemap")
  if (indexLocs.length > 0 && depth < 2) {
    const ranked = [...indexLocs].sort((a, b) => scoreSitemapName(b.loc) - scoreSitemapName(a.loc))
    for (const child of ranked.slice(0, 20)) {
      if (!child.loc) continue
      // Skip obvious non-product sitemaps when product ones exist
      if (
        scoreSitemapName(child.loc) < 0 &&
        ranked.some((r) => scoreSitemapName(r.loc) >= 80)
      ) {
        continue
      }
      try {
        const { text } = await fetchText(child.loc, {
          timeoutMs: 12_000,
          accept: "application/xml,text/xml,*/*",
          retries: 2,
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
  const blockRe = new RegExp(
    `<(?:\\w+:)?${parentTag}[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${parentTag}>`,
    "gi"
  )
  let block: RegExpExecArray | null
  while ((block = blockRe.exec(xml))) {
    const body = block[1]
    const loc = body.match(/<(?:\w+:)?loc[^>]*>\s*([^<\s]+)\s*<\/(?:\w+:)?loc>/i)?.[1]
    const lastmod = body.match(
      /<(?:\w+:)?lastmod[^>]*>\s*([^<\s]+)\s*<\/(?:\w+:)?lastmod>/i
    )?.[1]
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
  if (u.includes("page") || u.includes("blog") || u.includes("post") || u.includes("category"))
    return -50
  return 0
}

export function looksLikeProductUrl(url: string): boolean {
  try {
    const u = new URL(url)
    const path = u.pathname
    if (path === "/" || path.length < 2) return false
    if (/\/(cart|checkout|account|login|blogs?|pages|collections\/?$|search|policies)/i.test(path)) {
      return false
    }
    if (PRODUCT_PATH_RE.test(path)) return true
    if (/\/products\/[^/]+$/i.test(path)) return true
    if (/\/product\/[^/]+$/i.test(path)) return true
    if (!/\.[a-z0-9]{2,5}$/i.test(path) && path.split("/").filter(Boolean).length >= 2) {
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
