-- Marketing pool: pins only rotate through marketed products.
-- Catalog remains full; marketed is the bounded automation surface.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS marketed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_priority integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS products_marketed_active_idx
  ON public.products (user_id, marketed, is_active)
  WHERE marketed = true;

CREATE INDEX IF NOT EXISTS products_marketing_priority_idx
  ON public.products (user_id, marketing_priority DESC)
  WHERE marketed = true;

-- Backfill existing small catalogs (≤150 active with images) into the pool
WITH eligible AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id
           ORDER BY created_at DESC
         ) AS rn
  FROM public.products
  WHERE is_active = true
    AND image_url IS NOT NULL
    AND (lifecycle_status IS NULL OR lifecycle_status IN ('active','updated'))
)
UPDATE public.products p
SET marketed = true,
    marketing_priority = 50
FROM eligible e
WHERE p.id = e.id
  AND e.rn <= 150;
