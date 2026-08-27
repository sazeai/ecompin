import { NextResponse } from "next/server"
import { isKnownBot } from "@/lib/marketplace/helpers"
import { getPublicTrafficStats } from "@/lib/marketplace/queries"
import { getVisitorKey } from "@/lib/marketplace/visitor"
import { createAdminClient } from "@/utils/supabase/admin"

export async function GET() { return NextResponse.json(await getPublicTrafficStats()) }

export async function POST(request: Request) {
  if (isKnownBot(request)) return new NextResponse(null, { status: 204 })
  const visitorKey = await getVisitorKey()
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  await supabase.from("visitor_presence").upsert({ visitor_key: visitorKey, last_seen_at: now })
  const { data: visitor } = await supabase.from("visitors").select("last_seen_at").eq("visitor_key", visitorKey).maybeSingle()
  if (!visitor) await supabase.from("visitors").insert({ visitor_key: visitorKey, first_seen_at: now, last_seen_at: now })
  else if (Date.now() - new Date(visitor.last_seen_at).getTime() >= 300_000) await supabase.from("visitors").update({ last_seen_at: now }).eq("visitor_key", visitorKey)
  return new NextResponse(null, { status: 204 })
}
