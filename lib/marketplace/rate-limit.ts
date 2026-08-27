import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

type MemoryEntry = { count: number; resetAt: number }
const memory = new Map<string, MemoryEntry>()
let redis: Redis | null = null

function getRedis() {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

export async function checkMarketplaceRateLimit(key: string, limit: number, window: "1 m" | "10 m" | "1 h" = "1 h") {
  const client = getRedis()
  if (client) {
    const result = await new Ratelimit({ redis: client, limiter: Ratelimit.slidingWindow(limit, window), prefix: "fixthis" }).limit(key)
    return { allowed: result.success, remaining: result.remaining }
  }
  const now = Date.now()
  const windowMs = window === "1 m" ? 60_000 : window === "10 m" ? 600_000 : 3_600_000
  const entry = memory.get(key)
  if (!entry || entry.resetAt <= now) { memory.set(key, { count: 1, resetAt: now + windowMs }); return { allowed: true, remaining: limit - 1 } }
  if (entry.count >= limit) return { allowed: false, remaining: 0 }
  entry.count += 1
  return { allowed: true, remaining: limit - entry.count }
}
