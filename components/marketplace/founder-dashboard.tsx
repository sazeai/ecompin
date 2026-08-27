"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Check, LoaderCircle } from "lucide-react"
import { BidModal } from "@/components/marketplace/bid-modal"
import { FormField, TextArea, TextInput } from "@/components/marketplace/form-field"
import { FramedSection, MarketplaceFrame } from "@/components/marketplace/frame"
import { Header } from "@/components/marketplace/header"
import { formatMoney } from "@/lib/marketplace/helpers"
import type { FounderPlacementStats } from "@/types/marketplace"

export function FounderDashboard({ token, product, stats }: { token: string; product: Record<string, any>; stats: FounderPlacementStats[] }) {
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle")
  const [error, setError] = useState("")
  const [profile, setProfile] = useState({ name: product.name as string, tagline: product.tagline as string, destinationUrl: product.destination_url as string })

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState("saving")
    setError("")
    const form = new FormData(event.currentTarget)
    const payload = { name: String(form.get("name")), tagline: String(form.get("tagline")), destinationUrl: String(form.get("url")) }
    const response = await fetch("/api/manage/product", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      setState("idle")
      setError(result.error || "Could not save.")
      return
    }
    // Keep the rebid prefill in step with what was just saved.
    setProfile(payload)
    setState("saved")
    setTimeout(() => setState("idle"), 2000)
  }

  const lifetimeImpressions = stats.reduce((total, item) => total + item.lifetime_impressions, 0)
  const lifetimeClicks = stats.reduce((total, item) => total + item.lifetime_clicks, 0)

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#fafafa] font-sans text-[#111]">
      <div className="flex min-h-screen flex-col items-center">
        <MarketplaceFrame wide>
          <Header back />
          <main className="relative z-10 mt-28 flex w-full flex-col items-center">

            <FramedSection contentClassName="px-5 py-9 sm:px-8 sm:py-12">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#d84d37]">Private management</p>
                  <h1 className="mt-3 font-serif text-[32px] leading-[1.05] tracking-[-0.04em] text-[#111] sm:text-[40px]">{product.name}</h1>
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#999]">{product.registrable_domain}</p>
                </div>
                <div className="grid grid-cols-3 divide-x divide-[rgba(55,50,47,.1)]">
                  <HeadStat value={stats.length} label="Placements" />
                  <HeadStat value={lifetimeImpressions} label="Views · lifetime" middle />
                  <HeadStat value={lifetimeClicks} label="Clicks · lifetime" last />
                </div>
              </div>
            </FramedSection>

            <FramedSection contentClassName="px-5 py-10 sm:px-8 sm:py-12">
              <div className="grid gap-9 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">

                {/* Product profile */}
                <aside>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#999]">Product profile</p>
                  <h2 className="mt-2 font-serif text-[20px] tracking-[-0.02em] text-[#111]">How you appear</h2>
                  <form onSubmit={save} className="mt-5 space-y-4 border border-[rgba(55,50,47,0.12)] bg-white p-5">
                    <FormField label="Name">
                      <TextInput name="name" defaultValue={product.name} required maxLength={80} />
                    </FormField>
                    <FormField label="Tagline">
                      <TextArea name="tagline" defaultValue={product.tagline} required maxLength={180} />
                    </FormField>
                    <FormField label="Destination URL" helper="Must stay on the same registrable domain.">
                      <TextInput name="url" type="url" defaultValue={product.destination_url} required />
                    </FormField>
                    {error ? <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</p> : null}
                    <button disabled={state === "saving"} className="flex h-11 w-full items-center justify-center gap-2 bg-[#111] text-[10px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#ef4e37] disabled:opacity-60">
                      {state === "saving" ? <><LoaderCircle size={13} className="animate-spin" /> Saving…</>
                        : state === "saved" ? <><Check size={13} /> Saved</>
                        : "Save product"}
                    </button>
                    <p className="text-[11px] leading-5 text-[#999]">Edits change how you appear. They never alter payment or bid history.</p>
                  </form>
                </aside>

                {/* Placement performance */}
                <section>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#d84d37]">Placement performance</p>
                  <h2 className="mt-2 font-serif text-[26px] tracking-[-0.03em] text-[#111]">What your bids earned</h2>

                  <div className="mt-5 space-y-4">
                    {stats.length ? stats.map((item) => {
                      const isLead = item.placement.rank === 1
                      return (
                        <article key={item.placement.placement_id} className="border border-[rgba(55,50,47,0.12)] bg-white">
                          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[rgba(55,50,47,0.1)] p-5">
                            <div className="min-w-0 flex-1">
                              <Link href={`/problems/${item.problem.slug}`} className="group inline-flex items-start gap-1.5">
                                <span className="font-serif text-[18px] leading-tight tracking-[-0.02em] text-[#111] transition-colors group-hover:text-[#ef4e37]">“{item.problem.statement}”</span>
                                <ArrowUpRight size={13} className="mt-1 shrink-0 text-[#bbb]" />
                              </Link>
                              <p className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[8px] uppercase tracking-[0.1em] text-[#999]">
                                <span className={isLead ? "text-[#d84d37]" : ""}>#{item.placement.rank} of {item.competitor_count}</span>
                                <span className="text-[#ddd]">·</span>
                                <span>{item.placement.eligible ? `~${item.placement.visibility_percentage}% visibility` : "outside top 5"}</span>
                                <span className="text-[#ddd]">·</span>
                                <span>{item.problem.support_count.toLocaleString("en-US")} supporters</span>
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="font-serif text-[20px] leading-none tracking-[-0.03em] text-[#111]">
                                {item.placement.founding_claim ? "$0" : formatMoney(item.placement.current_bid_cents)}
                              </p>
                              <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.1em] text-[#999]">
                                {item.placement.founding_claim ? "Founding claim" : "Your bid"}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-px bg-[rgba(55,50,47,0.1)]">
                            <Metric value={item.impressions_24h} label="views / 24h" />
                            <Metric value={item.clicks_24h} label="clicks / 24h" />
                            <Metric value={`${item.ctr_24h}%`} label="CTR / 24h" />
                          </div>
                          <div className="grid grid-cols-2 gap-px border-t border-[rgba(55,50,47,0.1)] bg-[rgba(55,50,47,0.1)]">
                            <Metric value={item.lifetime_impressions} label="views / lifetime" />
                            <Metric value={item.lifetime_clicks} label="clicks / lifetime" />
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(55,50,47,0.1)] bg-[#fafafa] px-5 py-3.5">
                            <p className="text-[11px] leading-5 text-[#888]">
                              {isLead
                                ? "You hold the lead. A higher settled bid can take it at any time."
                                : `Take #1 from ${formatMoney(item.next_bid_cents)}. Each bid is a separate full purchase.`}
                            </p>
                            <BidModal
                              problemId={item.problem.id}
                              statement={item.problem.statement}
                              nextBidCents={item.next_bid_cents}
                              triggerLabel={isLead ? "EXTEND LEAD" : "TAKE #1"}
                              variant="outline"
                              prefill={{
                                productName: profile.name,
                                productTagline: profile.tagline,
                                destinationUrl: profile.destinationUrl,
                                email: product.owner_email,
                              }}
                            />
                          </div>
                        </article>
                      )
                    }) : (
                      <div className="border border-dashed border-[rgba(55,50,47,0.16)] bg-[#fafafa] px-6 py-14 text-center">
                        <p className="font-serif text-[20px] tracking-[-0.02em] text-[#111]">No placements yet.</p>
                        <p className="mt-2 text-[12px] text-[#888]">Claim a problem from the board to start receiving exposure.</p>
                        <Link href="/#problems" className="mt-5 inline-flex h-10 items-center bg-[#111] px-5 font-mono text-[9px] uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#ef4e37]">
                          Browse problems
                        </Link>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </FramedSection>
          </main>
        </MarketplaceFrame>
      </div>
    </div>
  )
}

function HeadStat({ value, label, middle = false, last = false }: { value: number; label: string; middle?: boolean; last?: boolean }) {
  return (
    <p className={middle ? "px-4" : last ? "pl-4" : "pr-4"}>
      <span className="block font-serif text-[20px] leading-none tracking-[-0.03em] text-[#111]">{value.toLocaleString("en-US")}</span>
      <span className="mt-1.5 block font-mono text-[7px] uppercase tracking-[0.12em] text-[#999]">{label}</span>
    </p>
  )
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="bg-white px-4 py-3.5">
      <p className="font-serif text-[18px] leading-none tracking-[-0.03em] text-[#111]">
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </p>
      <p className="mt-1.5 font-mono text-[7px] uppercase tracking-[0.12em] text-[#999]">{label}</p>
    </div>
  )
}
