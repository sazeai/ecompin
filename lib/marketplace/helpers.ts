import { createHash, randomBytes } from "crypto"
import { getDomain } from "tldts"

export const PROBLEM_CATEGORIES = [
  "Analytics", "Automation", "Communication", "Design", "Developer tools",
  "Finance", "Knowledge", "Marketing", "Product", "Productivity", "Sales", "Support", "Other",
] as const

export function normalizeProblemStatement(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

export function createProblemSlug(statement: string) {
  const normalized = normalizeProblemStatement(statement).split(" ").slice(0, 9).join("-").slice(0, 72) || "problem"
  return `${normalized}-${randomBytes(2).toString("hex")}`
}

export function normalizeProductUrl(value: string) {
  const url = new URL(value)
  if (url.protocol !== "https:") throw new Error("Product URLs must use HTTPS.")
  if (url.username || url.password) throw new Error("Product URLs cannot contain credentials.")
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "")
  if (hostname === "localhost" || hostname.endsWith(".local")) throw new Error("Enter a public product URL.")
  const domain = getDomain(hostname, { allowPrivateDomains: false })
  if (!domain) throw new Error("Enter a valid public product domain.")
  url.hash = ""
  return { destinationUrl: url.toString(), registrableDomain: domain.toLowerCase() }
}

export function getAppUrl(requestUrl?: string) {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL
  if (configured) return configured.replace(/\/$/, "")
  if (requestUrl) return new URL(requestUrl).origin
  return "http://localhost:3000"
}

export function getRequestIp(request: Request) {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
}

export function isKnownBot(request: Request) {
  const userAgent = request.headers.get("user-agent") || ""
  return /bot|crawler|spider|slurp|facebookexternalhit|twitterbot|slackbot|discordbot|preview/i.test(userAgent)
}

export function sha256(value: string) { return createHash("sha256").update(value).digest("hex") }

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100)
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: value >= 1000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value)
}

export function rotationPercentages(count: number) {
  if (count <= 0) return []
  if (count === 1) return [100]
  if (count === 2) return [70, 30]
  const lowerCount = Math.min(count, 5) - 2
  const base = Math.floor(15 / lowerCount)
  const remainder = 15 % lowerCount
  return [60, 25, ...Array.from({ length: lowerCount }, (_, index) => base + (index < remainder ? 1 : 0))]
}
