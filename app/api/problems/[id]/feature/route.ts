import { NextResponse } from "next/server"
import { isKnownBot } from "@/lib/marketplace/helpers"
import { jsonError } from "@/lib/marketplace/http"
import { getVisitorKey } from "@/lib/marketplace/visitor"
import { createAdminClient } from "@/utils/supabase/admin"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (isKnownBot(request)) return NextResponse.json({ placement: null })
  const { id } = await params
  const visitorKey = await getVisitorKey()
  const { data, error } = await createAdminClient().rpc("assign_featured_placement", { p_problem_id: id, p_visitor_key: visitorKey })
  if (error) { console.error("Placement assignment failed", error); return jsonError("Featured solution unavailable.", 500) }
  return NextResponse.json({ placement: data?.[0] || null })
}
