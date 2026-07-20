# EcomPin — Launch Readiness Upgrade Plan

> Source: `newfeaturepivot.md` (product pivot conversation). This plan converts every
> suggested feature/improvement from that discussion into a phased, measurable
> engineering program that takes EcomPin from "Shopify/Etsy API-dependent scheduler"
> to "platform-agnostic autonomous Pinterest agent" ready for public launch.

---

## 1. Why This Plan Exists (Context)

- **Etsy** denied API approval.
- **Shopify** requires app review + in-platform billing before third-party API access.
- Current pipeline is `Product → Lifestyle Image → Pin` with the product name/description
  as pin copy — a generic "product dump" that doesn't match how Pinterest discovery works.
- Current positioning couples the product to Shopify/Etsy, shrinking the addressable market.

**Strategic pivot (three pillars):**

| Pillar | From | To |
|---|---|---|
| A. Catalog ingestion | Platform APIs (blocked) | Public product discovery via storefront crawling, with a robust dedupe/sync engine |
| B. Platform support | Shopify + Etsy only | Any e-commerce store (Shopify, WooCommerce, Wix, Squarespace, BigCommerce, custom) |
| C. Pin generation | Product name + description dump | Idea-first, search-intent-driven pins that sell outcomes and solutions |

---

## 2. Complete Feature Inventory (extracted from the chat log)

### Pillar A — Intelligent Product Fetch & Duplicate Prevention

- **A1. Store URL onboarding** — user enters `https://brand.myshopify.com` or `https://brand.com`; no app install, no OAuth.
- **A2. `/products.json` crawler** — primary Shopify extractor (title, images, URL, price, variants).
- **A3. JSON-LD structured-data extractor** — parse Product schema from product/collection pages.
- **A4. Sitemap discovery & crawling** — `/sitemap.xml` → product sub-sitemaps (e.g. `/sitemap_products_1.xml`).
- **A5. XML product feed importer.**
- **A6. RSS feed importer.**
- **A7. CSV upload** — already implemented; keep as universal fallback.
- **A8. Manual entry** — already implemented; keep as last resort.
- **A9. Pluggable Catalog Sync Engine** with a defined fallback chain:
  `Platform extractor → /products.json → JSON-LD → Sitemap → XML/RSS feed → CSV → Manual`.
- **A10. Normalized catalog schema** — internal `Product` regardless of source: `id, store_id, platform, name, images[], description, product_url, price, variants, sku, platform_product_id, availability`.
- **A11. Scheduled re-sync every 12–24h.**
- **A12. Change detection via ETag/content hash** — only new/changed products trigger lifestyle image regeneration (cost control).
- **A13. New-product auto-detection** — new URL on re-crawl → new product → enqueue asset generation.
- **A14. Layered dedupe identity chain** (in priority order):
  1. `store_id + platform_product_id` (from JSON-LD/metadata when exposed)
  2. canonical product URL
  3. SKU
  4. content hash `SHA256(product_url + title + main_image_url)`
- **A15. Product lifecycle states** — `active / updated / missing` (missing for N consecutive crawls → `unavailable`/`deleted`; feeds out-of-stock detection so pins are never published for dead products).
- **A16. Sitemap-diff crawl optimization** — if product count + URLs + `lastmod` are unchanged, skip full re-crawl; fetch only new/changed pages (reduces daily crawl volume from hundreds of pages to a handful).

### Pillar B — Multi-Platform Support & Shopify API Decoupling

- **B1. Platform sniffing** — identify platform from the store URL/HTML fingerprint (generator meta, asset paths, headers).
- **B2. Platform-specific extractors**: Shopify (`/products.json` first), WooCommerce (JSON-LD/sitemap; very crawl-friendly), Squarespace (structured data + sitemap), Wix (JS-heavy; SSR/schema extraction), BigCommerce (SEO-friendly pages), generic/custom.
- **B3. Generic crawler** — platform-agnostic fallback that works off public pages alone.
- **B4. Remove all Shopify API-dependent logic from the frontend layer** — no tokens, no API calls, no "connect Shopify" UI; the browser only ever submits a store URL and reads sync status. Candidates for removal/refactor: `actions/shopify.ts`, `app/api/shopify/publish/route.ts`, `lib/integrations/shopify-client.ts` (UI-facing usage), `trigger/sync-shopify-products.ts` (API-based sync), `app/api/auth/etsy/*` (blocked OAuth), Shopify/Etsy steps in `components/onboarding/*` and `app/(protected)/integrations/page.tsx`.
- **B5. Repositioning** — "AI Pinterest automation for **any** e-commerce store" (kills single-platform policy risk and expands TAM).
- **B6. Guiding principle** — we don't "support platforms"; we support **public product discovery**. Extractors are an optimization, not a dependency.

### Pillar C — Strategic Pin Generation (Idea Engine)

- **C1. Pipeline rewrite** — from `Product → Pin` to:
  `Product → Product Understanding → Trend/Keyword Engine → Idea Generator → Content Calendar → Image Generation → Intent-based SEO Title & Description → Autonomous Publishing → Performance Feedback`.
- **C2. Keyword taxonomy per product**, three tiers:
  - *Product-centric*: "handmade leather wallet", "RFID wallet" (always safe).
  - *Use-case*: "everyday carry essentials", "travel wallet for men" (context, single product OK).
  - *Occasion*: "Father's Day gift for dad", "anniversary gift for him" (singular intent only).
- **C3. Intent-suitability guardrail** — for each candidate keyword the system answers: *"Can this exact product legitimately satisfy this search intent?"* Broad plural/listicle intents ("Top 20 Father's Day gifts", "Living room ideas") are rejected for single-product catalogs to avoid click–landing-page mismatch that depresses Pinterest satisfaction signals (saves, clicks, close-ups, outbound clicks).
- **C4. Multi-variant generation** — ≥5 search-intent variants per product: same product, different intent, different scene, different SEO angle (e.g. wallet → gift-for-dad / EDC upgrade / minimalist professional / anniversary gift / travel).
- **C5. Pinterest trend & keyword engine** — track seasonal/rising topics (Back to School, dorm room ideas, wedding season) and map them onto the merchant's catalog.
- **C6. Idea Generator** — outputs "ideas" (scene + intent + keyword cluster), not images.
- **C7. Autonomous content calendar** — decides which product to pin today, how often, how many lifestyle variations, when to repin, and which seasonal themes to apply. This is the "AI Pinterest marketer" moat, not image generation.
- **C8. Campaigns** — auto-generated seasonal campaigns (Valentine's, Mother's Day, Father's Day, Wedding Season, Back to School) that reuse the same products under different search intents.
- **C9. Performance feedback loop** — ingest pin analytics (impressions, saves, outbound clicks) and learn which idea archetypes perform best per store; feed back into the calendar.
- **C10. Copy generation change** — pin title/description target the *intent* with the product naturally embedded, never a raw product-name dump.
- **C11. Keep existing strengths** — human-like publishing behavior/warmup (`trigger/account-warmup.ts`), weekly approval inbox, auto-publish.

### Positioning & Messaging (go-to-market)

- **P1.** Landing page sells the business outcome ("Get more Pinterest traffic with zero weekly work"), not "AI lifestyle images" — merchants already have photos; they're buying traffic and time.
- **P2.** Target the operational pain: "I have 500–2,000 SKUs and no time to market each one" — autonomy is the value, imagery is the means.

---

## 3. Phased Implementation

### Phase 0 — Decoupling & Data Foundation
**Goal:** remove launch blockers (Shopify/Etsy API dependence) and prepare the schema.

**Deliverables**
- Delete/disable frontend Shopify API paths (`actions/shopify.ts`, `app/api/shopify/*`, Etsy OAuth routes, related onboarding/integrations UI).
- New Supabase migration: `stores(platform, canonical_url, last_synced_at, sync_status)`, `products` extended with `platform_product_id, sku, product_url, content_hash, last_seen_at, status`.
- Onboarding replaced with a single "Enter your store URL" step; CSV upload and manual entry remain visible as fallbacks.

**Success metrics**
- 0 Shopify/Etsy API calls originating from client or server code (grep-verified in CI).
- Onboarding (URL → import started) completes in < 60s for the user.

**Exit criteria:** a new user can onboard with URL + CSV only; no dead settings/integrations screens.

---

### Phase 1 — Catalog Sync Engine MVP
**Goal:** reliable URL-based import for Shopify-class stores (A1–A4, A7–A10).

**Deliverables**
- `lib/catalog/` sync engine with the fallback chain: platform sniff (B1) → `/products.json` (A2) → sitemap parse (A4) → JSON-LD scrape of top product/collection pages (A3) → CSV/manual (A7/A8).
- Normalized product persistence (A10); import status surfaced on `app/(protected)/products/page.tsx`.
- Trigger.dev job replacing `trigger/sync-shopify-products.ts` with crawl-based sync; polite crawling (robots.txt respect, rate limiting, identifiable user agent).

**Success metrics**
- ≥ 80% of Shopify test stores import ≥ 95% of their public catalog via URL alone.
- Median time-to-full-catalog < 3 min for stores ≤ 500 products.
- Catalog field completeness: title + ≥1 image + URL present for ≥ 98% of imported products.

**Exit criteria:** 20 real beta stores across niches imported without manual intervention.

---

### Phase 2 — Identity, Dedupe & Incremental Sync
**Goal:** automation-safe sync that never duplicates and never wastes generation credits (A11–A16).

**Deliverables**
- Dedupe matcher implementing the priority chain (A14) with a uniqueness constraint on `(store_id, coalesce(platform_product_id, product_url))` plus hash comparison.
- Lifecycle state machine (A15); products missing for 3 consecutive syncs → `unavailable`; pin queue auto-pauses them (out-of-stock protection).
- Re-sync scheduler every 12–24h (A11) with sitemap-diff short-circuit (A16).
- Change-detection gate: only `new`/`updated` products enqueue image generation (A12).

**Success metrics**
- Duplicate rate < 0.5% across repeated syncs of the same store (precision ≥ 99.5%).
- 100% of renames/price changes reflected within 24h; 0 pins published for `unavailable` products.
- ≥ 80% reduction in pages fetched per daily sync when the catalog is unchanged.
- Image-generation spend only on new/changed products (0 regenerations for unchanged hashes).

**Exit criteria:** 7-day soak test on 10 stores with daily syncs produces zero duplicates and correct lifecycle transitions.

---

### Phase 3 — Multi-Platform Extractors
**Goal:** prove "any store" positioning (B2, B3, B5).

**Deliverables**
- Extractor modules: WooCommerce, Squarespace, Wix, BigCommerce, plus the generic crawler (B3) as the catch-all.
- Per-platform fixtures/test suite (golden HTML/JSON snapshots).
- Marketing surface updated to platform-agnostic messaging (P1, P2, B5).

**Success metrics**
- URL-only import success: WooCommerce ≥ 85%, BigCommerce/Squarespace ≥ 75%, Wix ≥ 60%, generic fallback recovers ≥ 50% of otherwise-failed stores.
- CSV fallback used by < 25% of new signups after week 2.

**Exit criteria:** onboarding works end-to-end for at least one real store per supported platform.

---

### Phase 4 — Idea Engine (Pin Generation Rewrite)
**Goal:** replace product dumps with intent-driven pins (C1–C4, C10).

**Deliverables**
- `lib/ideas/` module: product understanding → keyword taxonomy tiers (C2) → intent-suitability filter (C3) → idea objects `{intent, keyword_cluster, scene_brief, copy_angle}`.
- `app/api/generate-pin/route.ts` + `trigger/generate-pin-batch.ts` consume ideas; each product yields ≥ 5 intent variants (C4), each with its own scene and SEO title/description (C10).
- Weekly approval inbox groups pins by intent/campaign so merchants see strategy, not a pile of images.

**Success metrics**
- 100% of newly generated pins use intent-based copy (0 raw product-name titles).
- ≥ 5 approved-ready variants per product at generation time.
- Merchant approval rate (approved without edits) ≥ 70% in beta.
- Early Pinterest signal: intent pins outperform legacy product-dump pins on outbound CTR in A/B backfill.

**Exit criteria:** beta merchants can articulate the strategy ("this pin targets X intent") from the inbox alone.

---

### Phase 5 — Strategy Layer (Calendar, Campaigns, Feedback)
**Goal:** the autonomy moat (C5–C9).

**Deliverables**
- Trend/keyword engine (C5) with a seasonal calendar seeded for the next 12 months.
- Content calendar scheduler (C7): product rotation, repin cadence, per-product pin caps, theme assignment.
- Campaign generator (C8): auto-created seasonal campaigns per store.
- Analytics ingestion from Pinterest (C9) → idea-archetype performance table → calendar weighting updates.

**Success metrics**
- ≥ 30% of published pins originate from calendar/campaign decisions (not raw catalog order) by week 4.
- Month-over-month uplift per connected account: impressions +25%, outbound clicks +15% (directional, cohort-based).
- Feedback loop demonstrably shifts mix: top-performing idea archetype receives increasing share of scheduled pins across consecutive weeks.

**Exit criteria:** one documented beta case study showing traffic growth attributable to campaign pins.

---

### Phase 6 — Launch Hardening & Repositioning
**Goal:** public release readiness.

**Deliverables**
- Landing page rewrite around outcomes (P1/P2) and "works with any store" (B5); pricing unchanged ($99/mo, 100 pins) but copy references ideas/campaigns, not just images.
- Observability: per-store sync health dashboard, crawl failure alerts, generation-failure alerts.
- Legal/ops: crawl ToS review, robots.txt compliance audit, rate-limit ceilings, abuse safeguards.

**Success metrics**
- Landing → signup conversion ≥ baseline; signup → first-published-pin activation ≥ 60% within 48h.
- Sync success rate ≥ 90% across all live stores in the final pre-launch week.

---

## 4. Master Metrics Summary

| Area | Metric | Target |
|---|---|---|
| Import | URL-only catalog import success | ≥ 80% Shopify / ≥ 60% all platforms |
| Import | Time-to-catalog (≤500 products) | < 3 min |
| Dedupe | Duplicate product rate | < 0.5% |
| Sync | Change propagation latency | ≤ 24h |
| Sync | Crawl reduction via sitemap diff | ≥ 80% |
| Safety | Pins for unavailable products | 0 |
| Content | Intent-based pin copy share | 100% of new pins |
| Content | Variants per product | ≥ 5 |
| Content | Approval-without-edit rate | ≥ 70% |
| Strategy | Calendar/campaign-sourced pins | ≥ 30% by week 4 |
| Growth | Impressions uplift (MoM, cohort) | +25% |
| Growth | Outbound click uplift (MoM, cohort) | +15% |
| Activation | Signup → first pin published (48h) | ≥ 60% |

---

## 5. Launch Checklist

**Catalog & Sync**
- [ ] Store-URL onboarding live; Shopify/Etsy API code fully removed from frontend (CI grep gate passes)
- [ ] Fallback chain verified: products.json → JSON-LD → sitemap → feed → CSV → manual
- [ ] Dedupe chain (ID → URL → SKU → hash) covered by tests; uniqueness constraint in production DB
- [ ] 12–24h re-sync scheduler running; lifecycle states pausing pins for unavailable products
- [ ] Sitemap-diff optimization enabled; robots.txt + rate limiting enforced
- [ ] WooCommerce, Squarespace, Wix, BigCommerce + generic extractors pass fixture suites

**Pin Generation & Strategy**
- [ ] Idea Engine generating ≥ 5 intent variants per product; intent-suitability filter blocking misleading plural keywords
- [ ] Pin copy is intent-first everywhere (no product-name dumps in queue)
- [ ] Content calendar + at least 3 seasonal campaign templates active
- [ ] Weekly approval inbox groups by intent/campaign
- [ ] Pinterest analytics ingestion feeding calendar weights
- [ ] Human-like publishing cadence + account warmup intact

**Product & GTM**
- [ ] Landing page repositioned to outcomes + "any e-commerce store"; pricing page copy updated
- [ ] Integrations/settings screens show only supported connection methods (URL, CSV, manual)
- [ ] Error states for unreachable/blocked stores with clear CSV fallback CTA
- [ ] Sync-health monitoring + alerting live
- [ ] Legal review of crawling/ToS completed
- [ ] Beta cohort: ≥ 20 stores onboarded, ≥ 1 traffic case study published
- [ ] Docs updated (`docs/`, `pinterest.md`) to reflect crawl-based sync and Idea Engine

---

## 6. Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Stores block crawlers / heavy JS (Wix) | Generic crawler + JSON-LD + RSS; graceful degradation to CSV with a smooth UX |
| Intent mismatch hurts Pinterest distribution | Intent-suitability filter (C3); plural/listicle keywords only when catalog supports collections |
| Crawl cost at scale | Sitemap diffing (A16), ETag caching, 12–24h cadence caps |
| Platform ToS changes | Positioning is "public product discovery", not platform partnership; extractor layer is pluggable |
| "I already have photos" objection | Outcome-led messaging (P1/P2); sell autonomy and traffic, not imagery |