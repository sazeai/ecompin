"use client"

import { useCallback, useState } from "react"
import { ArrowRight, Check, LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { FormField, TextArea, TextInput } from "@/components/marketplace/form-field"
import { ModalShell } from "@/components/marketplace/modal-shell"
import { TurnstileField } from "@/components/marketplace/turnstile-field"
import { PROBLEM_CATEGORIES } from "@/lib/marketplace/helpers"

export function PostProblemModal({ compact = false, trigger = "POST A PROBLEM", inverted = false }: { compact?: boolean; trigger?: string; inverted?: boolean }) {
  const [open, setOpen] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState(""), [success, setSuccess] = useState<"published" | "pending" | "">("")
  const router = useRouter(); const close = useCallback(() => !loading && setOpen(false), [loading])
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("")
    const form = new FormData(event.currentTarget)
    const response = await fetch("/api/problems", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      statement: form.get("statement"), category: form.get("category"), origin: "user", email: form.get("email"), website: form.get("website"), turnstileToken: form.get("cf-turnstile-response") || "",
    }) })
    const result = await response.json().catch(() => ({})); setLoading(false)
    if (response.status === 409 && result.slug) { router.push(`/problems/${result.slug}?duplicate=1`); setOpen(false); return }
    if (!response.ok) { setError(result.error || "The problem could not be published."); return }
    setSuccess(result.status); router.refresh()
  }
  return <><button type="button" onClick={() => { setOpen(true); setSuccess("") }} className={inverted ? "inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-[#111] shadow-[0_4px_18px_rgba(255,255,255,.13)] transition hover:-translate-y-0.5 hover:bg-[#fafafa]" : compact ? "inline-flex min-h-9 items-center gap-2 rounded-full bg-[#151412] px-4 text-xs font-semibold text-white transition hover:bg-black" : "inline-flex min-h-10 items-center gap-2 rounded-full bg-[#151412] px-5 text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,.14)] transition hover:-translate-y-0.5 hover:bg-black"}>{trigger} <ArrowRight size={15} /></button>
    <ModalShell open={open} onClose={close} labelledBy="post-problem-title">{success ? <div className="px-6 pb-10 pt-6 text-center sm:px-10"><span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-500 text-white"><Check /></span><h2 id="post-problem-title" className="mt-6 font-[var(--font-clash)] text-4xl tracking-[-.04em]">{success === "published" ? "Problem published." : "Sent for review."}</h2><p className="mt-3 text-black/55">{success === "published" ? "Your support is already counted. Products can now compete to solve it." : "The wording needs a quick moderation pass before it becomes public."}</p><button onClick={close} className="mt-7 min-h-11 rounded-full bg-black px-6 text-sm font-semibold text-white">DONE</button></div> : <div className="px-6 pb-9 pt-4 sm:px-9"><p className="font-mono text-[9px] uppercase tracking-[.16em] text-[#ff4f32]">No account required</p><h2 id="post-problem-title" className="mt-3 font-[var(--font-clash)] text-4xl tracking-[-.05em]">What is pissing you off?</h2><p className="mt-3 text-sm leading-6 text-black/55">Write the pain from the buyer&apos;s perspective. Do not pitch a product.</p><form onSubmit={submit} className="mt-7 space-y-5"><FormField label="I need…"><TextArea name="statement" minLength={20} maxLength={280} required placeholder="I need an analytics tool that makes sense without a training course…" /></FormField><FormField label="Category"><select name="category" className="min-h-12 w-full rounded-[10px] border border-black/15 bg-white px-3" defaultValue="Productivity">{PROBLEM_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></FormField><FormField label="Email (optional)" helper="Confirm by email to hear when the first solution claims this problem."><TextInput name="email" type="email" maxLength={254} placeholder="you@company.com" /></FormField><input name="website" className="hidden" tabIndex={-1} autoComplete="off" /><TurnstileField />{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#171714] font-semibold text-white disabled:opacity-60">{loading ? <><LoaderCircle className="animate-spin" size={17} /> PUBLISHING…</> : <>PUBLISH PROBLEM <ArrowRight size={16} /></>}</button></form></div>}</ModalShell></>
}
