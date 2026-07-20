import { schedules, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"
import { syncStoreCatalog } from "@/lib/catalog"

/**
 * Payload when triggered on-demand from /api/catalog/sync.
 * Scheduled cron runs have Trigger schedule metadata instead (no catalogStoreId).
 */
export interface ProductSyncPayload {
  userId?: string
  catalogStoreId?: string
  storeUrl?: string
  brandSettingsId?: string | null
  triggerSource?: "manual" | "scheduled" | "onboarding"
  forceFullCrawl?: boolean
  maxProductPages?: number
}

function isOnDemandPayload(payload: unknown): payload is Required<
  Pick<ProductSyncPayload, "userId" | "catalogStoreId" | "storeUrl">
> &
  ProductSyncPayload {
  if (!payload || typeof payload !== "object") return false
  const p = payload as ProductSyncPayload
  return Boolean(p.userId && p.catalogStoreId && p.storeUrl)
}

/**
 * EcomPin — Product Catalog Sync
 *
 * Reuses the existing schedule slot `shopify-product-sync` (do not add new schedules —
 * free Trigger.dev plan is capped at 10).
 *
 * - Cron: re-sync all registered catalog_stores via public crawl engine
 * - On-demand: tasks.trigger("shopify-product-sync", { userId, catalogStoreId, storeUrl, ... })
 */
export const shopifyProductSync = schedules.task({
  id: "shopify-product-sync",
  // 12h cadence — same schedule id as before (was daily 2AM Admin API sync)
  cron: "0 */12 * * *",
  run: async (payload: ProductSyncPayload | Record<string, unknown>) => {
    const supabase = createAdminClient() as any

    // ── On-demand single-store sync (URL import from app) ───────────────────
    if (isOnDemandPayload(payload)) {
      logger.info("Catalog store sync started (on-demand)", {
        userId: payload.userId,
        catalogStoreId: payload.catalogStoreId,
        storeUrl: payload.storeUrl,
        triggerSource: payload.triggerSource || "manual",
      })

      const report = await syncStoreCatalog(supabase, {
        userId: payload.userId,
        storeUrl: payload.storeUrl,
        brandSettingsId: payload.brandSettingsId ?? null,
        catalogStoreId: payload.catalogStoreId,
        triggerSource: payload.triggerSource || "manual",
        forceFullCrawl: Boolean(payload.forceFullCrawl),
        maxProductPages: payload.maxProductPages ?? 400,
      })

      logger.info("Catalog store sync finished (on-demand)", {
        status: report.status,
        inserted: report.inserted,
        updated: report.updated,
        unchanged: report.unchanged,
        unavailable: report.unavailable,
        pagesFetched: report.pagesFetched,
        extractor: report.extractorUsed,
        shortCircuited: report.sitemapShortCircuited,
        durationMs: report.durationMs,
        error: report.errorMessage,
      })

      return report
    }

    // ── Scheduled: all catalog_stores ───────────────────────────────────────
    logger.info("Global catalog re-sync started (shopify-product-sync)")

    const { data: stores, error } = await supabase
      .from("catalog_stores")
      .select("id, user_id, canonical_url, brand_settings_id, sync_status, last_synced_at")
      .in("sync_status", ["idle", "success", "partial", "failed", "queued"])
      .order("last_synced_at", { ascending: true, nullsFirst: true })
      .limit(200)

    if (error) {
      logger.error("Failed to load catalog_stores", { error: error.message })
      return { ok: false, error: error.message }
    }

    if (!stores?.length) {
      logger.info("No catalog stores to re-sync")
      return { ok: true, processed: 0, succeeded: 0, failed: 0 }
    }

    let processed = 0
    let succeeded = 0
    let failed = 0

    for (const store of stores) {
      if (store.sync_status === "running") continue

      try {
        const report = await syncStoreCatalog(supabase, {
          userId: store.user_id,
          storeUrl: store.canonical_url,
          brandSettingsId: store.brand_settings_id,
          catalogStoreId: store.id,
          triggerSource: "scheduled",
          forceFullCrawl: false,
          maxProductPages: 400,
        })
        processed++
        if (report.status === "failed") failed++
        else succeeded++

        logger.info("Re-synced store", {
          storeId: store.id,
          status: report.status,
          shortCircuited: report.sitemapShortCircuited,
          inserted: report.inserted,
          updated: report.updated,
          unavailable: report.unavailable,
        })
      } catch (err: any) {
        failed++
        processed++
        logger.error("Re-sync failed for store", {
          storeId: store.id,
          error: err?.message,
        })
      }

      await new Promise((r) => setTimeout(r, 250))
    }

    logger.info("Global catalog re-sync complete", { processed, succeeded, failed })
    return { ok: true, processed, succeeded, failed }
  },
})
