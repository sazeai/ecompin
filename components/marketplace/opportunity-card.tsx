import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { formatRelativeTime } from "@/lib/marketplace/helpers"
import type { Opportunity } from "@/types/marketplace"

export function OpportunityCard({ opportunity, position }: { opportunity: Opportunity; position: number }) {
  const offerLabel = opportunity.offer_count === 0
    ? "Open lane — no offers yet"
    : `${opportunity.offer_count} competitor${opportunity.offer_count === 1 ? "" : "s"} fighting for them`
  const isNewest = position === 1

  return (
    <Link href={`/o/${opportunity.slug}`} aria-label={`View customer leaving ${opportunity.leaving_product}`} className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#111]">
      <article className={`relative flex min-h-[158px] h-full flex-col overflow-hidden px-5 py-4 transition-colors duration-200 sm:px-6 ${isNewest ? "bg-[#fff3ee] shadow-[inset_0_0_0_1px_rgba(239,78,55,.72)] group-hover:bg-[#ffede6]" : "bg-[#fafafa] group-hover:bg-white"}`}>
        {isNewest ? <div className="absolute inset-x-0 top-0 h-[3px] bg-[#ef654f]" /> : null}
        <div className="flex items-start gap-3">
          <span className={`grid h-8 min-w-8 shrink-0 place-items-center rounded-full font-mono text-[9px] font-semibold ${isNewest ? "bg-[#ef654f] text-white" : "border border-[rgba(55,50,47,.13)] bg-white text-[#777]"}`}>#{String(position).padStart(2, "0")}</span>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-[15px] font-semibold text-[#111]">{opportunity.leaving_product}</p>
              {isNewest ? <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.12em] text-[#d84d37]">Newest</span> : null}
              {opportunity.is_demo ? <span className="shrink-0 border border-[rgba(55,50,47,.12)] bg-white/70 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[#999]">Demo</span> : null}
            </div>
            <p className="mt-0.5 font-mono text-[8px] font-medium uppercase tracking-[0.13em] text-[#999]">Customer leaving</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <p className={`font-serif text-[27px] leading-none tracking-[-0.04em] ${isNewest ? "text-[#db4e38]" : "text-[#111]"}`}>${opportunity.monthly_spend.toLocaleString("en-US")}<span className="ml-0.5 text-[10px] text-[#888]">/mo</span></p>
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[rgba(55,50,47,.12)] bg-white/80 text-[#111] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"><ArrowUpRight size={14} /></span>
          </div>
        </div>
        <blockquote className="mt-3 line-clamp-1 pl-11 text-[13px] leading-5 text-[#5e5952]">“{opportunity.reason}”</blockquote>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-[rgba(55,50,47,0.1)] pt-2.5">
          <p className="min-w-0 truncate text-[10px] font-medium text-[#555]"><span className="mr-1.5 inline-block size-1.5 rounded-full bg-emerald-500" />{offerLabel}</p>
          <p className="shrink-0 font-mono text-[8px] uppercase tracking-wide text-[#aaa]">{formatRelativeTime(opportunity.created_at)}</p>
        </div>
      </article>
    </Link>
  )
}
