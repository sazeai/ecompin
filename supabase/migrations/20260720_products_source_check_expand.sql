-- Expand products.source check so catalog crawl + CSV imports can persist.
-- Root cause of "seen N / inserted 0" on Trigger runs for boingg.in / magneticme.com.

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_source_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_source_check
  CHECK (source = ANY (ARRAY[
    'shopify'::text,
    'etsy'::text,
    'manual'::text,
    'csv'::text,
    'store_crawl'::text
  ]));
