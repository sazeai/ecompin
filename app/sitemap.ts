import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://steal.lol").replace(/\/$/, "")
  return ["", "/privacy-policy", "/terms", "/refund-policy"].map((path, index) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: index === 0 ? "daily" : "monthly",
    priority: index === 0 ? 1 : 0.4,
  }))
}
