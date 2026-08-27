"use client"

import { useCallback, useState } from "react"
import { ArrowRight, LoaderCircle } from "lucide-react"

import { FormField, TextArea, TextInput } from "@/components/marketplace/form-field"
import { ModalShell } from "@/components/marketplace/modal-shell"

export function CreateOfferModal({ opportunityId, leavingProduct, monthlySpend, isDemo, wide = false, inverted = false }: {
  opportunityId: string
  leavingProduct: string
  monthlySpend: number
  isDemo: boolean
  wide?: boolean
  inverted?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const close = useCallback(() => !loading && setOpen(false), [loading])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")
    const form = new FormData(event.currentTarget)

    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId,
          productName: form.get("productName"),
          productUrl: form.get("productUrl"),
          offerText: form.get("offerText"),
          email: form.get("email"),
          website: form.get("website"),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Payment couldn't be started.")
      window.location.assign(result.checkoutUrl)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Payment couldn't be started. Try again.")
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" disabled={isDemo} onClick={() => setOpen(true)} className={`${wide ? "w-full" : "w-full sm:w-auto"} inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold tracking-[-0.01em] transition ${inverted ? "bg-white text-[#111] hover:bg-[#f4f2ed] disabled:bg-white/55" : "bg-[#111] text-white shadow-sm hover:bg-black disabled:bg-[#aaa]"} disabled:cursor-not-allowed`}>
        {isDemo ? "DEMO LISTING — OFFERS DISABLED" : <>STEAL THIS CUSTOMER — $9 <ArrowRight size={16} /></>}
      </button>

      <ModalShell open={open} onClose={close} labelledBy="create-offer-title">
        <div className="px-5 pb-8 pt-7 sm:px-9 sm:pb-10">
          <p className="mb-3 text-xs font-bold tracking-[0.16em] text-[#e4573e]">STEAL THIS CUSTOMER</p>
          <h2 id="create-offer-title" className="font-instrument-serif text-[38px] leading-[1.02] tracking-[-0.03em] text-[#151412] sm:text-[46px]">Make them switch to you.</h2>
          <p className="mt-3 text-[15px] leading-6 text-[#68635b]">They&apos;re leaving <strong className="text-[#151412]">{leavingProduct}</strong> at <strong className="text-[#151412]">${monthlySpend.toLocaleString("en-US")}/month</strong>.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <FormField label="Your product"><TextInput name="productName" placeholder="Crisp" autoComplete="organization" maxLength={80} required /></FormField>
            <FormField label="Product URL"><TextInput name="productUrl" type="url" placeholder="https://crisp.chat" autoComplete="url" maxLength={2048} required /></FormField>
            <FormField label="Your offer"><TextArea name="offerText" placeholder="6 months free + we'll migrate everything for you" minLength={3} maxLength={280} required /></FormField>
            <FormField label="Your email" helper="Only used for payment and administration. Never shown publicly."><TextInput name="email" type="email" placeholder="founder@crisp.chat" autoComplete="email" maxLength={254} required /></FormField>
            <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

            <div className="flex items-end justify-between border-y border-black/10 py-4">
              <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#77726a]">One-time fee</p><p className="mt-1 text-xs text-[#77726a]">Your offer appears after payment.</p></div>
              <p className="font-instrument-serif text-4xl text-[#151412]">$9</p>
            </div>
            <p className="text-xs leading-5 text-[#77726a]">Only make offers you&apos;re prepared to honor.</p>
            {error ? <p role="alert" className="rounded-[9px] border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p> : null}
            <button disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#151412] px-5 text-[15px] font-bold text-white transition hover:bg-black disabled:cursor-wait disabled:opacity-65">
              {loading ? <><LoaderCircle size={17} className="animate-spin" /> REDIRECTING TO PAYMENT...</> : <>PAY $9 &amp; PUBLISH OFFER <ArrowRight size={17} /></>}
            </button>
            <p className="text-center text-xs text-[#77726a]">Secure checkout powered by Dodo Payments.</p>
          </form>
        </div>
      </ModalShell>
    </>
  )
}
