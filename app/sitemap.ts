import type { MetadataRoute } from "next"

import { getProblemSummaries } from "@/lib/marketplace/queries"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://fixthis.example").replace(/\/$/, "")

  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    ...["/privacy-policy", "/terms", "/refund-policy"].map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ]

  // Problem pages are the indexable surface; a query failure must not take the
  // whole sitemap down with it.
  let problemEntries: MetadataRoute.Sitemap = []
  try {
    const problems = await getProblemSummaries({ limit: 5000 })
    problemEntries = problems.map((problem) => ({
      url: `${baseUrl}/problems/${problem.slug}`,
      lastModified: new Date(problem.published_at || problem.created_at),
      changeFrequency: "daily" as const,
      priority: problem.competitor_count > 0 ? 0.8 : 0.6,
    }))
  } catch (error) {
    console.error("FIXTHIS sitemap problem query failed", error)
  }

  return [...staticEntries, ...problemEntries]
}
