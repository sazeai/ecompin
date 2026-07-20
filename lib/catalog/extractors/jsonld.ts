import * as cheerio from "cheerio"
import { buildNormalizedProduct, parsePrice, stripHtml } from "../normalize"
import type { NormalizedProduct } from "../types"

type JsonLdNode = Record<string, unknown>

/**
 * Extract Product entities from JSON-LD blocks in an HTML document.
 */
export function extractProductsFromJsonLd(
  html: string,
  pageUrl: string
): NormalizedProduct[] {
  const $ = cheerio.load(html)
  const nodes: JsonLdNode[] = []

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text()
    if (!raw?.trim()) return
    try {
      const parsed = JSON.parse(raw)
      collectNodes(parsed, nodes)
    } catch {
      // Some sites emit multiple JSON objects; try a loose repair by wrapping
      try {
        const repaired = JSON.parse(`[${raw.replace(/}\s*{/g, "},{")}]`)
        collectNodes(repaired, nodes)
      } catch {
        /* ignore bad blocks */
      }
    }
  })

  const products: NormalizedProduct[] = []
  for (const node of nodes) {
    const mapped = mapProductNode(node, pageUrl)
    if (mapped) products.push(mapped)
  }
  return products
}

function collectNodes(value: unknown, out: JsonLdNode[]) {
  if (!value) return
  if (Array.isArray(value)) {
    for (const v of value) collectNodes(v, out)
    return
  }
  if (typeof value !== "object") return
  const obj = value as JsonLdNode
  out.push(obj)
  if (obj["@graph"]) collectNodes(obj["@graph"], out)
  // ItemList elements
  if (Array.isArray(obj.itemListElement)) {
    for (const item of obj.itemListElement) {
      if (item && typeof item === "object") {
        const el = item as JsonLdNode
        collectNodes(el.item || el, out)
      }
    }
  }
}

function typeIncludes(node: JsonLdNode, typeName: string): boolean {
  const t = node["@type"]
  if (!t) return false
  if (typeof t === "string") return t.toLowerCase() === typeName.toLowerCase()
  if (Array.isArray(t)) return t.some((x) => String(x).toLowerCase() === typeName.toLowerCase())
  return false
}

function mapProductNode(node: JsonLdNode, pageUrl: string): NormalizedProduct | null {
  // Direct Product
  if (typeIncludes(node, "Product")) {
    return productFromFields(node, pageUrl)
  }

  // ProductGroup / some themes nest offers
  if (typeIncludes(node, "ProductGroup") || typeIncludes(node, "IndividualProduct")) {
    return productFromFields(node, pageUrl)
  }

  return null
}

function productFromFields(node: JsonLdNode, pageUrl: string): NormalizedProduct | null {
  const title = stringField(node.name) || stringField(node.title)
  if (!title) return null

  const productUrl =
    stringField(node.url) ||
    stringField(node["@id"]) ||
    pageUrl

  const description = stringField(node.description)

  const imageUrl = firstImage(node.image)
  const offers = firstOffer(node.offers)
  const price = offers ? parsePrice(offers.price ?? offers.lowPrice) : null
  const currency = offers ? stringField(offers.priceCurrency) : null
  const sku = stringField(node.sku) || (offers ? stringField(offers.sku) : null)
  const platformProductId =
    stringField(node.productID) ||
    stringField(node.mpn) ||
    stringField(node.gtin) ||
    stringField(node.gtin13) ||
    stringField(node.gtin14) ||
    null

  let availability: NormalizedProduct["availability"] = "unknown"
  const avail = offers ? stringField(offers.availability) : null
  if (avail) {
    if (/instock|in_stock|limitedavailability/i.test(avail)) availability = "in_stock"
    else if (/outofstock|out_of_stock|discontinued|soldout/i.test(avail)) availability = "out_of_stock"
  }

  const brand = node.brand
  const tags: string[] = []
  if (brand && typeof brand === "object") {
    const b = stringField((brand as JsonLdNode).name)
    if (b) tags.push(b)
  } else if (typeof brand === "string") {
    tags.push(brand)
  }
  const category = stringField(node.category)
  if (category) tags.push(category)

  return buildNormalizedProduct({
    title,
    description: stripHtml(description),
    productUrl,
    imageUrl,
    price,
    currency,
    sku,
    platformProductId,
    tags,
    availability,
    baseUrl: pageUrl,
  })
}

function stringField(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (typeof value === "number") return String(value)
  return null
}

function firstImage(image: unknown): string | null {
  if (!image) return null
  if (typeof image === "string") return image
  if (Array.isArray(image)) {
    for (const item of image) {
      const found = firstImage(item)
      if (found) return found
    }
    return null
  }
  if (typeof image === "object") {
    const obj = image as JsonLdNode
    return stringField(obj.url) || stringField(obj.contentUrl) || stringField(obj["@id"])
  }
  return null
}

function firstOffer(offers: unknown): JsonLdNode | null {
  if (!offers) return null
  if (Array.isArray(offers)) {
    const first = offers.find((o) => o && typeof o === "object")
    return (first as JsonLdNode) || null
  }
  if (typeof offers === "object") {
    const obj = offers as JsonLdNode
    // AggregateOffer
    if (obj.offers) return firstOffer(obj.offers) || obj
    return obj
  }
  return null
}

/**
 * OpenGraph / basic meta fallback when JSON-LD is missing on a product page.
 */
export function extractProductFromMeta(html: string, pageUrl: string): NormalizedProduct | null {
  const $ = cheerio.load(html)
  const ogType = $('meta[property="og:type"]').attr("content") || ""
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").first().text() ||
    ""
  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    null
  const image =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[property="og:image:secure_url"]').attr("content") ||
    null
  const url = $('meta[property="og:url"]').attr("content") || pageUrl
  const price =
    $('meta[property="product:price:amount"]').attr("content") ||
    $('meta[property="og:price:amount"]').attr("content") ||
    null
  const currency =
    $('meta[property="product:price:currency"]').attr("content") ||
    $('meta[property="og:price:currency"]').attr("content") ||
    null

  // Only accept if it looks like a product page
  const looksProduct =
    /product/i.test(ogType) ||
    !!$('meta[property="product:price:amount"]').attr("content") ||
    /\/products?\//i.test(pageUrl)

  if (!looksProduct || !title.trim()) return null

  return buildNormalizedProduct({
    title: title.trim(),
    description,
    productUrl: url,
    imageUrl: image,
    price: parsePrice(price),
    currency,
    baseUrl: pageUrl,
  })
}
