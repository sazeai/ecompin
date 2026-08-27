/**
 * FIXTHIS design tokens, lifted from the landing page so every surface speaks
 * the same language: warm paper ground, hairline rules, serif display type,
 * mono micro-labels, sharp corners, one red accent.
 *
 * Import these instead of retyping hex values — a page that hardcodes its own
 * palette is how the marketplace ended up looking like two different products.
 */

/** Hairline rule used for every divider, border, and grid gap. */
export const RULE = "rgba(55,50,47,0.12)"
export const RULE_SOFT = "rgba(55,50,47,0.08)"

export const COLOR = {
  paper: "#fafafa",
  paperAlt: "#f9f8f7",
  ink: "#111",
  body: "#555",
  muted: "#777",
  soft: "#888",
  faint: "#999",
  ghost: "#aaa",
  accent: "#ef4e37",
  accentDeep: "#d84d37",
  accentWash: "#fff0eb",
  accentWashStrong: "#fff3ee",
} as const

/** Page shell: warm ground, ink text, sans body. */
export const page = "min-h-screen w-full bg-[#fafafa] font-sans text-[#111]"

/** Display heading. Serif, tight tracking. Pair with an explicit text size. */
export const display = "font-serif tracking-[-0.04em] text-[#111]"

/** Section heading, slightly looser than display. */
export const heading = "font-serif tracking-[-0.02em] text-[#111]"

/** Uppercase mono micro-label above a heading or beside a stat. */
export const eyebrow = "font-mono uppercase tracking-[0.16em] text-[#999]"
export const eyebrowAccent = "font-mono uppercase tracking-[0.16em] text-[#d84d37]"

/** Tiny mono label used inside cards and stat blocks. */
export const microLabel = "font-mono uppercase tracking-[0.12em] text-[#999]"

/** Standard bordered surface. Sharp corners on purpose. */
export const panel = "border border-[rgba(55,50,47,0.12)] bg-white"
export const panelMuted = "border border-[rgba(55,50,47,0.12)] bg-[#fafafa]"

/** Dashed placeholder for an honest empty state. */
export const emptyState = "border border-dashed border-[rgba(55,50,47,0.16)] bg-[#fafafa] px-6 py-12 text-center text-[13px] text-[#888]"

/** Hairline grid: children sit on the rule colour with 1px gaps. */
export const hairlineGrid = "grid bg-[rgba(55,50,47,0.12)] gap-px"

/** Primary action. Ink block that warms to accent on hover. */
export const buttonPrimary =
  "inline-flex h-11 items-center justify-center gap-2 bg-[#111] px-5 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#ef4e37] disabled:opacity-60"

/** Secondary action. Outlined, same rhythm as primary. */
export const buttonSecondary =
  "inline-flex h-11 items-center justify-center gap-2 border border-[rgba(55,50,47,0.12)] bg-white px-5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#111] transition-colors hover:border-[#777] disabled:opacity-60"

/** Pill action, matching the header/hero CTA shape. */
export const buttonPill =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#111] px-5 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#ef4e37] disabled:opacity-60"

/** Text input / select / textarea. */
export const field =
  "h-11 w-full border border-[rgba(55,50,47,0.12)] bg-white px-3 text-[14px] text-[#111] outline-none transition placeholder:text-[#bbb] focus:border-[#777]"

/** Inline error message. */
export const errorText = "border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"

/** Small badge, e.g. "Curated", "Paid placement". */
export const badge =
  "inline-flex items-center border border-[rgba(55,50,47,0.12)] bg-white px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[#999]"

export const badgeAccent =
  "inline-flex items-center bg-[#fff0eb] px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[#d84d37]"
