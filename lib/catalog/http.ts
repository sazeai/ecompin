/**
 * Polite HTTP helpers for public storefront crawling.
 * - browser-like UA (custom bot UAs get 403/429 on many Shopify stores)
 * - timeout + 429/503 retry with backoff
 * - global throttle
 * - robots.txt best-effort gate
 */

// Browser-like UA: Shopify/Cloudflare often hard-throttle custom bot strings.
// We still identify via Accept-Language and low concurrency.
export const CATALOG_USER_AGENT =
  "Mozilla/5.0 (compatible; EcomPinCatalog/1.0; +https://ecompin.com/bot) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

const DEFAULT_TIMEOUT_MS = 15_000
const MIN_DELAY_MS = 350
const MAX_RETRIES = 4

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
let adaptiveDelayMs = MIN_DELAY_MS

async function throttle() {
  const now = Date.now()
  const wait = adaptiveDelayMs - (now - lastFetchAt)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastFetchAt = Date.now()
}

function bumpDelay(onRateLimit: boolean) {
  if (onRateLimit) {
    adaptiveDelayMs = Math.min(4_000, Math.max(adaptiveDelayMs * 2, 800))
  } else {
    // slowly recover toward baseline after successes
    adaptiveDelayMs = Math.max(MIN_DELAY_MS, Math.floor(adaptiveDelayMs * 0.9))
  }
}

export async function fetchText(
  url: string,
  opts?: {
    timeoutMs?: number
    accept?: string
    headers?: Record<string, string>
    retries?: number
  }
): Promise<FetchTextResult> {
  const retries = opts?.retries ?? MAX_RETRIES
  let lastErr: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    await throttle()

    const controller = new AbortController()
    const timeout = setTimeout(
      () => controller.abort(),
      opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS
    )

    try {
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": CATALOG_USER_AGENT,
          Accept:
            opts?.accept ||
            "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          ...(opts?.headers || {}),
        },
      })

      const text = await res.text()

      if (res.status === 429 || res.status === 503) {
        bumpDelay(true)
        const retryAfter = res.headers.get("retry-after")
        const fromHeader = retryAfter ? parseFloat(retryAfter) * 1000 : NaN
        const backoff = Number.isFinite(fromHeader)
          ? Math.min(fromHeader, 15_000)
          : Math.min(8_000, 500 * 2 ** attempt)
        lastErr = new CatalogHttpError(`HTTP ${res.status} for ${url}`, res.status)
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, backoff))
          continue
        }
        throw lastErr
      }

      if (!res.ok) {
        throw new CatalogHttpError(`HTTP ${res.status} for ${url}`, res.status)
      }

      bumpDelay(false)

      return {
        url,
        finalUrl: res.url || url,
        status: res.status,
        text,
        etag: res.headers.get("etag"),
        lastModified: res.headers.get("last-modified"),
        contentType: res.headers.get("content-type"),
      }
    } catch (err) {
      lastErr = err
      if (err instanceof CatalogHttpError && err.status !== 429 && err.status !== 503) {
        throw err
      }
      if (attempt >= retries) throw err
      await new Promise((r) => setTimeout(r, Math.min(8_000, 400 * 2 ** attempt)))
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(`Failed to fetch ${url}`)
}

export async function fetchJson<T = unknown>(
  url: string,
  opts?: { timeoutMs?: number; retries?: number }
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
 * Fail-open (allowed=true) if robots can't be fetched.
 */
export async function loadRobots(storeRoot: string): Promise<RobotsRules> {
  const robotsUrl = new URL("/robots.txt", storeRoot).toString()
  try {
    const { text } = await fetchText(robotsUrl, {
      timeoutMs: 6_000,
      accept: "text/plain,*/*",
      retries: 1,
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

  if (crawlDelaySec > 0) {
    adaptiveDelayMs = Math.max(adaptiveDelayMs, Math.round(crawlDelaySec * 1000))
  }

  return {
    allowed: !disallowAll,
    sitemaps,
    crawlDelayMs: crawlDelaySec > 0 ? Math.round(crawlDelaySec * 1000) : MIN_DELAY_MS,
  }
}

export function isPathDisallowedByRobots(_robotsBody: string, path: string): boolean {
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

  const agents = Array.from({ length: Math.min(concurrency, Math.max(items.length, 1)) }, () =>
    run()
  )
  await Promise.all(agents)
  return results
}

/** Reset adaptive delay between independent store syncs. */
export function resetHttpThrottle() {
  adaptiveDelayMs = MIN_DELAY_MS
  lastFetchAt = 0
}
