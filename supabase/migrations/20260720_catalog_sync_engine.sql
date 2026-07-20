-- Catalog Sync Engine (Phase 1–2)
-- Public storefront crawl + four-tier product identity + lifecycle states.
-- Additive only: keeps existing products/handle/is_active working for pin generation.

-- ─── catalog_stores ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_settings_id uuid REFERENCES public.brand_settings(id) ON DELETE SET NULL,
  canonical_url text NOT NULL,
  platform text NOT NULL DEFAULT 'unknown',
  -- idle | queued | running | success | partial | failed
  sync_status text NOT NULL DEFAULT 'idle',
  last_synced_at timestamptz,
  last_started_at timestamptz,
  last_error text,
  product_count integer NOT NULL DEFAULT 0,
  -- Sitemap-diff short-circuit cache
  sitemap_url text,
  sitemap_fingerprint text,
  sitemap_product_count integer,
  sitemap_urls_sample text[] DEFAULT '{}',
  last_extractor_used text,
  robots_allowed boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalog_stores_user_canonical_unique UNIQUE (user_id, canonical_url),
  CONSTRAINT catalog_stores_sync_status_check CHECK (
    sync_status IN ('idle', 'queued', 'running', 'success', 'partial', 'failed')
  )
);

CREATE INDEX IF NOT EXISTS catalog_stores_user_id_idx
  ON public.catalog_stores (user_id);
CREATE INDEX IF NOT EXISTS catalog_stores_sync_status_idx
  ON public.catalog_stores (sync_status);
CREATE INDEX IF NOT EXISTS catalog_stores_last_synced_at_idx
  ON public.catalog_stores (last_synced_at);

-- ─── products identity / lifecycle extensions ────────────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS catalog_store_id uuid REFERENCES public.catalog_stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS handle text,
  ADD COLUMN IF NOT EXISTS platform_product_id text,
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS content_hash text,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS missing_sync_count integer NOT NULL DEFAULT 0,
  -- active | updated | unavailable | deleted
  ADD COLUMN IF NOT EXISTS lifecycle_status text NOT NULL DEFAULT 'active';

-- Normalize any null lifecycle defaults for safety
UPDATE public.products
SET lifecycle_status = 'active'
WHERE lifecycle_status IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_lifecycle_status_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_lifecycle_status_check
      CHECK (lifecycle_status IN ('active', 'updated', 'unavailable', 'deleted'));
  END IF;
END $$;

-- Keep handle uniqueness (existing CSV/Shopify path)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_user_handle_key'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_user_handle_key UNIQUE (user_id, handle);
  END IF;
END $$;

-- Identity lookup indexes (uniqueness enforced in app via four-tier matcher).
-- Not UNIQUE at DB level: legacy catalogs may already contain URL/SKU collisions;
-- forcing UNIQUE here would block the migration and break existing accounts.
CREATE INDEX IF NOT EXISTS products_user_store_platform_id_idx
  ON public.products (user_id, catalog_store_id, platform_product_id)
  WHERE platform_product_id IS NOT NULL AND catalog_store_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS products_user_product_url_idx
  ON public.products (user_id, product_url)
  WHERE product_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS products_user_store_sku_idx
  ON public.products (user_id, catalog_store_id, sku)
  WHERE sku IS NOT NULL AND catalog_store_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS products_catalog_store_id_idx
  ON public.products (catalog_store_id);
CREATE INDEX IF NOT EXISTS products_content_hash_idx
  ON public.products (user_id, content_hash)
  WHERE content_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS products_lifecycle_status_idx
  ON public.products (user_id, lifecycle_status);
CREATE INDEX IF NOT EXISTS products_last_seen_at_idx
  ON public.products (catalog_store_id, last_seen_at);

-- ─── sync run audit (lightweight, practical) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.catalog_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_store_id uuid NOT NULL REFERENCES public.catalog_stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_source text NOT NULL DEFAULT 'manual', -- manual | scheduled | onboarding
  status text NOT NULL DEFAULT 'running', -- running | success | partial | failed
  extractor_used text,
  products_seen integer NOT NULL DEFAULT 0,
  products_inserted integer NOT NULL DEFAULT 0,
  products_updated integer NOT NULL DEFAULT 0,
  products_unchanged integer NOT NULL DEFAULT 0,
  products_unavailable integer NOT NULL DEFAULT 0,
  pages_fetched integer NOT NULL DEFAULT 0,
  sitemap_short_circuited boolean NOT NULL DEFAULT false,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS catalog_sync_runs_store_started_idx
  ON public.catalog_sync_runs (catalog_store_id, started_at DESC);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.catalog_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_sync_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "catalog_stores_select_own" ON public.catalog_stores;
CREATE POLICY "catalog_stores_select_own"
  ON public.catalog_stores FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "catalog_stores_insert_own" ON public.catalog_stores;
CREATE POLICY "catalog_stores_insert_own"
  ON public.catalog_stores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "catalog_stores_update_own" ON public.catalog_stores;
CREATE POLICY "catalog_stores_update_own"
  ON public.catalog_stores FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "catalog_stores_delete_own" ON public.catalog_stores;
CREATE POLICY "catalog_stores_delete_own"
  ON public.catalog_stores FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "catalog_sync_runs_select_own" ON public.catalog_sync_runs;
CREATE POLICY "catalog_sync_runs_select_own"
  ON public.catalog_sync_runs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "catalog_sync_runs_insert_own" ON public.catalog_sync_runs;
CREATE POLICY "catalog_sync_runs_insert_own"
  ON public.catalog_sync_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "catalog_sync_runs_update_own" ON public.catalog_sync_runs;
CREATE POLICY "catalog_sync_runs_update_own"
  ON public.catalog_sync_runs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role bypasses RLS for Trigger jobs.

-- ─── updated_at helper ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_catalog_stores_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS catalog_stores_set_updated_at ON public.catalog_stores;
CREATE TRIGGER catalog_stores_set_updated_at
  BEFORE UPDATE ON public.catalog_stores
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_catalog_stores_updated_at();
