import { logger, schedules, task } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"
import { syncStoreCatalog } from "@/lib/catalog"

export interface CatalogStoreSyncPayload {
  userId: string
  catalogStoreId: string
  storeUrl: string
  brandSettingsId?: string | null
  triggerSource?: "manual" | "scheduled" | "onboarding"
  forceFullCrawl?: boolean
  maxProductPages?: number
}

/**
 * On-demand catalog sync for a single store (URL import).
 */
export const catalogStoreSync = task({
  id: "catalog-store-sync",
  // Large catalogs may crawl many product pages
  maxDuration: 1800,
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: CatalogStoreSyncPayload) => {
    const {
      userId,
      catalogStoreId,
      storeUrl,
      brandSettingsId,
      triggerSource = "manual",
      forceFullCrawl = false,
      maxProductPages = 400,
    } = payload

    logger.info("Catalog store sync started", {
      userId,
      catalogStoreId,
      storeUrl,
      triggerSource,
    })

    const supabase = createAdminClient() as any

    const report = await syncStoreCatalog(supabase, {
      userId,
      storeUrl,
      brandSettingsId: brandSettingsId ?? null,
      catalogStoreId,
      triggerSource,
      forceFullCrawl,
      maxProductPages,
    })

    logger.info("Catalog store sync finished", {
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
  },
})

/**
 * Global re-sync every 12 hours for all registered catalog stores.
 * Uses sitemap fingerprint short-circuit to keep cost low.
 */
export const catalogStoreResync = schedules.task({
  id: "catalog-store-resync",
  cron: "0 */12 * * *",
  run: async () => {
    logger.info("Global catalog re-sync started")
    const supabase = createAdminClient() as any

    // Only stores that are not currently running and have been synced before
    // or were never successfully synced (retry failed).
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
      return { ok: true, processed: 0 }
    }

    let processed = 0
    let succeeded = 0
    let failed = 0

    for (const store of stores) {
      // Skip if a run is already in progress (race with manual)
      if (store.sync_status === "running") continue

      // Stagger slightly between stores
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
