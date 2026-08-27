import type { Metadata } from "next"

import { Footer } from "@/components/marketplace/footer"
import { FramedSection, MarketplaceFrame } from "@/components/marketplace/frame"
import { Header } from "@/components/marketplace/header"
import { Hero } from "@/components/marketplace/hero"
import { OpportunityGrid } from "@/components/marketplace/opportunity-grid"
import { getMarketplaceOpportunities } from "@/lib/marketplace/queries"
import type { Opportunity } from "@/types/marketplace"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "STEAL.LOL — Steal Customers From Your Competitors", description: "People leaving SaaS products list themselves here. Competitors pay to win their business." }

function HowItWorks() {
  const steps = [
    ["01", "List yourself", "Say what SaaS you're leaving, what you pay, and why."],
    ["02", "Competitors offer", "Founders pay $9 once to put a switching offer in front of you."],
    ["03", "You decide", "Visit any product that interests you. Your identity stays private."],
  ]
  return (
    <section id="how-it-works" className="w-full">
      <header className="flex flex-col gap-1 border-y border-[rgba(55,50,47,0.12)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8"><div className="flex items-center gap-3"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#999]">How it works</p><h2 className="font-serif text-xl text-[#111]">List. Offer. Switch.</h2></div><p className="text-[11px] text-[#777]">One simple loop. No account required.</p></header>
      <div className="grid border-y border-[rgba(55,50,47,0.12)] bg-[rgba(55,50,47,0.12)] md:grid-cols-3 md:gap-px">
        {steps.map(([number, title, body], index) => <article key={number} className={`bg-[#fafafa] p-7 transition-colors hover:bg-white ${index ? "border-t border-[rgba(55,50,47,0.12)] md:border-t-0" : ""}`}><p className="font-mono text-[9px] tracking-[0.16em] text-[#aaa]">{number}</p><h3 className="mt-6 font-serif text-xl text-[#111]">{title}</h3><p className="mt-2 text-[13px] leading-5 text-[#666]">{body}</p></article>)}
      </div>
    </section>
  )
}

export default async function HomePage() {
  let opportunities: Opportunity[] = []
  try { opportunities = await getMarketplaceOpportunities() } catch (error) { console.error("Marketplace homepage query failed:", error) }
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#fafafa] font-sans text-[#111]">
      <div className="flex min-h-screen flex-col items-center">
        <MarketplaceFrame>
          <Header />
          <main className="relative z-10 mt-28 flex w-full flex-col items-center">
            <Hero />
            <FramedSection contentClassName="pt-6"><OpportunityGrid opportunities={opportunities} /></FramedSection>
            <FramedSection contentClassName="pb-16"><HowItWorks /></FramedSection>
            <FramedSection><Footer /></FramedSection>
          </main>
        </MarketplaceFrame>
      </div>
    </div>
  )
}
