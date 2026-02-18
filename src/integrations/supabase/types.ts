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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_actions_log: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          target_id: string
          target_type: string
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id: string
          target_type: string
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          metadata: Json | null
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      attribution_sessions: {
        Row: {
          fbclid: string | null
          first_seen_at: string
          gclid: string | null
          id: string
          landing_url: string | null
          last_seen_at: string
          raw_params: Json | null
          ref: string | null
          referrer: string | null
          session_id: string
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          fbclid?: string | null
          first_seen_at?: string
          gclid?: string | null
          id?: string
          landing_url?: string | null
          last_seen_at?: string
          raw_params?: Json | null
          ref?: string | null
          referrer?: string | null
          session_id: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          fbclid?: string | null
          first_seen_at?: string
          gclid?: string | null
          id?: string
          landing_url?: string | null
          last_seen_at?: string
          raw_params?: Json | null
          ref?: string | null
          referrer?: string | null
          session_id?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          left_at: string | null
          role_in_conversation: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          left_at?: string | null
          role_in_conversation: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          role_in_conversation?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          client_id: string
          created_at: string
          id: string
          job_id: string
          last_message_at: string | null
          last_message_preview: string | null
          last_read_at_client: string | null
          last_read_at_pro: string | null
          pro_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          job_id: string
          last_message_at?: string | null
          last_message_preview?: string | null
          last_read_at_client?: string | null
          last_read_at_pro?: string | null
          pro_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          job_id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          last_read_at_client?: string | null
          last_read_at_pro?: string | null
          pro_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "matched_jobs_for_professional"
            referencedColumns: ["id"]
          },
        ]
      }
      email_notifications_queue: {
        Row: {
          attempts: number
          created_at: string
          event_type: string
          id: string
          last_error: string | null
          payload: Json
          recipient_user_id: string | null
          sent_at: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          event_type: string
          id?: string
          last_error?: string | null
          payload?: Json
          recipient_user_id?: string | null
          sent_at?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          event_type?: string
          id?: string
          last_error?: string | null
          payload?: Json
          recipient_user_id?: string | null
          sent_at?: string | null
        }
        Relationships: []
      }
      forum_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          author_display_name: string | null
          author_id: string
          category_id: string
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          photos: string[] | null
          reply_count: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_display_name?: string | null
          author_id: string
          category_id: string
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          photos?: string[] | null
          reply_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_display_name?: string | null
          author_id?: string
          category_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          photos?: string[] | null
          reply_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies: {
        Row: {
          author_display_name: string | null
          author_id: string
          content: string
          created_at: string | null
          id: string
          parent_reply_id: string | null
          post_id: string
          updated_at: string | null
        }
        Insert: {
          author_display_name?: string | null
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          parent_reply_id?: string | null
          post_id: string
          updated_at?: string | null
        }
        Update: {
          author_display_name?: string | null
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          parent_reply_id?: string | null
          post_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      job_invites: {
        Row: {
          created_at: string
          id: string
          job_id: string
          message: string | null
          professional_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          message?: string | null
          professional_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          message?: string | null
          professional_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_invites_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_invites_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_invites_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_invites_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "matched_jobs_for_professional"
            referencedColumns: ["id"]
          },
        ]
      }
      job_notifications_queue: {
        Row: {
          attempts: number
          created_at: string
          event: string
          id: string
          job_id: string
          last_error: string | null
          sent_at: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          event?: string
          id?: string
          job_id: string
          last_error?: string | null
          sent_at?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          event?: string
          id?: string
          job_id?: string
          last_error?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_notifications_queue_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_notifications_queue_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_notifications_queue_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_notifications_queue_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "matched_jobs_for_professional"
            referencedColumns: ["id"]
          },
        ]
      }
      job_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          job_id: string
          rating: number
          reviewee_role: string
          reviewee_user_id: string
          reviewer_role: string
          reviewer_user_id: string
          updated_at: string | null
          visibility: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          job_id: string
          rating: number
          reviewee_role: string
          reviewee_user_id: string
          reviewer_role: string
          reviewer_user_id: string
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          job_id?: string
          rating?: number
          reviewee_role?: string
          reviewee_user_id?: string
          reviewer_role?: string
          reviewer_user_id?: string
          updated_at?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "matched_jobs_for_professional"
            referencedColumns: ["id"]
          },
        ]
      }
      job_status_history: {
        Row: {
          change_source: string
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          job_id: string
          metadata: Json
          to_status: string
        }
        Insert: {
          change_source?: string
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          job_id: string
          metadata?: Json
          to_status: string
        }
        Update: {
          change_source?: string
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          job_id?: string
          metadata?: Json
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "matched_jobs_for_professional"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          answers: Json | null
          area: string | null
          assigned_professional_id: string | null
          attribution: Json | null
          budget_max: number | null
          budget_min: number | null
          budget_type: string | null
          budget_value: number | null
          category: string | null
          completed_at: string | null
          computed_inspection_bias: string | null
          computed_safety: string | null
          created_at: string
          description: string | null
          flags: string[] | null
          has_photos: boolean | null
          highlights: string[]
          id: string
          is_publicly_listed: boolean
          location: Json | null
          micro_slug: string | null
          start_date: string | null
          start_timing: string | null
          status: string
          subcategory: string | null
          teaser: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json | null
          area?: string | null
          assigned_professional_id?: string | null
          attribution?: Json | null
          budget_max?: number | null
          budget_min?: number | null
          budget_type?: string | null
          budget_value?: number | null
          category?: string | null
          completed_at?: string | null
          computed_inspection_bias?: string | null
          computed_safety?: string | null
          created_at?: string
          description?: string | null
          flags?: string[] | null
          has_photos?: boolean | null
          highlights?: string[]
          id?: string
          is_publicly_listed?: boolean
          location?: Json | null
          micro_slug?: string | null
          start_date?: string | null
          start_timing?: string | null
          status?: string
          subcategory?: string | null
          teaser?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json | null
          area?: string | null
          assigned_professional_id?: string | null
          attribution?: Json | null
          budget_max?: number | null
          budget_min?: number | null
          budget_type?: string | null
          budget_value?: number | null
          category?: string | null
          completed_at?: string | null
          computed_inspection_bias?: string | null
          computed_safety?: string | null
          created_at?: string
          description?: string | null
          flags?: string[] | null
          has_photos?: boolean | null
          highlights?: string[]
          id?: string
          is_publicly_listed?: boolean
          location?: Json | null
          micro_slug?: string | null
          start_date?: string | null
          start_timing?: string | null
          status?: string
          subcategory?: string | null
          teaser?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          message_type: string
          metadata: Json | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          digest_frequency: string
          email_digests: boolean
          email_job_matches: boolean
          email_messages: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          digest_frequency?: string
          email_digests?: boolean
          email_job_matches?: boolean
          email_messages?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          digest_frequency?: string
          email_digests?: boolean
          email_job_matches?: boolean
          email_messages?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      professional_documents: {
        Row: {
          created_at: string | null
          document_type: string
          file_name: string | null
          file_path: string
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_type: string
          file_name?: string | null
          file_path: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_type?: string
          file_name?: string | null
          file_path?: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      professional_micro_preferences: {
        Row: {
          created_at: string
          id: string
          max_distance_km: number | null
          micro_id: string
          min_budget_eur: number | null
          notes: string | null
          preference: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_distance_km?: number | null
          micro_id: string
          min_budget_eur?: number | null
          notes?: string | null
          preference?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_distance_km?: number | null
          micro_id?: string
          min_budget_eur?: number | null
          notes?: string | null
          preference?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_micro_preferences_micro_id_fkey"
            columns: ["micro_id"]
            isOneToOne: false
            referencedRelation: "service_micro_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_micro_preferences_micro_id_fkey"
            columns: ["micro_id"]
            isOneToOne: false
            referencedRelation: "service_search_index"
            referencedColumns: ["micro_id"]
          },
        ]
      }
      professional_micro_stats: {
        Row: {
          accepted_jobs_count: number
          avg_rating: number | null
          avg_response_minutes: number | null
          completed_jobs_count: number
          created_at: string
          declined_jobs_count: number
          id: string
          last_completed_at: string | null
          micro_id: string
          rating_count: number
          total_rating_sum: number
          updated_at: string
          user_id: string
          verification_level: string
        }
        Insert: {
          accepted_jobs_count?: number
          avg_rating?: number | null
          avg_response_minutes?: number | null
          completed_jobs_count?: number
          created_at?: string
          declined_jobs_count?: number
          id?: string
          last_completed_at?: string | null
          micro_id: string
          rating_count?: number
          total_rating_sum?: number
          updated_at?: string
          user_id: string
          verification_level?: string
        }
        Update: {
          accepted_jobs_count?: number
          avg_rating?: number | null
          avg_response_minutes?: number | null
          completed_jobs_count?: number
          created_at?: string
          declined_jobs_count?: number
          id?: string
          last_completed_at?: string | null
          micro_id?: string
          rating_count?: number
          total_rating_sum?: number
          updated_at?: string
          user_id?: string
          verification_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_micro_stats_micro_id_fkey"
            columns: ["micro_id"]
            isOneToOne: false
            referencedRelation: "service_micro_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_micro_stats_micro_id_fkey"
            columns: ["micro_id"]
            isOneToOne: false
            referencedRelation: "service_search_index"
            referencedColumns: ["micro_id"]
          },
        ]
      }
      professional_profiles: {
        Row: {
          accepts_emergency: boolean | null
          availability_status: string | null
          avatar_url: string | null
          base_location: Json | null
          bio: string | null
          business_name: string | null
          created_at: string
          day_rate: number | null
          display_name: string | null
          emergency_multiplier: number | null
          hourly_rate_max: number | null
          hourly_rate_min: number | null
          id: string
          is_publicly_listed: boolean
          location: Json | null
          metadata: Json | null
          minimum_call_out: number | null
          onboarding_phase: string
          pricing_model: string | null
          profile_status: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_area_type: string | null
          service_radius_km: number | null
          service_zones: string[] | null
          services_count: number
          submitted_at: string | null
          tagline: string | null
          typical_lead_time: string | null
          updated_at: string
          user_id: string
          verification_status: string
          working_hours: Json | null
        }
        Insert: {
          accepts_emergency?: boolean | null
          availability_status?: string | null
          avatar_url?: string | null
          base_location?: Json | null
          bio?: string | null
          business_name?: string | null
          created_at?: string
          day_rate?: number | null
          display_name?: string | null
          emergency_multiplier?: number | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          is_publicly_listed?: boolean
          location?: Json | null
          metadata?: Json | null
          minimum_call_out?: number | null
          onboarding_phase?: string
          pricing_model?: string | null
          profile_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_area_type?: string | null
          service_radius_km?: number | null
          service_zones?: string[] | null
          services_count?: number
          submitted_at?: string | null
          tagline?: string | null
          typical_lead_time?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string
          working_hours?: Json | null
        }
        Update: {
          accepts_emergency?: boolean | null
          availability_status?: string | null
          avatar_url?: string | null
          base_location?: Json | null
          bio?: string | null
          business_name?: string | null
          created_at?: string
          day_rate?: number | null
          display_name?: string | null
          emergency_multiplier?: number | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          is_publicly_listed?: boolean
          location?: Json | null
          metadata?: Json | null
          minimum_call_out?: number | null
          onboarding_phase?: string
          pricing_model?: string | null
          profile_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_area_type?: string | null
          service_radius_km?: number | null
          service_zones?: string[] | null
          services_count?: number
          submitted_at?: string | null
          tagline?: string | null
          typical_lead_time?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string
          working_hours?: Json | null
        }
        Relationships: []
      }
      professional_services: {
        Row: {
          created_at: string | null
          id: string
          micro_id: string
          notify: boolean | null
          searchable: boolean | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          micro_id: string
          notify?: boolean | null
          searchable?: boolean | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          micro_id?: string
          notify?: boolean | null
          searchable?: boolean | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_micro_id_fkey"
            columns: ["micro_id"]
            isOneToOne: false
            referencedRelation: "service_micro_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_micro_id_fkey"
            columns: ["micro_id"]
            isOneToOne: false
            referencedRelation: "service_search_index"
            referencedColumns: ["micro_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          first_touch_attribution: Json | null
          id: string
          last_touch_attribution: Json | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          first_touch_attribution?: Json | null
          id?: string
          last_touch_attribution?: Json | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          first_touch_attribution?: Json | null
          id?: string
          last_touch_attribution?: Json | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      question_packs: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          metadata: Json | null
          micro_slug: string
          questions: Json
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          micro_slug: string
          questions?: Json
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          micro_slug?: string
          questions?: Json
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          category_group: string | null
          created_at: string
          description: string | null
          display_order: number
          examples: string[] | null
          icon_emoji: string | null
          icon_name: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          category_group?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          examples?: string[] | null
          icon_emoji?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          category_group?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          examples?: string[] | null
          icon_emoji?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_listings: {
        Row: {
          created_at: string
          display_title: string
          gallery: string[] | null
          hero_image_url: string | null
          id: string
          location_base: string | null
          micro_id: string
          pricing_summary: string | null
          provider_id: string
          published_at: string | null
          short_description: string | null
          status: string
          updated_at: string
          view_count: number
        }
        Insert: {
          created_at?: string
          display_title?: string
          gallery?: string[] | null
          hero_image_url?: string | null
          id?: string
          location_base?: string | null
          micro_id: string
          pricing_summary?: string | null
          provider_id: string
          published_at?: string | null
          short_description?: string | null
          status?: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          created_at?: string
          display_title?: string
          gallery?: string[] | null
          hero_image_url?: string | null
          id?: string
          location_base?: string | null
          micro_id?: string
          pricing_summary?: string | null
          provider_id?: string
          published_at?: string | null
          short_description?: string | null
          status?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_listings_micro_id_fkey"
            columns: ["micro_id"]
            isOneToOne: false
            referencedRelation: "service_micro_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_listings_micro_id_fkey"
            columns: ["micro_id"]
            isOneToOne: false
            referencedRelation: "service_search_index"
            referencedColumns: ["micro_id"]
          },
        ]
      }
      service_micro_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          slug: string
          subcategory_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          slug: string
          subcategory_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          subcategory_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_micro_categories_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "service_search_index"
            referencedColumns: ["subcategory_id"]
          },
          {
            foreignKeyName: "service_micro_categories_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "service_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      service_pricing_items: {
        Row: {
          created_at: string
          id: string
          info_description: string | null
          is_enabled: boolean
          label: string
          price_amount: number | null
          price_currency: string
          service_listing_id: string
          sort_order: number
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          info_description?: string | null
          is_enabled?: boolean
          label: string
          price_amount?: number | null
          price_currency?: string
          service_listing_id: string
          sort_order?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          info_description?: string | null
          is_enabled?: boolean
          label?: string
          price_amount?: number | null
          price_currency?: string
          service_listing_id?: string
          sort_order?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_pricing_items_service_listing_id_fkey"
            columns: ["service_listing_id"]
            isOneToOne: false
            referencedRelation: "service_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_pricing_items_service_listing_id_fkey"
            columns: ["service_listing_id"]
            isOneToOne: false
            referencedRelation: "service_listings_browse"
            referencedColumns: ["id"]
          },
        ]
      }
      service_subcategories: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          display_order: number
          icon_emoji: string | null
          icon_name: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon_emoji?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon_emoji?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_search_index"
            referencedColumns: ["category_id"]
          },
        ]
      }
      service_views: {
        Row: {
          created_at: string
          id: string
          service_listing_id: string
          session_id: string | null
          viewer_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          service_listing_id: string
          session_id?: string | null
          viewer_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          service_listing_id?: string
          session_id?: string | null
          viewer_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_views_service_listing_id_fkey"
            columns: ["service_listing_id"]
            isOneToOne: false
            referencedRelation: "service_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_views_service_listing_id_fkey"
            columns: ["service_listing_id"]
            isOneToOne: false
            referencedRelation: "service_listings_browse"
            referencedColumns: ["id"]
          },
        ]
      }
      support_request_events: {
        Row: {
          actor_role: string
          actor_user_id: string
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          support_request_id: string
        }
        Insert: {
          actor_role: string
          actor_user_id: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          support_request_id: string
        }
        Update: {
          actor_role?: string
          actor_user_id?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          support_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_request_events_support_request_id_fkey"
            columns: ["support_request_id"]
            isOneToOne: false
            referencedRelation: "admin_support_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_request_events_support_request_id_fkey"
            columns: ["support_request_id"]
            isOneToOne: false
            referencedRelation: "support_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      support_requests: {
        Row: {
          assigned_to: string | null
          conversation_id: string | null
          created_at: string
          created_by_role: string
          created_by_user_id: string
          id: string
          issue_type: string
          job_id: string | null
          priority: string
          resolved_at: string | null
          status: string
          summary: string | null
          ticket_number: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          conversation_id?: string | null
          created_at?: string
          created_by_role: string
          created_by_user_id: string
          id?: string
          issue_type: string
          job_id?: string | null
          priority?: string
          resolved_at?: string | null
          status?: string
          summary?: string | null
          ticket_number?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          conversation_id?: string | null
          created_at?: string
          created_by_role?: string
          created_by_user_id?: string
          id?: string
          issue_type?: string
          job_id?: string | null
          priority?: string
          resolved_at?: string | null
          status?: string
          summary?: string | null
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_requests_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "matched_jobs_for_professional"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          active_role: string
          created_at: string
          id: string
          roles: string[]
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_role?: string
          created_at?: string
          id?: string
          roles?: string[]
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_role?: string
          created_at?: string
          id?: string
          roles?: string[]
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_platform_stats: {
        Row: {
          active_jobs: number | null
          active_professionals: number | null
          completed_jobs: number | null
          new_support_tickets: number | null
          open_jobs: number | null
          open_support_tickets: number | null
          total_conversations: number | null
          total_jobs: number | null
          total_posts: number | null
          total_professionals: number | null
          total_users: number | null
        }
        Relationships: []
      }
      admin_support_inbox: {
        Row: {
          age_hours: number | null
          assigned_to: string | null
          client_id: string | null
          conversation_id: string | null
          created_at: string | null
          created_by_role: string | null
          created_by_user_id: string | null
          id: string | null
          issue_type: string | null
          job_category: string | null
          job_id: string | null
          job_title: string | null
          last_message_at: string | null
          last_message_preview: string | null
          priority: string | null
          pro_id: string | null
          resolved_at: string | null
          status: string | null
          summary: string | null
          ticket_number: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_requests_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "matched_jobs_for_professional"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users_list: {
        Row: {
          active_role: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          phone: string | null
          pro_is_listed: boolean | null
          pro_onboarding_phase: string | null
          pro_services_count: number | null
          pro_verification_status: string | null
          roles: string[] | null
          status: string | null
          suspended_at: string | null
          suspension_reason: string | null
        }
        Relationships: []
      }
      job_details: {
        Row: {
          answers: Json | null
          area: string | null
          budget_max: number | null
          budget_min: number | null
          budget_type: string | null
          budget_value: number | null
          category: string | null
          computed_inspection_bias: string | null
          computed_safety: string | null
          created_at: string | null
          description: string | null
          flags: string[] | null
          has_photos: boolean | null
          highlights: string[] | null
          id: string | null
          is_owner: boolean | null
          is_publicly_listed: boolean | null
          location: Json | null
          micro_slug: string | null
          start_date: string | null
          start_timing: string | null
          status: string | null
          subcategory: string | null
          teaser: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          area?: string | null
          budget_max?: number | null
          budget_min?: number | null
          budget_type?: string | null
          budget_value?: number | null
          category?: string | null
          computed_inspection_bias?: string | null
          computed_safety?: string | null
          created_at?: string | null
          description?: string | null
          flags?: string[] | null
          has_photos?: boolean | null
          highlights?: string[] | null
          id?: string | null
          is_owner?: never
          is_publicly_listed?: boolean | null
          location?: Json | null
          micro_slug?: string | null
          start_date?: string | null
          start_timing?: string | null
          status?: string | null
          subcategory?: string | null
          teaser?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          area?: string | null
          budget_max?: number | null
          budget_min?: number | null
          budget_type?: string | null
          budget_value?: number | null
          category?: string | null
          computed_inspection_bias?: string | null
          computed_safety?: string | null
          created_at?: string | null
          description?: string | null
          flags?: string[] | null
          has_photos?: boolean | null
          highlights?: string[] | null
          id?: string | null
          is_owner?: never
          is_publicly_listed?: boolean | null
          location?: Json | null
          micro_slug?: string | null
          start_date?: string | null
          start_timing?: string | null
          status?: string | null
          subcategory?: string | null
          teaser?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      jobs_board: {
        Row: {
          area: string | null
          budget_max: number | null
          budget_min: number | null
          budget_type: string | null
          budget_value: number | null
          category: string | null
          computed_inspection_bias: string | null
          computed_safety: string | null
          created_at: string | null
          flags: string[] | null
          has_photos: boolean | null
          highlights: string[] | null
          id: string | null
          is_publicly_listed: boolean | null
          location: Json | null
          micro_slug: string | null
          start_date: string | null
          start_timing: string | null
          status: string | null
          subcategory: string | null
          teaser: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          area?: string | null
          budget_max?: number | null
          budget_min?: number | null
          budget_type?: string | null
          budget_value?: number | null
          category?: string | null
          computed_inspection_bias?: string | null
          computed_safety?: string | null
          created_at?: string | null
          flags?: string[] | null
          has_photos?: boolean | null
          highlights?: string[] | null
          id?: string | null
          is_publicly_listed?: boolean | null
          location?: Json | null
          micro_slug?: string | null
          start_date?: string | null
          start_timing?: string | null
          status?: string | null
          subcategory?: string | null
          teaser?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          area?: string | null
          budget_max?: number | null
          budget_min?: number | null
          budget_type?: string | null
          budget_value?: number | null
          category?: string | null
          computed_inspection_bias?: string | null
          computed_safety?: string | null
          created_at?: string | null
          flags?: string[] | null
          has_photos?: boolean | null
          highlights?: string[] | null
          id?: string | null
          is_publicly_listed?: boolean | null
          location?: Json | null
          micro_slug?: string | null
          start_date?: string | null
          start_timing?: string | null
          status?: string | null
          subcategory?: string | null
          teaser?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      matched_jobs_for_professional: {
        Row: {
          area: string | null
          budget_max: number | null
          budget_min: number | null
          budget_type: string | null
          budget_value: number | null
          category: string | null
          computed_inspection_bias: string | null
          computed_safety: string | null
          created_at: string | null
          flags: string[] | null
          has_photos: boolean | null
          highlights: string[] | null
          id: string | null
          is_publicly_listed: boolean | null
          location: Json | null
          micro_slug: string | null
          professional_user_id: string | null
          start_date: string | null
          start_timing: string | null
          status: string | null
          subcategory: string | null
          teaser: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      professional_matching_scores: {
        Row: {
          avg_rating: number | null
          completed_jobs_count: number | null
          match_score: number | null
          micro_id: string | null
          notify: boolean | null
          preference: string | null
          searchable: boolean | null
          status: string | null
          user_id: string | null
          verification_level: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_micro_id_fkey"
            columns: ["micro_id"]
            isOneToOne: false
            referencedRelation: "service_micro_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_micro_id_fkey"
            columns: ["micro_id"]
            isOneToOne: false
            referencedRelation: "service_search_index"
            referencedColumns: ["micro_id"]
          },
        ]
      }
      public_professional_details: {
        Row: {
          avatar_url: string | null
          bio: string | null
          display_name: string | null
          id: string | null
          services_count: number | null
          verification_status: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          display_name?: string | null
          id?: string | null
          services_count?: number | null
          verification_status?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          display_name?: string | null
          id?: string | null
          services_count?: number | null
          verification_status?: string | null
        }
        Relationships: []
      }
      public_professionals_preview: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          id: string | null
          services_count: number | null
          verification_status: string | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string | null
          services_count?: number | null
          verification_status?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string | null
          services_count?: number | null
          verification_status?: string | null
        }
        Relationships: []
      }
      service_listings_browse: {
        Row: {
          category_name: string | null
          category_slug: string | null
          created_at: string | null
          display_title: string | null
          hero_image_url: string | null
          id: string | null
          location_base: string | null
          micro_id: string | null
          micro_name: string | null
          micro_slug: string | null
          pricing_summary: string | null
          provider_avatar: string | null
          provider_id: string | null
          provider_name: string | null
          provider_verification: string | null
          published_at: string | null
          short_description: string | null
          starting_price: number | null
          starting_price_unit: string | null
          subcategory_name: string | null
          subcategory_slug: string | null
          view_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_listings_micro_id_fkey"
            columns: ["micro_id"]
            isOneToOne: false
            referencedRelation: "service_micro_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_listings_micro_id_fkey"
            columns: ["micro_id"]
            isOneToOne: false
            referencedRelation: "service_search_index"
            referencedColumns: ["micro_id"]
          },
        ]
      }
      service_search_index: {
        Row: {
          category_id: string | null
          category_name: string | null
          has_pack: boolean | null
          micro_id: string | null
          micro_name: string | null
          micro_slug: string | null
          search_text: string | null
          subcategory_id: string | null
          subcategory_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_health_snapshot: { Args: never; Returns: Json }
      admin_market_gap: {
        Args: { p_from_ts?: string; p_to_ts?: string }
        Returns: Json
      }
      admin_metric_drilldown: {
        Args: {
          p_area_filter?: string
          p_category_filter?: string
          p_from_ts: string
          p_limit_n?: number
          p_metric_key: string
          p_offset_n?: number
          p_to_ts: string
        }
        Returns: Json
      }
      admin_metric_timeseries: {
        Args: {
          p_area_filter?: string
          p_bucket?: string
          p_category_filter?: string
          p_from_ts: string
          p_metric_key: string
          p_to_ts: string
        }
        Returns: {
          bucket_start: string
          value: number
        }[]
      }
      admin_no_pro_reply_jobs: {
        Args: {
          p_from_ts?: string
          p_hours_threshold?: number
          p_to_ts?: string
        }
        Returns: Json
      }
      admin_onboarding_funnel: {
        Args: { p_from_ts?: string; p_to_ts?: string }
        Returns: Json
      }
      admin_operator_alerts: { Args: never; Returns: Json }
      admin_repeat_work: {
        Args: { p_from_ts?: string; p_to_ts?: string }
        Returns: Json
      }
      admin_top_sources: {
        Args: { p_from_ts?: string; p_to_ts?: string }
        Returns: Json
      }
      admin_unanswered_jobs: {
        Args: {
          p_from_ts?: string
          p_hours_threshold?: number
          p_to_ts?: string
        }
        Returns: Json
      }
      create_direct_conversation: {
        Args: { p_client_id: string; p_job_id: string; p_pro_id: string }
        Returns: string
      }
      create_draft_service_listings: {
        Args: { p_micro_ids: string[]; p_provider_id: string }
        Returns: {
          created_at: string
          display_title: string
          gallery: string[] | null
          hero_image_url: string | null
          id: string
          location_base: string | null
          micro_id: string
          pricing_summary: string | null
          provider_id: string
          published_at: string | null
          short_description: string | null
          status: string
          updated_at: string
          view_count: number
        }[]
        SetofOptions: {
          from: "*"
          to: "service_listings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_conversations_with_unread: {
        Args: never
        Returns: {
          client_id: string
          created_at: string
          id: string
          job_id: string
          last_message_at: string
          last_message_preview: string
          last_read_at_client: string
          last_read_at_pro: string
          pro_id: string
          unread_count: number
        }[]
      }
      get_or_create_conversation: {
        Args: { p_job_id: string; p_pro_id: string }
        Returns: string
      }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      increment_professional_micro_stats: {
        Args: { p_micro_id: string; p_rating?: number; p_user_id: string }
        Returns: undefined
      }
      track_event: {
        Args: { p_event_name: string; p_metadata?: Json; p_role?: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
