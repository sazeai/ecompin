import { ArrowUpRight } from "lucide-react"

import { getProductHost } from "@/lib/marketplace/helpers"
import type { Offer } from "@/types/marketplace"

export function OfferCard({ offer }: { offer: Offer }) {
  return (
    <article className="flex h-full flex-col bg-[#fafafa] p-7 transition-colors hover:bg-white sm:p-9">
      <div className="flex items-start justify-between gap-4">
        <div><h3 className="font-serif text-[30px] leading-none text-[#111]">{offer.product_name}</h3><p className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[#999]">{getProductHost(offer.product_url)}</p></div>
        <span className="border border-[rgba(55,50,47,.12)] bg-white px-2 py-1 font-mono text-[8px] uppercase tracking-[0.13em] text-[#777]">Paid offer</span>
      </div>
      <blockquote className="my-8 text-[18px] leading-7 text-[#44413c]">“{offer.offer_text}”</blockquote>
      <div className="mt-auto border-t border-[rgba(55,50,47,.1)] pt-5">
        <a href={offer.product_url} target="_blank" rel="noopener noreferrer sponsored" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#111] px-4 text-xs font-medium text-white transition hover:bg-black">VISIT {offer.product_name.toUpperCase()} <ArrowUpRight size={14} /></a>
      </div>
    </article>
  )
}
