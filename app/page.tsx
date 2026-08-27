import { Footer } from "@/components/marketplace/footer"
import { FramedSection, MarketplaceFrame } from "@/components/marketplace/frame"
import { Header } from "@/components/marketplace/header"
import { Hero } from "@/components/marketplace/hero"
import { MarketplaceHome } from "@/components/marketplace/marketplace-home"
import { PresenceTracker } from "@/components/marketplace/presence-tracker"
import { getProblemSummaries, getPublicTrafficStats } from "@/lib/marketplace/queries"
import { buildProblemSections } from "@/lib/marketplace/sections"
import type { ProblemSummary, PublicTrafficStats } from "@/types/marketplace"

export const dynamic = "force-dynamic"

function HowItWorks() {
  const steps = [
    ["01", "Post a problem", "Describe what you need, or validate an existing pain with one click."],
    ["02", "Products compete", "Founders pay once to claim exposure against that exact problem."],
    ["03", "Attention rotates", "The leading product gets about 60%; other top bidders still receive traffic."],
  ]
  return <section id="how-it-works" className="w-full"><header className="flex flex-col gap-1 border-y border-[rgba(55,50,47,0.12)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8"><div className="flex items-center gap-3"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#999]">How it works</p><h2 className="font-serif text-xl text-[#111]">Post. Validate. Compete.</h2></div><p className="text-[11px] text-[#777]">No public account required.</p></header><div className="grid border-y border-[rgba(55,50,47,0.12)] bg-[rgba(55,50,47,0.12)] md:grid-cols-3 md:gap-px">{steps.map(([number, title, body], index) => <article key={number} className={`bg-[#fafafa] p-7 transition-colors hover:bg-white ${index ? "border-t border-[rgba(55,50,47,0.12)] md:border-t-0" : ""}`}><p className="font-mono text-[9px] tracking-[0.16em] text-[#aaa]">{number}</p><h3 className="mt-6 font-serif text-xl text-[#111]">{title}</h3><p className="mt-2 text-[13px] leading-5 text-[#666]">{body}</p></article>)}</div></section>
}

export default async function HomePage() {
  let problems: ProblemSummary[] = []
  let traffic: PublicTrafficStats = { live_visitors: null, visitors_24h: 0 }
  try { [problems, traffic] = await Promise.all([getProblemSummaries(), getPublicTrafficStats()]) } catch (error) { console.error("FIXTHIS homepage query failed", error) }
  const sections = buildProblemSections(problems)
  return <div className="relative flex min-h-screen w-full flex-col bg-[#fafafa] font-sans text-[#111]"><PresenceTracker initial={traffic} /><div className="flex min-h-screen flex-col items-center"><MarketplaceFrame><Header /><main className="relative z-10 mt-28 flex w-full flex-col items-center"><Hero /><FramedSection contentClassName="pt-6"><MarketplaceHome problems={problems} sections={sections} /></FramedSection><FramedSection contentClassName="pb-16"><HowItWorks /></FramedSection><FramedSection><Footer /></FramedSection></main></MarketplaceFrame></div></div>
}
