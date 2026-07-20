import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { putR2Object } from "@/lib/r2"
import { attachIdentityFields, computeContentHash } from "@/lib/catalog"

/**
 * Manual Product Upload API
 *
 * POST /api/products/upload
 *
 * Accepts multipart form data with product info + optional image.
 * Writes identity fields (content_hash, handle, sku) for catalog engine parity.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()

    const title = formData.get("title") as string
    const description = formData.get("description") as string | null
    const price = formData.get("price") as string | null
    const currency = (formData.get("currency") as string) || "USD"
    const productUrl = formData.get("product_url") as string | null
    const tags = formData.get("tags") as string | null
    const sku = (formData.get("sku") as string | null) || null
    const imageFile = formData.get("image") as File | null

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Product title is required" }, { status: 400 })
    }

    const { data: brand } = await supabase
      .from("brand_settings")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()

    let imageUrl: string | null = null
    let imageR2Key: string | null = null

    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer())
      const ext = imageFile.name.split(".").pop() || "jpg"
      const r2Key = `products/${user.id}/manual_${Date.now()}.${ext}`

      await putR2Object(r2Key, buffer, imageFile.type || "image/jpeg", "public, max-age=31536000")
      imageR2Key = r2Key

      const r2PublicDomain = (process.env.R2_PUBLIC_DOMAIN || "")
        .replace(/^https?:\/\//, "")
        .replace(/\/+$/, "")
      if (r2PublicDomain) {
        imageUrl = `https://${r2PublicDomain}/${r2Key}`
      }
    }

    const parsedTags = tags
      ? tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : []

    const identity = attachIdentityFields({
      title: title.trim(),
      productUrl: productUrl?.trim() || null,
      imageUrl,
      sku,
    })

    const contentHash =
      identity?.contentHash ||
      computeContentHash({
        productUrl: productUrl?.trim() || `manual://${title.trim().toLowerCase()}`,
        title: title.trim(),
        imageUrl,
      })

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        user_id: user.id,
        brand_settings_id: brand?.id || null,
        source: "manual",
        title: title.trim(),
        description: description?.trim() || null,
        price: price ? parseFloat(price) : null,
        currency,
        product_url: identity?.productUrl || productUrl?.trim() || null,
        image_url: imageUrl,
        image_r2_key: imageR2Key,
        tags: parsedTags,
        handle: identity?.handle || null,
        sku: identity?.sku || sku,
        platform_product_id: identity?.platformProductId || null,
        content_hash: contentHash,
        last_seen_at: new Date().toISOString(),
        missing_sync_count: 0,
        lifecycle_status: "active",
        is_active: true,
      })
      .select("id, title")
      .single()

    if (error) {
      console.error("Failed to create product:", error)
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (err: any) {
    console.error("Product upload error:", err)
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 })
  }
}
