import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, Eye, Flame, MousePointerClick, Swords } from "lucide-react"
import { BidModal } from "@/components/marketplace/bid-modal"
import { FeaturedSolution } from "@/components/marketplace/featured-solution"
import { Footer } from "@/components/marketplace/footer"
import { FramedSection, MarketplaceFrame } from "@/components/marketplace/frame"
import { Header } from "@/components/marketplace/header"
import { SupportProblem } from "@/components/marketplace/support-problem"
import { formatMoney } from "@/lib/marketplace/helpers"
import type { ProblemDetail } from "@/types/marketplace"

export function ProblemDetailView({ problem, duplicate, paymentCancelled }: { problem: ProblemDetail; duplicate: boolean; paymentCancelled: boolean }) {
  const originLabel = problem.origin === "curated" ? "Curated by FIXTHIS" : problem.origin === "founder" ? "Added by a product" : "Posted by someone with this problem"

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#fafafa] font-sans text-[#111]">
      <div className="flex min-h-screen flex-col items-center">
        <MarketplaceFrame>
          <Header back />
          <main className="relative z-10 mt-28 flex w-full flex-col items-center">

            {duplicate ? <Banner>We found this existing problem instead of creating a duplicate. Add your support below.</Banner> : null}
            {paymentCancelled ? <Banner>Payment was cancelled. No bid or placement was published.</Banner> : null}

            {/* Statement */}
            <FramedSection contentClassName="px-5 pb-9 pt-8 sm:px-8 sm:pt-12">
              <Link href="/#problems" className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#999] transition-colors hover:text-[#111]">
                <ArrowLeft size={11} /> All problems
              </Link>

              <div className="mt-7 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#d84d37]">{problem.category}</span>
                <span className="text-[#ccc]">·</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#999]">{originLabel}</span>
              </div>

              <h1 className="mt-4 max-w-4xl font-serif text-[30px] leading-[1.08] tracking-[-0.04em] text-[#111] sm:text-[42px] lg:text-[48px]">
                “{problem.statement}”
              </h1>

              <div className="mt-8 flex flex-wrap items-center gap-2.5">
                <SupportProblem problemId={problem.id} initialCount={problem.support_count} />
                <BidModal problemId={problem.id} statement={problem.statement} nextBidCents={problem.next_bid_cents} />
              </div>
            </FramedSection>

            {/* Metrics */}
            <FramedSection>
              <div className="grid grid-cols-2 gap-px bg-[rgba(55,50,47,0.12)] sm:grid-cols-4">
                <Metric icon={<Flame size={12} />} value={problem.support_count} label="have this problem" accent />
                <Metric icon={<Eye size={12} />} value={problem.impression_count} label="solution impressions" />
                <Metric icon={<MousePointerClick size={12} />} value={problem.click_count} label="solution clicks" />
                <Metric icon={<Swords size={12} />} value={problem.competitor_count} label="products competing" />
              </div>
            </FramedSection>

            {/* Featured solution + battlefield */}
            <FramedSection contentClassName="px-5 py-10 sm:px-8 sm:py-12">
              <div className="grid gap-9 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#d84d37]">Currently claiming this problem</p>
                  <h2 className="mt-2 font-serif text-[22px] tracking-[-0.02em] text-[#111]">Featured solution</h2>
                  <div className="mt-4 border border-[rgba(55,50,47,0.12)]">
                    <FeaturedSolution problemId={problem.id} />
                  </div>
                  <p className="mt-3 text-[11px] leading-5 text-[#999]">
                    A paid rotating placement, not an endorsement. Different visitors may see different products.
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#d84d37]">The battlefield</p>
                      <h2 className="mt-2 font-serif text-[22px] tracking-[-0.02em] text-[#111]">Products competing</h2>
                    </div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#999]">Next bid {formatMoney(problem.next_bid_cents)}+</p>
                  </div>

                  {problem.battlefield.length ? (
                    <div className="mt-4 border border-[rgba(55,50,47,0.12)] bg-white">
                      {problem.battlefield.map((entry) => (
                        <div key={entry.placement_id} className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[rgba(55,50,47,0.1)] px-4 py-3 last:border-0">
                          <span className={`grid size-7 place-items-center rounded-full font-mono text-[9px] font-semibold ${entry.rank === 1 ? "bg-[#ef654f] text-white" : "border border-[rgba(55,50,47,.13)] bg-[#fafafa] text-[#777]"}`}>
                            {entry.rank}
                          </span>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 truncate text-[13px] font-semibold text-[#111]">
                              {entry.product_name}
                              {entry.founding_claim ? <span className="shrink-0 bg-[#fff0eb] px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.1em] text-[#d84d37]">Founding</span> : null}
                            </p>
                            <p className="mt-0.5 truncate font-mono text-[8px] uppercase tracking-[0.1em] text-[#aaa]">
                              {entry.impression_count.toLocaleString("en-US")} views · {entry.click_count.toLocaleString("en-US")} clicks · {entry.ctr}% CTR
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-serif text-[15px] leading-none text-[#111]">{entry.founding_claim ? "$0" : formatMoney(entry.current_bid_cents)}</p>
                            <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.1em] text-[#aaa]">
                              {entry.eligible ? `~${entry.visibility_percentage}% visibility` : "outside top 5"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 border border-dashed border-[rgba(55,50,47,0.16)] bg-[#fafafa] px-6 py-12 text-center">
                      <p className="font-serif text-[20px] tracking-[-0.02em] text-[#111]">No solution has claimed this yet.</p>
                      <p className="mt-2 text-[12px] text-[#888]">The first claim starts at {formatMoney(problem.next_bid_cents)}.</p>
                    </div>
                  )}
                </div>
              </div>
            </FramedSection>

            {/* Complaints + provenance */}
            <FramedSection contentClassName="px-5 py-10 sm:px-8 sm:py-12">
              <div className="grid gap-9 lg:grid-cols-2">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#d84d37]">What specifically sucks</p>
                  <h2 className="mt-2 font-serif text-[22px] tracking-[-0.02em] text-[#111]">Details from people who agree</h2>
                  <div className="mt-4 space-y-2">
                    {problem.complaints.length ? problem.complaints.map((item) => (
                      <blockquote key={item.id} className="border-l-2 border-[#ef654f] bg-white px-4 py-3 text-[13px] leading-6 text-[#555]">
                        “{item.detail}”
                      </blockquote>
                    )) : (
                      <p className="border border-dashed border-[rgba(55,50,47,0.16)] bg-[#fafafa] px-5 py-8 text-[12px] text-[#888]">
                        No one has added a specific detail yet.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#d84d37]">Research provenance</p>
                  <h2 className="mt-2 font-serif text-[22px] tracking-[-0.02em] text-[#111]">This problem has receipts</h2>
                  <p className="mt-3 text-[12px] leading-6 text-[#888]">
                    Curated problems are rewritten from public discussions, never presented as private testimonials.
                  </p>
                  <div className="mt-4 space-y-2">
                    {problem.sources.length ? problem.sources.map((source) => (
                      <a
                        key={source.id}
                        href={source.source_url}
                        rel="noopener noreferrer nofollow"
                        target="_blank"
                        className="flex items-center justify-between gap-3 border border-[rgba(55,50,47,0.12)] bg-white px-4 py-3 text-[12px] text-[#555] transition-colors hover:border-[#777] hover:text-[#111]"
                      >
                        <span className="truncate">{source.source_label}</span>
                        <ArrowUpRight size={13} className="shrink-0 text-[#aaa]" />
                      </a>
                    )) : (
                      <p className="border border-dashed border-[rgba(55,50,47,0.16)] bg-[#fafafa] px-5 py-8 text-[12px] text-[#888]">
                        This problem was submitted directly to FIXTHIS.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </FramedSection>

            <FramedSection><Footer /></FramedSection>
          </main>
        </MarketplaceFrame>
      </div>
    </div>
  )
}

function Banner({ children }: { children: ReactNode }) {
  return (
    <FramedSection>
      <p className="border-y border-[rgba(55,50,47,0.12)] bg-[#fff3ee] px-5 py-3 text-[12px] text-[#8a3d2c] sm:px-8">{children}</p>
    </FramedSection>
  )
}

function Metric({ icon, value, label, accent = false }: { icon: ReactNode; value: number; label: string; accent?: boolean }) {
  return (
    <div className="bg-[#fafafa] px-4 py-5 transition-colors hover:bg-white">
      <span className={accent ? "text-[#d84d37]" : "text-[#bbb]"}>{icon}</span>
      <p className={`mt-2 font-serif text-[26px] leading-none tracking-[-0.04em] ${accent ? "text-[#db4e38]" : "text-[#111]"}`}>
        {value.toLocaleString("en-US")}
      </p>
      <p className="mt-1.5 font-mono text-[7px] uppercase tracking-[0.12em] text-[#999]">{label}</p>
    </div>
  )
}
