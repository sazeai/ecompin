import type { CatalogPlatform } from "./types"

export interface PlatformDetection {
  platform: CatalogPlatform
  confidence: "high" | "medium" | "low"
  signals: string[]
}

/**
 * Detect ecommerce platform from URL + optional HTML homepage.
 * Used only to pick the best first extractor — never a hard dependency.
 */
export function detectPlatformFromUrl(storeUrl: string): PlatformDetection {
  const host = safeHost(storeUrl)
  const signals: string[] = []

  if (host.endsWith(".myshopify.com")) {
    return { platform: "shopify", confidence: "high", signals: ["myshopify.com host"] }
  }
  if (host.endsWith(".squarespace.com")) {
    return { platform: "squarespace", confidence: "high", signals: ["squarespace.com host"] }
  }
  if (host.includes("wixsite.com") || host.endsWith(".wix.com")) {
    return { platform: "wix", confidence: "high", signals: ["wix host"] }
  }
  if (host.includes("mybigcommerce.com")) {
    return { platform: "bigcommerce", confidence: "high", signals: ["bigcommerce host"] }
  }

  return { platform: "unknown", confidence: "low", signals }
}

export function detectPlatformFromHtml(storeUrl: string, html: string): PlatformDetection {
  const base = detectPlatformFromUrl(storeUrl)
  if (base.confidence === "high") return base

  const signals: string[] = [...base.signals]
  const hay = html.slice(0, 200_000).toLowerCase()

  const checks: Array<[CatalogPlatform, RegExp, string]> = [
    ["shopify", /cdn\.shopify\.com|shopify\.theme|shopify-section|myshopify\.com/i, "shopify assets"],
    ["woocommerce", /woocommerce|wp-content\/plugins\/woocommerce|wc-block/i, "woocommerce markers"],
    ["squarespace", /squarespace|static\.squarespace\.com|sqsp/i, "squarespace markers"],
    ["wix", /wix\.com|wixstatic\.com|x-wix/i, "wix markers"],
    ["bigcommerce", /bigcommerce|cdn\d*\.bigcommerce\.com/i, "bigcommerce markers"],
  ]

  for (const [platform, re, label] of checks) {
    if (re.test(hay)) {
      signals.push(label)
      return { platform, confidence: "high", signals }
    }
  }

  // Generator meta
  const gen = hay.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)/i)
  if (gen?.[1]) {
    signals.push(`generator:${gen[1]}`)
    if (/shopify/i.test(gen[1])) return { platform: "shopify", confidence: "high", signals }
    if (/woocommerce|wordpress/i.test(gen[1])) return { platform: "woocommerce", confidence: "medium", signals }
  }

  return { platform: "generic", confidence: "low", signals }
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return ""
  }
}
