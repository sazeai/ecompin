# FIXTHIS Phased Implementation Plan

## Summary

FIXTHIS is not a lead marketplace or recommendation directory. Its core object is a public problem with four measurable properties:

- **Demand:** unique people who say “I have this too.”
- **Attention:** legitimate solution impressions and outbound clicks.
- **Competition:** products bidding to appear against the problem.
- **Economics:** the current bid needed to become the leading solution.

Founders buy contextual advertising exposure, not customers, endorsements, exclusivity, or guaranteed conversions. Every problem card shows exactly one clearly labeled **Featured solution**. No counters, bids, or demand will be fabricated.

The implementation will reuse the current visual system, Next.js foundation, Supabase access, Dodo webhook pattern, Resend integration, and admin authentication. The retired Ecompin/STEAL product code will be removed rather than migrated.

## Phase 0 — Clean FIXTHIS Foundation

- Rename all public identity, metadata, legal copy, cookies, emails, analytics labels, and environment documentation to FIXTHIS; keep the final domain configurable through `NEXT_PUBLIC_APP_URL`.
- Remove retired product routes, components, jobs, types, dependencies, and old marketplace migrations after extracting reusable infrastructure.
- Use a fresh Supabase project with a clean FIXTHIS migration history; do not touch or migrate the old SaaS database.
- Replace the broad authentication proxy with a minimal public-marketplace layer that sets a secure anonymous visitor cookie and protects only admin/management surfaces.
- Remove wildcard credentialed CORS and `typescript.ignoreBuildErrors`; restore strict type-checking and a clean production build.
- Organize the new code by bounded modules: problems, demand, placements, bidding, traffic, moderation, payments, and shared UI.

**Exit gate:** FIXTHIS-branded shell renders, retired routes are gone, fresh schema applies from zero, and typecheck/build pass without ignored errors.

## Phase 1 — Useful Marketplace Before Network Activity

### Data and public experience

- Create `problems`, `problem_sources`, and category/status fields supporting `curated`, `user`, and `founder` origins.
- Seed all 30 researched problems and their cleaned provenance URLs. Mark the strongest 16 with launch priority rather than inventing engagement.
- Curated problems begin with zero supporters and display **Curated by FIXTHIS** plus expandable source links.
- Build:
  - Homepage sections for **Trending problems**, **Being fought over**, **New pains**, and **Unclaimed**.
  - Search and category filtering.
  - Indexable `/problems/[slug]` pages with demand, complaints, traffic, competition, provenance, and share metadata.
  - Honest empty states such as “No solution has claimed this yet.”
- Use **Featured solution**, **Currently claiming this problem**, and **Paid placement** language. Never use “best” or “recommended.”
- Product links use `rel="sponsored nofollow noopener"`.

### Initial ordering

- With little activity, homepage ordering falls back to the manually assigned launch priority.
- Once activity exists, trending score is recalculated from rolling signals:
  - `5 × unique supports in 24h`
  - `1 × unique outbound clicks in 24h`
  - `10 × settled bid events in 24h`
  - a small freshness bonus that reaches zero after 24 hours
- Cache public problem ordering for two minutes; do not expose the formula in the UI.

**Exit gate:** the site is valuable and credible with no users and no advertisers, all 30 problems are reachable, and the homepage prominently presents the selected 16.

## Phase 2 — Accountless Demand and Problem Supply

### Anonymous identity and support

- Set a secure, HTTP-only, same-site anonymous visitor token. Store only an HMAC-derived visitor key in analytics tables.
- `POST /api/problems/[id]/support` is idempotent: one lifetime support per anonymous visitor and problem.
- A normal user-created problem atomically creates its first support. Curated and founder-created problems begin at zero.
- After supporting, offer one optional moderated sentence answering what specifically is painful. This is not a comment thread and has no replies or public identity.
- Allow optional double-opt-in email subscription after posting/supporting so a user can be notified when a solution first claims the problem.

### Problem creation and screening

- `POST /api/problems` accepts a buyer-perspective statement of 20–280 characters with no signup.
- Apply server-side schema validation, honeypot, Upstash rate limits, managed Turnstile, bot detection, link/contact-detail rejection, normalized exact matching, and `pg_trgm` near-duplicate detection.
- Safe submissions publish immediately. Suspicious/promotional submissions enter moderation instead of becoming public.
- Near-duplicates return the canonical existing problem so the visitor can support it rather than fragmenting demand.
- Founder “add and claim” creates the problem with zero supporters and routes directly into the claim flow.

### Moderation

- Expand admin tools to approve, hide, edit, feature, categorize, and canonicalize problems; moderate complaint details; inspect abuse signals; and preserve an audit trail.
- Public APIs never expose emails, raw visitor tokens, IP addresses, payment identifiers, or moderation metadata.

**Exit gate:** duplicate votes do not inflate demand, safe problems publish accountlessly, abusive submissions are contained, and optional complaint/email flows work without creating accounts.

## Phase 3 — Attention Delivery and Trustworthy Analytics

### Exact weighted rotation

- Create `products`, `placements`, `rotation_epochs`, `visitor_assignments`, `placement_impressions`, and `placement_clicks`.
- Only the top five paid/founding placements are eligible for exposure:
  - One product: `100%`
  - Two products: `70% / 30%`
  - Three or more: `60% / 25% / remaining 15% shared across positions 3–5`
- Allocate integer shares with the largest-remainder method; rotate spare slots between lower positions across epochs.
- Each epoch stores a shuffled 100-slot bucket. A transactional Supabase RPC locks the epoch cursor, assigns the next slot, records the impression, and prevents concurrent requests from consuming the same slot.
- A visitor keeps the same solution for that problem for 30 minutes. Refreshing or opening more tabs does not create another impression.
- A ranking change creates a new epoch for future visitors; existing assignments remain stable until their 30-minute window ends unless the placement is suspended.
- Resolve featured solutions when a card actually enters the viewport, using `IntersectionObserver`, so below-the-fold cards do not generate impressions.

### Presence, visitors, and clicks

- Visible tabs send presence heartbeats every 20 seconds; hidden tabs stop. **Live** means last seen within 45 seconds.
- Update a visitor’s general `last_seen_at` no more than once every five minutes; count unique visitors whose last activity is within 24 hours.
- Hide the live counter below five visitors; show the real 24-hour count from visitor one.
- Outbound anchors send a beacon on an explicit user click and then navigate normally. The API counts only clicks tied to a recent valid assignment.
- Count one click per visitor and placement in a rolling 24-hour window.
- Publicly expose lifetime clicks/impressions plus current visibility share; founder management also shows 24-hour metrics and CTR.
- Ignore known crawler/link-preview user agents and reject abnormal IP/device velocity. Use rotating HMAC IP signals only for abuse detection.
- Retain anonymous raw impression/click records for 90 days, permanent daily aggregates for historical counters, and presence rows for at most 24 hours.

### Founding inventory

- Admin may create 5–10 genuine **Founding claim** placements for launch partners.
- Founding claims are labeled as such, carry a `$0` promotional bid, and are displaced by any settled `$5+` bid.
- Use these claims to validate exposure and analytics before enabling payments.

**Exit gate:** every problem card shows at most one solution, a 100-impression test matches the exact intended allocation, refreshes do not inflate counts, and all public counters are derived from real events.

## Phase 4 — Paid Bidding and Founder Management

### Bid rules

- First paid claim is `$5`; every later bid must be at least the highest settled or actively held bid plus `$5`.
- Every bid charges its full entered amount as a separate, non-refundable one-time advertising purchase. Previous spend is not credited.
- Products are normalized by registrable destination domain. A returning domain updates its existing placement while retaining append-only bid history.
- Unlimited products may bid, but only the top five settled placements rotate. Lower placements remain visible in the battlefield and can rebid.
- Rank by current valid bid amount, then settlement time for deterministic ties.

### Concurrent checkout

- Under a database lock, create a 15-minute `bid_quote` that temporarily raises the next-bid floor.
- Create a Dodo one-time Pay-What-You-Want checkout using the exact server-calculated amount in cents and a 15-minute confirmed session. Dodo currently supports programmatic dynamic amounts for one-time products. [Dodo dynamic-pricing documentation](https://docs.dodopayments.com/developer-resources/dynamic-pricing-checkout)
- Abandoned quotes expire automatically. A paid bid is activated only by a signed, idempotent `payment.succeeded` webhook that verifies quote, product, currency, amount, checkout session, and payment ID.
- Settlement atomically records the bid, updates the placement, recalculates the top five, and starts a new rotation epoch.
- The success page reports webhook-backed state—processing, settled position, or failure—and never publishes from the redirect alone.

### Reversals and disputes

- Handle `refund.succeeded` and dispute lifecycle webhooks in the same idempotent event ledger. Dodo exposes payment, refund, and dispute events for this reconciliation. [Dodo webhook event guide](https://docs.dodopayments.com/developer-resources/webhooks/intents/webhook-events-guide)
- An opened dispute suspends the affected bid. A won/cancelled dispute restores it; a refund, accepted dispute, or lost dispute revokes it.
- After revocation, recompute that product’s placement from its highest remaining valid bid, recalculate rankings, and generate a new rotation epoch.

### Battlefield and management

- The battlefield modal/page shows rank, bid, current visibility, impressions, clicks, CTR, and top-five eligibility.
- The bid CTA clearly states the expected rank/share and that another higher settled bid can later reduce exposure.
- Checkout email receives a secure magic management link. The management session can:
  - Edit product name, tagline, and destination URL after safety validation.
  - View private 24-hour/lifetime performance.
  - Rebid using a fresh quote.
  - Request a replacement management link without revealing whether an email exists.
- Product/detail edits do not alter payment or bid history.

**Exit gate:** concurrent quotes cannot sell the same minimum, only verified payments change rankings, refunds/disputes remove exposure correctly, and founders can manage placements without accounts.

## Phase 5 — Launch Hardening and Market Operations

- Finalize mobile, keyboard, screen-reader, loading, error, and reduced-motion behavior.
- Add structured metadata, canonical problem URLs, sitemap entries, social cards, and sponsored-link disclosure.
- Rewrite privacy, terms, refund, acceptable-content, and advertising-disclosure pages around anonymous analytics, moderation, full bid payments, and non-guaranteed exposure.
- Add structured operational logs and alerts for failed webhooks, stuck quotes, rotation RPC failures, traffic anomalies, email delivery failures, and counters falling out of sync.
- Provide admin tools for placement suspension, founder-link revocation, founding claims, refunds, bid/event inspection, daily metrics, problem ranking overrides, and aggregate reconciliation.
- Run a controlled launch with the 30 curated problems, 5–10 founding partners, and several real pre-launch user problems; remove all demo/fake marketplace records.
- Enable public payment CTAs only after test-mode and one live low-value Dodo transaction complete the entire settlement, email, impression, click, refund, and re-ranking flow.

**Exit gate:** production has real inventory and claims, no fabricated activity, verified payment/reversal handling, operational alerts, legal disclosure, and a repeatable launch checklist.

## Public Interfaces and Core Types

- Public APIs:
  - Problem list/detail and public aggregate stats.
  - Create problem, support problem, add optional complaint, and subscribe for updates.
  - Presence heartbeat, featured-solution assignment, and explicit outbound click.
  - Bid quote/checkout and signed Dodo webhook.
  - Founder magic-link request and authenticated placement management.
- Shared types:
  - `ProblemSummary`, `ProblemDetail`, `ProblemSource`, `ProblemSupport`
  - `FeaturedPlacement`, `BattlefieldEntry`, `RotationShare`
  - `BidQuote`, `Bid`, `PaymentState`
  - `PublicTrafficStats`, `FounderPlacementStats`
- All state-changing financial, rotation, support, and click operations use transactional database functions or constrained idempotent writes; the browser never decides price, rank, visibility, or public counts.

## Test Plan

- Unit-test validation, buyer-perspective screening, slug/domain normalization, duplicate detection, trending score, bid minimums, top-five ranking, and every rotation allocation.
- Database integration-test duplicate supports, initial user support, 30-minute assignment stickiness, 24-hour click deduplication, concurrent 100-slot consumption, quote expiration, simultaneous checkouts, webhook idempotency, rebids, and refund/dispute fallback.
- API security-test forged amounts, webhook signatures, replayed events, malicious URLs, SSRF/private-network destinations, rate limits, bot user agents, management-token enumeration, and PII leakage.
- End-to-end test curated browsing, accountless posting/supporting, optional complaint/email confirmation, founder add-and-claim, Dodo cancel/success, battlefield changes, magic-link management, tracked outbound clicks, and mobile behavior.
- Load-test concurrent impression assignment, heartbeat upserts, public-stat polling, and 100+ simultaneous bid quote attempts.
- Release verification requires strict typecheck, production build, focused lint after substantive changes, migration-from-empty, accessibility smoke tests, and test-mode plus live Dodo webhook reconciliation.

## Assumptions and Locked Defaults

- Brand is **FIXTHIS**; the final domain remains environment-configured.
- The old product and its data are disposable; FIXTHIS uses a fresh Supabase project.
- Public users do not create accounts.
- Safe submissions publish after automated screening; suspicious content waits for moderation.
- Support is a one-way idempotent signal, not a financially redeemable lead.
- Optional complaint details are one sentence, moderated, and non-threaded.
- Founder management uses email magic links rather than accounts.
- Bids are full one-time payments; no wallet, incremental credit, subscription, or guaranteed results.
- Five products receive rotation; additional products remain in the battlefield and may rebid.
- USD is the MVP bidding currency.
- Public counters remain hidden or zero when there is no activity; they are never seeded or simulated.
