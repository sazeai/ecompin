import { NextRequest, NextResponse } from "next/server"
import { tasks } from "@trigger.dev/sdk/v3"
import { createClient } from "@/utils/supabase/server"
import { normalizeStoreUrl, syncStoreCatalog } from "@/lib/catalog"
import type { catalogStoreSync } from "@/trigger/sync-catalog-store"

export const maxDuration = 60

/**
 * POST /api/catalog/sync
 * Body: { storeUrl: string, mode?: "async" | "sync", forceFullCrawl?: boolean }
 *
 * - async (default): enqueue Trigger job, return store id + queued status immediately
 * - sync: run inline (small stores / onboarding smoke). Caps product pages.
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
    const body = await req.json().catch(() => ({}))
    const storeUrlRaw = String(body.storeUrl || body.url || "").trim()
    if (!storeUrlRaw) {
      return NextResponse.json({ error: "storeUrl is required" }, { status: 400 })
    }

    let canonicalUrl: string
    try {
      canonicalUrl = normalizeStoreUrl(storeUrlRaw)
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Invalid store URL" },
        { status: 400 }
      )
    }

    const mode = body.mode === "sync" ? "sync" : "async"
    const forceFullCrawl = Boolean(body.forceFullCrawl)
    const triggerSource =
      body.triggerSource === "onboarding" ? "onboarding" : "manual"

    const { data: brand } = await supabase
      .from("brand_settings")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()

    // Ensure store row exists quickly so UI can poll
    const { data: existing } = await supabase
      .from("catalog_stores")
      .select("id, sync_status, last_synced_at, product_count, platform")
      .eq("user_id", user.id)
      .eq("canonical_url", canonicalUrl)
      .maybeSingle()

    let storeId = existing?.id as string | undefined

    if (!storeId) {
      const { data: created, error: createErr } = await supabase
        .from("catalog_stores")
        .insert({
          user_id: user.id,
          brand_settings_id: brand?.id || null,
          canonical_url: canonicalUrl,
          sync_status: "queued",
        })
        .select("id, sync_status, last_synced_at, product_count, platform")
        .single()

      if (createErr || !created) {
        // Unique race — fetch again
        const { data: again } = await supabase
          .from("catalog_stores")
          .select("id, sync_status, last_synced_at, product_count, platform")
          .eq("user_id", user.id)
          .eq("canonical_url", canonicalUrl)
          .maybeSingle()
        if (!again) {
          console.error("catalog_stores create failed:", createErr)
          return NextResponse.json(
            { error: "Failed to register store" },
            { status: 500 }
          )
        }
        storeId = again.id
      } else {
        storeId = created.id
      }
    } else {
      await supabase
        .from("catalog_stores")
        .update({ sync_status: "queued", last_error: null })
        .eq("id", storeId)
    }

    // Prevent double-running the same store
    if (existing?.sync_status === "running") {
      return NextResponse.json({
        success: true,
        queued: true,
        alreadyRunning: true,
        store: {
          id: storeId,
          canonicalUrl,
          syncStatus: "running",
          productCount: existing.product_count,
          platform: existing.platform,
        },
      })
    }

    if (mode === "sync") {
      // Inline path — keep it bounded for serverless timeouts
      const report = await syncStoreCatalog(supabase as any, {
        userId: user.id,
        storeUrl: canonicalUrl,
        brandSettingsId: brand?.id || null,
        catalogStoreId: storeId,
        triggerSource,
        forceFullCrawl,
        maxProductPages: Number(body.maxProductPages) || 80,
      })

      return NextResponse.json({
        success: report.status !== "failed",
        report,
        store: {
          id: storeId,
          canonicalUrl,
          syncStatus: report.status === "failed" ? "failed" : report.status,
        },
      })
    }

    // Prefer background job; fall back to inline if Trigger is unavailable
    try {
      await tasks.trigger<typeof catalogStoreSync>("catalog-store-sync", {
        userId: user.id,
        catalogStoreId: storeId!,
        storeUrl: canonicalUrl,
        brandSettingsId: brand?.id || null,
        triggerSource,
        forceFullCrawl,
      })

      return NextResponse.json({
        success: true,
        queued: true,
        store: {
          id: storeId,
          canonicalUrl,
          syncStatus: "queued",
        },
      })
    } catch (triggerErr) {
      console.warn("Trigger enqueue failed, running inline fallback:", triggerErr)
      const report = await syncStoreCatalog(supabase as any, {
        userId: user.id,
        storeUrl: canonicalUrl,
        brandSettingsId: brand?.id || null,
        catalogStoreId: storeId,
        triggerSource,
        forceFullCrawl,
        maxProductPages: 80,
      })
      return NextResponse.json({
        success: report.status !== "failed",
        queued: false,
        fallbackInline: true,
        report,
        store: {
          id: storeId,
          canonicalUrl,
          syncStatus: report.status,
        },
      })
    }
  } catch (err: any) {
    console.error("catalog sync API error:", err)
    return NextResponse.json(
      { error: err?.message || "Sync failed" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/catalog/sync?storeId=...
 * Poll sync status for a store.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const storeId = req.nextUrl.searchParams.get("storeId")
  const includeRuns = req.nextUrl.searchParams.get("runs") === "1"

  if (storeId) {
    const { data: store, error } = await supabase
      .from("catalog_stores")
      .select(
        "id, canonical_url, platform, sync_status, last_synced_at, last_started_at, last_error, product_count, last_extractor_used, sitemap_product_count"
      )
      .eq("id", storeId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (error || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    let latestRun = null
    if (includeRuns) {
      const { data: runs } = await supabase
        .from("catalog_sync_runs")
        .select(
          "id, status, extractor_used, products_seen, products_inserted, products_updated, products_unchanged, products_unavailable, pages_fetched, sitemap_short_circuited, error_message, started_at, finished_at"
        )
        .eq("catalog_store_id", storeId)
        .order("started_at", { ascending: false })
        .limit(1)
      latestRun = runs?.[0] || null
    }

    return NextResponse.json({ store, latestRun })
  }

  const { data: stores } = await supabase
    .from("catalog_stores")
    .select(
      "id, canonical_url, platform, sync_status, last_synced_at, last_error, product_count, last_extractor_used"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return NextResponse.json({ stores: stores || [] })
}
