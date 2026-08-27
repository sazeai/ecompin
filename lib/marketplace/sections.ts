import type { ProblemSection, ProblemSummary } from "@/types/marketplace"

const FRESH_WINDOW_MS = 7 * 86_400_000

function byPublished(a: ProblemSummary, b: ProblemSummary) {
  return new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime()
}

/**
 * Split the ranked board into market sections. Rows arrive already ordered by
 * trending score, so each bucket only needs its own secondary ordering.
 *
 * A problem may legitimately appear in more than one section — a contested
 * problem can also be trending. Only "unclaimed" is mutually exclusive with
 * "contested", because they are defined by the same predicate.
 */
export function buildProblemSections(problems: ProblemSummary[]): ProblemSection[] {
  const now = Date.now()
  const contested = problems.filter((problem) => problem.competitor_count > 0)
  const unclaimed = problems.filter((problem) => problem.competitor_count === 0)
  const fresh = problems
    .filter((problem) => problem.origin !== "curated" && now - new Date(problem.published_at || problem.created_at).getTime() < FRESH_WINDOW_MS)
    .sort(byPublished)

  const sections: ProblemSection[] = [
    {
      id: "trending",
      title: "Trending problems",
      blurb: "Most recent demand, clicks, and bidding activity.",
      problems: problems.slice(0, 12),
    },
    {
      id: "contested",
      title: "Being fought over",
      blurb: "Products are actively paying to be the featured solution here.",
      problems: [...contested].sort((a, b) => b.top_bid_cents - a.top_bid_cents || b.competitor_count - a.competitor_count).slice(0, 12),
    },
    {
      id: "fresh",
      title: "New pains",
      blurb: "Recently posted by people who ran into the problem themselves.",
      problems: fresh.slice(0, 12),
    },
    {
      id: "unclaimed",
      title: "Unclaimed",
      blurb: "Real demand with no solution competing for it yet.",
      problems: [...unclaimed].sort((a, b) => b.support_count - a.support_count || (a.launch_priority || 999) - (b.launch_priority || 999)).slice(0, 12),
    },
  ]

  // Never render an empty section — an empty shelf reads as a dead marketplace.
  return sections.filter((section) => section.problems.length > 0)
}
