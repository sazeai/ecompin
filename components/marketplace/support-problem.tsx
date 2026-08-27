"use client"

import { useState } from "react"
import { Check, Flame, LoaderCircle } from "lucide-react"

export function SupportProblem({ problemId, initialCount, compact = false }: { problemId: string; initialCount: number; compact?: boolean }) {
  const [count, setCount] = useState(initialCount)
  const [state, setState] = useState<"idle" | "loading" | "supported">("idle")
  const [details, setDetails] = useState(false)
  const [message, setMessage] = useState("")

  async function send(body: Record<string, unknown> = {}) {
    setState("loading")
    setMessage("")
    const response = await fetch(`/api/problems/${problemId}/support`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      setState("idle")
      setMessage(result.error || "Could not record this.")
      return false
    }
    if (result.inserted) setCount(result.support_count)
    setState("supported")
    return true
  }

  if (details) {
    return (
      <form
        className="w-full max-w-md space-y-2"
        onSubmit={async (event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          if (await send({ detail: form.get("detail"), email: form.get("email") })) setDetails(false)
        }}
      >
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#d84d37]">Counted. Anything specific?</p>
        <textarea
          name="detail"
          maxLength={280}
          className="min-h-20 w-full resize-none border border-[rgba(55,50,47,0.12)] bg-white p-3 text-[13px] text-[#111] outline-none transition placeholder:text-[#bbb] focus:border-[#777]"
          placeholder="What specifically sucks? (optional, one sentence)"
        />
        <input
          name="email"
          type="email"
          className="h-10 w-full border border-[rgba(55,50,47,0.12)] bg-white px-3 text-[13px] text-[#111] outline-none transition placeholder:text-[#bbb] focus:border-[#777]"
          placeholder="Email me when claimed (optional)"
        />
        <div className="flex items-center gap-2">
          <button className="inline-flex h-9 items-center bg-[#111] px-4 font-mono text-[9px] uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#ef4e37]">
            Save detail
          </button>
          <button type="button" onClick={() => setDetails(false)} className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#999] underline underline-offset-2 transition-colors hover:text-[#111]">
            Skip
          </button>
        </div>
        {message ? <p className="text-[11px] text-red-700">{message}</p> : null}
      </form>
    )
  }

  const supported = state === "supported"

  return (
    <div>
      <button
        type="button"
        disabled={state === "loading"}
        onClick={async () => {
          if (supported) { setDetails(true); return }
          if (await send()) setDetails(true)
        }}
        className={`inline-flex items-center gap-1.5 rounded-full font-bold transition-colors ${compact ? "min-h-9 px-3 text-[10px]" : "min-h-11 px-5 text-[11px] uppercase tracking-[0.08em]"} ${supported ? "bg-[#eef7f0] text-[#2f7d4f]" : "bg-[#fff0eb] text-[#d84d37] hover:bg-[#ffe4da]"}`}
      >
        {state === "loading" ? <LoaderCircle size={compact ? 11 : 13} className="animate-spin" />
          : supported ? <Check size={compact ? 11 : 13} />
          : <Flame size={compact ? 11 : 13} />}
        {supported ? "ME TOO" : compact ? `ME TOO · ${count}` : `I HAVE THIS TOO · ${count}`}
      </button>
      {message ? <p className="mt-2 text-[11px] text-red-700">{message}</p> : null}
    </div>
  )
}
