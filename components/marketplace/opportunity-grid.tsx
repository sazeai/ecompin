import { OpportunityCard } from "@/components/marketplace/opportunity-card"
import type { Opportunity } from "@/types/marketplace"

export function OpportunityGrid({ opportunities }: { opportunities: Opportunity[] }) {
  return (
    <section id="marketplace" className="w-full">
      <header className="flex flex-col gap-2 border-y border-[rgba(55,50,47,0.12)] bg-[#fafafa] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex items-center gap-2.5">
          <span className="size-2 rounded-full bg-[#ef4e37] shadow-[0_0_0_3px_rgba(239,78,55,.11)]" />
          <h2 className="whitespace-nowrap font-serif text-[16px] tracking-[-0.02em] text-[#111] sm:text-[18px]">Customers up for grabs</h2>
          <span className="rounded-full border border-[rgba(55,50,47,.12)] bg-white px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#777]">{opportunities.length} live</span>
        </div>
        <p className="text-[11px] text-[#777]">Newest first <span className="mx-1 text-[#bbb]">·</span> Identities stay private</p>
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
