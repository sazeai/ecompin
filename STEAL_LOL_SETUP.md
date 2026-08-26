# STEAL.LOL launch setup

The application code is complete, but production needs the marketplace database and provider settings below.

## 1. Supabase

Apply `supabase/migrations/20260827000000_steal_marketplace.sql` to the production Supabase project. It creates the three marketplace tables, indexes, locked-down RLS configuration, and five visibly labeled demo opportunities.

Required environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

All marketplace writes and private-field reads run on the server. Never expose the service-role key to the browser.

## 2. Dodo Payments

Create a product named `STEAL.LOL competitor offer` with a one-time price of exactly `$9 USD`. Put its product ID in:

```text
DODO_PAYMENTS_API_KEY=
DODO_PAYMENTS_WEBHOOK_SECRET=
DODO_ENVIRONMENT=test_mode
DODO_OFFER_PRODUCT_ID=
```

Configure the Dodo webhook URL as:

```text
https://your-domain.com/api/dodopayments/webhook
```

Subscribe it to `payment.succeeded`. The return page never publishes an offer; only the signed, idempotent webhook does that.

## 3. Email and app URL

Configure a Resend sender on a verified domain:

```text
NEXT_PUBLIC_APP_URL=https://your-domain.com
RESEND_API_KEY=
EMAIL_FROM=STEAL.LOL <offers@your-domain.com>
EMAIL_REPLY_TO=support@your-domain.com
```

## 4. Admin

Set one long password for the small moderation screen at `/admin`:

```text
STEAL_ADMIN_PASSWORD=
```

## 5. Pre-launch check

Run one real $9 transaction and verify that the offer becomes public only after the webhook arrives, the listing customer receives the notification email, and the provider link opens in a new tab.
