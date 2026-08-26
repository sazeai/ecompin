"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, LoaderCircle } from "lucide-react"

type OfferStatus = { status: string; opportunitySlug: string | null; leavingProduct: string | null }

export function OfferSuccess({ offerId }: { offerId: string }) {
  const [result, setResult] = useState<OfferStatus | null>(null)
  const [finishedPolling, setFinishedPolling] = useState(false)

  useEffect(() => {
    let cancelled = false
    let attempts = 0
    async function poll() {
      attempts += 1
      try {
        const response = await fetch(`/api/offers/${encodeURIComponent(offerId)}/status`, { cache: "no-store" })
        if (response.ok) {
          const next = await response.json()
          if (!cancelled) setResult(next)
          if (next.status === "paid") return
        }
      } catch {
        // A retry is more useful than surfacing a transient network error here.
      }

      if (!cancelled && attempts < 6) window.setTimeout(poll, 2000)
      else if (!cancelled) setFinishedPolling(true)
    }
    poll()
    return () => { cancelled = true }
  }, [offerId])

  const paid = result?.status === "paid"
  return (
    <div className="text-center">
      <div className={`mx-auto grid size-14 place-items-center rounded-full ${paid ? "bg-emerald-100 text-emerald-700" : "bg-black text-white"}`}>{paid ? <Check size={24} /> : <LoaderCircle size={24} className="animate-spin" />}</div>
      <p className="mt-6 text-xs font-extrabold tracking-[0.15em] text-[#e4573e]">{paid ? "PAID OFFER LIVE" : "PAYMENT RECEIVED"}</p>
      <h1 className="mt-3 font-instrument-serif text-[48px] leading-[.98] tracking-[-0.04em] sm:text-[62px]">{paid ? "You're live." : "You're in."}</h1>
      <p className="mx-auto mt-5 max-w-md text-[16px] leading-7 text-[#68635b]">{paid ? `Your offer is now in front of the customer leaving ${result?.leavingProduct || "their SaaS"}.` : finishedPolling ? "Dodo is still confirming the payment. Your offer will appear automatically—this page cannot publish it." : "Dodo is confirming the payment. Your offer will publish automatically in a moment."}</p>
      {result?.opportunitySlug ? <Link href={`/o/${result.opportunitySlug}`} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#151412] px-5 text-sm font-bold text-white">VIEW CUSTOMER <ArrowRight size={16} /></Link> : <Link href="/" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#151412] px-5 text-sm font-bold text-white">BACK TO MARKETPLACE <ArrowRight size={16} /></Link>}
    </div>
  )
}
