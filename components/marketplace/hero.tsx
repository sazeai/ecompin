import { CreateOpportunityModal } from "@/components/marketplace/create-opportunity-modal"

export function Hero() {
  return (
    <section className="relative flex w-full flex-col items-center border-b border-[rgba(55,50,47,0.12)] pb-9 text-center">
      <div className="z-10 flex max-w-3xl flex-col items-center px-6">
        <p className="mb-3 flex items-center gap-2 text-[10px] font-medium tracking-[0.12em] text-[#777]"><span className="size-1.5 rounded-full bg-[#ef4e37] shadow-[0_0_0_3px_rgba(239,78,55,.11)]" /> LIVE CUSTOMER MARKETPLACE</p>
        <h1 className="font-serif text-[42px] leading-[1.02] tracking-[-0.04em] text-[#111] sm:text-[56px] lg:text-[60px]">Steal customers from your competitors.</h1>
        <p className="mt-4 max-w-2xl text-[15px] font-normal leading-[1.6] tracking-tight text-[#555] sm:text-[1rem]">People leaving SaaS products list themselves here. Their competitors pay $9 to make them an offer.</p>
      </div>
      <div className="absolute bottom-0 z-20 flex w-full translate-y-1/2 justify-center"><CreateOpportunityModal /></div>
    </section>
  )
}
