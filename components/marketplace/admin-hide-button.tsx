"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function AdminHideButton({ type, id, disabled = false }: { type: "opportunity" | "offer"; id: string; disabled?: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function hide() {
    setLoading(true)
    const response = await fetch("/api/admin/hide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id }),
    })
    if (response.ok) router.refresh()
    else setLoading(false)
  }

  return <button type="button" onClick={hide} disabled={disabled || loading} className="min-h-9 rounded border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-45">{loading ? "HIDING..." : disabled ? "HIDDEN" : "HIDE"}</button>
}
