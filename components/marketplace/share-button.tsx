"use client"

import { Share2 } from "lucide-react"

export function ShareButton({ text, label = "SHARE" }: { text: string; label?: string }) {
  function share() {
    const url = `https://x.com/intent/post?text=${encodeURIComponent(`${text}\n\n${window.location.href}`)}`
    window.open(url, "_blank", "noopener,noreferrer,width=680,height=580")
  }

  return <button type="button" onClick={share} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-black/12 bg-white px-4 text-xs font-bold tracking-[0.05em] text-[#37342f] transition hover:border-black/25 hover:bg-[#f5f3ee]"><Share2 size={14} /> {label}</button>
}
