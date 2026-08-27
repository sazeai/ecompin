import type { ReactNode } from "react"

export function MarketplaceFrame({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className={`relative flex w-full flex-col items-center px-4 sm:px-6 md:px-8 lg:px-0 ${wide ? "lg:max-w-[1200px] lg:w-[1200px]" : "lg:max-w-[1000px] lg:w-[1000px]"}`}>
      <div className="absolute bottom-0 left-4 top-0 z-0 w-px bg-[rgba(55,50,47,0.12)] shadow-[1px_0_0_white] sm:left-6 md:left-8 lg:left-0" />
      <div className="absolute bottom-0 right-4 top-0 z-0 w-px bg-[rgba(55,50,47,0.12)] shadow-[1px_0_0_white] sm:right-6 md:right-8 lg:right-0" />
      {children}
    </div>
  )
}

function PatternRail() {
  return (
    <div
      aria-hidden="true"
      className="w-4 shrink-0 self-stretch sm:w-6 md:w-8 lg:w-12"
      style={{ backgroundImage: "repeating-linear-gradient(-45deg, transparent 0, transparent 10px, rgba(3,7,18,.07) 10.5px, rgba(3,7,18,.07) 11px)" }}
    />
  )
}

export function FramedSection({ children, className = "", contentClassName = "" }: { children: ReactNode; className?: string; contentClassName?: string }) {
  return (
    <div className={`relative z-10 -mt-px flex w-full items-stretch justify-center ${className}`}>
      <PatternRail />
      <div className={`min-w-0 flex-1 border-x border-[rgba(55,50,47,0.12)] ${contentClassName}`}>{children}</div>
      <PatternRail />
    </div>
  )
}
