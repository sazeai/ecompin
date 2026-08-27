"use client"

import { useEffect, useState } from "react"
import type { PublicTrafficStats } from "@/types/marketplace"

export function PresenceTracker({ initial }: { initial: PublicTrafficStats }) {
  const [stats, setStats] = useState(initial)
  useEffect(() => {
    let poll: ReturnType<typeof setInterval> | undefined, heartbeat: ReturnType<typeof setInterval> | undefined
    const beat = () => { if (document.visibilityState === "visible") fetch("/api/presence", { method: "POST", keepalive: true }).catch(() => undefined) }
    const refresh = () => fetch("/api/presence").then((r) => r.json()).then(setStats).catch(() => undefined)
    beat(); heartbeat = setInterval(beat, 20_000); poll = setInterval(refresh, 15_000)
    document.addEventListener("visibilitychange", beat)
    return () => { clearInterval(poll); clearInterval(heartbeat); document.removeEventListener("visibilitychange", beat) }
  }, [])
  if (!stats.live_visitors && stats.visitors_24h === 0) return null
  return <div className="fixed bottom-4 left-4 z-30 flex items-center gap-3 rounded-full border border-black/10 bg-white/90 px-4 py-2 font-mono text-[9px] uppercase tracking-wider shadow-lg backdrop-blur"><span>{stats.live_visitors ? <><i className="mr-1.5 inline-block size-1.5 rounded-full bg-emerald-500" />{stats.live_visitors} live</> : null}</span><span>{stats.visitors_24h.toLocaleString()} visitors / 24h</span></div>
}
