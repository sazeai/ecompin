import { OpportunityCard } from "@/components/marketplace/opportunity-card"
import type { Opportunity } from "@/types/marketplace"

export function OpportunityGrid({ opportunities }: { opportunities: Opportunity[] }) {
  return (
    <section id="marketplace" className="bg-[#0c0c0c] px-5 py-20 text-white sm:px-8 sm:py-24">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-[11px] font-bold tracking-[0.16em] text-[#74716d]">THE MARKETPLACE</p>
            <h2 className="font-instrument-serif text-[40px] leading-none tracking-[-0.04em] sm:text-[54px]">Customers up for grabs.</h2>
          </div>
          <p className="hidden max-w-[250px] text-right text-sm leading-6 text-[#85817c] sm:block">Newest listings first. Emails and identities stay private.</p>
        </div>

        {opportunities.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {opportunities.map((opportunity) => <OpportunityCard key={opportunity.id} opportunity={opportunity} />)}
          </div>
        ) : (
          <div className="rounded-[14px] border border-dashed border-white/15 px-6 py-20 text-center">
            <p className="font-instrument-serif text-3xl">The board is clean.</p>
            <p className="mt-2 text-sm text-[#85817c]">Be the first customer up for grabs.</p>
          </div>
        )}
      </div>
    </section>
  )
}
