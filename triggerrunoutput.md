complete_schema_sql
"create table public.ab_experiments (id uuid not null, user_id uuid not null, product_id uuid not null, pin_a_id uuid not null, pin_b_id uuid not null, aesthetic_a text not null, aesthetic_b text not null, status text not null, winner text, started_at timestamp with time zone not null, concluded_at timestamp with time zone, metrics_a jsonb not null, metrics_b jsonb not null, created_at timestamp with time zone not null);

create table public.account_health_log (id uuid not null, user_id uuid not null, pinterest_connection_id uuid not null, pins_today integer not null, pins_this_week integer not null, url_pins_this_week integer not null, warmup_phase text not null, warmup_day integer not null, shadow_ban_risk text not null, checked_at timestamp with time zone not null);

create table public.brand_settings (id uuid not null, user_id uuid not null, brand_name text not null, brand_description text, store_url text, logo_url text, font_choice text not null, aesthetic_boundaries jsonb, created_at timestamp with time zone not null, updated_at timestamp with time zone not null, automation_paused boolean, autopilot_enabled boolean, account_age_type text, pin_layout_mode text, is_account_warmed_up boolean, last_notified_at timestamp with time zone, default_board_id text, show_brand_url boolean not null);

create table public.catalog_stores (id uuid not null, user_id uuid not null, brand_settings_id uuid, canonical_url text not null, platform text not null, sync_status text not null, last_synced_at timestamp with time zone, last_started_at timestamp with time zone, last_error text, product_count integer not null, sitemap_url text, sitemap_fingerprint text, sitemap_product_count integer, sitemap_urls_sample ARRAY, last_extractor_used text, robots_allowed boolean, created_at timestamp with time zone not null, updated_at timestamp with time zone not null);

create table public.catalog_sync_runs (id uuid not null, catalog_store_id uuid not null, user_id uuid not null, trigger_source text not null, status text not null, extractor_used text, products_seen integer not null, products_inserted integer not null, products_updated integer not null, products_unchanged integer not null, products_unavailable integer not null, pages_fetched integer not null, sitemap_short_circuited boolean not null, error_message text, started_at timestamp with time zone not null, finished_at timestamp with time zone, meta jsonb not null);

create table public.credits (id bigint not null, created_at timestamp with time zone not null, credits numeric not null, user_id uuid not null);

create table public.dodo_payments (id uuid not null, created_at timestamp with time zone not null, user_id uuid not null, dodo_payment_id text not null, dodo_checkout_session_id text, pricing_plan_id uuid not null, amount numeric not null, currency text not null, status text not null, credits integer not null, metadata jsonb);

create table public.dodo_pricing_plans (id uuid not null, created_at timestamp with time zone not null, updated_at timestamp with time zone not null, name text not null, description text, price numeric not null, credits integer not null, currency text not null, dodo_product_id text, is_active boolean not null, metadata jsonb);

create table public.dodo_subscription_changes (id uuid not null, created_at timestamp with time zone not null, user_id uuid not null, from_plan_id uuid, to_plan_id uuid, checkout_session_id text, status text not null, change_type text not null, reason text, completed_at timestamp with time zone, error_message text, metadata jsonb);

create table public.dodo_subscriptions (id uuid not null, created_at timestamp with time zone not null, updated_at timestamp with time zone not null, user_id uuid not null, dodo_subscription_id text, pricing_plan_id uuid not null, status text not null, metadata jsonb, cancel_at_period_end boolean not null, current_period_end timestamp with time zone, next_billing_date timestamp with time zone, canceled_at timestamp with time zone, price_snapshot bigint, currency_snapshot text);

create table public.dodo_webhook_events (id uuid not null, created_at timestamp with time zone not null, dodo_event_id text not null, event_type text not null, processed boolean not null, processed_at timestamp with time zone, data jsonb not null, error_message text, retry_count integer not null);

create table public.etsy_connections (id uuid not null, user_id uuid not null, shop_id text, shop_name text, access_token text not null, refresh_token text, expires_at timestamp with time zone, created_at timestamp with time zone not null, updated_at timestamp with time zone not null);

create table public.pin_analytics_snapshots (id uuid not null, pin_id uuid not null, user_id uuid not null, impressions integer not null, outbound_clicks integer not null, saves integer not null, snapshot_date date not null, created_at timestamp with time zone not null);

create table public.pin_queue (id uuid not null, user_id uuid not null, pin_id uuid not null, scheduled_for timestamp with time zone, priority integer not null, status text not null, published_at timestamp with time zone, created_at timestamp with time zone not null);

create table public.pin_rejections (id uuid not null, pin_id uuid not null, user_id uuid not null, reason text not null, created_at timestamp with time zone);

create table public.pins (id uuid not null, user_id uuid not null, product_id uuid, brand_settings_id uuid, art_director_prompt text, template_id text, generated_image_url text, generated_image_r2_key text, rendered_image_url text, rendered_image_r2_key text, pin_title text, pin_description text, pinterest_pin_id text, pinterest_board_id text, published_at timestamp with time zone, pin_url text, has_outbound_link boolean not null, outbound_clicks integer not null, impressions integer not null, saves integer not null, last_analytics_at timestamp with time zone, status text not null, error_message text, created_at timestamp with time zone not null, updated_at timestamp with time zone not null, target_angle text, angle_embedding USER-DEFINED, is_mood_board boolean, aesthetic_tag text);

create table public.pinterest_connections (id uuid not null, user_id uuid not null, pinterest_user_id text, access_token text not null, refresh_token text, expires_at timestamp with time zone, account_age_days integer, trust_score numeric, warmup_phase text not null, created_at timestamp with time zone not null, updated_at timestamp with time zone not null);

create table public.products (id uuid not null, user_id uuid not null, brand_settings_id uuid, source text not null, source_product_id text, title text not null, description text, price numeric, currency text, product_url text, image_url text, image_r2_key text, tags ARRAY, is_active boolean not null, created_at timestamp with time zone not null, updated_at timestamp with time zone not null, handle text, catalog_store_id uuid, platform_product_id text, sku text, content_hash text, last_seen_at timestamp with time zone, missing_sync_count integer not null, lifecycle_status text not null, marketed boolean not null, marketing_priority integer not null);

create table public.profiles (id uuid not null, email text, credits_remaining integer, subscription_tier text, created_at timestamp with time zone, updated_at timestamp with time zone, default_brand_id uuid);

create table public.prompt_weights (id uuid not null, user_id uuid not null, brand_settings_id uuid, prompt_template text not null, aesthetic_tags ARRAY, weight numeric not null, total_pins_used integer not null, total_clicks integer not null, avg_click_rate numeric not null, created_at timestamp with time zone not null, updated_at timestamp with time zone not null);

create table public.shopify_connections (id uuid not null, user_id uuid not null, store_domain text not null, is_default boolean, created_at timestamp with time zone, updated_at timestamp with time zone, shopify_client_id text, shopify_client_secret text);

create table public.user_feedback (id bigint not null, user_id uuid not null, feedback_text text not null, created_at timestamp with time zone not null);

alter table public.pin_analytics_snapshots add constraint pin_analytics_snapshots_pin_id_fkey foreign key (pin_id) references public.pins (id);

alter table public.pin_rejections add constraint pin_rejections_pin_id_fkey foreign key (pin_id) references public.pins (id);

alter table public.ab_experiments add constraint ab_experiments_product_id_fkey foreign key (product_id) references public.products (id);

alter table public.ab_experiments add constraint ab_experiments_pin_a_fkey foreign key (pin_a_id) references public.pins (id);

alter table public.ab_experiments add constraint ab_experiments_pin_b_fkey foreign key (pin_b_id) references public.pins (id);

alter table public.catalog_stores add constraint catalog_stores_brand_settings_id_fkey foreign key (brand_settings_id) references public.brand_settings (id);

alter table public.products add constraint products_catalog_store_id_fkey foreign key (catalog_store_id) references public.catalog_stores (id);

alter table public.catalog_sync_runs add constraint catalog_sync_runs_catalog_store_id_fkey foreign key (catalog_store_id) references public.catalog_stores (id);

alter table public.dodo_payments add constraint dodo_payments_pricing_plan_id_fkey foreign key (pricing_plan_id) references public.dodo_pricing_plans (id);

alter table public.dodo_subscription_changes add constraint dodo_subscription_changes_from_plan_id_fkey foreign key (from_plan_id) references public.dodo_pricing_plans (id);

alter table public.dodo_subscription_changes add constraint dodo_subscription_changes_to_plan_id_fkey foreign key (to_plan_id) references public.dodo_pricing_plans (id);

alter table public.dodo_subscriptions add constraint dodo_subscriptions_pricing_plan_id_fkey foreign key (pricing_plan_id) references public.dodo_pricing_plans (id);

alter table public.products add constraint products_brand_settings_id_fkey foreign key (brand_settings_id) references public.brand_settings (id);

alter table public.pins add constraint pins_product_id_fkey foreign key (product_id) references public.products (id);

alter table public.pins add constraint pins_brand_settings_id_fkey foreign key (brand_settings_id) references public.brand_settings (id);

alter table public.prompt_weights add constraint prompt_weights_brand_settings_id_fkey foreign key (brand_settings_id) references public.brand_settings (id);

alter table public.account_health_log add constraint account_health_log_pinterest_fkey foreign key (pinterest_connection_id) references public.pinterest_connections (id);

alter table public.pin_queue add constraint pin_queue_pin_id_fkey foreign key (pin_id) references public.pins (id);

CREATE OR REPLACE FUNCTION public.set_catalog_stores_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.match_pin_angles(query_product_id uuid, query_embedding vector, match_threshold double precision, match_count integer)
 RETURNS TABLE(id uuid, target_angle text, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    pins.id,
    pins.target_angle,
    1 - (pins.angle_embedding <=> query_embedding) AS similarity
  FROM pins
  WHERE pins.product_id = query_product_id
    AND pins.angle_embedding IS NOT NULL
    AND 1 - (pins.angle_embedding <=> query_embedding) > match_threshold
  ORDER BY pins.angle_embedding <=> query_embedding
  LIMIT match_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.consume_ai_tokens(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_subscription record;
  v_usage record;
  v_is_subscribed boolean := false;
  v_tokens_remaining bigint;
begin
  -- 1. Check subscription status (active = subscribed)
  select * into v_subscription
  from dodo_subscriptions
  where user_id = p_user_id
    and status = 'active'
  order by created_at desc
  limit 1;
  
  v_is_subscribed := (v_subscription.id is not null);
  
  -- If not subscribed, deny immediately
  if not v_is_subscribed then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'subscription_required',
      'tokens_remaining', 0,
      'is_subscribed', false
    );
  end if;
  
  -- 2. Get or create usage record
  select * into v_usage
  from ai_token_usage
  where user_id = p_user_id;
  
  if v_usage.user_id is null then
    -- First time user, create record with cycle start from subscription
    insert into ai_token_usage (user_id, tokens_used, cycle_start_date)
    values (
      p_user_id, 
      0, 
      coalesce(v_subscription.current_period_end - interval '1 month', now())
    )
    returning * into v_usage;
  end if;
  
  -- 3. Check if billing cycle has passed (lazy reset)
  -- If subscription's current_period_end indicates a new billing cycle, reset tokens
  if v_subscription.current_period_end is not null 
     and v_usage.cycle_start_date < (v_subscription.current_period_end - interval '1 month') then
    -- Reset the cycle
    update ai_token_usage
    set tokens_used = 0,
        cycle_start_date = v_subscription.current_period_end - interval '1 month',
        updated_at = now()
    where user_id = p_user_id
    returning * into v_usage;
  end if;
  
  -- 4. Calculate remaining tokens
  v_tokens_remaining := v_usage.tokens_limit - v_usage.tokens_used;
  
  -- 5. Check if quota exceeded
  if v_tokens_remaining <= 0 then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'quota_exceeded',
      'tokens_remaining', 0,
      'tokens_used', v_usage.tokens_used,
      'tokens_limit', v_usage.tokens_limit,
      'is_subscribed', true,
      'cycle_resets_at', v_subscription.current_period_end
    );
  end if;
  
  -- 6. Allowed!
  return jsonb_build_object(
    'allowed', true,
    'tokens_remaining', v_tokens_remaining,
    'tokens_used', v_usage.tokens_used,
    'tokens_limit', v_usage.tokens_limit,
    'is_subscribed', true,
    'cycle_resets_at', v_subscription.current_period_end
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.find_covered_answer(check_embedding vector, brand_uuid uuid, match_threshold double precision)
 RETURNS TABLE(article_id uuid, answer_text text, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT first_covered_by, answer_unit, 1 - (answer_embedding <=> check_embedding)
  FROM answer_coverage
  WHERE brand_id = brand_uuid
  AND answer_embedding IS NOT NULL
  AND 1 - (answer_embedding <=> check_embedding) > match_threshold
  ORDER BY 1 - (answer_embedding <=> check_embedding) DESC
  LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.find_live_url_from_article(target_article_id uuid, brand_uuid uuid, match_threshold double precision)
 RETURNS TABLE(live_url text, live_title text, similarity double precision)
 LANGUAGE plpgsql
AS $function$
DECLARE
  source_vector vector(1536);
BEGIN
  -- 1. Get the source vector(1536) from the draft article
  SELECT topic_embedding INTO source_vector
  FROM articles
  WHERE id = target_article_id;

  -- 2. Find the matching live link
  RETURN QUERY
  SELECT url, title, 1 - (embedding <=> source_vector)
  FROM internal_links
  WHERE brand_id = brand_uuid
  AND 1 - (embedding <=> source_vector) > match_threshold
  ORDER BY 1 - (embedding <=> source_vector) DESC
  LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.match_articles_topic(query_embedding vector, match_threshold double precision, match_count integer, p_user_id uuid, p_brand_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, keyword text, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    articles.id,
    articles.keyword,
    1 - (articles.topic_embedding <=> query_embedding) AS similarity
  FROM articles
  WHERE 1 - (articles.topic_embedding <=> query_embedding) > match_threshold
    AND articles.user_id = p_user_id
    AND (p_brand_id IS NULL OR articles.brand_id = p_brand_id)  -- NEW: Brand isolation
  ORDER BY articles.topic_embedding <=> query_embedding
  LIMIT match_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.match_internal_links(query_embedding vector, match_threshold double precision, match_count integer, p_user_id uuid)
 RETURNS TABLE(id uuid, url text, title text, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    internal_links.id,
    internal_links.url,
    internal_links.title,
    1 - (internal_links.embedding <=> query_embedding) AS similarity
  FROM internal_links
  WHERE 1 - (internal_links.embedding <=> query_embedding) > match_threshold
    AND internal_links.user_id = p_user_id
  ORDER BY internal_links.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.match_internal_links(query_embedding vector, match_threshold double precision, match_count integer, p_brand_id uuid, p_user_id uuid)
 RETURNS TABLE(id uuid, url text, title text, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    internal_links.id,
    internal_links.url,
    internal_links.title,
    1 - (internal_links.embedding <=> query_embedding) AS similarity
  FROM internal_links
  WHERE 1 - (internal_links.embedding <=> query_embedding) > match_threshold
    AND internal_links.user_id = p_user_id
    AND (p_brand_id IS NULL OR internal_links.brand_id = p_brand_id)
  ORDER BY internal_links.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    new.updated_at = now();
    return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.match_articles(query_embedding vector, match_threshold double precision, match_count integer, p_user_id uuid, p_brand_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, keyword text, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        articles.id,
        articles.keyword,
        1 - (articles.topic_embedding <=> query_embedding) AS similarity
    FROM articles
    WHERE 
        articles.topic_embedding IS NOT NULL
        AND 1 - (articles.topic_embedding <=> query_embedding) > match_threshold
        AND articles.user_id = p_user_id
        AND (p_brand_id IS NULL OR articles.brand_id = p_brand_id)
    ORDER BY articles.topic_embedding <=> query_embedding
    LIMIT match_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.record_ai_usage(p_user_id uuid, p_tokens_used bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_new_total bigint;
  v_limit bigint;
begin
  -- Update usage, incrementing tokens_used
  update ai_token_usage
  set tokens_used = tokens_used + p_tokens_used,
      last_request_at = now(),
      updated_at = now()
  where user_id = p_user_id
  returning tokens_used, tokens_limit into v_new_total, v_limit;
  
  -- If no record exists (edge case), create one
  if v_new_total is null then
    insert into ai_token_usage (user_id, tokens_used)
    values (p_user_id, p_tokens_used)
    returning tokens_used, tokens_limit into v_new_total, v_limit;
  end if;
  
  return jsonb_build_object(
    'tokens_used', v_new_total,
    'tokens_remaining', greatest(0, v_limit - v_new_total),
    'tokens_limit', v_limit
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_sprint_balance(p_user_sprint_id uuid)
 RETURNS TABLE(new_remaining integer, refresh_remaining integer, new_used integer, refresh_used integer, new_total integer, refresh_total integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    WITH grants AS (
        SELECT 
            COALESCE(SUM(CASE WHEN quota_type = 'new' AND delta > 0 THEN delta ELSE 0 END), 0)::integer AS new_total,
            COALESCE(SUM(CASE WHEN quota_type = 'refresh' AND delta > 0 THEN delta ELSE 0 END), 0)::integer AS refresh_total,
            COALESCE(SUM(CASE WHEN quota_type = 'new' AND delta < 0 THEN ABS(delta) ELSE 0 END), 0)::integer AS new_used,
            COALESCE(SUM(CASE WHEN quota_type = 'refresh' AND delta < 0 THEN ABS(delta) ELSE 0 END), 0)::integer AS refresh_used
        FROM sprint_quota_ledgers
        WHERE user_sprint_id = p_user_sprint_id
    )
    SELECT 
        (g.new_total - g.new_used)::integer AS new_remaining,
        (g.refresh_total - g.refresh_used)::integer AS refresh_remaining,
        g.new_used,
        g.refresh_used,
        g.new_total,
        g.refresh_total
    FROM grants g;
$function$
;"