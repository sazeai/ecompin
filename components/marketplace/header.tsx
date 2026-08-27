import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { CreateOpportunityModal } from "@/components/marketplace/create-opportunity-modal"

function Mark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeOpacity="0.15" strokeDasharray="2 2" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <circle cx="12" cy="4.5" r="1.5" fill="#ef4e37" />
      <circle cx="12" cy="19.5" r="1.5" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1.5" fill="currentColor" />
      <circle cx="19.5" cy="12" r="1.5" fill="currentColor" />
      <path d="M12 7v2.5M12 14.5V17M7 12h2.5M14.5 12H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function Header({ back = false }: { back?: boolean }) {
  return (
    <nav className="absolute top-8 z-40 flex w-full items-center justify-center">
      <div className="absolute left-0 top-1/2 -z-10 h-px w-full -translate-y-1/2 bg-[rgba(55,50,47,0.12)] " />
      <div className="flex max-w-[calc(100%-24px)] items-center rounded-full border border-black/5 bg-[#efefef]/85 p-2 backdrop-blur-md">
        <Link href="/" aria-label="STEAL.LOL home" className="group mr-1 flex size-9 shrink-0 items-center justify-center rounded-full border border-[rgba(55,50,47,0.08)] bg-[#fafafa] text-[#111] transition-transform hover:scale-105 sm:mr-3"><Mark /></Link>
        <Link href="/" className="hidden pr-3 text-[13px] font-extrabold tracking-[-0.04em] text-[#111] sm:block">STEAL.LOL</Link>
        {back ? (
          <Link href="/" className="flex min-h-9 items-center gap-2 px-3 text-[13px] font-medium text-[#555] transition-colors hover:text-[#111]"><ArrowLeft size={14} /> Back</Link>
        ) : (
          <div className="flex items-center gap-3 px-1 text-[13px] font-medium text-[#555] md:gap-6 md:px-3">
            <Link href="#marketplace" className="transition-colors hover:text-[#111]">Marketplace</Link>
            <Link href="#how-it-works" className="hidden transition-colors hover:text-[#111] md:block">How it works</Link>
          </div>
        )}
        <div className="mx-2 hidden h-4 w-px bg-[rgba(55,50,47,0.12)] sm:block" />
        <CreateOpportunityModal compact trigger="LIST YOURSELF" />
      </div>
    </nav>
  )
}
