-- STEAL.LOL one-time offer marketplace.
-- All public access goes through validated Next.js route handlers using the service role.

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  leaving_product text not null check (char_length(leaving_product) between 1 and 80),
  monthly_spend integer not null check (monthly_spend > 0),
  reason text not null check (char_length(reason) between 3 and 280),
  customer_email text not null check (char_length(customer_email) <= 254),
  status text not null default 'active' check (status in ('active', 'hidden')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  product_name text not null check (char_length(product_name) between 1 and 80),
  product_url text not null check (char_length(product_url) <= 2048),
  offer_text text not null check (char_length(offer_text) between 3 and 280),
  provider_email text not null check (char_length(provider_email) <= 254),
  payment_status text not null default 'pending_payment' check (payment_status in ('pending_payment', 'paid', 'refunded')),
  dodopayments_session_id text unique,
  is_hidden boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.dodopayments_events (
  dodopayments_event_id text primary key,
  processed_at timestamptz not null default now()
);

create index if not exists opportunities_created_at_idx on public.opportunities (created_at desc);
create index if not exists opportunities_status_demo_created_idx on public.opportunities (status, is_demo, created_at desc);
create index if not exists offers_opportunity_id_idx on public.offers (opportunity_id);
create index if not exists offers_payment_status_idx on public.offers (payment_status);
create index if not exists offers_publication_idx on public.offers (opportunity_id, payment_status, is_hidden, published_at desc);

alter table public.opportunities enable row level security;
alter table public.offers enable row level security;
alter table public.dodopayments_events enable row level security;

-- Honest cold-start data. Demo rows are labeled in every public view and cannot accept paid offers.
insert into public.opportunities (slug, leaving_product, monthly_spend, reason, customer_email, is_demo, created_at)
values
  ('leaving-hubspot-demo', 'HubSpot', 299, 'Way too complicated for our team.', 'demo@steal.lol', true, now() - interval '18 minutes'),
  ('leaving-intercom-demo', 'Intercom', 149, 'Too expensive for what we are getting.', 'demo@steal.lol', true, now() - interval '47 minutes'),
  ('leaving-semrush-demo', 'Semrush', 139, 'We only use a fraction of the features.', 'demo@steal.lol', true, now() - interval '2 hours'),
  ('leaving-zendesk-demo', 'Zendesk', 115, 'Setup and support have become too slow.', 'demo@steal.lol', true, now() - interval '4 hours'),
  ('leaving-notion-demo', 'Notion', 20, 'We need something simpler and faster.', 'demo@steal.lol', true, now() - interval '8 hours')
on conflict (slug) do nothing;
