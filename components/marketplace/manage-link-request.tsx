"use client"

import { useState } from "react"
import { ArrowRight, LoaderCircle, MailCheck } from "lucide-react"
import { TurnstileField } from "@/components/marketplace/turnstile-field"

export function ManageLinkRequest() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState("sending")
    setError("")
    const form = new FormData(event.currentTarget)
    const response = await fetch("/api/manage/request-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        turnstileToken: form.get("cf-turnstile-response") || "",
        website: form.get("website"),
      }),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      setState("idle")
      setError(result.error || "The link could not be requested.")
      return
    }
    setMessage(result.message || "If that email manages a placement, a fresh management link is on its way.")
    setState("sent")
  }

  if (state === "sent") {
    return (
      <div className="border border-[rgba(55,50,47,0.12)] bg-white px-6 py-10 text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-[#fff0eb] text-[#d84d37]"><MailCheck size={20} /></span>
        <p className="mt-5 font-serif text-2xl tracking-[-0.02em] text-[#111]">Check your inbox.</p>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-6 text-[#777]">{message}</p>
        <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#aaa]">Links expire after 30 days</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="border border-[rgba(55,50,47,0.12)] bg-white p-6 sm:p-7">
      <label className="block">
        <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.14em] text-[#777]">Checkout email</span>
        <input
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          placeholder="founder@company.com"
          className="h-11 w-full border border-[rgba(55,50,47,.12)] bg-[#fafafa] px-3 text-[14px] text-[#111] outline-none transition placeholder:text-[#bbb] focus:border-[#777]"
        />
      </label>
      <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />
      <div className="mt-4"><TurnstileField /></div>
      {error ? <p role="alert" className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</p> : null}
      <button
        disabled={state === "sending"}
        className="mt-5 flex h-11 w-full items-center justify-center gap-2 bg-[#111] text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#ef4e37] disabled:opacity-60"
      >
        {state === "sending" ? <><LoaderCircle size={14} className="animate-spin" /> Sending…</> : <>Email me the link <ArrowRight size={14} /></>}
      </button>
      <p className="mt-4 text-[11px] leading-5 text-[#999]">
        For privacy we send the same confirmation either way, so this page never reveals whether an email manages a placement.
      </p>
    </form>
  )
}
