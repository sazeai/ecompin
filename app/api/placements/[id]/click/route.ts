import { NextResponse } from "next/server"
import { isKnownBot } from "@/lib/marketplace/helpers"
import { mutationAllowed } from "@/lib/marketplace/http"
import { getVisitorKey } from "@/lib/marketplace/visitor"
import { createAdminClient } from "@/utils/supabase/admin"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!mutationAllowed(request) || isKnownBot(request)) return new NextResponse(null, { status: 204 })
  const { id } = await params
  const visitorKey = await getVisitorKey()
  await createAdminClient().rpc("record_placement_click", { p_placement_id: id, p_visitor_key: visitorKey })
  return new NextResponse(null, { status: 204 })
}
