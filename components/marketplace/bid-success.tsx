"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, LoaderCircle, TriangleAlert } from "lucide-react"
import { FramedSection, MarketplaceFrame } from "@/components/marketplace/frame"
import { Header } from "@/components/marketplace/header"

type Status = { status?: string; rank?: number | null; problem_id?: string; error?: string }

export function BidSuccess({ quoteId }: { quoteId: string }) {
  const [status, setStatus] = useState<Status>({ status: "processing" })
  const [gaveUp, setGaveUp] = useState(false)

  useEffect(() => {
    if (!quoteId) return
    let cancelled = false
    let attempts = 0
    const check = async () => {
      if (cancelled) return
      try {
        const response = await fetch(`/api/bids/${quoteId}/status`, { cache: "no-store" })
        const result = await response.json()
        if (cancelled) return
        setStatus(result)
        attempts += 1
        if (result.status !== "settled" && attempts < 20) window.setTimeout(check, 1500)
        else if (result.status !== "settled") setGaveUp(true)
      } catch {
        if (!cancelled) setGaveUp(true)
      }
    }
    check()
    return () => { cancelled = true }
  }, [quoteId])

  const settled = status.status === "settled"
  const failed = Boolean(status.error)

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#fafafa] font-sans text-[#111]">
      <div className="flex min-h-screen flex-col items-center">
        <MarketplaceFrame>
          <Header back />
          <main className="relative z-10 mt-28 flex w-full flex-col items-center">
            <FramedSection contentClassName="px-5 py-16 sm:px-10 sm:py-24">
              <div className="mx-auto max-w-lg text-center">
                <span className={`mx-auto grid size-12 place-items-center rounded-full ${settled ? "bg-[#eef7f0] text-[#2f7d4f]" : failed ? "bg-red-50 text-red-600" : "bg-[#fff0eb] text-[#d84d37]"}`}>
                  {settled ? <Check size={22} /> : failed ? <TriangleAlert size={20} /> : <LoaderCircle size={20} className="animate-spin" />}
                </span>

                <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.16em] text-[#999]">Webhook-verified state</p>
                <h1 className="mt-3 font-serif text-[34px] leading-[1.05] tracking-[-0.04em] text-[#111] sm:text-[42px]">
                  {settled ? `You are #${status.rank || "—"}.` : failed ? "We could not find that quote." : gaveUp ? "Still confirming." : "Confirming payment…"}
                </h1>

                <p className="mx-auto mt-4 max-w-md text-[14px] leading-6 text-[#666]">
                  {settled
                    ? "Your placement is live. A private management and stats link is on its way to the checkout email."
                    : failed
                      ? "If you were charged, contact support with your payment email and we will reconcile it."
                      : gaveUp
                        ? "The payment webhook has not arrived yet. This page will not publish a bid on its own — refresh in a moment, or check the management email."
                        : "This return page cannot publish a bid. We are waiting for the signed payment webhook to confirm it."}
                </p>

                <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
                  <Link href="/#problems" className="inline-flex h-11 items-center bg-[#111] px-5 font-mono text-[10px] uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#ef4e37]">
                    Back to the board
                  </Link>
                  <Link href="/manage" className="inline-flex h-11 items-center border border-[rgba(55,50,47,0.12)] bg-white px-5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#111] transition-colors hover:border-[#777]">
                    Manage placement
                  </Link>
                </div>
              </div>
            </FramedSection>
          </main>
        </MarketplaceFrame>
      </div>
    </div>
  )
}
