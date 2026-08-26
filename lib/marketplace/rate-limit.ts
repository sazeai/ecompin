type Entry = { count: number; resetAt: number }

const buckets = new Map<string, Entry>()

export function checkMarketplaceRateLimit(key: string, limit: number, windowMs = 60 * 60 * 1000) {
  const now = Date.now()
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt }
  }

  current.count += 1
  return { allowed: true, remaining: limit - current.count }
}
