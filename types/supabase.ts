export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      dodopayments_events: {
        Row: {
          dodopayments_event_id: string
          processed_at: string
        }
        Insert: {
          dodopayments_event_id: string
          processed_at?: string
        }
        Update: {
          dodopayments_event_id?: string
          processed_at?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          created_at: string
          dodopayments_session_id: string | null
          id: string
          is_hidden: boolean
          offer_text: string
          opportunity_id: string
          payment_status: "pending_payment" | "paid" | "refunded"
          product_name: string
          product_url: string
          provider_email: string
          published_at: string | null
        }
        Insert: {
          created_at?: string
          dodopayments_session_id?: string | null
          id?: string
          is_hidden?: boolean
          offer_text: string
          opportunity_id: string
          payment_status?: "pending_payment" | "paid" | "refunded"
          product_name: string
          product_url: string
          provider_email: string
          published_at?: string | null
        }
        Update: {
          created_at?: string
          dodopayments_session_id?: string | null
          id?: string
          is_hidden?: boolean
          offer_text?: string
          opportunity_id?: string
          payment_status?: "pending_payment" | "paid" | "refunded"
          product_name?: string
          product_url?: string
          provider_email?: string
          published_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          created_at: string
          customer_email: string
          id: string
          is_demo: boolean
          leaving_product: string
          monthly_spend: number
          reason: string
          slug: string
          status: "active" | "hidden"
        }
        Insert: {
          created_at?: string
          customer_email: string
          id?: string
          is_demo?: boolean
          leaving_product: string
          monthly_spend: number
          reason: string
          slug: string
          status?: "active" | "hidden"
        }
        Update: {
          created_at?: string
          customer_email?: string
          id?: string
          is_demo?: boolean
          leaving_product?: string
          monthly_spend?: number
          reason?: string
          slug?: string
          status?: "active" | "hidden"
        }
        Relationships: []
      }
      account_health_log: {
        Row: {
          checked_at: string
          id: string
          pins_this_week: number
          pins_today: number
          pinterest_connection_id: string
          shadow_ban_risk: string
          url_pins_this_week: number
          user_id: string
          warmup_day: number
          warmup_phase: string
        }
        Insert: {
          checked_at?: string
          id?: string
          pins_this_week?: number
          pins_today?: number
          pinterest_connection_id: string
          shadow_ban_risk?: string
          url_pins_this_week?: number
          user_id: string
          warmup_day?: number
          warmup_phase?: string
        }
        Update: {
          checked_at?: string
          id?: string
          pins_this_week?: number
          pins_today?: number
          pinterest_connection_id?: string
          shadow_ban_risk?: string
          url_pins_this_week?: number
          user_id?: string
          warmup_day?: number
          warmup_phase?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_health_log_pinterest_fkey"
            columns: ["pinterest_connection_id"]
            isOneToOne: false
            referencedRelation: "pinterest_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_token_usage: {
        Row: {
          created_at: string
          cycle_start_date: string
          last_request_at: string | null
          tokens_limit: number
          tokens_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cycle_start_date?: string
          last_request_at?: string | null
          tokens_limit?: number
          tokens_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cycle_start_date?: string
          last_request_at?: string | null
          tokens_limit?: number
          tokens_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      answer_coverage: {
        Row: {
          answer_embedding: string | null
          answer_unit: string
          brand_id: string | null
          cluster: string
          coverage_state: string
          first_covered_by: string | null
          id: string
          last_updated_at: string | null
          user_id: string
        }
        Insert: {
          answer_embedding?: string | null
          answer_unit: string
          brand_id?: string | null
          cluster: string
          coverage_state: string
          first_covered_by?: string | null
          id?: string
          last_updated_at?: string | null
          user_id: string
        }
        Update: {
          answer_embedding?: string | null
          answer_unit?: string
          brand_id?: string | null
          cluster?: string
          coverage_state?: string
          first_covered_by?: string | null
          id?: string
          last_updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_coverage_article_fkey"
            columns: ["first_covered_by"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          article_type: string | null
          brand_id: string | null
          competitor_data: Json | null
          content_mode: string | null
          created_at: string | null
          current_step_index: number | null
          error_message: string | null
          failed_at_phase: Database["public"]["Enums"]["article_phase"] | null
          featured_image_url: string | null
          final_html: string | null
          id: string
          keyword: string
          meta_description: string | null
          original_url: string | null
          outline: Json | null
          published_at: string | null
          raw_content: string | null
          shopify_article_id: string | null
          shopify_article_url: string | null
          shopify_connection_id: string | null
          slug: string | null
          status: Database["public"]["Enums"]["article_status"] | null
          supporting_keywords: string[] | null
          topic_embedding: string | null
          updated_at: string | null
          user_id: string
          user_sprint_id: string | null
          webflow_item_id: string | null
          webflow_item_url: string | null
          webflow_site_id: string | null
          wordpress_post_id: string | null
          wordpress_post_url: string | null
          wordpress_site_id: string | null
        }
        Insert: {
          article_type?: string | null
          brand_id?: string | null
          competitor_data?: Json | null
          content_mode?: string | null
          created_at?: string | null
          current_step_index?: number | null
          error_message?: string | null
          failed_at_phase?: Database["public"]["Enums"]["article_phase"] | null
          featured_image_url?: string | null
          final_html?: string | null
          id?: string
          keyword: string
          meta_description?: string | null
          original_url?: string | null
          outline?: Json | null
          published_at?: string | null
          raw_content?: string | null
          shopify_article_id?: string | null
          shopify_article_url?: string | null
          shopify_connection_id?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["article_status"] | null
          supporting_keywords?: string[] | null
          topic_embedding?: string | null
          updated_at?: string | null
          user_id: string
          user_sprint_id?: string | null
          webflow_item_id?: string | null
          webflow_item_url?: string | null
          webflow_site_id?: string | null
          wordpress_post_id?: string | null
          wordpress_post_url?: string | null
          wordpress_site_id?: string | null
        }
        Update: {
          article_type?: string | null
          brand_id?: string | null
          competitor_data?: Json | null
          content_mode?: string | null
          created_at?: string | null
          current_step_index?: number | null
          error_message?: string | null
          failed_at_phase?: Database["public"]["Enums"]["article_phase"] | null
          featured_image_url?: string | null
          final_html?: string | null
          id?: string
          keyword?: string
          meta_description?: string | null
          original_url?: string | null
          outline?: Json | null
          published_at?: string | null
          raw_content?: string | null
          shopify_article_id?: string | null
          shopify_article_url?: string | null
          shopify_connection_id?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["article_status"] | null
          supporting_keywords?: string[] | null
          topic_embedding?: string | null
          updated_at?: string | null
          user_id?: string
          user_sprint_id?: string | null
          webflow_item_id?: string | null
          webflow_item_url?: string | null
          webflow_site_id?: string | null
          wordpress_post_id?: string | null
          wordpress_post_url?: string | null
          wordpress_site_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_shopify_connection_id_fkey"
            columns: ["shopify_connection_id"]
            isOneToOne: false
            referencedRelation: "shopify_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_user_sprint_id_fkey"
            columns: ["user_sprint_id"]
            isOneToOne: false
            referencedRelation: "user_sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_webflow_site_id_fkey"
            columns: ["webflow_site_id"]
            isOneToOne: false
            referencedRelation: "webflow_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_wordpress_site_id_fkey"
            columns: ["wordpress_site_id"]
            isOneToOne: false
            referencedRelation: "wordpress_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_details: {
        Row: {
          brand_data: Json
          created_at: string | null
          deleted_at: string | null
          discovered_competitors: Json | null
          id: string
          image_style: string | null
          pillar_recommendations: Json | null
          updated_at: string | null
          user_id: string
          website_url: string
        }
        Insert: {
          brand_data?: Json
          created_at?: string | null
          deleted_at?: string | null
          discovered_competitors?: Json | null
          id?: string
          image_style?: string | null
          pillar_recommendations?: Json | null
          updated_at?: string | null
          user_id: string
          website_url: string
        }
        Update: {
          brand_data?: Json
          created_at?: string | null
          deleted_at?: string | null
          discovered_competitors?: Json | null
          id?: string
          image_style?: string | null
          pillar_recommendations?: Json | null
          updated_at?: string | null
          user_id?: string
          website_url?: string
        }
        Relationships: []
      }
      brand_settings: {
        Row: {
          aesthetic_boundaries: Json | null
          account_age_type: string | null
          automation_paused: boolean
          brand_description: string | null
          brand_name: string
          created_at: string
          default_board_id: string | null
          font_choice: string
          id: string
          logo_url: string | null
          pin_layout_mode: string
          show_brand_url: boolean
          store_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aesthetic_boundaries?: Json | null
          account_age_type?: string | null
          automation_paused?: boolean
          brand_description?: string | null
          brand_name: string
          created_at?: string
          default_board_id?: string | null
          font_choice?: string
          id?: string
          logo_url?: string | null
          pin_layout_mode?: string
          show_brand_url?: boolean
          store_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aesthetic_boundaries?: Json | null
          account_age_type?: string | null
          automation_paused?: boolean
          brand_description?: string | null
          brand_name?: string
          created_at?: string
          default_board_id?: string | null
          font_choice?: string
          id?: string
          logo_url?: string | null
          pin_layout_mode?: string
          show_brand_url?: boolean
          store_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_plans: {
        Row: {
          automation_status: string | null
          brand_id: string | null
          catch_up_mode: string | null
          competitor_seeds: Json | null
          created_at: string | null
          generation_error: string | null
          generation_phase: string | null
          generation_status: string | null
          gsc_enhanced: boolean | null
          id: string
          plan_data: Json
          plan_mode: string
          updated_at: string | null
          user_id: string
          user_sprint_id: string | null
        }
        Insert: {
          automation_status?: string | null
          brand_id?: string | null
          catch_up_mode?: string | null
          competitor_seeds?: Json | null
          created_at?: string | null
          generation_error?: string | null
          generation_phase?: string | null
          generation_status?: string | null
          gsc_enhanced?: boolean | null
          id?: string
          plan_data: Json
          plan_mode?: string
          updated_at?: string | null
          user_id: string
          user_sprint_id?: string | null
        }
        Update: {
          automation_status?: string | null
          brand_id?: string | null
          catch_up_mode?: string | null
          competitor_seeds?: Json | null
          created_at?: string | null
          generation_error?: string | null
          generation_phase?: string | null
          generation_status?: string | null
          gsc_enhanced?: boolean | null
          id?: string
          plan_data?: Json
          plan_mode?: string
          updated_at?: string | null
          user_id?: string
          user_sprint_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_plans_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_plans_user_sprint_id_fkey"
            columns: ["user_sprint_id"]
            isOneToOne: false
            referencedRelation: "user_sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      credits: {
        Row: {
          created_at: string
          credits: number
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number
          id?: number
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      dodo_payments: {
        Row: {
          amount: number
          created_at: string
          credits: number
          currency: string
          dodo_checkout_session_id: string | null
          dodo_payment_id: string
          id: string
          metadata: Json | null
          pricing_plan_id: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          credits?: number
          currency?: string
          dodo_checkout_session_id?: string | null
          dodo_payment_id: string
          id?: string
          metadata?: Json | null
          pricing_plan_id: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          credits?: number
          currency?: string
          dodo_checkout_session_id?: string | null
          dodo_payment_id?: string
          id?: string
          metadata?: Json | null
          pricing_plan_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dodo_payments_pricing_plan_id_fkey"
            columns: ["pricing_plan_id"]
            isOneToOne: false
            referencedRelation: "dodo_pricing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      dodo_pricing_plans: {
        Row: {
          created_at: string
          credits: number
          currency: string
          description: string | null
          dodo_product_id: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits: number
          currency?: string
          description?: string | null
          dodo_product_id?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits?: number
          currency?: string
          description?: string | null
          dodo_product_id?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      dodo_subscription_changes: {
        Row: {
          change_type: string
          checkout_session_id: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          from_plan_id: string | null
          id: string
          metadata: Json | null
          reason: string | null
          status: string
          to_plan_id: string | null
          user_id: string
        }
        Insert: {
          change_type: string
          checkout_session_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          from_plan_id?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          status: string
          to_plan_id?: string | null
          user_id: string
        }
        Update: {
          change_type?: string
          checkout_session_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          from_plan_id?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          status?: string
          to_plan_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dodo_subscription_changes_from_plan_id_fkey"
            columns: ["from_plan_id"]
            isOneToOne: false
            referencedRelation: "dodo_pricing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dodo_subscription_changes_to_plan_id_fkey"
            columns: ["to_plan_id"]
            isOneToOne: false
            referencedRelation: "dodo_pricing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      dodo_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          currency_snapshot: string | null
          current_period_end: string | null
          dodo_subscription_id: string | null
          id: string
          metadata: Json | null
          next_billing_date: string | null
          price_snapshot: number | null
          pricing_plan_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          currency_snapshot?: string | null
          current_period_end?: string | null
          dodo_subscription_id?: string | null
          id?: string
          metadata?: Json | null
          next_billing_date?: string | null
          price_snapshot?: number | null
          pricing_plan_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          currency_snapshot?: string | null
          current_period_end?: string | null
          dodo_subscription_id?: string | null
          id?: string
          metadata?: Json | null
          next_billing_date?: string | null
          price_snapshot?: number | null
          pricing_plan_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dodo_subscriptions_pricing_plan_id_fkey"
            columns: ["pricing_plan_id"]
            isOneToOne: false
            referencedRelation: "dodo_pricing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      dodo_webhook_events: {
        Row: {
          created_at: string
          data: Json
          dodo_event_id: string
          error_message: string | null
          event_type: string
          id: string
          processed: boolean
          processed_at: string | null
          retry_count: number
        }
        Insert: {
          created_at?: string
          data: Json
          dodo_event_id: string
          error_message?: string | null
          event_type: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          retry_count?: number
        }
        Update: {
          created_at?: string
          data?: Json
          dodo_event_id?: string
          error_message?: string | null
          event_type?: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          retry_count?: number
        }
        Relationships: []
      }
      etsy_connections: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          id: string
          refresh_token: string | null
          shop_id: string | null
          shop_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          shop_id?: string | null
          shop_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          shop_id?: string | null
          shop_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gsc_connections: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
          refresh_token: string
          site_url: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
          refresh_token: string
          site_url: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          refresh_token?: string
          site_url?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gsc_decay_candidates: {
        Row: {
          created_at: string
          ctr_delta: number | null
          decay_score: number
          id: string
          meta: Json
          page_url: string
          position_delta: number | null
          status: Database["public"]["Enums"]["gsc_decay_candidate_status"]
          updated_at: string
          user_sprint_id: string
          window_30_clicks: number
          window_30_impressions: number
          window_60_clicks: number
          window_60_impressions: number
        }
        Insert: {
          created_at?: string
          ctr_delta?: number | null
          decay_score?: number
          id?: string
          meta?: Json
          page_url: string
          position_delta?: number | null
          status?: Database["public"]["Enums"]["gsc_decay_candidate_status"]
          updated_at?: string
          user_sprint_id: string
          window_30_clicks?: number
          window_30_impressions?: number
          window_60_clicks?: number
          window_60_impressions?: number
        }
        Update: {
          created_at?: string
          ctr_delta?: number | null
          decay_score?: number
          id?: string
          meta?: Json
          page_url?: string
          position_delta?: number | null
          status?: Database["public"]["Enums"]["gsc_decay_candidate_status"]
          updated_at?: string
          user_sprint_id?: string
          window_30_clicks?: number
          window_30_impressions?: number
          window_60_clicks?: number
          window_60_impressions?: number
        }
        Relationships: [
          {
            foreignKeyName: "gsc_decay_candidates_user_sprint_id_fkey"
            columns: ["user_sprint_id"]
            isOneToOne: false
            referencedRelation: "user_sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      gsc_snapshots: {
        Row: {
          avg_ctr: number | null
          avg_position: number | null
          created_at: string | null
          id: string
          page_data: Json | null
          snapshot_date: string
          total_clicks: number | null
          total_impressions: number | null
          user_id: string
          user_sprint_id: string
        }
        Insert: {
          avg_ctr?: number | null
          avg_position?: number | null
          created_at?: string | null
          id?: string
          page_data?: Json | null
          snapshot_date: string
          total_clicks?: number | null
          total_impressions?: number | null
          user_id: string
          user_sprint_id: string
        }
        Update: {
          avg_ctr?: number | null
          avg_position?: number | null
          created_at?: string | null
          id?: string
          page_data?: Json | null
          snapshot_date?: string
          total_clicks?: number | null
          total_impressions?: number | null
          user_id?: string
          user_sprint_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gsc_snapshots_user_sprint_id_fkey"
            columns: ["user_sprint_id"]
            isOneToOne: false
            referencedRelation: "user_sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_links: {
        Row: {
          brand_id: string | null
          created_at: string | null
          embedding: string | null
          id: string
          title: string
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          title: string
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_links_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand_details"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_queue: {
        Row: {
          created_at: string
          id: string
          pin_id: string
          priority: number
          published_at: string | null
          scheduled_for: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pin_id: string
          priority?: number
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pin_id?: string
          priority?: number
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pin_queue_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
        ]
      }
      pins: {
        Row: {
          art_director_prompt: string | null
          brand_settings_id: string | null
          created_at: string
          error_message: string | null
          generated_image_r2_key: string | null
          generated_image_url: string | null
          has_outbound_link: boolean
          id: string
          image_prompt_used: string | null
          impressions: number
          last_analytics_at: string | null
          outbound_clicks: number
          pin_description: string | null
          pin_title: string | null
          pin_url: string | null
          pinterest_board_id: string | null
          pinterest_pin_id: string | null
          product_id: string | null
          published_at: string | null
          rendered_image_r2_key: string | null
          rendered_image_url: string | null
          saves: number
          status: string
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          art_director_prompt?: string | null
          brand_settings_id?: string | null
          created_at?: string
          error_message?: string | null
          generated_image_r2_key?: string | null
          generated_image_url?: string | null
          has_outbound_link?: boolean
          id?: string
          image_prompt_used?: string | null
          impressions?: number
          last_analytics_at?: string | null
          outbound_clicks?: number
          pin_description?: string | null
          pin_title?: string | null
          pin_url?: string | null
          pinterest_board_id?: string | null
          pinterest_pin_id?: string | null
          product_id?: string | null
          published_at?: string | null
          rendered_image_r2_key?: string | null
          rendered_image_url?: string | null
          saves?: number
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          art_director_prompt?: string | null
          brand_settings_id?: string | null
          created_at?: string
          error_message?: string | null
          generated_image_r2_key?: string | null
          generated_image_url?: string | null
          has_outbound_link?: boolean
          id?: string
          image_prompt_used?: string | null
          impressions?: number
          last_analytics_at?: string | null
          outbound_clicks?: number
          pin_description?: string | null
          pin_title?: string | null
          pin_url?: string | null
          pinterest_board_id?: string | null
          pinterest_pin_id?: string | null
          product_id?: string | null
          published_at?: string | null
          rendered_image_r2_key?: string | null
          rendered_image_url?: string | null
          saves?: number
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pins_brand_settings_id_fkey"
            columns: ["brand_settings_id"]
            isOneToOne: false
            referencedRelation: "brand_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pins_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pinterest_connections: {
        Row: {
          access_token: string
          account_age_days: number | null
          created_at: string
          expires_at: string | null
          id: string
          pinterest_user_id: string | null
          refresh_token: string | null
          trust_score: number | null
          updated_at: string
          user_id: string
          warmup_phase: string
        }
        Insert: {
          access_token: string
          account_age_days?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          pinterest_user_id?: string | null
          refresh_token?: string | null
          trust_score?: number | null
          updated_at?: string
          user_id: string
          warmup_phase?: string
        }
        Update: {
          access_token?: string
          account_age_days?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          pinterest_user_id?: string | null
          refresh_token?: string | null
          trust_score?: number | null
          updated_at?: string
          user_id?: string
          warmup_phase?: string
        }
        Relationships: []
      }
      catalog_stores: {
        Row: {
          id: string
          user_id: string
          brand_settings_id: string | null
          canonical_url: string
          platform: string
          sync_status: string
          last_synced_at: string | null
          last_started_at: string | null
          last_error: string | null
          product_count: number
          sitemap_url: string | null
          sitemap_fingerprint: string | null
          sitemap_product_count: number | null
          sitemap_urls_sample: string[] | null
          last_extractor_used: string | null
          robots_allowed: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          brand_settings_id?: string | null
          canonical_url: string
          platform?: string
          sync_status?: string
          last_synced_at?: string | null
          last_started_at?: string | null
          last_error?: string | null
          product_count?: number
          sitemap_url?: string | null
          sitemap_fingerprint?: string | null
          sitemap_product_count?: number | null
          sitemap_urls_sample?: string[] | null
          last_extractor_used?: string | null
          robots_allowed?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          brand_settings_id?: string | null
          canonical_url?: string
          platform?: string
          sync_status?: string
          last_synced_at?: string | null
          last_started_at?: string | null
          last_error?: string | null
          product_count?: number
          sitemap_url?: string | null
          sitemap_fingerprint?: string | null
          sitemap_product_count?: number | null
          sitemap_urls_sample?: string[] | null
          last_extractor_used?: string | null
          robots_allowed?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_stores_brand_settings_id_fkey"
            columns: ["brand_settings_id"]
            isOneToOne: false
            referencedRelation: "brand_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_sync_runs: {
        Row: {
          id: string
          catalog_store_id: string
          user_id: string
          trigger_source: string
          status: string
          extractor_used: string | null
          products_seen: number
          products_inserted: number
          products_updated: number
          products_unchanged: number
          products_unavailable: number
          pages_fetched: number
          sitemap_short_circuited: boolean
          error_message: string | null
          started_at: string
          finished_at: string | null
          meta: Json
        }
        Insert: {
          id?: string
          catalog_store_id: string
          user_id: string
          trigger_source?: string
          status?: string
          extractor_used?: string | null
          products_seen?: number
          products_inserted?: number
          products_updated?: number
          products_unchanged?: number
          products_unavailable?: number
          pages_fetched?: number
          sitemap_short_circuited?: boolean
          error_message?: string | null
          started_at?: string
          finished_at?: string | null
          meta?: Json
        }
        Update: {
          id?: string
          catalog_store_id?: string
          user_id?: string
          trigger_source?: string
          status?: string
          extractor_used?: string | null
          products_seen?: number
          products_inserted?: number
          products_updated?: number
          products_unchanged?: number
          products_unavailable?: number
          pages_fetched?: number
          sitemap_short_circuited?: boolean
          error_message?: string | null
          started_at?: string
          finished_at?: string | null
          meta?: Json
        }
        Relationships: [
          {
            foreignKeyName: "catalog_sync_runs_catalog_store_id_fkey"
            columns: ["catalog_store_id"]
            isOneToOne: false
            referencedRelation: "catalog_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_settings_id: string | null
          catalog_store_id: string | null
          content_hash: string | null
          created_at: string
          currency: string | null
          description: string | null
          handle: string | null
          id: string
          image_r2_key: string | null
          image_url: string | null
          is_active: boolean
          last_seen_at: string | null
          lifecycle_status: string
          marketed: boolean
          marketing_priority: number
          missing_sync_count: number
          platform_product_id: string | null
          price: number | null
          product_url: string | null
          sku: string | null
          source: string
          source_product_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_settings_id?: string | null
          catalog_store_id?: string | null
          content_hash?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          handle?: string | null
          id?: string
          image_r2_key?: string | null
          image_url?: string | null
          is_active?: boolean
          last_seen_at?: string | null
          lifecycle_status?: string
          marketed?: boolean
          marketing_priority?: number
          missing_sync_count?: number
          platform_product_id?: string | null
          price?: number | null
          product_url?: string | null
          sku?: string | null
          source?: string
          source_product_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_settings_id?: string | null
          catalog_store_id?: string | null
          content_hash?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          handle?: string | null
          id?: string
          image_r2_key?: string | null
          image_url?: string | null
          is_active?: boolean
          last_seen_at?: string | null
          lifecycle_status?: string
          missing_sync_count?: number
          platform_product_id?: string | null
          price?: number | null
          product_url?: string | null
          sku?: string | null
          source?: string
          source_product_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_settings_id_fkey"
            columns: ["brand_settings_id"]
            isOneToOne: false
            referencedRelation: "brand_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_catalog_store_id_fkey"
            columns: ["catalog_store_id"]
            isOneToOne: false
            referencedRelation: "catalog_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          credits_remaining: number | null
          default_brand_id: string | null
          email: string | null
          id: string
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits_remaining?: number | null
          default_brand_id?: string | null
          email?: string | null
          id: string
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits_remaining?: number | null
          default_brand_id?: string | null
          email?: string | null
          id?: string
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_brand_id_fkey"
            columns: ["default_brand_id"]
            isOneToOne: false
            referencedRelation: "brand_details"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_weights: {
        Row: {
          aesthetic_tags: string[] | null
          avg_click_rate: number
          brand_settings_id: string | null
          created_at: string
          id: string
          prompt_template: string
          total_clicks: number
          total_pins_used: number
          updated_at: string
          user_id: string
          weight: number
        }
        Insert: {
          aesthetic_tags?: string[] | null
          avg_click_rate?: number
          brand_settings_id?: string | null
          created_at?: string
          id?: string
          prompt_template: string
          total_clicks?: number
          total_pins_used?: number
          updated_at?: string
          user_id: string
          weight?: number
        }
        Update: {
          aesthetic_tags?: string[] | null
          avg_click_rate?: number
          brand_settings_id?: string | null
          created_at?: string
          id?: string
          prompt_template?: string
          total_clicks?: number
          total_pins_used?: number
          updated_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_weights_brand_settings_id_fkey"
            columns: ["brand_settings_id"]
            isOneToOne: false
            referencedRelation: "brand_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_metrics: {
        Row: {
          accessibility_desktop: number | null
          accessibility_mobile: number | null
          best_practices_desktop: number | null
          best_practices_mobile: number | null
          brand_id: string | null
          cls_desktop: number | null
          cls_mobile: number | null
          created_at: string | null
          domain: string
          domain_authority: number | null
          error_message: string | null
          external_links: number | null
          fcp_desktop: number | null
          fcp_mobile: number | null
          fetched_at: string | null
          id: string
          lcp_desktop: number | null
          lcp_mobile: number | null
          linking_root_domains: number | null
          page_authority: number | null
          performance_desktop: number | null
          performance_mobile: number | null
          recommendations_desktop: Json | null
          recommendations_mobile: Json | null
          seo_desktop: number | null
          seo_mobile: number | null
          status: string | null
          tbt_desktop: number | null
          tbt_mobile: number | null
          user_id: string
        }
        Insert: {
          accessibility_desktop?: number | null
          accessibility_mobile?: number | null
          best_practices_desktop?: number | null
          best_practices_mobile?: number | null
          brand_id?: string | null
          cls_desktop?: number | null
          cls_mobile?: number | null
          created_at?: string | null
          domain: string
          domain_authority?: number | null
          error_message?: string | null
          external_links?: number | null
          fcp_desktop?: number | null
          fcp_mobile?: number | null
          fetched_at?: string | null
          id?: string
          lcp_desktop?: number | null
          lcp_mobile?: number | null
          linking_root_domains?: number | null
          page_authority?: number | null
          performance_desktop?: number | null
          performance_mobile?: number | null
          recommendations_desktop?: Json | null
          recommendations_mobile?: Json | null
          seo_desktop?: number | null
          seo_mobile?: number | null
          status?: string | null
          tbt_desktop?: number | null
          tbt_mobile?: number | null
          user_id: string
        }
        Update: {
          accessibility_desktop?: number | null
          accessibility_mobile?: number | null
          best_practices_desktop?: number | null
          best_practices_mobile?: number | null
          brand_id?: string | null
          cls_desktop?: number | null
          cls_mobile?: number | null
          created_at?: string | null
          domain?: string
          domain_authority?: number | null
          error_message?: string | null
          external_links?: number | null
          fcp_desktop?: number | null
          fcp_mobile?: number | null
          fetched_at?: string | null
          id?: string
          lcp_desktop?: number | null
          lcp_mobile?: number | null
          linking_root_domains?: number | null
          page_authority?: number | null
          performance_desktop?: number | null
          performance_mobile?: number | null
          recommendations_desktop?: Json | null
          recommendations_mobile?: Json | null
          seo_desktop?: number | null
          seo_mobile?: number | null
          status?: string | null
          tbt_desktop?: number | null
          tbt_mobile?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_metrics_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand_details"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_connections: {
        Row: {
          access_token: string
          blog_id: string
          blog_title: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          store_domain: string
          store_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          blog_id: string
          blog_title?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          store_domain: string
          store_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          blog_id?: string
          blog_title?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          store_domain?: string
          store_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sprint_packages: {
        Row: {
          code: string
          created_at: string
          currency: string
          dodo_product_id: string | null
          duration_days: number
          id: string
          is_active: boolean
          metadata: Json
          name: string
          price: number
          quota_new_articles: number
          quota_refresh_articles: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          dodo_product_id?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          price: number
          quota_new_articles: number
          quota_refresh_articles: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          dodo_product_id?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          price?: number
          quota_new_articles?: number
          quota_refresh_articles?: number
          updated_at?: string
        }
        Relationships: []
      }
      sprint_quota_ledgers: {
        Row: {
          article_id: string | null
          content_plan_item_id: string | null
          correlation_id: string | null
          created_at: string
          delta: number
          id: string
          meta: Json
          quota_type: Database["public"]["Enums"]["sprint_quota_type"]
          reason: string
          user_sprint_id: string
        }
        Insert: {
          article_id?: string | null
          content_plan_item_id?: string | null
          correlation_id?: string | null
          created_at?: string
          delta: number
          id?: string
          meta?: Json
          quota_type: Database["public"]["Enums"]["sprint_quota_type"]
          reason: string
          user_sprint_id: string
        }
        Update: {
          article_id?: string | null
          content_plan_item_id?: string | null
          correlation_id?: string | null
          created_at?: string
          delta?: number
          id?: string
          meta?: Json
          quota_type?: Database["public"]["Enums"]["sprint_quota_type"]
          reason?: string
          user_sprint_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprint_quota_ledgers_user_sprint_id_fkey"
            columns: ["user_sprint_id"]
            isOneToOne: false
            referencedRelation: "user_sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_registry: {
        Row: {
          canonical_keyword: string
          cluster_id: string | null
          created_at: string
          embedding: string | null
          funnel_role: string | null
          id: string
          intent: string | null
          metadata: Json
          normalized_slug: string
          reason: string | null
          source_batch_id: string | null
          state: Database["public"]["Enums"]["topic_registry_state"]
          title: string
          updated_at: string
          user_sprint_id: string
        }
        Insert: {
          canonical_keyword: string
          cluster_id?: string | null
          created_at?: string
          embedding?: string | null
          funnel_role?: string | null
          id?: string
          intent?: string | null
          metadata?: Json
          normalized_slug: string
          reason?: string | null
          source_batch_id?: string | null
          state?: Database["public"]["Enums"]["topic_registry_state"]
          title: string
          updated_at?: string
          user_sprint_id: string
        }
        Update: {
          canonical_keyword?: string
          cluster_id?: string | null
          created_at?: string
          embedding?: string | null
          funnel_role?: string | null
          id?: string
          intent?: string | null
          metadata?: Json
          normalized_slug?: string
          reason?: string | null
          source_batch_id?: string | null
          state?: Database["public"]["Enums"]["topic_registry_state"]
          title?: string
          updated_at?: string
          user_sprint_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_registry_user_sprint_id_fkey"
            columns: ["user_sprint_id"]
            isOneToOne: false
            referencedRelation: "user_sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      topical_audits: {
        Row: {
          authority_score: number
          brand_id: string
          competitor_coverages: Json
          competitors_scanned: number
          created_at: string
          gap_matrix: Json
          generation_error: string | null
          generation_phase: string | null
          generation_status: string | null
          id: string
          niche_blueprint: Json
          pillar_scores: Json
          pillar_suggestions: Json
          projected_score: number
          topics_analyzed: number
          updated_at: string
          user_coverage: Json
          user_id: string
          user_pages_scanned: number | null
        }
        Insert: {
          authority_score?: number
          brand_id: string
          competitor_coverages?: Json
          competitors_scanned?: number
          created_at?: string
          gap_matrix?: Json
          generation_error?: string | null
          generation_phase?: string | null
          generation_status?: string | null
          id?: string
          niche_blueprint?: Json
          pillar_scores?: Json
          pillar_suggestions?: Json
          projected_score?: number
          topics_analyzed?: number
          updated_at?: string
          user_coverage?: Json
          user_id: string
          user_pages_scanned?: number | null
        }
        Update: {
          authority_score?: number
          brand_id?: string
          competitor_coverages?: Json
          competitors_scanned?: number
          created_at?: string
          gap_matrix?: Json
          generation_error?: string | null
          generation_phase?: string | null
          generation_status?: string | null
          id?: string
          niche_blueprint?: Json
          pillar_scores?: Json
          pillar_suggestions?: Json
          projected_score?: number
          topics_analyzed?: number
          updated_at?: string
          user_coverage?: Json
          user_id?: string
          user_pages_scanned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "topical_audits_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand_details"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          created_at: string
          feedback_text: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_text: string
          id?: number
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_text?: string
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      user_sprints: {
        Row: {
          activated_at: string | null
          brand_id: string | null
          completed_at: string | null
          created_at: string
          dodo_checkout_id: string | null
          dodo_payment_id: string | null
          ends_at: string | null
          id: string
          metadata: Json
          package_id: string
          starts_at: string | null
          status: Database["public"]["Enums"]["sprint_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          brand_id?: string | null
          completed_at?: string | null
          created_at?: string
          dodo_checkout_id?: string | null
          dodo_payment_id?: string | null
          ends_at?: string | null
          id?: string
          metadata?: Json
          package_id: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["sprint_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          brand_id?: string | null
          completed_at?: string | null
          created_at?: string
          dodo_checkout_id?: string | null
          dodo_payment_id?: string | null
          ends_at?: string | null
          id?: string
          metadata?: Json
          package_id?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["sprint_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sprints_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sprints_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "sprint_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      webflow_connections: {
        Row: {
          api_token: string
          collection_id: string
          created_at: string | null
          field_mapping: Json | null
          id: string
          is_default: boolean | null
          site_id: string
          site_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_token: string
          collection_id: string
          created_at?: string | null
          field_mapping?: Json | null
          id?: string
          is_default?: boolean | null
          site_id: string
          site_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_token?: string
          collection_id?: string
          created_at?: string | null
          field_mapping?: Json | null
          id?: string
          is_default?: boolean | null
          site_id?: string
          site_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wordpress_connections: {
        Row: {
          app_password: string
          created_at: string | null
          default_category_id: number | null
          id: string
          is_default: boolean | null
          site_name: string | null
          site_url: string
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          app_password: string
          created_at?: string | null
          default_category_id?: number | null
          id?: string
          is_default?: boolean | null
          site_name?: string | null
          site_url: string
          updated_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          app_password?: string
          created_at?: string | null
          default_category_id?: number | null
          id?: string
          is_default?: boolean | null
          site_name?: string | null
          site_url?: string
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_ai_tokens: { Args: { p_user_id: string }; Returns: Json }
      find_covered_answer: {
        Args: {
          brand_uuid: string
          check_embedding: string
          match_threshold: number
        }
        Returns: {
          answer_text: string
          article_id: string
          similarity: number
        }[]
      }
      find_live_url_from_article: {
        Args: {
          brand_uuid: string
          match_threshold: number
          target_article_id: string
        }
        Returns: {
          live_title: string
          live_url: string
          similarity: number
        }[]
      }
      get_sprint_balance: {
        Args: { p_user_sprint_id: string }
        Returns: {
          new_remaining: number
          new_total: number
          new_used: number
          refresh_remaining: number
          refresh_total: number
          refresh_used: number
        }[]
      }
      match_articles: {
        Args: {
          match_count: number
          match_threshold: number
          p_brand_id?: string
          p_user_id: string
          query_embedding: string
        }
        Returns: {
          id: string
          keyword: string
          similarity: number
        }[]
      }
      match_articles_topic: {
        Args: {
          match_count: number
          match_threshold: number
          p_brand_id?: string
          p_user_id: string
          query_embedding: string
        }
        Returns: {
          id: string
          keyword: string
          similarity: number
        }[]
      }
      match_internal_links:
        | {
            Args: {
              match_count: number
              match_threshold: number
              p_brand_id: string
              p_user_id: string
              query_embedding: string
            }
            Returns: {
              id: string
              similarity: number
              title: string
              url: string
            }[]
          }
        | {
            Args: {
              match_count: number
              match_threshold: number
              p_user_id: string
              query_embedding: string
            }
            Returns: {
              id: string
              similarity: number
              title: string
              url: string
            }[]
          }
      record_ai_usage: {
        Args: { p_tokens_used: number; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      article_phase: "research" | "outline" | "writing" | "polish" | "trigger"
      article_status:
        | "queued"
        | "researching"
        | "outlining"
        | "writing"
        | "polishing"
        | "completed"
        | "failed"
      gsc_decay_candidate_status: "queued" | "selected" | "used" | "skipped"
      sprint_quota_type: "new" | "refresh"
      sprint_status:
        | "pending"
        | "active"
        | "paused"
        | "completed"
        | "expired"
        | "cancelled"
      topic_registry_state:
        | "candidate"
        | "reserved"
        | "accepted"
        | "merged"
        | "rejected"
        | "conflict_replacement_requested"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      article_phase: ["research", "outline", "writing", "polish", "trigger"],
      article_status: [
        "queued",
        "researching",
        "outlining",
        "writing",
        "polishing",
        "completed",
        "failed",
      ],
      gsc_decay_candidate_status: ["queued", "selected", "used", "skipped"],
      sprint_quota_type: ["new", "refresh"],
      sprint_status: [
        "pending",
        "active",
        "paused",
        "completed",
        "expired",
        "cancelled",
      ],
      topic_registry_state: [
        "candidate",
        "reserved",
        "accepted",
        "merged",
        "rejected",
        "conflict_replacement_requested",
      ],
    },
  },
} as const
