import { CreateOpportunityModal } from "@/components/marketplace/create-opportunity-modal"

export function Hero() {
  return (
    <section className="relative flex min-h-[510px] flex-col items-center justify-center border-b border-black/10 px-5 py-24 text-center sm:min-h-[590px] sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_49.9%,rgba(0,0,0,.055)_50%,transparent_50.1%)]" />
      <div className="relative z-10 flex max-w-4xl flex-col items-center">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/75 px-3 py-1.5 text-[11px] font-bold tracking-[0.12em] text-[#5e5952] shadow-sm">
          <span className="size-2 rounded-full bg-[#ef4e37] shadow-[0_0_0_3px_rgba(239,78,55,.12)]" /> LIVE CUSTOMER MARKETPLACE
        </div>
        <h1 className="font-instrument-serif text-[53px] leading-[0.91] tracking-[-0.055em] text-[#151412] sm:text-[78px] md:text-[96px]">Steal their<br />customers.</h1>
        <p className="mt-7 max-w-xl text-[16px] leading-7 text-[#625e57] sm:text-[18px]">People leaving SaaS products list themselves here. Their competitors pay $9 to make them an offer.</p>
        <div className="mt-8"><CreateOpportunityModal /></div>
        <p className="mt-3 text-xs text-[#827d75]">Listing is free. Your identity stays private.</p>
      </div>
    </section>
  )
}
