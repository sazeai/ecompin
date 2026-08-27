import { OpportunityCard } from "@/components/marketplace/opportunity-card"
import type { Opportunity } from "@/types/marketplace"

export function OpportunityGrid({ opportunities }: { opportunities: Opportunity[] }) {
  const totalMonthlySpend = opportunities.reduce((total, opportunity) => total + opportunity.monthly_spend, 0)
  const totalOffers = opportunities.reduce((total, opportunity) => total + opportunity.offer_count, 0)
  const liveCount = opportunities.filter((opportunity) => !opportunity.is_demo).length
  const demoCount = opportunities.length - liveCount

  return (
    <section id="marketplace" className="w-full">
      <header className="flex flex-col gap-3 border-y border-[rgba(55,50,47,0.12)] bg-[#fafafa] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="size-2 rounded-full bg-[#ef4e37] shadow-[0_0_0_3px_rgba(239,78,55,.11)]" />
            <h2 className="whitespace-nowrap font-serif text-[16px] tracking-[-0.02em] text-[#111] sm:text-[18px]">Customers up for grabs</h2>
            <span className="whitespace-nowrap rounded-full border border-[rgba(55,50,47,.12)] bg-white px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.08em] text-[#777] sm:px-2 sm:text-[8px]">{liveCount} live{demoCount ? ` · ${demoCount} demo` : ""}</span>
          </div>
          <p className="mt-1.5 text-[10px] text-[#888]">Make an offer without leaving this board.</p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-[rgba(55,50,47,.1)] border-t border-[rgba(55,50,47,.1)] pt-3 sm:min-w-[48%] sm:border-t-0 sm:pt-0">
          <p className="pr-3"><span className="block font-serif text-[18px] leading-none text-[#111]">${totalMonthlySpend.toLocaleString("en-US")}</span><span className="mt-1 block font-mono text-[7px] uppercase tracking-[0.12em] text-[#999]">Monthly spend moving</span></p>
          <p className="px-3"><span className="block font-serif text-[18px] leading-none text-[#111]">{totalOffers}</span><span className="mt-1 block font-mono text-[7px] uppercase tracking-[0.12em] text-[#999]">Offers live</span></p>
          <p className="pl-3"><span className="block font-serif text-[18px] leading-none text-[#111]">$9</span><span className="mt-1 block font-mono text-[7px] uppercase tracking-[0.12em] text-[#999]">To enter any race</span></p>
        </div>
      </header>

      {opportunities.length ? (
        <div className="grid bg-[rgba(55,50,47,0.12)] md:grid-cols-2 md:gap-px">
          {opportunities.map((opportunity, index) => <div key={opportunity.id} className={`${index ? "border-t border-[rgba(55,50,47,.12)]" : ""} md:border-t-0`}><OpportunityCard opportunity={opportunity} position={index + 1} /></div>)}
        </div>
      ) : (
        <div className="border-y border-dashed border-[rgba(55,50,47,.16)] bg-[#fafafa] px-6 py-20 text-center"><p className="font-serif text-3xl text-[#111]">The board is clean.</p><p className="mt-2 text-sm text-[#777]">Be the first customer up for grabs.</p></div>
      )}
    </section>
  )
}
