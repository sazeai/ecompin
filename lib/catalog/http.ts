/**
 * Polite HTTP helpers for public storefront crawling.
 * - identifiable UA
 * - timeout
 * - light concurrency / delay
 * - robots.txt best-effort gate
 */

export const CATALOG_USER_AGENT =
  "EcomPinCatalogBot/1.0 (+https://ecompin.com/bot; catalog-sync; respectful crawler)"

const DEFAULT_TIMEOUT_MS = 12_000
const MIN_DELAY_MS = 120

export class CatalogHttpError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = "CatalogHttpError"
  }
}

export interface FetchTextResult {
  url: string
  finalUrl: string
  status: number
  text: string
  etag: string | null
  lastModified: string | null
  contentType: string | null
}

let lastFetchAt = 0

async function throttle() {
  const now = Date.now()
  const wait = MIN_DELAY_MS - (now - lastFetchAt)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastFetchAt = Date.now()
}

export async function fetchText(
  url: string,
  opts?: { timeoutMs?: number; accept?: string; headers?: Record<string, string> }
): Promise<FetchTextResult> {
  await throttle()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": CATALOG_USER_AGENT,
        Accept: opts?.accept || "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
        "Accept-Language": "en-US,en;q=0.8",
        ...(opts?.headers || {}),
      },
    })

    const text = await res.text()
    if (!res.ok) {
      throw new CatalogHttpError(`HTTP ${res.status} for ${url}`, res.status)
    }

    return {
      url,
      finalUrl: res.url || url,
      status: res.status,
      text,
      etag: res.headers.get("etag"),
      lastModified: res.headers.get("last-modified"),
      contentType: res.headers.get("content-type"),
    }
  } finally {
    clearTimeout(timeout)
  }
}

export async function fetchJson<T = unknown>(
  url: string,
  opts?: { timeoutMs?: number }
): Promise<{ data: T; finalUrl: string; status: number }> {
  const result = await fetchText(url, {
    ...opts,
    accept: "application/json,text/javascript,*/*;q=0.8",
  })
  try {
    return {
      data: JSON.parse(result.text) as T,
      finalUrl: result.finalUrl,
      status: result.status,
    }
  } catch {
    throw new CatalogHttpError(`Invalid JSON from ${url}`, result.status)
  }
}

export interface RobotsRules {
  allowed: boolean
  sitemaps: string[]
  crawlDelayMs: number
}

/**
 * Minimal robots.txt parser for our bot group + * .
 * Fail-open (allowed=true) if robots can't be fetched — public catalog import
 * should not hard-fail on robots outage; we still stay polite with delays.
 */
export async function loadRobots(storeRoot: string): Promise<RobotsRules> {
  const robotsUrl = new URL("/robots.txt", storeRoot).toString()
  try {
    const { text } = await fetchText(robotsUrl, {
      timeoutMs: 6_000,
      accept: "text/plain,*/*",
    })
    return parseRobots(text)
  } catch {
    return { allowed: true, sitemaps: [], crawlDelayMs: MIN_DELAY_MS }
  }
}

export function parseRobots(body: string): RobotsRules {
  const lines = body.split(/\r?\n/).map((l) => l.trim())
  const sitemaps: string[] = []
  let active = false
  let appliesToUs = false
  let disallowAll = false
  let crawlDelaySec = 0

  for (const line of lines) {
    if (!line || line.startsWith("#")) continue
    const idx = line.indexOf(":")
    if (idx < 0) continue
    const key = line.slice(0, idx).trim().toLowerCase()
    const value = line.slice(idx + 1).trim()

    if (key === "sitemap" && value) {
      sitemaps.push(value)
      continue
    }

    if (key === "user-agent") {
      const ua = value.toLowerCase()
      active = ua === "*" || ua.includes("ecompin") || ua.includes("bot")
      if (active && (ua.includes("ecompin") || ua === "*")) appliesToUs = true
      continue
    }

    if (!active) continue

    if (key === "disallow") {
      if (value === "/" && appliesToUs) disallowAll = true
    }
    if (key === "crawl-delay") {
      const n = parseFloat(value)
      if (Number.isFinite(n) && n > 0) crawlDelaySec = Math.max(crawlDelaySec, n)
    }
  }

  return {
    allowed: !disallowAll,
    sitemaps,
    crawlDelayMs: crawlDelaySec > 0 ? Math.round(crawlDelaySec * 1000) : MIN_DELAY_MS,
  }
}

export function isPathDisallowedByRobots(robotsBody: string, path: string): boolean {
  // Lightweight: only honor Disallow: / for * (already handled). Per-path
  // matching is intentionally shallow — we never crawl admin/cart/checkout.
  const blocked = ["/admin", "/cart", "/checkout", "/account", "/orders"]
  return blocked.some((b) => path.startsWith(b))
}

export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0

  async function run() {
    while (next < items.length) {
      const i = next++
      results[i] = await worker(items[i], i)
    }
  }

  const agents = Array.from({ length: Math.min(concurrency, items.length) }, () => run())
  await Promise.all(agents)
  return results
}
