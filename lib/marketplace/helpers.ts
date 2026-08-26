import { randomBytes } from "crypto"

export function createOpportunitySlug(productName: string) {
  const normalized = productName
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 44) || "saas"

  const suffix = randomBytes(2).toString("hex")
  return `leaving-${normalized}-${suffix}`
}

export function getAppUrl(requestUrl?: string) {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL
  if (configured) return configured.replace(/\/$/, "")
  if (requestUrl) return new URL(requestUrl).origin
  return "http://localhost:3000"
}

export function getProductHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export function formatRelativeTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))

  if (seconds < 60) return "Listed just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Listed ${minutes} minute${minutes === 1 ? "" : "s"} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Listed ${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `Listed ${days} day${days === 1 ? "" : "s"} ago`

  return `Listed ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric" })}`
}

export function getRequestIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  )
}
