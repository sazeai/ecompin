import type { ReactNode } from "react"

import { Header } from "@/components/marketplace/header"
import { MarketplaceFrame } from "@/components/marketplace/frame"

export function LegalPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen justify-center bg-[#fafafa] text-[#111]">
      <MarketplaceFrame><Header back />
        <article className="mx-auto mt-40 max-w-3xl border-x border-[rgba(55,50,47,.12)] px-6 py-16 sm:px-12 sm:py-24">
          <p className="text-xs font-extrabold tracking-[0.15em] text-[#e4573e]">{eyebrow}</p>
          <h1 className="mt-4 font-instrument-serif text-5xl tracking-[-0.04em] sm:text-7xl">{title}</h1>
          <p className="mt-5 text-lg leading-8 text-[#68635b]">{intro}</p>
          <div className="mt-12 space-y-9 text-[15px] leading-7 text-[#4d4943] [&_h2]:mb-2 [&_h2]:font-instrument-serif [&_h2]:text-3xl [&_h2]:text-[#151412] [&_a]:underline">{children}</div>
          <p className="mt-12 border-t border-black/10 pt-6 text-xs text-[#77726a]">Last updated: August 27, 2026</p>
        </article>
      </MarketplaceFrame>
    </main>
  )
}
