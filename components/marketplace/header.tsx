import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { CreateOpportunityModal } from "@/components/marketplace/create-opportunity-modal"

export function Header({ back = false }: { back?: boolean }) {
  return (
    <header className="flex h-[76px] w-full items-center justify-between border-b border-black/10 px-5 sm:px-8">
      <Link href="/" className="text-[18px] font-black tracking-[-0.055em] text-[#151412]">STEAL.LOL</Link>
      {back ? (
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#59554e] transition hover:text-black"><ArrowLeft size={15} /> BACK</Link>
      ) : (
        <CreateOpportunityModal compact trigger="LIST YOURSELF" />
      )}
    </header>
  )
}
