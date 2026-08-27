"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function AdminActionButton({ entity, id, action }: { entity: "problem" | "placement"; id: string; action: "hide" | "publish" | "suspend" | "restore" }) {
  const [loading, setLoading] = useState(false); const router = useRouter()
  return <button type="button" disabled={loading} onClick={async () => { setLoading(true); const response = await fetch("/api/admin/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entity, id, action }) }); if (response.ok) router.refresh(); else setLoading(false) }} className="min-h-8 rounded-full border border-black/10 bg-white px-3 text-[10px] font-bold uppercase disabled:opacity-50">{loading ? "Working…" : action}</button>
}
