export type CatalogPlatform =
  | "shopify"
  | "woocommerce"
  | "squarespace"
  | "wix"
  | "bigcommerce"
  | "generic"
  | "unknown"

export type CatalogExtractorName =
  | "products_json"
  | "sitemap_jsonld"
  | "jsonld_homepage"
  | "rss_xml"
  | "csv"
  | "manual"

export type ProductLifecycleStatus =
  | "active"
  | "updated"
  | "unavailable"
  | "deleted"

export type CatalogSyncStatus =
  | "idle"
  | "queued"
  | "running"
  | "success"
  | "partial"
  | "failed"

/** Normalized product discovered from any public source. */
export interface NormalizedProduct {
  title: string
  description: string | null
  productUrl: string
  imageUrl: string | null
  price: number | null
  currency: string | null
  handle: string | null
  platformProductId: string | null
  sku: string | null
  tags: string[]
  availability: "in_stock" | "out_of_stock" | "unknown"
  /** SHA256 of stable fields — set by normalize layer */
  contentHash: string
}

export interface SitemapSnapshot {
  sitemapUrl: string | null
  productUrls: string[]
  /** lastmod map when available */
  lastmodByUrl: Record<string, string | undefined>
  fingerprint: string
}

export interface ExtractorResult {
  extractor: CatalogExtractorName
  products: NormalizedProduct[]
  pagesFetched: number
  sitemap?: SitemapSnapshot
  warnings: string[]
  /** true when sitemap fingerprint matched previous run and product pages were skipped */
  sitemapShortCircuited?: boolean
}

export interface CatalogStoreRow {
  id: string
  user_id: string
  brand_settings_id: string | null
  canonical_url: string
  platform: CatalogPlatform
  sync_status: CatalogSyncStatus
  last_synced_at: string | null
  last_started_at: string | null
  last_error: string | null
  product_count: number
  sitemap_url: string | null
  sitemap_fingerprint: string | null
  sitemap_product_count: number | null
  sitemap_urls_sample: string[] | null
  last_extractor_used: string | null
  robots_allowed: boolean | null
}

export interface ExistingProductRow {
  id: string
  handle: string | null
  platform_product_id: string | null
  sku: string | null
  product_url: string | null
  content_hash: string | null
  title: string
  image_url: string | null
  is_active: boolean
  lifecycle_status: ProductLifecycleStatus
  missing_sync_count: number
  catalog_store_id: string | null
}

export interface MatchDecision {
  kind: "insert" | "update" | "unchanged"
  existingId?: string
  matchTier?: "platform_product_id" | "product_url" | "sku" | "content_hash" | "handle"
  /** true when content_hash changed (needs asset regen downstream) */
  contentChanged?: boolean
}

export interface SyncReport {
  storeId: string
  canonicalUrl: string
  platform: CatalogPlatform
  extractorUsed: CatalogExtractorName | null
  status: "success" | "partial" | "failed"
  productsSeen: number
  inserted: number
  updated: number
  unchanged: number
  unavailable: number
  pagesFetched: number
  sitemapShortCircuited: boolean
  warnings: string[]
  errorMessage?: string
  durationMs: number
}

export interface SyncOptions {
  userId: string
  storeUrl: string
  brandSettingsId?: string | null
  /** When set, re-sync this store row instead of creating */
  catalogStoreId?: string
  triggerSource?: "manual" | "scheduled" | "onboarding"
  /** Max product pages to fetch via sitemap/json-ld path (cost cap) */
  maxProductPages?: number
  /** Force full crawl even if sitemap fingerprint matches */
  forceFullCrawl?: boolean
  /** Missing for this many consecutive syncs → unavailable */
  missingThreshold?: number
}
