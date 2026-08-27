import { NextResponse } from "next/server"
import { z } from "zod"
import { isAdminAuthenticated } from "@/lib/marketplace/admin-auth"
import { createAdminClient } from "@/utils/supabase/admin"

const schema = z.object({ entity: z.enum(["problem", "placement"]), id: z.string().uuid(), action: z.enum(["hide", "publish", "suspend", "restore"]) })
export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  const supabase = createAdminClient(); const { entity, id, action } = parsed.data
  let error: any = null
  if (entity === "problem") {
    const status = action === "publish" || action === "restore" ? "published" : "hidden"
    ;({ error } = await supabase.from("problems").update({ status, published_at: status === "published" ? new Date().toISOString() : undefined }).eq("id", id))
  } else {
    const status = action === "restore" || action === "publish" ? "active" : action === "suspend" ? "suspended" : "hidden"
    const { data: placement, error: lookupError } = await supabase.from("placements").update({ status }).eq("id", id).select("problem_id").single(); error = lookupError
    if (!error && placement) await supabase.rpc("rebuild_rotation", { p_problem_id: placement.problem_id })
  }
  if (error) return NextResponse.json({ error: "Admin action failed." }, { status: 500 })
  await supabase.from("moderation_audit").insert({ entity_type: entity, entity_id: id, action })
  return NextResponse.json({ ok: true })
}
