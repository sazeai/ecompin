import type { ReactNode } from "react"

import { Header } from "@/components/marketplace/header"

export function LegalPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f6f4ef] text-[#151412]">
      <div className="mx-auto min-h-screen max-w-[960px] border-x border-black/10 bg-[#fbfaf7]"><Header back />
        <article className="mx-auto max-w-3xl px-5 py-16 sm:px-10 sm:py-24">
          <p className="text-xs font-extrabold tracking-[0.15em] text-[#e4573e]">{eyebrow}</p>
          <h1 className="mt-4 font-instrument-serif text-5xl tracking-[-0.04em] sm:text-7xl">{title}</h1>
          <p className="mt-5 text-lg leading-8 text-[#68635b]">{intro}</p>
          <div className="mt-12 space-y-9 text-[15px] leading-7 text-[#4d4943] [&_h2]:mb-2 [&_h2]:font-instrument-serif [&_h2]:text-3xl [&_h2]:text-[#151412] [&_a]:underline">{children}</div>
          <p className="mt-12 border-t border-black/10 pt-6 text-xs text-[#77726a]">Last updated: August 27, 2026</p>
        </article>
      </div>
    </main>
  )
}
