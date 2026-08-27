"use client"

import { useCallback, useState } from "react"
import { ArrowRight, LoaderCircle } from "lucide-react"
import { FormField, TextArea, TextInput } from "@/components/marketplace/form-field"
import { ModalShell } from "@/components/marketplace/modal-shell"
import { TurnstileField } from "@/components/marketplace/turnstile-field"
import { formatMoney } from "@/lib/marketplace/helpers"

export type BidPrefill = { productName?: string; productTagline?: string; destinationUrl?: string; email?: string }

export function BidModal({
  problemId,
  statement,
  nextBidCents,
  compact = false,
  prefill,
  triggerLabel,
  variant = "solid",
}: {
  problemId: string
  statement: string
  nextBidCents: number
  compact?: boolean
  prefill?: BidPrefill
  triggerLabel?: string
  variant?: "solid" | "outline"
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const close = useCallback(() => !loading && setOpen(false), [loading])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")
    const form = new FormData(event.currentTarget)
    const amountCents = Math.round(Number(form.get("amount")) * 100)
    const response = await fetch("/api/bids/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemId,
        productName: form.get("productName"),
        productTagline: form.get("productTagline"),
        destinationUrl: form.get("destinationUrl"),
        email: form.get("email"),
        amountCents,
        turnstileToken: form.get("cf-turnstile-response") || "",
        website: form.get("website"),
      }),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      setLoading(false)
      setError(result.error || "Checkout could not be started.")
      return
    }
    window.location.assign(result.checkoutUrl)
  }

  const label = triggerLabel || (nextBidCents === 500 ? "CLAIM" : "TAKE #1")
  const triggerBase = compact
    ? "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[10px] font-bold"
    : "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[11px] font-bold uppercase tracking-[0.08em]"
  const triggerSkin = variant === "outline"
    ? "border border-[rgba(55,50,47,0.14)] bg-white text-[#111] transition-colors hover:border-[#777]"
    : "bg-[#111] text-white transition-colors hover:bg-[#ef4e37]"

  return <>
    <button type="button" onClick={() => setOpen(true)} className={`${triggerBase} ${triggerSkin}`}>
      {label} · {formatMoney(nextBidCents)}+ <ArrowRight size={13} />
    </button>

    <ModalShell open={open} onClose={close} labelledBy="bid-title">
      <div className="px-6 pb-9 pt-3 sm:px-8">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#d84d37]">Paid contextual placement</p>
        <h2 id="bid-title" className="mt-3 font-serif text-[30px] leading-[1.06] tracking-[-0.04em] text-[#111]">Claim this problem.</h2>
        <blockquote className="mt-4 border-l-2 border-[#ef654f] pl-4 text-[13px] leading-6 text-[#666]">“{statement}”</blockquote>

        <div className="mt-6">
          <p className="mb-2 font-mono text-[8px] uppercase tracking-[0.14em] text-[#999]">What each position gets</p>
          <div className="grid grid-cols-3 gap-px bg-[rgba(55,50,47,0.12)] text-center">
            <Share value="60%" label="#1" lead />
            <Share value="25%" label="#2" />
            <Share value="15%" label="#3–5 share" />
          </div>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <FormField label="Product name">
            <TextInput name="productName" maxLength={80} required defaultValue={prefill?.productName} placeholder="Plausible" />
          </FormField>
          <FormField label="One-sentence fit">
            <TextArea name="productTagline" minLength={3} maxLength={180} required defaultValue={prefill?.productTagline} placeholder="Simple, privacy-friendly analytics without the GA4 learning curve." />
          </FormField>
          <FormField label="HTTPS product URL">
            <TextInput name="destinationUrl" type="url" required defaultValue={prefill?.destinationUrl} placeholder="https://plausible.io" />
          </FormField>
          <FormField label="Management email" helper="This email receives the private stats and editing link.">
            <TextInput name="email" type="email" required defaultValue={prefill?.email} placeholder="founder@company.com" />
          </FormField>
          <FormField label={`Bid · minimum ${formatMoney(nextBidCents)}`}>
            <div className="flex h-11 items-center border border-[rgba(55,50,47,0.12)] bg-white focus-within:border-[#777]">
              <span className="pl-3 font-mono text-[13px] text-[#999]">$</span>
              <TextInput name="amount" type="number" min={nextBidCents / 100} step="1" defaultValue={nextBidCents / 100} required className="!border-0 !h-auto flex-1 focus:!border-0" />
            </div>
          </FormField>

          <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />
          <TurnstileField />

          <p className="text-[11px] leading-5 text-[#999]">
            This is a full, one-time, non-refundable advertising purchase. It buys exposure, not leads or endorsement. The quote is held for 15 minutes.
          </p>
          {error ? <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</p> : null}

          <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 bg-[#111] text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#ef4e37] disabled:opacity-60">
            {loading ? <><LoaderCircle className="animate-spin" size={15} /> Opening checkout…</> : <>Continue to secure checkout <ArrowRight size={14} /></>}
          </button>
        </form>
      </div>
    </ModalShell>
  </>
}

function Share({ value, label, lead = false }: { value: string; label: string; lead?: boolean }) {
  return (
    <div className="bg-[#fafafa] px-2 py-3">
      <p className={`font-serif text-[19px] leading-none tracking-[-0.03em] ${lead ? "text-[#db4e38]" : "text-[#111]"}`}>{value}</p>
      <p className="mt-1.5 font-mono text-[7px] uppercase tracking-[0.12em] text-[#999]">{label}</p>
    </div>
  )
}
