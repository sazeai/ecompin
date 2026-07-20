import { fetchText } from "../http"
import { dedupeNormalizedBatch } from "../normalize"
import { extractProductsFromJsonLd } from "./jsonld"
import type { ExtractorResult } from "../types"

/**
 * Scrape homepage + common collection paths for embedded Product JSON-LD.
 * Weak but useful when products.json and sitemaps fail.
 */
export async function extractViaHomepageJsonLd(
  storeRoot: string
): Promise<ExtractorResult | null> {
  const paths = [
    "/",
    "/collections/all",
    "/collections/all/products",
    "/shop",
    "/products",
    "/catalog",
    "/store",
  ]

  const warnings: string[] = []
  let pagesFetched = 0
  const all = []

  for (const path of paths) {
    const url = new URL(path, storeRoot).toString()
    try {
      const { text, finalUrl } = await fetchText(url, { timeoutMs: 12_000 })
      pagesFetched++
      const found = extractProductsFromJsonLd(text, finalUrl)
      all.push(...found)
    } catch (err) {
      warnings.push(
        `homepage path ${path} failed: ${err instanceof Error ? err.message : "error"}`
      )
    }
  }

  const products = dedupeNormalizedBatch(all)
  if (products.length === 0) return null

  return {
    extractor: "jsonld_homepage",
    products,
    pagesFetched,
    warnings,
  }
}
