import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ShieldCheck } from "lucide-react"

import { CreateOfferModal } from "@/components/marketplace/create-offer-modal"
import { Header } from "@/components/marketplace/header"
import { OfferCard } from "@/components/marketplace/offer-card"
import { ShareButton } from "@/components/marketplace/share-button"
import { formatRelativeTime } from "@/lib/marketplace/helpers"
import { getOpportunityBySlug, getPaidOffers } from "@/lib/marketplace/queries"
import type { Offer, OpportunityPrivate } from "@/types/marketplace"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ listed?: string; payment?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const opportunity = await getOpportunityBySlug(slug)
    if (!opportunity) return { title: "Listing not found — STEAL.LOL" }
    const title = `$${opportunity.monthly_spend.toLocaleString("en-US")}/mo customer leaving ${opportunity.leaving_product} — STEAL.LOL`
    return { title, description: opportunity.reason, openGraph: { title, description: opportunity.reason, type: "website" } }
  } catch {
    return { title: "Customer up for grabs — STEAL.LOL" }
  }
}

export default async function OpportunityPage({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  let opportunity: OpportunityPrivate | null = null
  try {
    opportunity = await getOpportunityBySlug(slug)
  } catch (error) {
    console.error("Opportunity query failed:", error)
  }
  if (!opportunity) notFound()

  let offers: Offer[] = []
  try {
    offers = await getPaidOffers(opportunity.id)
  } catch (error) {
    console.error("Paid offers query failed:", error)
  }

  const justListed = query.listed === "1"
  const shareText = justListed
    ? `I'm leaving ${opportunity.leaving_product}.\n\nLet's see if one of their competitors can win me over 💀`
    : `There's a $${opportunity.monthly_spend.toLocaleString("en-US")}/mo ${opportunity.leaving_product} customer up for grabs 💀`

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-[#151412] pb-20 sm:pb-0">
      <div className="mx-auto min-h-screen max-w-[1120px] border-x border-black/10 bg-[#fbfaf7] shadow-[0_0_80px_rgba(0,0,0,.035)]">
        <Header back />

        {justListed ? (
          <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-5 sm:px-8">
            <div className="mx-auto flex max-w-[960px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-instrument-serif text-2xl text-emerald-950">You&apos;re officially stealable.</p><p className="mt-1 text-sm text-emerald-800">We&apos;ll email you when competitors start fighting over you.</p></div>
              <ShareButton text={shareText} label="SHARE ON X" />
            </div>
          </div>
        ) : null}
        {query.payment === "cancelled" ? <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-center text-sm text-amber-900">Payment was cancelled. Your pending offer is not public.</div> : null}

        <section className="grid border-b border-black/10 lg:grid-cols-[1fr_360px]">
          <div className="px-5 py-16 sm:px-10 sm:py-24 lg:px-16">
            <div className="flex items-center gap-3">
              <p className="flex items-center gap-2 text-[11px] font-extrabold tracking-[0.15em] text-[#e4573e]"><span className="size-2 rounded-full bg-[#ef4e37] shadow-[0_0_0_4px_rgba(239,78,55,.12)]" /> CUSTOMER UP FOR GRABS</p>
              {opportunity.is_demo ? <span className="rounded border border-[#e4573e]/25 bg-[#e4573e]/6 px-2 py-1 text-[9px] font-extrabold tracking-[0.14em] text-[#cf4934]">DEMO</span> : null}
            </div>
            <h1 className="mt-8 font-instrument-serif text-[54px] leading-[0.95] tracking-[-0.05em] sm:text-[74px]">Leaving {opportunity.leaving_product}</h1>
            <p className="mt-7 font-instrument-serif text-[38px] leading-none tracking-[-0.03em]">${opportunity.monthly_spend.toLocaleString("en-US")}<span className="ml-1 text-xl text-[#77726a]">/month</span></p>
            <blockquote className="mt-10 max-w-[650px] border-l-2 border-[#e4573e] pl-5 text-[21px] leading-8 text-[#4d4943] sm:text-[24px]">“{opportunity.reason}”</blockquote>
            <div className="mt-9 flex flex-wrap items-center gap-3 text-xs text-[#77726a]"><span>{formatRelativeTime(opportunity.created_at)}</span><span>·</span><span>{opportunity.offer_count} paid offer{opportunity.offer_count === 1 ? "" : "s"}</span><ShareButton text={shareText} /></div>
          </div>

          <aside className="flex flex-col justify-between border-t border-black/10 bg-[#151515] p-6 text-white lg:border-l lg:border-t-0 lg:p-8">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-[#7e7a75]">FOR SAAS FOUNDERS</p>
              <h2 className="mt-5 font-instrument-serif text-[36px] leading-[1.04]">Think your product is better?</h2>
              <p className="mt-4 text-sm leading-6 text-[#aaa6a0]">Put a switching offer directly in front of this customer.</p>
            </div>
            <div className="mt-10">
              <CreateOfferModal opportunityId={opportunity.id} leavingProduct={opportunity.leaving_product} monthlySpend={opportunity.monthly_spend} isDemo={opportunity.is_demo} wide />
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#77736e]"><ShieldCheck size={13} /> One-time payment. No commission.</p>
            </div>
          </aside>
        </section>

        <section className="px-5 py-16 sm:px-10 sm:py-20 lg:px-16">
          <div className="mb-9"><p className="text-[11px] font-bold tracking-[0.15em] text-[#8b857d]">PAID OFFERS ONLY</p><h2 className="mt-3 font-instrument-serif text-[39px] leading-none tracking-[-0.04em] sm:text-[50px]">Competitors fighting for them.</h2></div>
          {offers.length ? <div className="grid gap-4 md:grid-cols-2">{offers.map((offer) => <OfferCard key={offer.id} offer={offer} />)}</div> : (
            <div className="rounded-[14px] border border-dashed border-black/15 bg-[#f7f5f0] px-6 py-16 text-center"><p className="font-instrument-serif text-3xl">Nobody has stepped up yet.</p><p className="mt-2 text-sm text-[#77726a]">The first offer gets the room to itself.</p></div>
          )}
          <div className="mt-10 rounded-[14px] bg-[#151515] p-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8">
            <div><p className="font-instrument-serif text-3xl">Come for {opportunity.leaving_product}&apos;s customer.</p><p className="mt-2 text-sm text-[#97938d]">One offer. One payment. No account.</p></div>
            <div className="mt-6 sm:mt-0"><CreateOfferModal opportunityId={opportunity.id} leavingProduct={opportunity.leaving_product} monthlySpend={opportunity.monthly_spend} isDemo={opportunity.is_demo} /></div>
          </div>
          <Link href="/" className="mt-10 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#5f5a53] hover:text-black"><ArrowLeft size={15} /> SEE ALL CUSTOMERS</Link>
        </section>
      </div>

      {!opportunity.is_demo ? <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#151515]/95 p-3 backdrop-blur sm:hidden"><CreateOfferModal opportunityId={opportunity.id} leavingProduct={opportunity.leaving_product} monthlySpend={opportunity.monthly_spend} isDemo={false} wide /></div> : null}
    </main>
  )
}
