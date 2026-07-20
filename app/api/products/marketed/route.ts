import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * Toggle a product's inclusion in the marketing pool.
 * PATCH { productId, marketed }
 */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { productId, marketed } = await req.json()
    if (!productId || typeof marketed !== "boolean") {
      return NextResponse.json(
        { error: "productId and marketed(boolean) are required" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("products")
      .update({ marketed, updated_at: new Date().toISOString() })
      .eq("id", productId)
      .eq("user_id", user.id)

    if (error) throw error

    return NextResponse.json({ success: true, productId, marketed })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update product" },
      { status: 500 }
    )
  }
}
