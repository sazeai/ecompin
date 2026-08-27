-- FIXTHIS clean marketplace schema.
-- Apply this migration to a fresh Supabase project. Public application access
-- goes through validated Next.js route handlers using the service role.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table public.problems (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  statement text not null check (char_length(statement) between 20 and 280),
  normalized_statement text unique not null,
  category text not null check (char_length(category) between 2 and 40),
  origin text not null check (origin in ('curated', 'user', 'founder')),
  status text not null default 'published' check (status in ('published', 'pending', 'hidden')),
  launch_priority integer check (launch_priority between 1 and 100),
  support_count integer not null default 0 check (support_count >= 0),
  impression_count bigint not null default 0 check (impression_count >= 0),
  click_count bigint not null default 0 check (click_count >= 0),
  last_support_at timestamptz,
  last_bid_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index problems_status_priority_idx on public.problems (status, launch_priority nulls last, published_at desc);
create index problems_category_idx on public.problems (category, status);
create index problems_normalized_trgm_idx on public.problems using gin (normalized_statement gin_trgm_ops);

create table public.problem_sources (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  source_url text not null check (char_length(source_url) <= 2048),
  source_label text not null default 'Public user discussion' check (char_length(source_label) <= 100),
  created_at timestamptz not null default now(),
  unique (problem_id, source_url)
);

create table public.problem_supports (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  visitor_key text not null check (char_length(visitor_key) = 64),
  detail text check (detail is null or char_length(detail) between 3 and 280),
  detail_status text not null default 'none' check (detail_status in ('none', 'published', 'pending', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (problem_id, visitor_key)
);

create index problem_supports_problem_created_idx on public.problem_supports (problem_id, created_at desc);
create index problem_supports_public_details_idx on public.problem_supports (problem_id, detail_status, created_at desc) where detail is not null;

create table public.problem_subscriptions (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  email text not null check (char_length(email) <= 254),
  verification_token_hash text unique not null check (char_length(verification_token_hash) = 64),
  verified_at timestamptz,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (problem_id, email)
);

create table public.visitors (
  visitor_key text primary key check (char_length(visitor_key) = 64),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index visitors_last_seen_idx on public.visitors (last_seen_at desc);

create table public.visitor_presence (
  visitor_key text primary key check (char_length(visitor_key) = 64),
  last_seen_at timestamptz not null default now()
);

create index visitor_presence_last_seen_idx on public.visitor_presence (last_seen_at desc);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  registrable_domain text unique not null check (char_length(registrable_domain) between 3 and 255),
  name text not null check (char_length(name) between 1 and 80),
  tagline text not null check (char_length(tagline) between 3 and 180),
  destination_url text not null check (char_length(destination_url) <= 2048),
  owner_email text not null check (char_length(owner_email) <= 254),
  status text not null default 'active' check (status in ('active', 'suspended', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.placements (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  current_bid_cents integer not null default 0 check (current_bid_cents >= 0),
  status text not null default 'active' check (status in ('active', 'suspended', 'hidden')),
  founding_claim boolean not null default false,
  settled_at timestamptz not null default now(),
  impression_count bigint not null default 0 check (impression_count >= 0),
  click_count bigint not null default 0 check (click_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (problem_id, product_id)
);

create index placements_problem_rank_idx on public.placements (problem_id, status, current_bid_cents desc, settled_at asc);

create table public.bid_quotes (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  registrable_domain text not null check (char_length(registrable_domain) between 3 and 255),
  product_name text not null check (char_length(product_name) between 1 and 80),
  product_tagline text not null check (char_length(product_tagline) between 3 and 180),
  destination_url text not null check (char_length(destination_url) <= 2048),
  owner_email text not null check (char_length(owner_email) <= 254),
  amount_cents integer not null check (amount_cents >= 500),
  currency text not null default 'USD' check (currency = 'USD'),
  status text not null default 'held' check (status in ('held', 'checkout_created', 'settled', 'expired', 'cancelled')),
  checkout_session_id text unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index bid_quotes_active_idx on public.bid_quotes (problem_id, expires_at desc) where status in ('held', 'checkout_created');

create table public.bids (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid unique not null references public.bid_quotes(id) on delete restrict,
  placement_id uuid not null references public.placements(id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 500),
  currency text not null default 'USD' check (currency = 'USD'),
  status text not null default 'settled' check (status in ('settled', 'suspended', 'revoked')),
  payment_id text unique not null,
  checkout_session_id text unique not null,
  settled_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index bids_placement_state_idx on public.bids (placement_id, status, amount_cents desc, settled_at asc);
create index bids_settled_at_idx on public.bids (settled_at desc);

create table public.rotation_epochs (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  version integer not null check (version > 0),
  slots uuid[] not null check (coalesce(array_length(slots, 1), 0) = 100),
  cursor integer not null default 0 check (cursor between 0 and 99),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (problem_id, version)
);

create unique index rotation_epochs_one_active_idx on public.rotation_epochs (problem_id) where active;

create table public.visitor_assignments (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  placement_id uuid not null references public.placements(id) on delete cascade,
  epoch_id uuid not null references public.rotation_epochs(id) on delete cascade,
  visitor_key text not null check (char_length(visitor_key) = 64),
  assigned_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index visitor_assignments_sticky_idx on public.visitor_assignments (problem_id, visitor_key, expires_at desc);

create table public.placement_impressions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid unique not null references public.visitor_assignments(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  placement_id uuid not null references public.placements(id) on delete cascade,
  visitor_key text not null check (char_length(visitor_key) = 64),
  created_at timestamptz not null default now()
);

create index placement_impressions_placement_created_idx on public.placement_impressions (placement_id, created_at desc);

create table public.placement_clicks (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  placement_id uuid not null references public.placements(id) on delete cascade,
  visitor_key text not null check (char_length(visitor_key) = 64),
  created_at timestamptz not null default now()
);

create index placement_clicks_dedupe_idx on public.placement_clicks (placement_id, visitor_key, created_at desc);

create table public.daily_traffic (
  traffic_date date not null,
  problem_id uuid not null references public.problems(id) on delete cascade,
  placement_id uuid not null references public.placements(id) on delete cascade,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  primary key (traffic_date, placement_id)
);

create table public.payment_webhook_events (
  provider_event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

create table public.moderation_audit (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('problem', 'support_detail', 'product', 'placement', 'bid')),
  entity_id uuid not null,
  action text not null,
  reason text,
  actor text not null default 'admin',
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger problems_touch before update on public.problems for each row execute function public.touch_updated_at();
create trigger supports_touch before update on public.problem_supports for each row execute function public.touch_updated_at();
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
create trigger placements_touch before update on public.placements for each row execute function public.touch_updated_at();

create or replace function public.support_problem(
  p_problem_id uuid,
  p_visitor_key text,
  p_detail text default null,
  p_detail_status text default 'none'
)
returns table(inserted boolean, support_count integer)
language plpgsql security definer set search_path = public as $$
declare
  v_inserted boolean := false;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_problem_id::text || ':' || p_visitor_key, 0));

  insert into public.problem_supports(problem_id, visitor_key, detail, detail_status)
  values (p_problem_id, p_visitor_key, p_detail, p_detail_status)
  on conflict (problem_id, visitor_key) do nothing;
  v_inserted := found;

  if v_inserted then
    update public.problems
      set support_count = support_count + 1, last_support_at = now()
      where id = p_problem_id and status = 'published';
  elsif p_detail is not null then
    update public.problem_supports
      set detail = coalesce(detail, p_detail),
          detail_status = case when detail is null then p_detail_status else detail_status end
      where problem_id = p_problem_id and visitor_key = p_visitor_key;
  end if;

  return query select v_inserted, p.support_count from public.problems p where p.id = p_problem_id;
end;
$$;

create or replace function public.rebuild_rotation(p_problem_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_ids uuid[];
  v_weights integer[] := array[]::integer[];
  v_slots uuid[];
  v_count integer;
  v_version integer;
  v_base integer;
  v_remainder integer;
  v_i integer;
  v_weight integer;
  v_epoch_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('rotation:' || p_problem_id::text, 0));

  select array_agg(id order by current_bid_cents desc, settled_at asc, id asc)
    into v_ids
  from (
    select id, current_bid_cents, settled_at
    from public.placements
    where problem_id = p_problem_id and status = 'active'
    order by current_bid_cents desc, settled_at asc, id asc
    limit 5
  ) ranked;

  v_count := coalesce(array_length(v_ids, 1), 0);
  update public.rotation_epochs set active = false where problem_id = p_problem_id and active;
  if v_count = 0 then return null; end if;

  select coalesce(max(version), 0) + 1 into v_version from public.rotation_epochs where problem_id = p_problem_id;

  if v_count = 1 then
    v_weights := array[100];
  elsif v_count = 2 then
    v_weights := array[70, 30];
  else
    v_weights := array[60, 25];
    v_base := 15 / (v_count - 2);
    v_remainder := 15 % (v_count - 2);
    for v_i in 3..v_count loop
      v_weight := v_base;
      if mod((v_i - 3) + (v_version - 1), v_count - 2) < v_remainder then
        v_weight := v_weight + 1;
      end if;
      v_weights := array_append(v_weights, v_weight);
    end loop;
  end if;

  select array_agg(slot order by random()) into v_slots
  from (
    select v_ids[i] as slot
    from generate_subscripts(v_ids, 1) i
    cross join lateral generate_series(1, v_weights[i]) copies
  ) expanded;

  insert into public.rotation_epochs(problem_id, version, slots)
  values (p_problem_id, v_version, v_slots)
  returning id into v_epoch_id;
  return v_epoch_id;
end;
$$;

create or replace function public.assign_featured_placement(p_problem_id uuid, p_visitor_key text)
returns table(
  placement_id uuid,
  product_id uuid,
  product_name text,
  product_tagline text,
  destination_url text,
  registrable_domain text,
  claim_kind text,
  impression_count bigint,
  click_count bigint
)
language plpgsql security definer set search_path = public as $$
declare
  v_assignment public.visitor_assignments%rowtype;
  v_epoch public.rotation_epochs%rowtype;
  v_placement_id uuid;
  v_assignment_id uuid;
begin
  select a.* into v_assignment
  from public.visitor_assignments a
  join public.placements pl on pl.id = a.placement_id and pl.status = 'active'
  join public.products pr on pr.id = pl.product_id and pr.status = 'active'
  where a.problem_id = p_problem_id and a.visitor_key = p_visitor_key and a.expires_at > now()
  order by a.assigned_at desc limit 1;

  if v_assignment.id is not null then
    return query
      select pl.id, pr.id, pr.name, pr.tagline, pr.destination_url, pr.registrable_domain,
             case when pl.founding_claim and pl.current_bid_cents = 0 then 'founding' else 'paid' end,
             pl.impression_count, pl.click_count
      from public.placements pl join public.products pr on pr.id = pl.product_id
      where pl.id = v_assignment.placement_id;
    return;
  end if;

  select * into v_epoch from public.rotation_epochs
  where problem_id = p_problem_id and active for update;

  if v_epoch.id is null then
    perform public.rebuild_rotation(p_problem_id);
    select * into v_epoch from public.rotation_epochs
    where problem_id = p_problem_id and active for update;
  end if;
  if v_epoch.id is null then return; end if;

  v_placement_id := v_epoch.slots[v_epoch.cursor + 1];
  update public.rotation_epochs set cursor = mod(cursor + 1, 100) where id = v_epoch.id;

  insert into public.visitor_assignments(problem_id, placement_id, epoch_id, visitor_key, expires_at)
  values (p_problem_id, v_placement_id, v_epoch.id, p_visitor_key, now() + interval '30 minutes')
  returning id into v_assignment_id;

  insert into public.placement_impressions(assignment_id, problem_id, placement_id, visitor_key)
  values (v_assignment_id, p_problem_id, v_placement_id, p_visitor_key);
  update public.placements set impression_count = impression_count + 1 where id = v_placement_id;
  update public.problems set impression_count = impression_count + 1 where id = p_problem_id;
  insert into public.daily_traffic(traffic_date, problem_id, placement_id, impressions)
    values (current_date, p_problem_id, v_placement_id, 1)
    on conflict (traffic_date, placement_id) do update set impressions = public.daily_traffic.impressions + 1;

  return query
    select pl.id, pr.id, pr.name, pr.tagline, pr.destination_url, pr.registrable_domain,
           case when pl.founding_claim and pl.current_bid_cents = 0 then 'founding' else 'paid' end,
           pl.impression_count, pl.click_count
    from public.placements pl join public.products pr on pr.id = pl.product_id
    where pl.id = v_placement_id;
end;
$$;

create or replace function public.record_placement_click(p_placement_id uuid, p_visitor_key text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_problem_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('click:' || p_placement_id::text || ':' || p_visitor_key, 0));
  select a.problem_id into v_problem_id
  from public.visitor_assignments a
  where a.placement_id = p_placement_id and a.visitor_key = p_visitor_key
    and a.assigned_at > now() - interval '2 hours'
  order by a.assigned_at desc limit 1;
  if v_problem_id is null then return false; end if;

  if exists (
    select 1 from public.placement_clicks
    where placement_id = p_placement_id and visitor_key = p_visitor_key
      and created_at > now() - interval '24 hours'
  ) then return false; end if;

  insert into public.placement_clicks(problem_id, placement_id, visitor_key)
  values (v_problem_id, p_placement_id, p_visitor_key);
  update public.placements set click_count = click_count + 1 where id = p_placement_id;
  update public.problems set click_count = click_count + 1 where id = v_problem_id;
  insert into public.daily_traffic(traffic_date, problem_id, placement_id, clicks)
    values (current_date, v_problem_id, p_placement_id, 1)
    on conflict (traffic_date, placement_id) do update set clicks = public.daily_traffic.clicks + 1;
  return true;
end;
$$;

create or replace function public.create_bid_quote(
  p_problem_id uuid,
  p_registrable_domain text,
  p_product_name text,
  p_product_tagline text,
  p_destination_url text,
  p_owner_email text,
  p_amount_cents integer
)
returns table(quote_id uuid, minimum_cents integer, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_max integer;
  v_minimum integer;
  v_quote_id uuid;
  v_expires timestamptz := now() + interval '15 minutes';
  v_owner text;
begin
  perform pg_advisory_xact_lock(hashtextextended('bid:' || p_problem_id::text, 0));
  update public.bid_quotes set status = 'expired'
    where problem_id = p_problem_id and status in ('held', 'checkout_created') and expires_at <= now();

  select owner_email into v_owner from public.products where registrable_domain = p_registrable_domain;
  if v_owner is not null and lower(v_owner) <> lower(p_owner_email) then
    raise exception 'This product is managed by another email address.' using errcode = '22023';
  end if;

  select greatest(
    coalesce((select max(current_bid_cents) from public.placements where problem_id = p_problem_id and status = 'active'), 0),
    coalesce((select max(amount_cents) from public.bid_quotes where problem_id = p_problem_id and status in ('held', 'checkout_created') and expires_at > now()), 0)
  ) into v_max;
  v_minimum := case when v_max = 0 then 500 else v_max + 500 end;
  if p_amount_cents < v_minimum then
    raise exception 'Minimum bid is % cents.', v_minimum using errcode = '22023';
  end if;

  update public.bid_quotes set status = 'cancelled'
    where problem_id = p_problem_id and registrable_domain = p_registrable_domain
      and status in ('held', 'checkout_created') and expires_at > now();

  insert into public.bid_quotes(
    problem_id, registrable_domain, product_name, product_tagline,
    destination_url, owner_email, amount_cents, expires_at
  ) values (
    p_problem_id, p_registrable_domain, p_product_name, p_product_tagline,
    p_destination_url, lower(p_owner_email), p_amount_cents, v_expires
  ) returning id into v_quote_id;

  return query select v_quote_id, v_minimum, v_expires;
end;
$$;

create or replace function public.settle_bid(
  p_quote_id uuid,
  p_payment_id text,
  p_checkout_session_id text,
  p_amount_cents integer,
  p_settled_at timestamptz
)
returns table(placement_id uuid, rank integer)
language plpgsql security definer set search_path = public as $$
declare
  v_quote public.bid_quotes%rowtype;
  v_product_id uuid;
  v_placement_id uuid;
  v_rank integer;
begin
  select * into v_quote from public.bid_quotes where id = p_quote_id for update;
  if v_quote.id is null then raise exception 'Quote not found.'; end if;

  if v_quote.status = 'settled' then
    select b.placement_id into v_placement_id from public.bids b where b.quote_id = p_quote_id;
  else
    if v_quote.status not in ('held', 'checkout_created') then raise exception 'Quote is not payable.'; end if;
    if v_quote.checkout_session_id is not null and v_quote.checkout_session_id <> p_checkout_session_id then raise exception 'Checkout session mismatch.'; end if;
    if v_quote.amount_cents <> p_amount_cents then raise exception 'Paid amount mismatch.'; end if;

    insert into public.products(registrable_domain, name, tagline, destination_url, owner_email)
    values (v_quote.registrable_domain, v_quote.product_name, v_quote.product_tagline, v_quote.destination_url, lower(v_quote.owner_email))
    on conflict (registrable_domain) do update set
      name = excluded.name, tagline = excluded.tagline, destination_url = excluded.destination_url, updated_at = now()
    where lower(public.products.owner_email) = lower(excluded.owner_email)
    returning id into v_product_id;
    if v_product_id is null then raise exception 'Product ownership mismatch.'; end if;

    insert into public.placements(problem_id, product_id, current_bid_cents, status, settled_at)
    values (v_quote.problem_id, v_product_id, v_quote.amount_cents, 'active', p_settled_at)
    on conflict (problem_id, product_id) do update set
      current_bid_cents = excluded.current_bid_cents,
      status = 'active', settled_at = excluded.settled_at, updated_at = now()
    returning id into v_placement_id;

    insert into public.bids(quote_id, placement_id, amount_cents, payment_id, checkout_session_id, settled_at)
    values (v_quote.id, v_placement_id, v_quote.amount_cents, p_payment_id, p_checkout_session_id, p_settled_at);
    update public.bid_quotes set status = 'settled', checkout_session_id = p_checkout_session_id where id = v_quote.id;
    update public.problems set last_bid_at = p_settled_at where id = v_quote.problem_id;
    perform public.rebuild_rotation(v_quote.problem_id);
  end if;

  select ranked.position into v_rank from (
    select id, row_number() over (order by current_bid_cents desc, settled_at asc, id asc)::integer as position
    from public.placements where problem_id = v_quote.problem_id and status = 'active'
  ) ranked where ranked.id = v_placement_id;
  return query select v_placement_id, v_rank;
end;
$$;

create or replace function public.reconcile_bid_state(p_payment_id text, p_status text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_bid public.bids%rowtype;
  v_problem_id uuid;
  v_fallback integer;
  v_founding boolean;
begin
  if p_status not in ('settled', 'suspended', 'revoked') then raise exception 'Invalid bid state.'; end if;
  select * into v_bid from public.bids where payment_id = p_payment_id for update;
  if v_bid.id is null then return; end if;
  update public.bids set status = p_status where id = v_bid.id;
  select problem_id, founding_claim into v_problem_id, v_founding from public.placements where id = v_bid.placement_id for update;
  select max(amount_cents) into v_fallback from public.bids where placement_id = v_bid.placement_id and status = 'settled';
  if v_fallback is null and not v_founding then
    update public.placements set status = 'hidden', current_bid_cents = 0 where id = v_bid.placement_id;
  else
    update public.placements set status = 'active', current_bid_cents = coalesce(v_fallback, 0),
      settled_at = coalesce((select min(settled_at) from public.bids where placement_id = v_bid.placement_id and status = 'settled' and amount_cents = v_fallback), settled_at)
      where id = v_bid.placement_id;
  end if;
  perform public.rebuild_rotation(v_problem_id);
end;
$$;

-- Keep every marketplace table server-only. The service role bypasses RLS.
alter table public.problems enable row level security;
alter table public.problem_sources enable row level security;
alter table public.problem_supports enable row level security;
alter table public.problem_subscriptions enable row level security;
alter table public.visitors enable row level security;
alter table public.visitor_presence enable row level security;
alter table public.products enable row level security;
alter table public.placements enable row level security;
alter table public.bid_quotes enable row level security;
alter table public.bids enable row level security;
alter table public.rotation_epochs enable row level security;
alter table public.visitor_assignments enable row level security;
alter table public.placement_impressions enable row level security;
alter table public.placement_clicks enable row level security;
alter table public.daily_traffic enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.moderation_audit enable row level security;

revoke all on all functions in schema public from public, anon, authenticated;

-- Honest launch inventory. Curated rows start with zero demand and no placements.
insert into public.problems(slug, statement, normalized_statement, category, origin, launch_priority, status, published_at)
values
('automate-unpaid-invoice-followups', 'I hate chasing clients for unpaid invoices. I want reminders and escalation handled automatically without sounding hostile.', 'i hate chasing clients for unpaid invoices i want reminders and escalation handled automatically without sounding hostile', 'Finance', 'curated', 1, 'published', now()),
('simple-lead-followup-reminders', 'I keep forgetting to follow up with potential clients. I want something simpler than a CRM that tells me who needs a follow-up today.', 'i keep forgetting to follow up with potential clients i want something simpler than a crm that tells me who needs a follow up today', 'Sales', 'curated', 2, 'published', now()),
('simple-quickbooks-alternative', 'QuickBooks has become too expensive and bloated for my small business. I just need simple accounting.', 'quickbooks has become too expensive and bloated for my small business i just need simple accounting', 'Finance', 'curated', 3, 'published', now()),
('automate-receipt-matching', 'Bookkeeping should not mean hunting through email for receipts and attaching them to transactions one by one.', 'bookkeeping should not mean hunting through email for receipts and attaching them to transactions one by one', 'Finance', 'curated', 17, 'published', now()),
('affordable-social-scheduler', 'Social media schedulers are expensive, and each one still seems to be missing a feature I need.', 'social media schedulers are expensive and each one still seems to be missing a feature i need', 'Marketing', 'curated', 4, 'published', now()),
('one-customer-support-inbox', 'My customers message us on email, WhatsApp, Instagram, and website chat. I need one inbox where my team can answer everything.', 'my customers message us on email whatsapp instagram and website chat i need one inbox where my team can answer everything', 'Support', 'curated', 5, 'published', now()),
('affordable-intercom-alternative', 'I need an Intercom alternative that does not become insanely expensive and actually handles the channels I use.', 'i need an intercom alternative that does not become insanely expensive and actually handles the channels i use', 'Support', 'curated', 6, 'published', now()),
('form-builder-with-fair-pricing', 'Form builders get expensive exactly when forms receive real traffic. I want pricing that does not punish responses.', 'form builders get expensive exactly when forms receive real traffic i want pricing that does not punish responses', 'Marketing', 'curated', 7, 'published', now()),
('simple-google-analytics-alternative', 'Google Analytics is too complicated. I want understandable website stats without a giant dashboard and cookie mess.', 'google analytics is too complicated i want understandable website stats without a giant dashboard and cookie mess', 'Analytics', 'curated', 8, 'published', now()),
('affordable-zapier-alternative', 'Zapier becomes far too expensive once automations start running at meaningful volume.', 'zapier becomes far too expensive once automations start running at meaningful volume', 'Automation', 'curated', 9, 'published', now()),
('fair-airtable-collaborator-pricing', 'Why am I paying a full Airtable seat for people who barely touch the database?', 'why am i paying a full airtable seat for people who barely touch the database', 'Productivity', 'curated', 18, 'published', now()),
('competitor-change-alerts', 'I keep learning about competitor pricing and feature changes from customers. I want automatic meaningful alerts.', 'i keep learning about competitor pricing and feature changes from customers i want automatic meaningful alerts', 'Marketing', 'curated', 10, 'published', now()),
('unify-customer-feedback', 'Customer feedback is scattered across email, surveys, reviews, and social media. I need one place that shows what people actually complain about.', 'customer feedback is scattered across email surveys reviews and social media i need one place that shows what people actually complain about', 'Product', 'curated', 11, 'published', now()),
('meeting-notes-with-followthrough', 'Meeting notes are useless if I still forget the action items. I want summaries, next steps, and context before the next call.', 'meeting notes are useless if i still forget the action items i want summaries next steps and context before the next call', 'Productivity', 'curated', 19, 'published', now()),
('schedule-across-timezones', 'Scheduling a meeting across four time zones should not require everyone doing time-zone math in their head.', 'scheduling a meeting across four time zones should not require everyone doing time zone math in their head', 'Productivity', 'curated', 12, 'published', now()),
('extract-pdf-tables-cleanly', 'I need to pull tables out of PDFs into Excel without destroying the rows and columns.', 'i need to pull tables out of pdfs into excel without destroying the rows and columns', 'Productivity', 'curated', 13, 'published', now()),
('save-browser-tab-context', 'I have over 100 browser tabs because each feels important. I need to save the context without creating another bookmark graveyard.', 'i have over 100 browser tabs because each feels important i need to save the context without creating another bookmark graveyard', 'Productivity', 'curated', 14, 'published', now()),
('organize-saved-links-and-screenshots', 'I dump useful links, screenshots, and posts into Slack and then cannot organize or rediscover them.', 'i dump useful links screenshots and posts into slack and then cannot organize or rediscover them', 'Knowledge', 'curated', 20, 'published', now()),
('searchable-organized-screenshots', 'My screenshots are a second camera roll. I want them automatically organized and searchable by what is inside them.', 'my screenshots are a second camera roll i want them automatically organized and searchable by what is inside them', 'Knowledge', 'curated', 21, 'published', now()),
('offline-first-notion-alternative', 'A notes app is useless if I lose access when the internet is bad. I need a proper offline-first Notion alternative.', 'a notes app is useless if i lose access when the internet is bad i need a proper offline first notion alternative', 'Knowledge', 'curated', 15, 'published', now()),
('better-notion-search', 'I know the note exists in Notion, but search refuses to find it reliably.', 'i know the note exists in notion but search refuses to find it reliably', 'Knowledge', 'curated', 22, 'published', now()),
('instant-knowledge-capture', 'I need to capture a thought instantly without opening my knowledge app, finding the right page, and organizing it first.', 'i need to capture a thought instantly without opening my knowledge app finding the right page and organizing it first', 'Knowledge', 'curated', 23, 'published', now()),
('faster-reliable-canva-video', 'Canva turns a short video edit into hours because it keeps loading, freezing, and failing to export.', 'canva turns a short video edit into hours because it keeps loading freezing and failing to export', 'Design', 'curated', 24, 'published', now()),
('analyze-app-store-reviews', 'Reading hundreds of App Store reviews manually is a terrible way to discover what users hate or what changed after a release.', 'reading hundreds of app store reviews manually is a terrible way to discover what users hate or what changed after a release', 'Product', 'curated', 25, 'published', now()),
('find-high-intent-social-conversations', 'People on Reddit and X are asking for products like mine, but finding those conversations manually is impossible.', 'people on reddit and x are asking for products like mine but finding those conversations manually is impossible', 'Sales', 'curated', 26, 'published', now()),
('track-llm-brand-visibility', 'I do not know whether ChatGPT or Claude recommend my company or competitors, or what I need to change to appear there.', 'i do not know whether chatgpt or claude recommend my company or competitors or what i need to change to appear there', 'Marketing', 'curated', 27, 'published', now()),
('bot-protection-without-false-blocks', 'I need bot protection that does not randomly block real users or cost a fortune.', 'i need bot protection that does not randomly block real users or cost a fortune', 'Developer tools', 'curated', 28, 'published', now()),
('serious-affordable-adobe-alternative', 'Adobe costs too much, and cancelling or changing plans feels hostile. I need a serious alternative, not a toy.', 'adobe costs too much and cancelling or changing plans feels hostile i need a serious alternative not a toy', 'Design', 'curated', 16, 'published', now()),
('cheap-international-phone-calls', 'I still need cheap international calls to real mobile and landline numbers, not another video meeting app.', 'i still need cheap international calls to real mobile and landline numbers not another video meeting app', 'Communication', 'curated', 29, 'published', now()),
('small-deployment-vmware-alternative', 'VMware pricing no longer makes sense for a small deployment. I need something reliable without enterprise-scale licensing.', 'vmware pricing no longer makes sense for a small deployment i need something reliable without enterprise scale licensing', 'Developer tools', 'curated', 30, 'published', now())
on conflict (slug) do nothing;

insert into public.problem_sources(problem_id, source_url)
select p.id, source.url from (values
('automate-unpaid-invoice-followups','https://www.reddit.com/r/freelanceuk/comments/1qis45h/how_do_you_follow_up_on_unpaid_invoices_without/'),
('simple-lead-followup-reminders','https://www.reddit.com/r/sideprojects/comments/1rya8md/i_kept_forgetting_to_follow_up_with_potential/'),
('simple-quickbooks-alternative','https://www.reddit.com/r/smallbusiness/comments/1uq9ejx/cheaper_alternatives_to_quickbooks/'),
('automate-receipt-matching','https://www.reddit.com/r/Bookkeeping/comments/1nu1j94/how_can_i_do_bookkeeping_faster/'),
('affordable-social-scheduler','https://www.reddit.com/r/SocialMediaMarketing/comments/19756fd/sick_of_pricey_featureless_sm_schedulers_looking/'),
('one-customer-support-inbox','https://www.reddit.com/r/EmailProspecting/comments/1vqxjki/getting_support_questions_on_email_instagram_dms/'),
('affordable-intercom-alternative','https://www.reddit.com/r/SaaS/comments/zl4dkc/any_suggestions_to_replace_intercom_were_done/'),
('form-builder-with-fair-pricing','https://www.reddit.com/r/SaaS/comments/1qvv5ku/i_started_building_a_form_tool_after_realizing/'),
('simple-google-analytics-alternative','https://www.reddit.com/r/SaaS/comments/1u91vsu/best_google_analytics_alternatives_for_a_newly/'),
('affordable-zapier-alternative','https://www.reddit.com/r/automation/comments/1t78cd0/what_are_people_switching_to_instead_of_zapier/'),
('fair-airtable-collaborator-pricing','https://www.reddit.com/r/Airtable/comments/1m8wpvh/airtable_per_user_pricing_model_is_too_high/'),
('competitor-change-alerts','https://www.reddit.com/r/SaaS/comments/1rwn9kh/how_do_you_track_competitor_pricingfeatures/'),
('unify-customer-feedback','https://www.reddit.com/r/SaaS/comments/1qu1nm2/what_do_you_use_to_collect_customer_feedback/'),
('meeting-notes-with-followthrough','https://www.reddit.com/r/ITManagers/comments/1gm0ymf/tools_for_meeting_summary_and_reminders_for/'),
('schedule-across-timezones','https://www.reddit.com/r/SideProject/comments/1vib3d4/simple_tool_that_shows_the_best_times_to_meet/'),
('extract-pdf-tables-cleanly','https://www.reddit.com/r/SideProject/comments/1tm08p6/i_built_a_free_pdf_table_extractor_because_every/'),
('save-browser-tab-context','https://www.reddit.com/r/ADHD/comments/1bury3i/you_have_how_many_tabs_open/'),
('organize-saved-links-and-screenshots','https://www.reddit.com/r/Slack/comments/zjg0ba'),
('searchable-organized-screenshots','https://www.reddit.com/r/tasker/comments/1ua7ak2/project_share_tagly_v10_organize_screenshots_and/'),
('offline-first-notion-alternative','https://www.reddit.com/r/Notion/comments/ljy0h1'),
('better-notion-search','https://www.reddit.com/r/Notion/comments/14rzqtx/notions_search_function_is_frustrating_and/'),
('instant-knowledge-capture','https://www.reddit.com/r/ObsidianMD/comments/1gu5day/ive_built_a_quick_capture_app_for_obsidian_that/'),
('faster-reliable-canva-video','https://www.reddit.com/r/canva/comments/1901mkk/canva_is_frustrating_alternative_websites/'),
('analyze-app-store-reviews','https://www.reddit.com/r/Appstore/comments/1ttsx73/i_built_a_tool_that_runs_llm_analysis_on_app/'),
('find-high-intent-social-conversations','https://www.reddit.com/r/SaaS/comments/1u5ivq4/looking_for_a_reddit_tool/'),
('track-llm-brand-visibility','https://www.reddit.com/r/SaaS/comments/1tl9mce/looking_for_a_tool_to_audit_my_saas_for_geoaio/'),
('bot-protection-without-false-blocks','https://x.com/theo/status/1889885678839931350'),
('serious-affordable-adobe-alternative','https://www.reddit.com/r/FuckAdobe/comments/1rkvbss/adobe_is_too_fcking_expensive/'),
('cheap-international-phone-calls','https://www.reddit.com/r/SaaS/comments/1kakpmh/my_nonai_app_made_8000_usd_in_2_months_heres_how/'),
('small-deployment-vmware-alternative','https://www.reddit.com/r/sysadmin/comments/1sudhzb/vmware_alternatives/')
) as source(slug, url)
join public.problems p on p.slug = source.slug
on conflict do nothing;
