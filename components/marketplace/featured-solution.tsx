"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUpRight, LoaderCircle } from "lucide-react"
import type { FeaturedPlacement } from "@/types/marketplace"

export function FeaturedSolution({ problemId, compact = false }: { problemId: string; compact?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [placement, setPlacement] = useState<FeaturedPlacement | null | undefined>(undefined)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    // Resolve only when the card actually enters the viewport, so below-the-fold
    // cards never generate an impression.
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) return
      observer.disconnect()
      fetch(`/api/problems/${problemId}/feature`, { method: "POST" })
        .then((response) => response.json())
        .then((result) => setPlacement(result.placement || null))
        .catch(() => setPlacement(null))
    }, { threshold: 0.45 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [problemId])

  function trackClick() {
    if (!placement) return
    navigator.sendBeacon?.(`/api/placements/${placement.placement_id}/click`)
  }

  if (compact) {
    return (
      <div ref={ref} className="min-h-7">
        {placement === undefined ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[#bbb]">
            <LoaderCircle size={9} className="animate-spin" /> Finding featured solution
          </span>
        ) : placement === null ? (
          <p className="truncate font-mono text-[8px] uppercase tracking-[0.1em] text-[#aaa]">No solution has claimed this yet</p>
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 bg-[#fff0eb] px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.1em] text-[#d84d37]">
              {placement.claim_kind === "founding" ? "Founding" : "Paid"}
            </span>
            <span className="truncate text-[11px] font-semibold text-[#333]">{placement.product_name}</span>
            <a
              href={placement.destination_url}
              target="_blank"
              rel="sponsored nofollow noopener"
              onClick={trackClick}
              className="ml-auto inline-flex shrink-0 items-center gap-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[#777] transition-colors hover:text-[#111]"
            >
              Visit <ArrowUpRight size={9} />
            </a>
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={ref} className="min-h-[128px] bg-white p-5">
      {placement === undefined ? (
        <div className="flex h-[88px] items-center justify-center text-[#ccc]"><LoaderCircle size={16} className="animate-spin" /></div>
      ) : placement === null ? (
        <div className="flex h-[88px] flex-col justify-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#aaa]">Featured solution</p>
          <p className="mt-2 text-[13px] text-[#888]">No product has claimed this problem yet.</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="bg-[#fff0eb] px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[#d84d37]">
              {placement.claim_kind === "founding" ? "Founding claim" : "Paid placement"}
            </span>
            <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#aaa]">
              {placement.click_count.toLocaleString("en-US")} clicks
            </span>
          </div>
          <p className="mt-3 font-serif text-[22px] leading-none tracking-[-0.03em] text-[#111]">{placement.product_name}</p>
          <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[#777]">{placement.product_tagline}</p>
          <a
            href={placement.destination_url}
            target="_blank"
            rel="sponsored nofollow noopener"
            onClick={trackClick}
            className="mt-4 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#111] underline underline-offset-4 transition-colors hover:text-[#ef4e37]"
          >
            Visit solution <ArrowUpRight size={12} />
          </a>
        </div>
      )}
    </div>
  )
}
