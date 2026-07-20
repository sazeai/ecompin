import { fetchText } from "../http"
import { buildNormalizedProduct, stripHtml } from "../normalize"
import type { ExtractorResult, NormalizedProduct } from "../types"

/**
 * Best-effort RSS/Atom product feed import.
 * Many stores expose /feeds/products.atom or Google product RSS.
 */
export async function extractViaRss(storeRoot: string): Promise<ExtractorResult | null> {
  const candidates = [
    new URL("/feeds/products.atom", storeRoot).toString(),
    new URL("/collections/all.atom", storeRoot).toString(),
    new URL("/product-feed.xml", storeRoot).toString(),
    new URL("/feed.xml", storeRoot).toString(),
    new URL("/rss.xml", storeRoot).toString(),
    new URL("/products.rss", storeRoot).toString(),
  ]

  const warnings: string[] = []
  let pagesFetched = 0

  for (const url of candidates) {
    try {
      const { text } = await fetchText(url, {
        timeoutMs: 12_000,
        accept: "application/rss+xml,application/atom+xml,application/xml,text/xml,*/*",
      })
      pagesFetched++
      const products = parseFeed(text, storeRoot)
      if (products.length > 0) {
        return {
          extractor: "rss_xml",
          products,
          pagesFetched,
          warnings,
        }
      }
    } catch {
      /* next */
    }
  }

  return null
}

function parseFeed(xml: string, baseUrl: string): NormalizedProduct[] {
  const products: NormalizedProduct[] = []

  // RSS items
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || []
  for (const block of items) {
    const title = tagText(block, "title")
    const link = tagText(block, "link") || tagText(block, "guid")
    const description = tagText(block, "description") || tagText(block, "content:encoded")
    const image =
      attrInTag(block, "media:content", "url") ||
      attrInTag(block, "enclosure", "url") ||
      tagText(block, "image") ||
      null
    const price =
      tagText(block, "g:price") ||
      tagText(block, "price") ||
      null
    const id = tagText(block, "g:id") || tagText(block, "guid")
    const sku = tagText(block, "g:mpn") || tagText(block, "sku")

    if (!title || !link) continue
    const normalized = buildNormalizedProduct({
      title,
      description: stripHtml(description),
      productUrl: link,
      imageUrl: image,
      price: price ? parseFloat(String(price).replace(/[^0-9.]/g, "")) : null,
      platformProductId: id,
      sku,
      baseUrl,
    })
    if (normalized) products.push(normalized)
  }

  // Atom entries
  const entries = xml.match(/<entry[\s\S]*?<\/entry>/gi) || []
  for (const block of entries) {
    const title = tagText(block, "title")
    const link =
      attrInTag(block, "link", "href") ||
      tagText(block, "id")
    const description = tagText(block, "summary") || tagText(block, "content")
    if (!title || !link) continue
    const normalized = buildNormalizedProduct({
      title,
      description: stripHtml(description),
      productUrl: link,
      baseUrl,
    })
    if (normalized) products.push(normalized)
  }

  return products
}

function tagText(block: string, tag: string): string | null {
  const re = new RegExp(`<(?:\\w+:)?${tag.replace(":", ":")}[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${tag.replace(/^.*:/, "")}>`, "i")
  // simpler approach for namespaced tags
  const plain = new RegExp(
    `<${tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^>]*>([\\s\\S]*?)<\\/${tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}>`,
    "i"
  )
  const m = block.match(plain)
  if (!m) return null
  return decode(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")).trim() || null
}

function attrInTag(block: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag.replace(":", ":")}[^>]*\\s${attr}=["']([^"']+)["'][^>]*>`, "i")
  const plain = new RegExp(
    `<${tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^>]*\\s${attr}=["']([^"']+)["'][^>]*>`,
    "i"
  )
  const m = block.match(plain)
  return m?.[1] ? decode(m[1]) : null
}

function decode(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}
