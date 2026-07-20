import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { attachIdentityFields, computeContentHash } from "@/lib/catalog"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { rows } = await req.json()
    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ message: "Invalid CSV payload" }, { status: 400 })
    }

    if (rows.length > 5000) {
      return NextResponse.json(
        { message: "CSV exceeds 5,000 row limit. Split the file and retry." },
        { status: 400 }
      )
    }

    const { data: brand } = await supabase
      .from("brand_settings")
      .select("id, store_url")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()

    const brandSettingsId = brand?.id || null

    let inserted = 0
    let updated = 0
    let errors = 0
    const errorDetails: string[] = []

    // Load existing identity fields for four-tier match
    const { data: existingProducts } = await supabase
      .from("products")
      .select("id, handle, product_url, platform_product_id, sku, content_hash, title, image_url")
      .eq("user_id", user.id)

    const handleToId = new Map<string, string>()
    const urlToId = new Map<string, string>()
    const skuToId = new Map<string, string>()
    const hashToId = new Map<string, string>()

    for (const p of existingProducts || []) {
      if (p.handle) handleToId.set(String(p.handle).toLowerCase(), p.id)
      if (p.product_url) urlToId.set(String(p.product_url).toLowerCase(), p.id)
      if (p.sku) skuToId.set(String(p.sku).toLowerCase(), p.id)
      if (p.content_hash) hashToId.set(p.content_hash, p.id)
    }

    const processedKeys = new Set<string>()
    const upsertPayload: Record<string, unknown>[] = []
    const nowIso = new Date().toISOString()

    for (const row of rows) {
      const handle = (row.Handle || row.handle || "").trim()
      const title = (row.Title || row.title || "").trim()
      if (!handle || !title) continue

      const key = handle.toLowerCase()
      if (processedKeys.has(key)) continue
      processedKeys.add(key)

      const priceRaw = row["Variant Price"] ?? row.price ?? row.Price
      const price = priceRaw != null && priceRaw !== "" ? parseFloat(String(priceRaw)) : null
      const imageUrl = row["Image Src"] || row.image_url || row.Image || null
      const tags = row.Tags
        ? String(row.Tags)
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
        : []
      const description =
        (row["Body (HTML)"] || row.description || row.Description || "")
          .toString()
          .replace(/<[^>]*>/g, "")
          .substring(0, 1000) || null

      const productUrl =
        row["SEO Item URL"] ||
        row.product_url ||
        row.URL ||
        row.Url ||
        (brand?.store_url ? `${String(brand.store_url).replace(/\/$/, "")}/products/${handle}` : null)

      const sku = row.SKU || row.sku || row["Variant SKU"] || null
      const platformProductId = row["Product ID"] || row.product_id || null

      const identity = attachIdentityFields({
        title,
        productUrl,
        imageUrl,
        handle,
        platformProductId,
        sku,
      })

      const contentHash =
        identity?.contentHash ||
        computeContentHash({
          productUrl: productUrl || `handle://${handle}`,
          title,
          imageUrl,
        })

      // Match: handle → url → sku → hash (ignore in-file placeholders)
      const resolveId = (id: string | undefined) =>
        id && id !== "pending" ? id : undefined

      const existingId =
        resolveId(handleToId.get(key)) ||
        resolveId(productUrl ? urlToId.get(String(productUrl).toLowerCase()) : undefined) ||
        resolveId(sku ? skuToId.get(String(sku).toLowerCase()) : undefined) ||
        resolveId(hashToId.get(contentHash))

      const isPublished = row.Published !== "false" && row.Published !== false

      if (existingId) {
        upsertPayload.push({
          id: existingId,
          user_id: user.id,
          handle,
          title,
          description,
          price: Number.isFinite(price as number) ? price : null,
          image_url: imageUrl,
          product_url: identity?.productUrl || productUrl,
          sku: identity?.sku || sku,
          platform_product_id: identity?.platformProductId || platformProductId,
          content_hash: contentHash,
          tags,
          last_seen_at: nowIso,
          missing_sync_count: 0,
          lifecycle_status: isPublished ? "active" : "unavailable",
          is_active: isPublished,
          source: "csv",
          updated_at: nowIso,
        })
        updated++
      } else {
        upsertPayload.push({
          user_id: user.id,
          brand_settings_id: brandSettingsId,
          source: "csv",
          source_product_id: platformProductId || handle,
          handle,
          title,
          description,
          price: Number.isFinite(price as number) ? price : null,
          product_url: identity?.productUrl || productUrl,
          image_url: imageUrl,
          tags,
          sku: identity?.sku || sku,
          platform_product_id: identity?.platformProductId || platformProductId,
          content_hash: contentHash,
          last_seen_at: nowIso,
          missing_sync_count: 0,
          lifecycle_status: isPublished ? "active" : "unavailable",
          is_active: isPublished,
        })
        inserted++
        // Prevent later rows matching this new logical product within same file
        handleToId.set(key, "pending")
        if (contentHash) hashToId.set(contentHash, "pending")
      }
    }

    const chunkSize = 100
    for (let i = 0; i < upsertPayload.length; i += chunkSize) {
      const chunk = upsertPayload.slice(i, i + chunkSize)
      const { error } = await supabase.from("products").upsert(chunk)
      if (error) {
        console.error("Bulk upsert error chunk:", error)
        errors += chunk.length
        errorDetails.push(`Bulk chunk failed: ${error.message}`)
        inserted -= chunk.filter((c) => !c.id).length
        updated -= chunk.filter((c) => c.id).length
      }
    }

    return NextResponse.json({
      success: true,
      report: { inserted, updated, errors, errorDetails },
    })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
