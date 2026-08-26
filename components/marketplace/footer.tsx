import Link from "next/link"

import { CreateOpportunityModal } from "@/components/marketplace/create-opportunity-modal"

export function Footer() {
  return (
    <footer className="border-t border-black/10 bg-[#f6f4ef]">
      <div className="mx-auto grid max-w-[1120px] gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="font-instrument-serif text-[38px] leading-[1.05] tracking-[-0.04em] text-[#151412] sm:text-[48px]">Already shopping around?<br />Make them earn you.</p>
          <div className="mt-6"><CreateOpportunityModal trigger="LIST YOURSELF" /></div>
        </div>
        <div className="text-left md:text-right">
          <p className="text-base font-black tracking-[-0.05em] text-[#151412]">STEAL.LOL</p>
          <p className="mt-3 max-w-sm text-xs leading-5 text-[#77726a]">An independent marketplace. Not affiliated with any products mentioned on this site.</p>
          <div className="mt-4 flex gap-4 text-xs font-semibold text-[#59554e] md:justify-end"><Link href="/terms">Terms</Link><Link href="/privacy-policy">Privacy</Link></div>
        </div>
      </div>
    </footer>
  )
}
