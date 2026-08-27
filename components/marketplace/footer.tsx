import Link from "next/link"

import { CreateOpportunityModal } from "@/components/marketplace/create-opportunity-modal"

function Mark() {
  return <div className="grid size-9 place-items-center rounded-full border border-[rgba(55,50,47,.08)] bg-[#fafafa]"><span className="size-2 rounded-full bg-[#ef4e37] shadow-[0_0_0_4px_rgba(239,78,55,.1)]" /></div>
}

export function Footer() {
  return (
    <footer className="w-full font-sans">
      <section className="relative flex flex-col items-center justify-center overflow-hidden bg-[#111] px-6 py-20 text-center sm:py-24">
        <div className="relative z-10 flex max-w-2xl flex-col items-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"><span className="size-1.5 rounded-full bg-white" /><span className="text-[11px] font-medium tracking-wide text-white">Free customer listing</span></div>
          <h2 className="font-serif text-[2.8rem] leading-[1.04] tracking-[-0.035em] text-white sm:text-[4rem]">Leaving a SaaS?<br />Make them earn you.</h2>
          <p className="mb-9 mt-6 max-w-xl text-[1rem] leading-7 text-white/55">List yourself in about 20 seconds. Competitors can pay to put their best switching offer in front of you.</p>
          <CreateOpportunityModal inverted trigger="LIST YOURSELF" />
        </div>
      </section>

      <div className="grid border-t border-[rgba(55,50,47,0.12)] bg-[#f9f8f7] md:grid-cols-12">
        <div className="p-8 md:col-span-5 md:border-r md:border-[rgba(55,50,47,0.12)] md:p-12">
          <div className="mb-5 flex items-center gap-2"><Mark /><span className="font-serif text-[1.35rem] text-[#111]">STEAL.LOL</span></div>
          <p className="max-w-xs text-[13px] leading-6 text-[#888]">The independent marketplace where people leaving SaaS products meet their competitors.</p>
        </div>
        <div className="grid grid-cols-2 gap-8 border-t border-[rgba(55,50,47,0.12)] p-8 md:col-span-7 md:border-t-0 md:p-12">
          <div><h3 className="font-serif text-[14px] text-[#111]">Product</h3><ul className="mt-4 space-y-2 text-[13px] text-[#888]"><li><Link href="/#marketplace" className="hover:text-[#111]">Marketplace</Link></li><li><Link href="/#how-it-works" className="hover:text-[#111]">How it works</Link></li></ul></div>
          <div><h3 className="font-serif text-[14px] text-[#111]">Legal</h3><ul className="mt-4 space-y-2 text-[13px] text-[#888]"><li><Link href="/privacy-policy" className="hover:text-[#111]">Privacy Policy</Link></li><li><Link href="/terms" className="hover:text-[#111]">Terms of Service</Link></li><li><Link href="/refund-policy" className="hover:text-[#111]">Refund Policy</Link></li></ul></div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-between gap-4 border-t border-[rgba(55,50,47,0.12)] bg-[#f9f8f7] px-8 py-6 sm:flex-row"><p className="font-mono text-[10px] tracking-wide text-[#aaa]">© 2026 STEAL.LOL</p><div className="flex items-center gap-2 rounded-full border border-[rgba(55,50,47,.07)] bg-white px-3 py-1.5"><span className="size-1.5 rounded-full bg-[#ef4e37]" /><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#777]">Independent marketplace</span></div></div>
    </footer>
  )
}
