import type { Metadata } from "next"

import { Footer } from "@/components/marketplace/footer"
import { Header } from "@/components/marketplace/header"
import { Hero } from "@/components/marketplace/hero"
import { OpportunityGrid } from "@/components/marketplace/opportunity-grid"
import { getMarketplaceOpportunities } from "@/lib/marketplace/queries"
import type { Opportunity } from "@/types/marketplace"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "STEAL.LOL — Steal Customers From Your Competitors",
  description: "People leaving SaaS products list themselves here. Competitors pay to win their business.",
  openGraph: {
    title: "STEAL.LOL — Steal Customers From Your Competitors",
    description: "People leaving SaaS products list themselves here. Competitors pay to win their business.",
    type: "website",
  },
}

export default async function HomePage() {
  let opportunities: Opportunity[] = []
  try {
    opportunities = await getMarketplaceOpportunities()
  } catch (error) {
    console.error("Marketplace homepage query failed:", error)
  }

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-[#151412]">
      <div className="mx-auto max-w-[1120px] border-x border-black/10 bg-[#fbfaf7] shadow-[0_0_80px_rgba(0,0,0,.035)]">
        <Header />
        <Hero />
      </div>
      <OpportunityGrid opportunities={opportunities} />
      <Footer />
    </main>
  )
}
