import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { formatRelativeTime } from "@/lib/marketplace/helpers"
import type { Opportunity } from "@/types/marketplace"

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const offerLabel = opportunity.offer_count === 0
    ? "Nobody has made an offer yet"
    : `${opportunity.offer_count} competitor${opportunity.offer_count === 1 ? "" : "s"} fighting for them`

  return (
    <article className="group flex min-h-[330px] flex-col rounded-[14px] border border-white/10 bg-[#151515] p-6 text-white transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-[#191919] sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-[11px] font-bold tracking-[0.13em] text-[#d4d1cb]"><span className="size-2 shrink-0 rounded-full bg-[#f1503a] shadow-[0_0_0_4px_rgba(241,80,58,.12)]" /> LEAVING <span className="truncate text-white">{opportunity.leaving_product.toUpperCase()}</span></p>
        {opportunity.is_demo ? <span className="rounded border border-[#f0a395]/30 bg-[#f1503a]/10 px-2 py-1 text-[9px] font-extrabold tracking-[0.14em] text-[#ff9c8c]">DEMO</span> : null}
      </div>
      <div className="mt-9">
        <p className="font-instrument-serif text-[43px] leading-none tracking-[-0.04em] sm:text-[49px]">${opportunity.monthly_spend.toLocaleString("en-US")}<span className="ml-1 text-xl text-[#aaa7a1]">/mo</span></p>
        <p className="mt-2 text-[11px] font-semibold tracking-[0.12em] text-[#77746f]">CUSTOMER</p>
      </div>
      <blockquote className="mt-7 line-clamp-3 text-[17px] leading-7 text-[#d6d3cd]">“{opportunity.reason}”</blockquote>
      <div className="mt-auto pt-8">
        <div className="flex items-center justify-between border-t border-white/10 pt-5">
          <div>
            <p className={`text-xs font-semibold ${opportunity.offer_count ? "text-[#a9d9b8]" : "text-[#9c9994]"}`}>{offerLabel}</p>
            <p className="mt-1 text-[11px] text-[#6f6c68]">{formatRelativeTime(opportunity.created_at)}</p>
          </div>
          <Link href={`/o/${opportunity.slug}`} aria-label={`View customer leaving ${opportunity.leaving_product}`} className="grid size-11 shrink-0 place-items-center rounded-full border border-white/15 bg-white text-black transition group-hover:rotate-3 group-hover:bg-[#f1eee8]"><ArrowUpRight size={18} /></Link>
        </div>
      </div>
    </article>
  )
}
