import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { BidModal } from "@/components/marketplace/bid-modal"
import { FeaturedSolution } from "@/components/marketplace/featured-solution"
import { SupportProblem } from "@/components/marketplace/support-problem"
import type { ProblemSummary } from "@/types/marketplace"

export function ProblemCard({ problem, index }: { problem: ProblemSummary; index: number }) {
  const isFirst = index === 0
  const claimLabel = problem.competitor_count === 0
    ? "Open lane — no solution yet"
    : `${problem.competitor_count} solution${problem.competitor_count === 1 ? "" : "s"} competing`

  return (
    <article className={`relative flex min-h-[196px] h-full flex-col overflow-hidden px-5 py-3.5 transition-colors duration-200 sm:px-6 ${isFirst ? "bg-[#fff3ee] shadow-[inset_0_0_0_1px_rgba(239,78,55,.72)]" : "bg-[#fafafa]"}`}>
      {isFirst ? <div className="absolute inset-x-0 top-0 h-[3px] bg-[#ef654f]" /> : null}
      <div className="flex items-start gap-3">
        <span className={`grid h-8 min-w-8 shrink-0 place-items-center rounded-full font-mono text-[9px] font-semibold ${isFirst ? "bg-[#ef654f] text-white" : "border border-[rgba(55,50,47,.13)] bg-white text-[#777]"}`}>#{String(index + 1).padStart(2, "0")}</span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-[15px] font-semibold text-[#111]">{problem.category}</p>
            {isFirst ? <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.12em] text-[#d84d37]">Trending</span> : null}
            {problem.origin === "curated" ? <span className="shrink-0 border border-[rgba(55,50,47,.12)] bg-white/70 px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.1em] text-[#999]">Curated</span> : null}
          </div>
          <p className="mt-0.5 font-mono text-[8px] font-medium uppercase tracking-[0.13em] text-[#999]">Problem on the board</p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`font-serif text-[27px] leading-none tracking-[-0.04em] ${isFirst ? "text-[#db4e38]" : "text-[#111]"}`}>{problem.support_count.toLocaleString("en-US")}</p>
          <p className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.1em] text-[#999]">have this</p>
        </div>
      </div>

      <Link href={`/problems/${problem.slug}`} className="mt-2 line-clamp-2 pl-11 text-[13px] leading-5 text-[#5e5952] transition-colors hover:text-[#111]">“{problem.statement}”</Link>
      <div className="mt-2 pl-11"><FeaturedSolution problemId={problem.id} compact /></div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[rgba(55,50,47,0.1)] pt-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-medium text-[#555]"><span className={`mr-1.5 inline-block size-1.5 rounded-full ${problem.competitor_count ? "bg-emerald-500" : "bg-[#bbb]"}`} />{claimLabel}</p>
          <Link href={`/problems/${problem.slug}`} className="mt-0.5 inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-wide text-[#aaa] hover:text-[#555]">Open battlefield <ArrowUpRight size={9} /></Link>
        </div>
        <div className="flex items-center gap-1.5"><SupportProblem problemId={problem.id} initialCount={problem.support_count} compact /><BidModal problemId={problem.id} statement={problem.statement} nextBidCents={problem.next_bid_cents} compact /></div>
      </div>
    </article>
  )
}
