import { NextResponse } from "next/server"
import { z } from "zod"

import { isAdminAuthenticated } from "@/lib/marketplace/admin-auth"
import { createAdminClient } from "@/utils/supabase/admin"

const schema = z.object({ type: z.enum(["opportunity", "offer"]), id: z.string().uuid() })

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 })

  const supabase = createAdminClient()
  const update = parsed.data.type === "opportunity"
    ? supabase.from("opportunities").update({ status: "hidden" }).eq("id", parsed.data.id)
    : supabase.from("offers").update({ is_hidden: true }).eq("id", parsed.data.id)

  const { error } = await update
  if (error) {
    console.error("Admin hide failed:", error)
    return NextResponse.json({ error: "The item couldn't be hidden." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
