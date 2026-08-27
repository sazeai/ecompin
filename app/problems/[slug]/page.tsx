import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProblemDetailView } from "@/components/marketplace/problem-detail-view"
import { PresenceTracker } from "@/components/marketplace/presence-tracker"
import { getProblemBySlug, getPublicTrafficStats } from "@/lib/marketplace/queries"

export const dynamic = "force-dynamic"
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ duplicate?: string; payment?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const problem = await getProblemBySlug(slug).catch(() => null)
  if (!problem) return { title: "Problem not found" }
  return { title: problem.statement, description: `${problem.support_count} people have this problem. See the products competing to solve it.`, alternates: { canonical: `/problems/${problem.slug}` }, openGraph: { title: problem.statement, description: `${problem.support_count} people have this too · ${problem.competitor_count} products competing` } }
}

export default async function ProblemPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const [problem, traffic] = await Promise.all([getProblemBySlug(slug).catch(() => null), getPublicTrafficStats().catch(() => ({ live_visitors: null, visitors_24h: 0 }))])
  if (!problem) notFound()

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://fixthis.example").replace(/\/$/, "")
  // Describe the page as what it is: a page about a stated problem. We do not
  // emit review, rating, or product markup, because a featured solution is a
  // paid placement rather than an endorsement.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${baseUrl}/problems/${problem.slug}`,
        url: `${baseUrl}/problems/${problem.slug}`,
        name: problem.statement,
        description: `${problem.support_count} people report this problem. ${problem.competitor_count} products are competing for the paid featured placement.`,
        inLanguage: "en",
        isPartOf: { "@type": "WebSite", name: "FIXTHIS", url: baseUrl },
        datePublished: problem.published_at || problem.created_at,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Problems", item: baseUrl },
          { "@type": "ListItem", position: 2, name: problem.category, item: `${baseUrl}/?category=${encodeURIComponent(problem.category)}` },
          { "@type": "ListItem", position: 3, name: problem.statement },
        ],
      },
    ],
  }

  return <>
    <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <PresenceTracker initial={traffic} />
    <ProblemDetailView problem={problem} duplicate={query.duplicate === "1"} paymentCancelled={query.payment === "cancelled"} />
  </>
}
