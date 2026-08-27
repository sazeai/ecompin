import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ShieldCheck } from "lucide-react"

import { CreateOfferModal } from "@/components/marketplace/create-offer-modal"
import { Footer } from "@/components/marketplace/footer"
import { FramedSection, MarketplaceFrame } from "@/components/marketplace/frame"
import { Header } from "@/components/marketplace/header"
import { OfferCard } from "@/components/marketplace/offer-card"
import { ShareButton } from "@/components/marketplace/share-button"
import { formatRelativeTime } from "@/lib/marketplace/helpers"
import { getOpportunityBySlug, getPaidOffers } from "@/lib/marketplace/queries"
import type { Offer, OpportunityPrivate } from "@/types/marketplace"

export const dynamic = "force-dynamic"

type PageProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ listed?: string; payment?: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const opportunity = await getOpportunityBySlug(slug)
    if (!opportunity) return { title: "Listing not found — STEAL.LOL" }
    const title = `$${opportunity.monthly_spend.toLocaleString("en-US")}/mo customer leaving ${opportunity.leaving_product} — STEAL.LOL`
    return { title, description: opportunity.reason }
  } catch { return { title: "Customer up for grabs — STEAL.LOL" } }
}

export default async function OpportunityPage({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  let opportunity: OpportunityPrivate | null = null
  try { opportunity = await getOpportunityBySlug(slug) } catch (error) { console.error("Opportunity query failed:", error) }
  if (!opportunity) notFound()

  let offers: Offer[] = []
  try { offers = await getPaidOffers(opportunity.id) } catch (error) { console.error("Paid offers query failed:", error) }

  const justListed = query.listed === "1"
  const shareText = justListed
    ? `I'm leaving ${opportunity.leaving_product}.\n\nLet's see if one of their competitors can win me over 💀`
    : `There's a $${opportunity.monthly_spend.toLocaleString("en-US")}/mo ${opportunity.leaving_product} customer up for grabs 💀`

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#fafafa] font-sans text-[#111]">
      <div className="flex min-h-screen flex-col items-center">
        <MarketplaceFrame>
          <Header back />
          <main className="relative z-10 mt-40 flex w-full flex-col items-center pb-20 sm:pb-0">
            {justListed ? <div className="w-full border-y border-emerald-200 bg-emerald-50 px-6 py-5"><div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-serif text-2xl text-emerald-950">You&apos;re officially stealable.</p><p className="mt-1 text-sm text-emerald-800">We&apos;ll email you when competitors start fighting over you.</p></div><ShareButton text={shareText} label="SHARE ON X" /></div></div> : null}
            {query.payment === "cancelled" ? <div className="w-full border-y border-amber-200 bg-amber-50 px-5 py-3 text-center text-sm text-amber-900">Payment was cancelled. Your pending offer is not public.</div> : null}

            <section className="relative flex w-full flex-col items-center border-b border-[rgba(55,50,47,.12)] px-6 pb-16 text-center sm:px-10">
              <div className="flex items-center gap-3"><p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#777]"><span className="size-1.5 rounded-full bg-[#ef4e37] shadow-[0_0_0_3px_rgba(239,78,55,.11)]" /> Customer up for grabs</p>{opportunity.is_demo ? <span className="border border-[rgba(55,50,47,.12)] bg-white px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-[#888]">Demo</span> : null}</div>
              <h1 className="mt-7 max-w-4xl font-serif text-[48px] leading-[1.02] tracking-[-0.045em] text-[#111] sm:text-[68px]">Leaving {opportunity.leaving_product}</h1>
              <p className="mt-6 font-serif text-[38px] leading-none tracking-[-0.04em] text-[#111]">${opportunity.monthly_spend.toLocaleString("en-US")}<span className="ml-1 text-lg text-[#777]">/month</span></p>
              <blockquote className="mt-8 max-w-2xl text-[20px] leading-8 text-[#555] sm:text-[23px]">“{opportunity.reason}”</blockquote>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 font-mono text-[9px] uppercase tracking-wide text-[#999]"><span>{formatRelativeTime(opportunity.created_at)}</span><span>·</span><span>{opportunity.offer_count} paid offer{opportunity.offer_count === 1 ? "" : "s"}</span><ShareButton text={shareText} /></div>
              <div className="absolute bottom-0 z-20 flex w-full translate-y-1/2 justify-center px-6"><CreateOfferModal opportunityId={opportunity.id} leavingProduct={opportunity.leaving_product} monthlySpend={opportunity.monthly_spend} isDemo={opportunity.is_demo} /></div>
            </section>

            <FramedSection contentClassName="pt-20 pb-16">
              <section className="w-full">
                <div className="px-6 pb-12 text-center sm:px-10"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#999]">Paid offers only</p><h2 className="mt-3 font-serif text-[2.5rem] leading-[1.08] tracking-[-0.03em] text-[#111] sm:text-[3.5rem]">Competitors fighting for them.</h2></div>
                {offers.length ? <div className="grid border-y border-[rgba(55,50,47,.12)] bg-[rgba(55,50,47,.12)] md:grid-cols-2 md:gap-px">{offers.map((offer, index) => <div key={offer.id} className={`${index ? "border-t border-[rgba(55,50,47,.12)]" : ""} md:border-t-0`}><OfferCard offer={offer} /></div>)}</div> : <div className="border-y border-dashed border-[rgba(55,50,47,.16)] bg-[#fafafa] px-6 py-16 text-center"><p className="font-serif text-3xl">Nobody has stepped up yet.</p><p className="mt-2 text-sm text-[#777]">The first offer gets the room to itself.</p></div>}

                <div className="grid border-b border-[rgba(55,50,47,.12)] md:grid-cols-2">
                  <div className="p-8 md:border-r md:border-[rgba(55,50,47,.12)] md:p-12"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#999]">For SaaS founders</p><h3 className="mt-5 font-serif text-3xl leading-tight">Think your product is better?</h3><p className="mt-3 text-sm leading-6 text-[#666]">Put one clear switching offer directly in front of this customer.</p></div>
                  <div className="flex flex-col justify-center border-t border-[rgba(55,50,47,.12)] bg-white p-8 md:border-t-0 md:p-12"><CreateOfferModal opportunityId={opportunity.id} leavingProduct={opportunity.leaving_product} monthlySpend={opportunity.monthly_spend} isDemo={opportunity.is_demo} wide /><p className="mt-3 flex items-center justify-center gap-1.5 font-mono text-[9px] uppercase tracking-wide text-[#999]"><ShieldCheck size={12} /> One-time payment. No commission.</p></div>
                </div>
                <div className="px-8 pt-8"><Link href="/" className="inline-flex min-h-10 items-center gap-2 text-xs font-medium text-[#666] hover:text-[#111]"><ArrowLeft size={14} /> See all customers</Link></div>
              </section>
            </FramedSection>
            <FramedSection><Footer /></FramedSection>
          </main>
        </MarketplaceFrame>
      </div>

      {!opportunity.is_demo ? <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-[#efefef]/95 p-3 backdrop-blur sm:hidden"><CreateOfferModal opportunityId={opportunity.id} leavingProduct={opportunity.leaving_product} monthlySpend={opportunity.monthly_spend} isDemo={false} wide /></div> : null}
    </div>
  )
}
