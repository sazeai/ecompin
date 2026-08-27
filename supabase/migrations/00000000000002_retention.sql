-- FIXTHIS data retention.
-- Phase 3 retention rules:
--   presence rows        -> at most 24 hours
--   raw impressions      -> 90 days (daily_traffic keeps the permanent totals)
--   raw clicks           -> 90 days
--   visitor assignments  -> 7 days (only the 30-minute window and click grace matter)
--   expired bid quotes   -> marked expired so they stop holding the next-bid floor
--   unverified email subs -> 7 days

create or replace function public.purge_expired_traffic()
returns table(
  presence_deleted bigint,
  impressions_deleted bigint,
  clicks_deleted bigint,
  assignments_deleted bigint,
  quotes_expired bigint,
  subscriptions_deleted bigint
)
language plpgsql security definer set search_path = public as $$
declare
  v_presence bigint;
  v_impressions bigint;
  v_clicks bigint;
  v_assignments bigint;
  v_quotes bigint;
  v_subscriptions bigint;
begin
  delete from public.visitor_presence where last_seen_at < now() - interval '24 hours';
  get diagnostics v_presence = row_count;

  delete from public.placement_impressions where created_at < now() - interval '90 days';
  get diagnostics v_impressions = row_count;

  delete from public.placement_clicks where created_at < now() - interval '90 days';
  get diagnostics v_clicks = row_count;

  delete from public.visitor_assignments where expires_at < now() - interval '7 days';
  get diagnostics v_assignments = row_count;

  update public.bid_quotes set status = 'expired'
    where status in ('held', 'checkout_created') and expires_at <= now();
  get diagnostics v_quotes = row_count;

  delete from public.problem_subscriptions
    where verified_at is null and created_at < now() - interval '7 days';
  get diagnostics v_subscriptions = row_count;

  return query select v_presence, v_impressions, v_clicks, v_assignments, v_quotes, v_subscriptions;
end;
$$;

comment on function public.purge_expired_traffic() is
  'Enforces FIXTHIS retention windows. Safe to run repeatedly; call on a schedule.';
