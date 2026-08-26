"use client"

import { useCallback, useState } from "react"
import { ArrowRight, LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"

import { FormField, TextArea, TextInput } from "@/components/marketplace/form-field"
import { ModalShell } from "@/components/marketplace/modal-shell"

export function CreateOpportunityModal({ trigger = "I'M LEAVING A SAAS", compact = false }: { trigger?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const close = useCallback(() => !loading && setOpen(false), [loading])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")
    const form = new FormData(event.currentTarget)

    try {
      const response = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leavingProduct: form.get("leavingProduct"),
          monthlySpend: form.get("monthlySpend"),
          reason: form.get("reason"),
          email: form.get("email"),
          website: form.get("website"),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Your listing couldn't be created.")

      localStorage.setItem("steal.lol:last-listing", result.slug)
      router.push(`/o/${result.slug}?listed=1`)
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Your listing couldn't be created.")
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={compact
        ? "inline-flex min-h-11 items-center gap-2 rounded-full bg-[#151412] px-4 text-sm font-semibold text-white transition hover:bg-black"
        : "inline-flex min-h-12 items-center gap-2 rounded-full bg-[#151412] px-5 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,.14)] transition hover:-translate-y-0.5 hover:bg-black"}>
        {trigger} <ArrowRight size={16} />
      </button>

      <ModalShell open={open} onClose={close} labelledBy="create-opportunity-title">
        <div className="px-5 pb-8 pt-7 sm:px-9 sm:pb-10">
          <p className="mb-3 text-xs font-bold tracking-[0.16em] text-[#e4573e]">CUSTOMER LISTING · FREE</p>
          <h2 id="create-opportunity-title" className="font-instrument-serif text-[38px] leading-[1.02] tracking-[-0.03em] text-[#151412] sm:text-[46px]">Leaving a SaaS?</h2>
          <p className="mt-3 max-w-md text-[15px] leading-6 text-[#68635b]">Make its competitors fight for your business. You stay anonymous.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <FormField label="SaaS you're leaving">
              <TextInput name="leavingProduct" placeholder="Intercom" autoComplete="organization" maxLength={80} required />
            </FormField>
            <FormField label="What are you paying?">
              <div className="flex items-center rounded-[10px] border border-black/14 bg-white focus-within:border-black focus-within:ring-2 focus-within:ring-black/8">
                <span className="pl-3.5 text-[#77726a]">$</span>
                <TextInput name="monthlySpend" type="number" inputMode="numeric" min={1} step={1} max={10000000} placeholder="149" required className="border-0 !ring-0" />
                <span className="shrink-0 pr-3.5 text-sm text-[#77726a]">/ month</span>
              </div>
            </FormField>
            <FormField label="Why are you leaving?">
              <TextArea name="reason" placeholder="Too expensive, support is slow, missing features..." minLength={3} maxLength={280} required />
            </FormField>
            <FormField label="Your email" helper="Hidden publicly. We'll email you when competitors make offers.">
              <TextInput name="email" type="email" placeholder="you@company.com" autoComplete="email" maxLength={254} required />
            </FormField>
            <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

            <p className="text-xs leading-5 text-[#77726a]">Don&apos;t include private information, account credentials or confidential company data.</p>
            {error ? <p role="alert" className="rounded-[9px] border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p> : null}
            <button disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#151412] px-5 text-[15px] font-bold text-white transition hover:bg-black disabled:cursor-wait disabled:opacity-65">
              {loading ? <><LoaderCircle size={17} className="animate-spin" /> LISTING YOU...</> : <>LIST ME <ArrowRight size={17} /></>}
            </button>
            <p className="text-center text-xs text-[#77726a]">Free. Takes about 20 seconds.</p>
          </form>
        </div>
      </ModalShell>
    </>
  )
}
