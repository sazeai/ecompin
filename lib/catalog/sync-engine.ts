import type { SupabaseClient } from "@supabase/supabase-js"
import { ProductIdentityIndex, toProductWritePayload } from "./dedupe"
import { extractViaHomepageJsonLd } from "./extractors/homepage-jsonld"
import { extractViaProductsJson } from "./extractors/products-json"
import { extractViaRss } from "./extractors/rss"
import { extractViaSitemap } from "./extractors/sitemap"
import { fetchText, loadRobots, resetHttpThrottle } from "./http"
import {
  buildNormalizedProduct,
  computeContentHash,
  dedupeNormalizedBatch,
  extractHandleFromUrl,
  normalizeStoreUrl,
} from "./normalize"
import { detectPlatformFromHtml, detectPlatformFromUrl } from "./platform"
import { refreshMarketingPool } from "./marketing-pool"
import type {
  CatalogExtractorName,
  CatalogPlatform,
  CatalogStoreRow,
  ExistingProductRow,
  ExtractorResult,
  NormalizedProduct,
  SyncOptions,
  SyncReport,
} from "./types"

type AnySb = SupabaseClient<any, "public", any>

const DEFAULT_MISSING_THRESHOLD = 3
const UPSERT_CHUNK = 50

/**
 * Pluggable catalog sync engine.
 * Fallback chain:
 *   platform sniff → /products.json → sitemap+JSON-LD → homepage JSON-LD → RSS
 * CSV/manual remain separate entry points that share the same identity columns.
 */
export async function syncStoreCatalog(
  supabase: AnySb,
  options: SyncOptions
): Promise<SyncReport> {
  const started = Date.now()
  const missingThreshold = options.missingThreshold ?? DEFAULT_MISSING_THRESHOLD
  const warnings: string[] = []
  resetHttpThrottle()

  let canonicalUrl: string
  try {
    canonicalUrl = normalizeStoreUrl(options.storeUrl)
  } catch (err) {
    return failedReport({
      storeId: options.catalogStoreId || "",
      canonicalUrl: options.storeUrl,
      platform: "unknown",
      errorMessage: err instanceof Error ? err.message : "Invalid store URL",
      durationMs: Date.now() - started,
      warnings,
    })
  }

  // Resolve brand
  let brandSettingsId = options.brandSettingsId ?? null
  if (!brandSettingsId) {
    const { data: brand } = await supabase
      .from("brand_settings")
      .select("id, store_url")
      .eq("user_id", options.userId)
      .limit(1)
      .maybeSingle()
    brandSettingsId = brand?.id ?? null

    // Backfill brand store_url if empty
    if (brand?.id && !brand.store_url) {
      await supabase
        .from("brand_settings")
        .update({ store_url: canonicalUrl, updated_at: new Date().toISOString() })
        .eq("id", brand.id)
    }
  }

  // Upsert catalog_stores row
  const store = await ensureStoreRow(supabase, {
    userId: options.userId,
    brandSettingsId,
    canonicalUrl,
    catalogStoreId: options.catalogStoreId,
  })

  if (!store) {
    return failedReport({
      storeId: "",
      canonicalUrl,
      platform: "unknown",
      errorMessage: "Failed to create catalog store record",
      durationMs: Date.now() - started,
      warnings,
    })
  }

  // Mark running + open audit row
  const nowIso = new Date().toISOString()
  await supabase
    .from("catalog_stores")
    .update({
      sync_status: "running",
      last_started_at: nowIso,
      last_error: null,
    })
    .eq("id", store.id)

  const { data: runRow } = await supabase
    .from("catalog_sync_runs")
    .insert({
      catalog_store_id: store.id,
      user_id: options.userId,
      trigger_source: options.triggerSource || "manual",
      status: "running",
      started_at: nowIso,
    })
    .select("id")
    .single()

  const runId = runRow?.id as string | undefined

  try {
    // robots.txt
    const robots = await loadRobots(canonicalUrl)
    if (!robots.allowed) {
      const msg =
        "Store robots.txt disallows crawlers. Use CSV upload or manual entry instead."
      await finalizeFailure(supabase, store.id, runId, msg)
      return failedReport({
        storeId: store.id,
        canonicalUrl,
        platform: store.platform as CatalogPlatform,
        errorMessage: msg,
        durationMs: Date.now() - started,
        warnings,
      })
    }

    // Platform sniff (homepage HTML best-effort)
    let platform: CatalogPlatform = (store.platform as CatalogPlatform) || "unknown"
    let homepageHtml: string | null = null
    try {
      const home = await fetchText(canonicalUrl, { timeoutMs: 12_000 })
      homepageHtml = home.text
      const detected = detectPlatformFromHtml(canonicalUrl, home.text)
      platform = detected.platform
    } catch {
      const detected = detectPlatformFromUrl(canonicalUrl)
      platform = detected.platform
      warnings.push("Homepage fetch failed — platform sniffed from URL only")
    }

    // Run extractor fallback chain
    const extracted = await runExtractorChain({
      storeRoot: canonicalUrl,
      platform,
      homepageHtml,
      previousFingerprint: store.sitemap_fingerprint,
      maxProductPages: options.maxProductPages,
      forceFullCrawl: options.forceFullCrawl,
      robotsSitemaps: robots.sitemaps,
    })

    if (!extracted || (extracted.products.length === 0 && !extracted.sitemapShortCircuited)) {
      const msg =
        extracted?.warnings?.join("; ") ||
        "Could not discover products from this storefront. Try CSV upload."
      warnings.push(...(extracted?.warnings || []))
      await finalizeFailure(supabase, store.id, runId, msg, {
        platform,
        pagesFetched: extracted?.pagesFetched || 0,
      })
      return failedReport({
        storeId: store.id,
        canonicalUrl,
        platform,
        errorMessage: msg,
        durationMs: Date.now() - started,
        warnings,
        pagesFetched: extracted?.pagesFetched || 0,
      })
    }

    warnings.push(...extracted.warnings)

    // Sitemap short-circuit: touch last_seen, no product writes
    if (extracted.sitemapShortCircuited) {
      const touchIso = new Date().toISOString()
      await supabase
        .from("products")
        .update({ last_seen_at: touchIso, missing_sync_count: 0, updated_at: touchIso })
        .eq("catalog_store_id", store.id)
        .in("lifecycle_status", ["active", "updated"])

      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("catalog_store_id", store.id)
        .eq("is_active", true)

      await supabase
        .from("catalog_stores")
        .update({
          platform,
          sync_status: "success",
          last_synced_at: touchIso,
          last_error: null,
          product_count: count || store.product_count,
          last_extractor_used: extracted.extractor,
          sitemap_url: extracted.sitemap?.sitemapUrl || store.sitemap_url,
          sitemap_fingerprint: extracted.sitemap?.fingerprint || store.sitemap_fingerprint,
          sitemap_product_count:
            extracted.sitemap?.productUrls.length ?? store.sitemap_product_count,
          robots_allowed: true,
        })
        .eq("id", store.id)

      if (runId) {
        await supabase
          .from("catalog_sync_runs")
          .update({
            status: "success",
            extractor_used: extracted.extractor,
            products_seen: count || 0,
            products_unchanged: count || 0,
            pages_fetched: extracted.pagesFetched,
            sitemap_short_circuited: true,
            finished_at: touchIso,
          })
          .eq("id", runId)
      }

      return {
        storeId: store.id,
        canonicalUrl,
        platform,
        extractorUsed: extracted.extractor,
        status: "success",
        productsSeen: count || 0,
        inserted: 0,
        updated: 0,
        unchanged: count || 0,
        unavailable: 0,
        pagesFetched: extracted.pagesFetched,
        sitemapShortCircuited: true,
        warnings,
        durationMs: Date.now() - started,
      }
    }

    // Load existing products for this user (store-scoped + orphans with matching URLs)
    const existing = await loadExistingProducts(supabase, options.userId, store.id)
    const index = new ProductIdentityIndex(existing)

    const seenIds = new Set<string>()
    const insertPayloads: Record<string, unknown>[] = []
    const updatePayloads: Record<string, unknown>[] = []
    let inserted = 0
    let updated = 0
    let unchanged = 0
    const source = sourceForExtractor(extracted.extractor)
    const writeIso = new Date().toISOString()
    const batch = dedupeNormalizedBatch(extracted.products)

    for (const product of batch) {
      const decision = index.match(product)

      if (decision.kind === "unchanged" && decision.existingId) {
        unchanged++
        seenIds.add(decision.existingId)
        // Lightweight touch so lifecycle doesn't mark it missing
        updatePayloads.push({
          id: decision.existingId,
          last_seen_at: writeIso,
          missing_sync_count: 0,
          // revive if previously unavailable but now present
          lifecycle_status: product.availability === "out_of_stock" ? "unavailable" : "active",
          is_active: product.availability !== "out_of_stock",
          updated_at: writeIso,
          catalog_store_id: store.id,
        })
        continue
      }

      if (decision.kind === "update" && decision.existingId) {
        updated++
        seenIds.add(decision.existingId)
        const payload = toProductWritePayload(product, {
          userId: options.userId,
          brandSettingsId,
          catalogStoreId: store.id,
          source,
          existingId: decision.existingId,
          nowIso: writeIso,
        })
        // Preserve lifecycle "updated" when content changed (signals regen)
        if (decision.contentChanged && payload.lifecycle_status === "active") {
          ;(payload as any).lifecycle_status = "updated"
        }
        updatePayloads.push(payload)

        index.upsertLocal({
          id: decision.existingId,
          handle: product.handle,
          platform_product_id: product.platformProductId,
          sku: product.sku,
          product_url: product.productUrl,
          content_hash: product.contentHash,
          title: product.title,
          image_url: product.imageUrl,
          is_active: product.availability !== "out_of_stock",
          lifecycle_status: (payload as any).lifecycle_status,
          missing_sync_count: 0,
          catalog_store_id: store.id,
        })
        continue
      }

      // insert
      inserted++
      const payload = toProductWritePayload(product, {
        userId: options.userId,
        brandSettingsId,
        catalogStoreId: store.id,
        source,
        nowIso: writeIso,
      })
      insertPayloads.push(payload)
    }

    // Lifecycle: products previously in this store but not seen → missing++
    let unavailable = 0
    const missingUpdates: Record<string, unknown>[] = []
    for (const row of index.all) {
      if (row.catalog_store_id && row.catalog_store_id !== store.id) continue
      // Only manage rows tied to this store (or matched during this run)
      if (!row.catalog_store_id && !seenIds.has(row.id)) continue
      if (seenIds.has(row.id)) continue
      if (row.lifecycle_status === "deleted") continue

      const nextMissing = (row.missing_sync_count || 0) + 1
      if (nextMissing >= missingThreshold) {
        unavailable++
        missingUpdates.push({
          id: row.id,
          missing_sync_count: nextMissing,
          lifecycle_status: "unavailable",
          is_active: false,
          updated_at: writeIso,
        })
      } else {
        missingUpdates.push({
          id: row.id,
          missing_sync_count: nextMissing,
          updated_at: writeIso,
        })
      }
    }

    // Persist in chunks
    const writeErrors: string[] = []
    for (const chunk of chunkArray(insertPayloads, UPSERT_CHUNK)) {
      const { error } = await supabase.from("products").insert(chunk)
      if (error) {
        writeErrors.push(`insert: ${error.message}`)
        // Fall back to row-by-row so one bad row doesn't nuke the batch
        for (const row of chunk) {
          const { error: rowErr } = await supabase.from("products").insert(row)
          if (rowErr) {
            writeErrors.push(`insert row: ${rowErr.message}`)
            inserted = Math.max(0, inserted - 1)
          }
        }
      }
    }

    for (const chunk of chunkArray([...updatePayloads, ...missingUpdates], UPSERT_CHUNK)) {
      const { error } = await supabase.from("products").upsert(chunk, { onConflict: "id" })
      if (error) {
        writeErrors.push(`upsert: ${error.message}`)
        for (const row of chunk) {
          const { error: rowErr } = await supabase.from("products").upsert(row, { onConflict: "id" })
          if (rowErr) writeErrors.push(`upsert row: ${rowErr.message}`)
        }
      }
    }

    if (writeErrors.length) {
      warnings.push(...writeErrors.slice(0, 8))
    }

    // Refresh the bounded marketing pool (pins rotate only through marketed products)
    let poolInfo: { poolSize: number; promoted: number; demoted: number; cap: number } | null = null
    try {
      poolInfo = await refreshMarketingPool(supabase, {
        userId: options.userId,
        catalogStoreId: store.id,
        cap: options.marketingPoolCap,
      })
      if (poolInfo) {
        warnings.push(
          `Marketing pool: ${poolInfo.poolSize}/${poolInfo.cap} active, ${poolInfo.promoted} promoted, ${poolInfo.demoted} demoted`
        )
      }
    } catch (err) {
      warnings.push(
        `Marketing pool refresh failed: ${err instanceof Error ? err.message : "error"}`
      )
    }

    const { count: activeCount } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("user_id", options.userId)
      .eq("catalog_store_id", store.id)
      .eq("is_active", true)

    const status =
      writeErrors.length > 0
        ? "partial"
        : batch.length > 0
          ? "success"
          : "partial"

    const finishIso = new Date().toISOString()
    const sampleUrls = (extracted.sitemap?.productUrls || extracted.products.map((p) => p.productUrl)).slice(0, 20)

    await supabase
      .from("catalog_stores")
      .update({
        platform,
        sync_status: status,
        last_synced_at: finishIso,
        last_error: writeErrors[0] || null,
        product_count: activeCount || 0,
        last_extractor_used: extracted.extractor,
        sitemap_url: extracted.sitemap?.sitemapUrl || store.sitemap_url,
        sitemap_fingerprint:
          extracted.sitemap?.fingerprint || store.sitemap_fingerprint,
        sitemap_product_count:
          extracted.sitemap?.productUrls.length ?? store.sitemap_product_count,
        sitemap_urls_sample: sampleUrls,
        robots_allowed: true,
      })
      .eq("id", store.id)

    if (runId) {
      await supabase
        .from("catalog_sync_runs")
        .update({
          status,
          extractor_used: extracted.extractor,
          products_seen: batch.length,
          products_inserted: inserted,
          products_updated: updated,
          products_unchanged: unchanged,
          products_unavailable: unavailable,
          pages_fetched: extracted.pagesFetched,
          sitemap_short_circuited: false,
          error_message: writeErrors[0] || null,
          finished_at: finishIso,
          meta: { warnings: warnings.slice(0, 20) },
        })
        .eq("id", runId)
    }

    return {
      storeId: store.id,
      canonicalUrl,
      platform,
      extractorUsed: extracted.extractor,
      status,
      productsSeen: batch.length,
      inserted,
      updated,
      unchanged,
      unavailable,
      pagesFetched: extracted.pagesFetched,
      sitemapShortCircuited: false,
      warnings,
      durationMs: Date.now() - started,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Catalog sync failed"
    await finalizeFailure(supabase, store.id, runId, msg)
    return failedReport({
      storeId: store.id,
      canonicalUrl,
      platform: (store.platform as CatalogPlatform) || "unknown",
      errorMessage: msg,
      durationMs: Date.now() - started,
      warnings,
    })
  }
}

async function runExtractorChain(args: {
  storeRoot: string
  platform: CatalogPlatform
  homepageHtml: string | null
  previousFingerprint: string | null
  maxProductPages?: number
  forceFullCrawl?: boolean
  robotsSitemaps: string[]
}): Promise<ExtractorResult | null> {
  // 1) Shopify-style public products.json (best signal when available)
  if (args.platform === "shopify" || args.platform === "unknown" || args.platform === "generic") {
    const viaJson = await extractViaProductsJson(args.storeRoot)
    if (viaJson && viaJson.products.length > 0) return viaJson
  }

  // Always try products.json once even for non-shopify if not tried — cheap 404
  if (args.platform !== "shopify" && args.platform !== "unknown" && args.platform !== "generic") {
    const viaJson = await extractViaProductsJson(args.storeRoot)
    if (viaJson && viaJson.products.length > 0) return viaJson
  }

  // 2) Sitemap → Shopify product.js (preferred) or HTML JSON-LD
  const viaSitemap = await extractViaSitemap(args.storeRoot, {
    robotsSitemaps: args.robotsSitemaps,
    // Shopify .js is cheap; allow full catalogs (500–2000) by default
    maxProductPages: args.maxProductPages ?? (args.platform === "shopify" ? 2000 : 400),
    previousFingerprint: args.previousFingerprint,
    forceFullCrawl: args.forceFullCrawl,
    preferShopifyJs: args.platform === "shopify" || args.platform === "unknown" || args.platform === "generic",
  })
  if (viaSitemap && (viaSitemap.products.length > 0 || viaSitemap.sitemapShortCircuited)) {
    return viaSitemap
  }

  // 3) Homepage / collection JSON-LD
  const viaHome = await extractViaHomepageJsonLd(args.storeRoot)
  if (viaHome && viaHome.products.length > 0) return viaHome

  // 4) RSS / Atom feeds
  const viaRss = await extractViaRss(args.storeRoot)
  if (viaRss && viaRss.products.length > 0) return viaRss

  // Prefer returning sitemap result (with warnings) over null when URLs existed
  if (viaSitemap) return viaSitemap
  return null
}

async function ensureStoreRow(
  supabase: AnySb,
  args: {
    userId: string
    brandSettingsId: string | null
    canonicalUrl: string
    catalogStoreId?: string
  }
): Promise<CatalogStoreRow | null> {
  if (args.catalogStoreId) {
    const { data } = await supabase
      .from("catalog_stores")
      .select("*")
      .eq("id", args.catalogStoreId)
      .eq("user_id", args.userId)
      .maybeSingle()
    if (data) return data as CatalogStoreRow
  }

  const { data: existing } = await supabase
    .from("catalog_stores")
    .select("*")
    .eq("user_id", args.userId)
    .eq("canonical_url", args.canonicalUrl)
    .maybeSingle()

  if (existing) {
    if (args.brandSettingsId && !existing.brand_settings_id) {
      await supabase
        .from("catalog_stores")
        .update({ brand_settings_id: args.brandSettingsId })
        .eq("id", existing.id)
      existing.brand_settings_id = args.brandSettingsId
    }
    return existing as CatalogStoreRow
  }

  const { data: created, error } = await supabase
    .from("catalog_stores")
    .insert({
      user_id: args.userId,
      brand_settings_id: args.brandSettingsId,
      canonical_url: args.canonicalUrl,
      platform: detectPlatformFromUrl(args.canonicalUrl).platform,
      sync_status: "queued",
    })
    .select("*")
    .single()

  if (error || !created) {
    console.error("catalog_stores insert failed:", error)
    return null
  }
  return created as CatalogStoreRow
}

async function loadExistingProducts(
  supabase: AnySb,
  userId: string,
  storeId: string
): Promise<ExistingProductRow[]> {
  // Prefer store-scoped rows; also load user products with identity fields for match
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, handle, platform_product_id, sku, product_url, content_hash, title, image_url, is_active, lifecycle_status, missing_sync_count, catalog_store_id"
    )
    .eq("user_id", userId)
    .or(`catalog_store_id.eq.${storeId},catalog_store_id.is.null`)

  if (error) {
    console.error("loadExistingProducts error:", error)
    return []
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    handle: row.handle ?? null,
    platform_product_id: row.platform_product_id ?? null,
    sku: row.sku ?? null,
    product_url: row.product_url ?? null,
    content_hash: row.content_hash ?? null,
    title: row.title,
    image_url: row.image_url ?? null,
    is_active: row.is_active ?? true,
    lifecycle_status: row.lifecycle_status || "active",
    missing_sync_count: row.missing_sync_count || 0,
    catalog_store_id: row.catalog_store_id ?? null,
  }))
}

async function finalizeFailure(
  supabase: AnySb,
  storeId: string,
  runId: string | undefined,
  message: string,
  extra?: { platform?: CatalogPlatform; pagesFetched?: number }
) {
  const ts = new Date().toISOString()
  await supabase
    .from("catalog_stores")
    .update({
      sync_status: "failed",
      last_error: message.slice(0, 1000),
      ...(extra?.platform ? { platform: extra.platform } : {}),
    })
    .eq("id", storeId)

  if (runId) {
    await supabase
      .from("catalog_sync_runs")
      .update({
        status: "failed",
        error_message: message.slice(0, 1000),
        pages_fetched: extra?.pagesFetched || 0,
        finished_at: ts,
      })
      .eq("id", runId)
  }
}

/**
 * products.source is constrained in DB to:
 *   shopify | etsy | manual | csv | store_crawl
 * Prefer "shopify" for Shopify public endpoints so existing dashboards/filters keep working.
 * Use "store_crawl" for generic public discovery.
 */
function sourceForExtractor(name: CatalogExtractorName): string {
  switch (name) {
    case "products_json":
      return "shopify"
    case "sitemap_jsonld":
      // Shopify product.js path still uses this extractor name
      return "shopify"
    case "jsonld_homepage":
    case "rss_xml":
      return "store_crawl"
    case "csv":
      return "csv"
    case "manual":
      return "manual"
    default:
      return "store_crawl"
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function failedReport(partial: {
  storeId: string
  canonicalUrl: string
  platform: CatalogPlatform
  errorMessage: string
  durationMs: number
  warnings: string[]
  pagesFetched?: number
}): SyncReport {
  return {
    storeId: partial.storeId,
    canonicalUrl: partial.canonicalUrl,
    platform: partial.platform,
    extractorUsed: null,
    status: "failed",
    productsSeen: 0,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    unavailable: 0,
    pagesFetched: partial.pagesFetched || 0,
    sitemapShortCircuited: false,
    warnings: partial.warnings,
    errorMessage: partial.errorMessage,
    durationMs: partial.durationMs,
  }
}

/** Used by CSV path to attach identity hashes without a full crawl. */
export function attachIdentityFields(product: {
  title: string
  productUrl: string | null
  imageUrl: string | null
  handle?: string | null
  platformProductId?: string | null
  sku?: string | null
}): Pick<
  NormalizedProduct,
  "contentHash" | "handle" | "platformProductId" | "sku" | "productUrl"
> | null {
  if (!product.productUrl && !product.handle) {
    return null
  }

  // CSV rows often only have handle — hash with synthetic stable URL
  const productUrl =
    product.productUrl ||
    (product.handle ? `handle://${product.handle}` : null)

  if (!productUrl) return null

  if (productUrl.startsWith("handle://")) {
    return {
      productUrl,
      handle: product.handle || extractHandleFromUrl(productUrl),
      platformProductId: product.platformProductId || null,
      sku: product.sku || null,
      contentHash: computeContentHash({
        productUrl,
        title: product.title,
        imageUrl: product.imageUrl,
      }),
    }
  }

  const n = buildNormalizedProduct({
    title: product.title,
    productUrl,
    imageUrl: product.imageUrl,
    handle: product.handle,
    platformProductId: product.platformProductId,
    sku: product.sku,
  })
  if (!n) return null
  return {
    productUrl: n.productUrl,
    handle: n.handle,
    platformProductId: n.platformProductId,
    sku: n.sku,
    contentHash: n.contentHash,
  }
}
