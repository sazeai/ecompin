import { ArrowUpRight } from "lucide-react"

import { getProductHost } from "@/lib/marketplace/helpers"
import type { Offer } from "@/types/marketplace"

export function OfferCard({ offer }: { offer: Offer }) {
  return (
    <article className="rounded-[14px] border border-black/10 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,.04)] sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-instrument-serif text-[30px] leading-none text-[#151412]">{offer.product_name}</h3>
          <p className="mt-2 text-xs font-medium text-[#77726a]">{getProductHost(offer.product_url)}</p>
        </div>
        <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-extrabold tracking-[0.12em] text-emerald-700">PAID OFFER</span>
      </div>
      <blockquote className="my-7 text-[18px] leading-7 text-[#37342f]">“{offer.offer_text}”</blockquote>
      <a href={offer.product_url} target="_blank" rel="noopener noreferrer sponsored" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#151412] px-4 text-sm font-semibold text-white transition hover:bg-black">VISIT {offer.product_name.toUpperCase()} <ArrowUpRight size={15} /></a>
    </article>
  )
}
