"use client"

import { useMemo, useState } from "react"
import { ProblemCard } from "@/components/marketplace/problem-card"
import type { ProblemSection, ProblemSectionId, ProblemSummary } from "@/types/marketplace"

const SECTION_MARK: Record<ProblemSectionId, string> = {
  trending: "01",
  contested: "02",
  fresh: "03",
  unclaimed: "04",
}

export function MarketplaceHome({ problems, sections }: { problems: ProblemSummary[]; sections: ProblemSection[] }) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [active, setActive] = useState<ProblemSectionId>(sections[0]?.id || "trending")

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(problems.map((problem) => problem.category))).sort()],
    [problems],
  )

  const query = search.trim().toLowerCase()
  const filtering = Boolean(query) || category !== "All"

  // While a filter is active the section shelves are replaced by one flat result
  // set, so a search never silently hides matches sitting in another section.
  const results = useMemo(() => {
    if (!filtering) return []
    return problems.filter((problem) => {
      const matchesCategory = category === "All" || problem.category === category
      const matchesSearch = !query || `${problem.statement} ${problem.category}`.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [category, filtering, problems, query])

  const activeSection = sections.find((section) => section.id === active) || sections[0]
  const visible = filtering ? results : activeSection?.problems || []

  const totalDemand = problems.reduce((total, problem) => total + problem.support_count, 0)
  const totalClaims = problems.reduce((total, problem) => total + problem.competitor_count, 0)

  return (
    <section id="problems" className="w-full">
      <header className="border-y border-[rgba(55,50,47,0.12)] bg-[#fafafa] px-5 py-4 sm:px-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="size-2 rounded-full bg-[#ef4e37] shadow-[0_0_0_3px_rgba(239,78,55,.11)]" />
              <h2 className="whitespace-nowrap font-serif text-[16px] tracking-[-0.02em] text-[#111] sm:text-[18px]">Problems up for grabs</h2>
              <span className="whitespace-nowrap rounded-full border border-[rgba(55,50,47,.12)] bg-white px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-[#777]">{problems.length} real</span>
            </div>
            <p className="mt-1.5 text-[10px] text-[#888]">Validate a pain or claim its featured placement from this board.</p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-[rgba(55,50,47,.1)] border-t border-[rgba(55,50,47,.1)] pt-3 sm:min-w-[48%] sm:border-t-0 sm:pt-0">
            <Stat value={totalDemand.toLocaleString("en-US")} label="People with this" />
            <Stat value={totalClaims.toLocaleString("en-US")} label="Claims competing" middle />
            <Stat value="$5" label="First claim" last />
          </div>
        </div>
        <div className="mt-4 grid gap-2 border-t border-[rgba(55,50,47,.1)] pt-3 sm:grid-cols-[1fr_180px]">
          <label className="sr-only" htmlFor="problem-search">Search problems</label>
          <input id="problem-search" value={search} onChange={(event) => setSearch(event.target.value)} className="h-9 border border-[rgba(55,50,47,.12)] bg-white px-3 text-[12px] text-[#333] outline-none transition focus:border-[#777]" placeholder="Search the board…" />
          <label className="sr-only" htmlFor="problem-category">Filter by category</label>
          <select id="problem-category" value={category} onChange={(event) => setCategory(event.target.value)} className="h-9 border border-[rgba(55,50,47,.12)] bg-white px-3 text-[11px] text-[#555] outline-none transition focus:border-[#777]">
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </header>

      {filtering ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(55,50,47,0.12)] bg-[#f9f8f7] px-5 py-2.5 sm:px-7">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#777]">
            {results.length} {results.length === 1 ? "match" : "matches"}
            {category !== "All" ? <span className="text-[#aaa]"> · {category}</span> : null}
          </p>
          <button type="button" onClick={() => { setSearch(""); setCategory("All") }} className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#999] underline underline-offset-2 transition-colors hover:text-[#111]">
            Clear filters
          </button>
        </div>
      ) : (
        <nav aria-label="Problem sections" className="flex overflow-x-auto border-b border-[rgba(55,50,47,0.12)] bg-[#f9f8f7]">
          {sections.map((section) => {
            const selected = section.id === activeSection?.id
            return (
              <button
                key={section.id}
                type="button"
                aria-current={selected ? "true" : undefined}
                onClick={() => setActive(section.id)}
                className={`group relative flex shrink-0 items-center gap-2 border-r border-[rgba(55,50,47,0.12)] px-4 py-2.5 text-left transition-colors sm:px-5 ${selected ? "bg-[#fafafa]" : "hover:bg-[#fafafa]/60"}`}
              >
                {selected ? <span className="absolute inset-x-0 top-0 h-[2px] bg-[#ef4e37]" /> : null}
                <span className={`font-mono text-[8px] tracking-[0.14em] ${selected ? "text-[#d84d37]" : "text-[#bbb]"}`}>{SECTION_MARK[section.id]}</span>
                <span className={`whitespace-nowrap text-[12px] font-medium ${selected ? "text-[#111]" : "text-[#777] group-hover:text-[#111]"}`}>{section.title}</span>
                <span className={`rounded-full px-1.5 py-0.5 font-mono text-[8px] ${selected ? "bg-[#fff0eb] text-[#d84d37]" : "bg-[rgba(55,50,47,.06)] text-[#999]"}`}>{section.problems.length}</span>
              </button>
            )
          })}
        </nav>
      )}

      {!filtering && activeSection ? (
        <p className="border-b border-[rgba(55,50,47,0.12)] bg-[#fafafa] px-5 py-2.5 text-[11px] text-[#888] sm:px-7">{activeSection.blurb}</p>
      ) : null}

      {visible.length ? (
        <div className="grid bg-[rgba(55,50,47,0.12)] md:grid-cols-2 md:gap-px">
          {visible.map((problem, index) => (
            <div key={problem.id} className={`${index ? "border-t border-[rgba(55,50,47,.12)]" : ""} md:border-t-0`}>
              <ProblemCard problem={problem} index={index} />
            </div>
          ))}
        </div>
      ) : (
        <div className="border-y border-dashed border-[rgba(55,50,47,.16)] bg-[#fafafa] px-6 py-20 text-center">
          <p className="font-serif text-3xl text-[#111]">Nothing matches yet.</p>
          <p className="mt-2 text-sm text-[#777]">Try another filter, or put this problem on the board.</p>
        </div>
      )}
    </section>
  )
}

function Stat({ value, label, middle = false, last = false }: { value: string; label: string; middle?: boolean; last?: boolean }) {
  return <p className={middle ? "px-3" : last ? "pl-3" : "pr-3"}><span className="block font-serif text-[18px] leading-none text-[#111]">{value}</span><span className="mt-1 block font-mono text-[7px] uppercase tracking-[0.12em] text-[#999]">{label}</span></p>
}
