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
      admin_allowlist: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
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
      client_reputation: {
        Row: {
          avg_response_hours: number
          badges: string[]
          completed_jobs: number
          completion_rate: number
          dispute_rate: number
          repeat_hire_rate: number
          review_rate: number
          score: number
          total_jobs: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_response_hours?: number
          badges?: string[]
          completed_jobs?: number
          completion_rate?: number
          dispute_rate?: number
          repeat_hire_rate?: number
          review_rate?: number
          score?: number
          total_jobs?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_response_hours?: number
          badges?: string[]
          completed_jobs?: number
          completion_rate?: number
          dispute_rate?: number
          repeat_hire_rate?: number
          review_rate?: number
          score?: number
          total_jobs?: number
          updated_at?: string
          user_id?: string
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
            referencedRelation: "admin_unclassified_custom_jobs"
            referencedColumns: ["job_id"]
          },
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
      daily_category_metrics: {
        Row: {
          avg_job_score: number | null
          avg_responses: number | null
          category: string
          created_at: string
          dispute_rate: number | null
          id: string
          jobs_completed: number
          jobs_created: number
          jobs_disputed: number
          jobs_posted: number
          metric_date: string
          success_rate: number | null
        }
        Insert: {
          avg_job_score?: number | null
          avg_responses?: number | null
          category: string
          created_at?: string
          dispute_rate?: number | null
          id?: string
          jobs_completed?: number
          jobs_created?: number
          jobs_disputed?: number
          jobs_posted?: number
          metric_date: string
          success_rate?: number | null
        }
        Update: {
          avg_job_score?: number | null
          avg_responses?: number | null
          category?: string
          created_at?: string
          dispute_rate?: number | null
          id?: string
          jobs_completed?: number
          jobs_created?: number
          jobs_disputed?: number
          jobs_posted?: number
          metric_date?: string
          success_rate?: number | null
        }
        Relationships: []
      }
      daily_platform_metrics: {
        Row: {
          avg_job_score: number | null
          avg_response_time_hours: number | null
          created_at: string
          dispute_rate: number | null
          jobs_awarded: number
          jobs_completed: number
          jobs_created: number
          jobs_disputed: number
          jobs_posted: number
          jobs_with_zero_responses: number
          metric_date: string
          new_professionals: number
          new_users: number
          response_rate: number | null
          success_rate: number | null
          total_conversations: number
          total_messages: number
          updated_at: string
          wizard_completion_rate: number | null
        }
        Insert: {
          avg_job_score?: number | null
          avg_response_time_hours?: number | null
          created_at?: string
          dispute_rate?: number | null
          jobs_awarded?: number
          jobs_completed?: number
          jobs_created?: number
          jobs_disputed?: number
          jobs_posted?: number
          jobs_with_zero_responses?: number
          metric_date: string
          new_professionals?: number
          new_users?: number
          response_rate?: number | null
          success_rate?: number | null
          total_conversations?: number
          total_messages?: number
          updated_at?: string
          wizard_completion_rate?: number | null
        }
        Update: {
          avg_job_score?: number | null
          avg_response_time_hours?: number | null
          created_at?: string
          dispute_rate?: number | null
          jobs_awarded?: number
          jobs_completed?: number
          jobs_created?: number
          jobs_disputed?: number
          jobs_posted?: number
          jobs_with_zero_responses?: number
          metric_date?: string
          new_professionals?: number
          new_users?: number
          response_rate?: number | null
          success_rate?: number | null
          total_conversations?: number
          total_messages?: number
          updated_at?: string
          wizard_completion_rate?: number | null
        }
        Relationships: []
      }
      daily_worker_metrics: {
        Row: {
          completion_rate: number | null
          created_at: string
          disputes: number
          id: string
          jobs_completed: number
          jobs_received: number
          jobs_responded: number
          jobs_viewed: number
          metric_date: string
          response_rate: number | null
          trust_score_snapshot: number | null
          worker_id: string
        }
        Insert: {
          completion_rate?: number | null
          created_at?: string
          disputes?: number
          id?: string
          jobs_completed?: number
          jobs_received?: number
          jobs_responded?: number
          jobs_viewed?: number
          metric_date: string
          response_rate?: number | null
          trust_score_snapshot?: number | null
          worker_id: string
        }
        Update: {
          completion_rate?: number | null
          created_at?: string
          disputes?: number
          id?: string
          jobs_completed?: number
          jobs_received?: number
          jobs_responded?: number
          jobs_viewed?: number
          metric_date?: string
          response_rate?: number | null
          trust_score_snapshot?: number | null
          worker_id?: string
        }
        Relationships: []
      }
      demand_snapshots: {
        Row: {
          area: string | null
          category: string
          created_at: string
          id: string
          job_count_30d: number
          job_count_7d: number
          pct_change_7d: number | null
          snapshot_date: string
        }
        Insert: {
          area?: string | null
          category: string
          created_at?: string
          id?: string
          job_count_30d?: number
          job_count_7d?: number
          pct_change_7d?: number | null
          snapshot_date?: string
        }
        Update: {
          area?: string | null
          category?: string
          created_at?: string
          id?: string
          job_count_30d?: number
          job_count_7d?: number
          pct_change_7d?: number | null
          snapshot_date?: string
        }
        Relationships: []
      }
      dispute_ai_events: {
        Row: {
          created_at: string
          dispute_id: string
          event_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string
          dispute_id: string
          event_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string
          dispute_id?: string
          event_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "dispute_ai_events_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_analysis: {
        Row: {
          agreed_facts: Json | null
          confidence_score: number | null
          created_at: string
          dispute_id: string
          disputed_points: Json | null
          id: string
          is_current: boolean | null
          issue_types:
            | Database["public"]["Enums"]["dispute_issue_type"][]
            | null
          missing_evidence: Json | null
          raw_ai_response: Json | null
          requires_human_review: boolean | null
          suggested_pathway:
            | Database["public"]["Enums"]["resolution_pathway"]
            | null
          summary_neutral: string | null
        }
        Insert: {
          agreed_facts?: Json | null
          confidence_score?: number | null
          created_at?: string
          dispute_id: string
          disputed_points?: Json | null
          id?: string
          is_current?: boolean | null
          issue_types?:
            | Database["public"]["Enums"]["dispute_issue_type"][]
            | null
          missing_evidence?: Json | null
          raw_ai_response?: Json | null
          requires_human_review?: boolean | null
          suggested_pathway?:
            | Database["public"]["Enums"]["resolution_pathway"]
            | null
          summary_neutral?: string | null
        }
        Update: {
          agreed_facts?: Json | null
          confidence_score?: number | null
          created_at?: string
          dispute_id?: string
          disputed_points?: Json | null
          id?: string
          is_current?: boolean | null
          issue_types?:
            | Database["public"]["Enums"]["dispute_issue_type"][]
            | null
          missing_evidence?: Json | null
          raw_ai_response?: Json | null
          requires_human_review?: boolean | null
          suggested_pathway?:
            | Database["public"]["Enums"]["resolution_pathway"]
            | null
          summary_neutral?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispute_analysis_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_evidence: {
        Row: {
          created_at: string
          description: string | null
          dispute_id: string
          evidence_category: string | null
          file_name: string | null
          file_path: string
          file_size_bytes: number | null
          file_type: string
          id: string
          is_visible_to_counterparty: boolean | null
          related_issue_type: string | null
          submitted_by_role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          dispute_id: string
          evidence_category?: string | null
          file_name?: string | null
          file_path: string
          file_size_bytes?: number | null
          file_type?: string
          id?: string
          is_visible_to_counterparty?: boolean | null
          related_issue_type?: string | null
          submitted_by_role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          dispute_id?: string
          evidence_category?: string | null
          file_name?: string | null
          file_path?: string
          file_size_bytes?: number | null
          file_type?: string
          id?: string
          is_visible_to_counterparty?: boolean | null
          related_issue_type?: string | null
          submitted_by_role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_evidence_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_inputs: {
        Row: {
          created_at: string
          dispute_id: string
          id: string
          input_type: string
          questionnaire_answers: Json | null
          raw_text: string | null
          transcript: string | null
          user_id: string
          voice_file_path: string | null
        }
        Insert: {
          created_at?: string
          dispute_id: string
          id?: string
          input_type?: string
          questionnaire_answers?: Json | null
          raw_text?: string | null
          transcript?: string | null
          user_id: string
          voice_file_path?: string | null
        }
        Update: {
          created_at?: string
          dispute_id?: string
          id?: string
          input_type?: string
          questionnaire_answers?: Json | null
          raw_text?: string | null
          transcript?: string | null
          user_id?: string
          voice_file_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispute_inputs_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_status_history: {
        Row: {
          change_source: string
          changed_by: string | null
          created_at: string
          dispute_id: string
          from_status: Database["public"]["Enums"]["dispute_status"] | null
          id: string
          metadata: Json | null
          to_status: Database["public"]["Enums"]["dispute_status"]
        }
        Insert: {
          change_source?: string
          changed_by?: string | null
          created_at?: string
          dispute_id: string
          from_status?: Database["public"]["Enums"]["dispute_status"] | null
          id?: string
          metadata?: Json | null
          to_status: Database["public"]["Enums"]["dispute_status"]
        }
        Update: {
          change_source?: string
          changed_by?: string | null
          created_at?: string
          dispute_id?: string
          from_status?: Database["public"]["Enums"]["dispute_status"] | null
          id?: string
          metadata?: Json | null
          to_status?: Database["public"]["Enums"]["dispute_status"]
        }
        Relationships: [
          {
            foreignKeyName: "dispute_status_history_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          ai_confidence_score: number | null
          closed_at: string | null
          counterparty_id: string | null
          counterparty_responded_at: string | null
          created_at: string
          evidence_deadline: string | null
          human_review_required: boolean | null
          id: string
          issue_types: Database["public"]["Enums"]["dispute_issue_type"][]
          job_id: string
          milestone_label: string | null
          raised_by: string
          raised_by_role: string
          recommended_pathway:
            | Database["public"]["Enums"]["resolution_pathway"]
            | null
          requested_outcome: string | null
          resolution_accepted_at: string | null
          resolution_description: string | null
          resolution_type:
            | Database["public"]["Enums"]["resolution_pathway"]
            | null
          resolved_at: string | null
          response_deadline: string | null
          secondary_tags: string[] | null
          status: Database["public"]["Enums"]["dispute_status"]
          summary_neutral: string | null
          updated_at: string
        }
        Insert: {
          ai_confidence_score?: number | null
          closed_at?: string | null
          counterparty_id?: string | null
          counterparty_responded_at?: string | null
          created_at?: string
          evidence_deadline?: string | null
          human_review_required?: boolean | null
          id?: string
          issue_types?: Database["public"]["Enums"]["dispute_issue_type"][]
          job_id: string
          milestone_label?: string | null
          raised_by: string
          raised_by_role?: string
          recommended_pathway?:
            | Database["public"]["Enums"]["resolution_pathway"]
            | null
          requested_outcome?: string | null
          resolution_accepted_at?: string | null
          resolution_description?: string | null
          resolution_type?:
            | Database["public"]["Enums"]["resolution_pathway"]
            | null
          resolved_at?: string | null
          response_deadline?: string | null
          secondary_tags?: string[] | null
          status?: Database["public"]["Enums"]["dispute_status"]
          summary_neutral?: string | null
          updated_at?: string
        }
        Update: {
          ai_confidence_score?: number | null
          closed_at?: string | null
          counterparty_id?: string | null
          counterparty_responded_at?: string | null
          created_at?: string
          evidence_deadline?: string | null
          human_review_required?: boolean | null
          id?: string
          issue_types?: Database["public"]["Enums"]["dispute_issue_type"][]
          job_id?: string
          milestone_label?: string | null
          raised_by?: string
          raised_by_role?: string
          recommended_pathway?:
            | Database["public"]["Enums"]["resolution_pathway"]
            | null
          requested_outcome?: string | null
          resolution_accepted_at?: string | null
          resolution_description?: string | null
          resolution_type?:
            | Database["public"]["Enums"]["resolution_pathway"]
            | null
          resolved_at?: string | null
          response_deadline?: string | null
          secondary_tags?: string[] | null
          status?: Database["public"]["Enums"]["dispute_status"]
          summary_neutral?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "admin_unclassified_custom_jobs"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "disputes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_job_id_fkey"
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
          failed_at: string | null
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
          failed_at?: string | null
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
          failed_at?: string | null
          id?: string
          last_error?: string | null
          payload?: Json
          recipient_user_id?: string | null
          sent_at?: string | null
        }
        Relationships: []
      }
      error_events: {
        Row: {
          browser: string | null
          created_at: string
          error_type: string
          id: string
          message: string
          metadata: Json | null
          route: string | null
          stack: string | null
          url: string | null
          user_id: string | null
          viewport: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string
          error_type: string
          id?: string
          message: string
          metadata?: Json | null
          route?: string | null
          stack?: string | null
          url?: string | null
          user_id?: string | null
          viewport?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string
          error_type?: string
          id?: string
          message?: string
          metadata?: Json | null
          route?: string | null
          stack?: string | null
          url?: string | null
          user_id?: string | null
          viewport?: string | null
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
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_anonymous: boolean
          is_locked: boolean
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
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_anonymous?: boolean
          is_locked?: boolean
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
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_anonymous?: boolean
          is_locked?: boolean
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
          deleted_at: string | null
          deleted_by: string | null
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
          deleted_at?: string | null
          deleted_by?: string | null
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
          deleted_at?: string | null
          deleted_by?: string | null
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
      job_classification_suggestions: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          job_id: string
          model_name: string
          raw_output: Json | null
          reasoning_summary: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          suggested_category_slug: string | null
          suggested_micro_slugs: string[] | null
          suggested_subcategory_slug: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          job_id: string
          model_name: string
          raw_output?: Json | null
          reasoning_summary?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_category_slug?: string | null
          suggested_micro_slugs?: string[] | null
          suggested_subcategory_slug?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          job_id?: string
          model_name?: string
          raw_output?: Json | null
          reasoning_summary?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_category_slug?: string | null
          suggested_micro_slugs?: string[] | null
          suggested_subcategory_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_classification_suggestions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "admin_unclassified_custom_jobs"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_classification_suggestions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_classification_suggestions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_classification_suggestions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_classification_suggestions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "matched_jobs_for_professional"
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
            referencedRelation: "admin_unclassified_custom_jobs"
            referencedColumns: ["job_id"]
          },
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
      job_micro_links: {
        Row: {
          created_at: string
          id: string
          job_id: string
          micro_slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          micro_slug: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          micro_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_micro_links_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "admin_unclassified_custom_jobs"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_micro_links_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_micro_links_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_micro_links_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_micro_links_job_id_fkey"
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
            referencedRelation: "admin_unclassified_custom_jobs"
            referencedColumns: ["job_id"]
          },
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
      job_progress_updates: {
        Row: {
          author_id: string
          created_at: string
          id: string
          job_id: string
          note: string | null
          photo_url: string | null
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          job_id: string
          note?: string | null
          photo_url?: string | null
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          job_id?: string
          note?: string | null
          photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_progress_updates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "admin_unclassified_custom_jobs"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_progress_updates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_progress_updates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_progress_updates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_progress_updates_job_id_fkey"
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
            referencedRelation: "admin_unclassified_custom_jobs"
            referencedColumns: ["job_id"]
          },
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
            referencedRelation: "admin_unclassified_custom_jobs"
            referencedColumns: ["job_id"]
          },
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
          ai_generated_title: boolean | null
          answers: Json | null
          area: string | null
          assigned_professional_id: string | null
          attribution: Json | null
          budget_max: number | null
          budget_min: number | null
          budget_type: string | null
          budget_value: number | null
          cancellation_reason: string | null
          cancellation_requested_at: string | null
          cancellation_requested_by: string | null
          category: string | null
          completed_at: string | null
          completion_requested_at: string | null
          completion_requested_by: string | null
          computed_inspection_bias: string | null
          computed_safety: string | null
          created_at: string
          description: string | null
          description_i18n: Json | null
          edit_version: number
          flags: string[] | null
          has_photos: boolean | null
          highlights: string[]
          id: string
          is_custom_request: boolean
          is_publicly_listed: boolean
          job_score: number | null
          location: Json | null
          micro_slug: string | null
          source_lang: string | null
          start_date: string | null
          start_timing: string | null
          status: string
          subcategory: string | null
          teaser: string | null
          teaser_i18n: Json | null
          title: string
          title_i18n: Json | null
          translation_status: string | null
          updated_at: string
          user_id: string
          worker_brief: string | null
        }
        Insert: {
          ai_generated_title?: boolean | null
          answers?: Json | null
          area?: string | null
          assigned_professional_id?: string | null
          attribution?: Json | null
          budget_max?: number | null
          budget_min?: number | null
          budget_type?: string | null
          budget_value?: number | null
          cancellation_reason?: string | null
          cancellation_requested_at?: string | null
          cancellation_requested_by?: string | null
          category?: string | null
          completed_at?: string | null
          completion_requested_at?: string | null
          completion_requested_by?: string | null
          computed_inspection_bias?: string | null
          computed_safety?: string | null
          created_at?: string
          description?: string | null
          description_i18n?: Json | null
          edit_version?: number
          flags?: string[] | null
          has_photos?: boolean | null
          highlights?: string[]
          id?: string
          is_custom_request?: boolean
          is_publicly_listed?: boolean
          job_score?: number | null
          location?: Json | null
          micro_slug?: string | null
          source_lang?: string | null
          start_date?: string | null
          start_timing?: string | null
          status?: string
          subcategory?: string | null
          teaser?: string | null
          teaser_i18n?: Json | null
          title: string
          title_i18n?: Json | null
          translation_status?: string | null
          updated_at?: string
          user_id: string
          worker_brief?: string | null
        }
        Update: {
          ai_generated_title?: boolean | null
          answers?: Json | null
          area?: string | null
          assigned_professional_id?: string | null
          attribution?: Json | null
          budget_max?: number | null
          budget_min?: number | null
          budget_type?: string | null
          budget_value?: number | null
          cancellation_reason?: string | null
          cancellation_requested_at?: string | null
          cancellation_requested_by?: string | null
          category?: string | null
          completed_at?: string | null
          completion_requested_at?: string | null
          completion_requested_by?: string | null
          computed_inspection_bias?: string | null
          computed_safety?: string | null
          created_at?: string
          description?: string | null
          description_i18n?: Json | null
          edit_version?: number
          flags?: string[] | null
          has_photos?: boolean | null
          highlights?: string[]
          id?: string
          is_custom_request?: boolean
          is_publicly_listed?: boolean
          job_score?: number | null
          location?: Json | null
          micro_slug?: string | null
          source_lang?: string | null
          start_date?: string | null
          start_timing?: string | null
          status?: string
          subcategory?: string | null
          teaser?: string | null
          teaser_i18n?: Json | null
          title?: string
          title_i18n?: Json | null
          translation_status?: string | null
          updated_at?: string
          user_id?: string
          worker_brief?: string | null
        }
        Relationships: []
      }
      listing_addons: {
        Row: {
          created_at: string
          expires_at: string | null
          extra_listings: number
          id: string
          purchased_at: string
          status: string
          stripe_payment_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          extra_listings?: number
          id?: string
          purchased_at?: string
          status?: string
          stripe_payment_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          extra_listings?: number
          id?: string
          purchased_at?: string
          status?: string
          stripe_payment_id?: string | null
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
      network_failures: {
        Row: {
          browser: string | null
          created_at: string
          error_message: string | null
          id: string
          method: string | null
          request_url: string | null
          route: string | null
          status_code: number | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          method?: string | null
          request_url?: string | null
          route?: string | null
          status_code?: number | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          method?: string | null
          request_url?: string | null
          route?: string | null
          status_code?: number | null
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          digest_frequency: string
          email_digests: boolean
          email_job_matches: boolean
          email_messages: boolean
          email_project_updates: boolean
          email_quotes: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          digest_frequency?: string
          email_digests?: boolean
          email_job_matches?: boolean
          email_messages?: boolean
          email_project_updates?: boolean
          email_quotes?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          digest_frequency?: string
          email_digests?: boolean
          email_job_matches?: boolean
          email_messages?: boolean
          email_project_updates?: boolean
          email_quotes?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nudge_log: {
        Row: {
          id: string
          job_id: string | null
          nudge_date: string
          nudge_type: string
          sent_at: string | null
          suppressed_at: string | null
          suppressed_by: string | null
          triggered_at: string
          user_id: string
        }
        Insert: {
          id?: string
          job_id?: string | null
          nudge_date?: string
          nudge_type: string
          sent_at?: string | null
          suppressed_at?: string | null
          suppressed_by?: string | null
          triggered_at?: string
          user_id: string
        }
        Update: {
          id?: string
          job_id?: string | null
          nudge_date?: string
          nudge_type?: string
          sent_at?: string | null
          suppressed_at?: string | null
          suppressed_by?: string | null
          triggered_at?: string
          user_id?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          browser: string | null
          created_at: string
          id: string
          load_time_ms: number | null
          route: string | null
          url: string | null
          user_id: string
          viewport: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string
          id?: string
          load_time_ms?: number | null
          route?: string | null
          url?: string | null
          user_id: string
          viewport?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string
          id?: string
          load_time_ms?: number | null
          route?: string | null
          url?: string | null
          user_id?: string
          viewport?: string | null
        }
        Relationships: []
      }
      platform_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          body: string
          category: string
          created_at: string
          dedupe_key: string
          id: string
          metadata: Json | null
          metric_date: string | null
          related_id: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          body?: string
          category?: string
          created_at?: string
          dedupe_key: string
          id?: string
          metadata?: Json | null
          metric_date?: string | null
          related_id?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          body?: string
          category?: string
          created_at?: string
          dedupe_key?: string
          id?: string
          metadata?: Json | null
          metric_date?: string | null
          related_id?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      portfolio_projects: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_published: boolean
          job_id: string
          photo_urls: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_published?: boolean
          job_id: string
          photo_urls?: string[]
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_published?: boolean
          job_id?: string
          photo_urls?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_projects_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "admin_unclassified_custom_jobs"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "portfolio_projects_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_projects_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_projects_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_projects_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "matched_jobs_for_professional"
            referencedColumns: ["id"]
          },
        ]
      }
      price_estimates: {
        Row: {
          additional_max: number
          additional_min: number
          category: string
          confidence_level: string
          created_at: string
          currency: string
          disclaimer_version: string
          id: string
          inputs: Json
          labour_max: number
          labour_min: number
          linked_job_id: string | null
          materials_max: number
          materials_min: number
          micro_name: string
          micro_slug: string
          pricing_source: string
          rule_snapshot: Json | null
          status: string
          subcategory: string
          total_max: number
          total_min: number
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_max?: number
          additional_min?: number
          category: string
          confidence_level?: string
          created_at?: string
          currency?: string
          disclaimer_version?: string
          id?: string
          inputs?: Json
          labour_max?: number
          labour_min?: number
          linked_job_id?: string | null
          materials_max?: number
          materials_min?: number
          micro_name: string
          micro_slug: string
          pricing_source?: string
          rule_snapshot?: Json | null
          status?: string
          subcategory: string
          total_max?: number
          total_min?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_max?: number
          additional_min?: number
          category?: string
          confidence_level?: string
          created_at?: string
          currency?: string
          disclaimer_version?: string
          id?: string
          inputs?: Json
          labour_max?: number
          labour_min?: number
          linked_job_id?: string | null
          materials_max?: number
          materials_min?: number
          micro_name?: string
          micro_slug?: string
          pricing_source?: string
          rule_snapshot?: Json | null
          status?: string
          subcategory?: string
          total_max?: number
          total_min?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pricing_rules: {
        Row: {
          adjustment_factors: Json
          base_labour_max: number
          base_labour_min: number
          base_labour_unit: string
          base_material_max: number
          base_material_min: number
          category: string
          created_at: string
          created_by: string | null
          difficulty_modifier: number
          guide_content: Json | null
          id: string
          is_active: boolean
          location_modifier: number
          micro_name: string
          micro_slug: string
          subcategory: string
          updated_at: string
          urgency_modifier: number
        }
        Insert: {
          adjustment_factors?: Json
          base_labour_max?: number
          base_labour_min?: number
          base_labour_unit?: string
          base_material_max?: number
          base_material_min?: number
          category: string
          created_at?: string
          created_by?: string | null
          difficulty_modifier?: number
          guide_content?: Json | null
          id?: string
          is_active?: boolean
          location_modifier?: number
          micro_name: string
          micro_slug: string
          subcategory: string
          updated_at?: string
          urgency_modifier?: number
        }
        Update: {
          adjustment_factors?: Json
          base_labour_max?: number
          base_labour_min?: number
          base_labour_unit?: string
          base_material_max?: number
          base_material_min?: number
          category?: string
          created_at?: string
          created_by?: string | null
          difficulty_modifier?: number
          guide_content?: Json | null
          id?: string
          is_active?: boolean
          location_modifier?: number
          micro_name?: string
          micro_slug?: string
          subcategory?: string
          updated_at?: string
          urgency_modifier?: number
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
          avatar_card_url: string | null
          avatar_thumb_url: string | null
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
          trust_score: number | null
          typical_lead_time: string | null
          updated_at: string
          user_id: string
          verification_status: string
          working_hours: Json | null
        }
        Insert: {
          accepts_emergency?: boolean | null
          availability_status?: string | null
          avatar_card_url?: string | null
          avatar_thumb_url?: string | null
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
          trust_score?: number | null
          typical_lead_time?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string
          working_hours?: Json | null
        }
        Update: {
          accepts_emergency?: boolean | null
          availability_status?: string | null
          avatar_card_url?: string | null
          avatar_thumb_url?: string | null
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
          trust_score?: number | null
          typical_lead_time?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string
          working_hours?: Json | null
        }
        Relationships: []
      }
      professional_rankings: {
        Row: {
          activity_score: number
          completion_rate: number
          labels: string[]
          ranking_score: number
          rating_avg: number
          repeat_hire_rate: number
          response_speed_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_score?: number
          completion_rate?: number
          labels?: string[]
          ranking_score?: number
          rating_avg?: number
          repeat_hire_rate?: number
          response_speed_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_score?: number
          completion_rate?: number
          labels?: string[]
          ranking_score?: number
          rating_avg?: number
          repeat_hire_rate?: number
          response_speed_score?: number
          updated_at?: string
          user_id?: string
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
      qa_reminder_runs: {
        Row: {
          created_at: string
          destination: string
          error_message: string | null
          function_name: string
          id: string
          sent_at: string
          status: string
          trigger_source: string
          triggered_by: string | null
          week_key: string
        }
        Insert: {
          created_at?: string
          destination?: string
          error_message?: string | null
          function_name: string
          id?: string
          sent_at?: string
          status?: string
          trigger_source?: string
          triggered_by?: string | null
          week_key: string
        }
        Update: {
          created_at?: string
          destination?: string
          error_message?: string | null
          function_name?: string
          id?: string
          sent_at?: string
          status?: string
          trigger_source?: string
          triggered_by?: string | null
          week_key?: string
        }
        Relationships: []
      }
      question_packs: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_validated_at: string | null
          lint_warnings: Json | null
          metadata: Json | null
          micro_slug: string
          owner: string | null
          questions: Json
          reviewed_at: string | null
          reviewed_by: string | null
          schema_version: number
          status: string
          title: string
          updated_at: string
          validation_errors: Json | null
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_validated_at?: string | null
          lint_warnings?: Json | null
          metadata?: Json | null
          micro_slug: string
          owner?: string | null
          questions?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          schema_version?: number
          status?: string
          title: string
          updated_at?: string
          validation_errors?: Json | null
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_validated_at?: string | null
          lint_warnings?: Json | null
          metadata?: Json | null
          micro_slug?: string
          owner?: string | null
          questions?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          schema_version?: number
          status?: string
          title?: string
          updated_at?: string
          validation_errors?: Json | null
          version?: number
        }
        Relationships: []
      }
      quote_line_items: {
        Row: {
          added_by: string | null
          client_acknowledged_at: string | null
          created_at: string
          description: string
          id: string
          is_addition: boolean
          line_total: number | null
          quantity: number
          quote_id: string
          sort_order: number
          unit_price: number
        }
        Insert: {
          added_by?: string | null
          client_acknowledged_at?: string | null
          created_at?: string
          description?: string
          id?: string
          is_addition?: boolean
          line_total?: number | null
          quantity?: number
          quote_id: string
          sort_order?: number
          unit_price?: number
        }
        Update: {
          added_by?: string | null
          client_acknowledged_at?: string | null
          created_at?: string
          description?: string
          id?: string
          is_addition?: boolean
          line_total?: number | null
          quantity?: number
          quote_id?: string
          sort_order?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          created_at: string
          exclusions_text: string | null
          hourly_rate: number | null
          id: string
          job_id: string
          notes: string | null
          price_fixed: number | null
          price_max: number | null
          price_min: number | null
          price_type: string
          professional_id: string
          revision_number: number
          scope_text: string
          start_date_estimate: string | null
          status: string
          subtotal: number | null
          time_estimate_days: number | null
          total: number | null
          updated_at: string
          valid_until: string | null
          vat_percent: number | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          exclusions_text?: string | null
          hourly_rate?: number | null
          id?: string
          job_id: string
          notes?: string | null
          price_fixed?: number | null
          price_max?: number | null
          price_min?: number | null
          price_type?: string
          professional_id: string
          revision_number?: number
          scope_text?: string
          start_date_estimate?: string | null
          status?: string
          subtotal?: number | null
          time_estimate_days?: number | null
          total?: number | null
          updated_at?: string
          valid_until?: string | null
          vat_percent?: number | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          exclusions_text?: string | null
          hourly_rate?: number | null
          id?: string
          job_id?: string
          notes?: string | null
          price_fixed?: number | null
          price_max?: number | null
          price_min?: number | null
          price_type?: string
          professional_id?: string
          revision_number?: number
          scope_text?: string
          start_date_estimate?: string | null
          status?: string
          subtotal?: number | null
          time_estimate_days?: number | null
          total?: number | null
          updated_at?: string
          valid_until?: string | null
          vat_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "admin_unclassified_custom_jobs"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "quotes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "matched_jobs_for_professional"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_events: {
        Row: {
          action: string
          created_at: string
          id: string
          identifier: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          identifier?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          identifier?: string | null
          user_id?: string
        }
        Relationships: []
      }
      saved_professionals: {
        Row: {
          created_at: string
          id: string
          professional_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          professional_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          professional_id?: string
          user_id?: string
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
          display_title_i18n: Json | null
          gallery: string[] | null
          hero_card_url: string | null
          hero_image_url: string | null
          hero_large_url: string | null
          hero_thumb_url: string | null
          id: string
          location_base: string | null
          micro_id: string
          pricing_summary: string | null
          provider_id: string
          published_at: string | null
          short_description: string | null
          short_description_i18n: Json | null
          source_lang: string | null
          status: string
          translation_status: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          created_at?: string
          display_title?: string
          display_title_i18n?: Json | null
          gallery?: string[] | null
          hero_card_url?: string | null
          hero_image_url?: string | null
          hero_large_url?: string | null
          hero_thumb_url?: string | null
          id?: string
          location_base?: string | null
          micro_id: string
          pricing_summary?: string | null
          provider_id: string
          published_at?: string | null
          short_description?: string | null
          short_description_i18n?: Json | null
          source_lang?: string | null
          status?: string
          translation_status?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          created_at?: string
          display_title?: string
          display_title_i18n?: Json | null
          gallery?: string[] | null
          hero_card_url?: string | null
          hero_image_url?: string | null
          hero_large_url?: string | null
          hero_thumb_url?: string | null
          id?: string
          location_base?: string | null
          micro_id?: string
          pricing_summary?: string | null
          provider_id?: string
          published_at?: string | null
          short_description?: string | null
          short_description_i18n?: Json | null
          source_lang?: string | null
          status?: string
          translation_status?: string | null
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
      subscriptions: {
        Row: {
          commission_rate: number
          created_at: string | null
          current_period_end: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          commission_rate?: number
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
            referencedRelation: "admin_unclassified_custom_jobs"
            referencedColumns: ["job_id"]
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
      tester_reports: {
        Row: {
          browser: string | null
          context: Json | null
          conversation_id: string | null
          created_at: string
          description: string
          id: string
          route: string | null
          status: string
          url: string | null
          user_id: string
          viewport: string | null
        }
        Insert: {
          browser?: string | null
          context?: Json | null
          conversation_id?: string | null
          created_at?: string
          description: string
          id?: string
          route?: string | null
          status?: string
          url?: string | null
          user_id: string
          viewport?: string | null
        }
        Update: {
          browser?: string | null
          context?: Json | null
          conversation_id?: string | null
          created_at?: string
          description?: string
          id?: string
          route?: string | null
          status?: string
          url?: string | null
          user_id?: string
          viewport?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tester_reports_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
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
      weekly_ai_reports: {
        Row: {
          ai_analysis: string | null
          comparison_json: Json
          created_at: string
          id: string
          issues: Json | null
          open_alerts_snapshot: Json | null
          recommendations: Json | null
          report_week: string
          summary_json: Json
        }
        Insert: {
          ai_analysis?: string | null
          comparison_json?: Json
          created_at?: string
          id?: string
          issues?: Json | null
          open_alerts_snapshot?: Json | null
          recommendations?: Json | null
          report_week: string
          summary_json?: Json
        }
        Update: {
          ai_analysis?: string | null
          comparison_json?: Json
          created_at?: string
          id?: string
          issues?: Json | null
          open_alerts_snapshot?: Json | null
          recommendations?: Json | null
          report_week?: string
          summary_json?: Json
        }
        Relationships: []
      }
    }
    Views: {
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
            referencedRelation: "admin_unclassified_custom_jobs"
            referencedColumns: ["job_id"]
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
      admin_unclassified_custom_jobs: {
        Row: {
          area: string | null
          client_id: string | null
          created_at: string | null
          job_id: string | null
          latest_suggestion_at: string | null
          latest_suggestion_confidence: number | null
          latest_suggestion_status: string | null
          teaser: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          area?: string | null
          client_id?: string | null
          created_at?: string | null
          job_id?: string | null
          latest_suggestion_at?: never
          latest_suggestion_confidence?: never
          latest_suggestion_status?: never
          teaser?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          area?: string | null
          client_id?: string | null
          created_at?: string | null
          job_id?: string | null
          latest_suggestion_at?: never
          latest_suggestion_confidence?: never
          latest_suggestion_status?: never
          teaser?: string | null
          title?: string | null
          updated_at?: string | null
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
          created_at: string | null
          description: string | null
          description_i18n: Json | null
          flags: string[] | null
          has_photos: boolean | null
          highlights: string[] | null
          id: string | null
          is_owner: boolean | null
          is_publicly_listed: boolean | null
          location: Json | null
          micro_slug: string | null
          source_lang: string | null
          start_date: string | null
          start_timing: string | null
          status: string | null
          subcategory: string | null
          teaser: string | null
          teaser_i18n: Json | null
          title: string | null
          title_i18n: Json | null
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
          created_at?: string | null
          description?: string | null
          description_i18n?: Json | null
          flags?: string[] | null
          has_photos?: boolean | null
          highlights?: string[] | null
          id?: string | null
          is_owner?: never
          is_publicly_listed?: boolean | null
          location?: Json | null
          micro_slug?: string | null
          source_lang?: string | null
          start_date?: string | null
          start_timing?: string | null
          status?: string | null
          subcategory?: string | null
          teaser?: string | null
          teaser_i18n?: Json | null
          title?: string | null
          title_i18n?: Json | null
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
          created_at?: string | null
          description?: string | null
          description_i18n?: Json | null
          flags?: string[] | null
          has_photos?: boolean | null
          highlights?: string[] | null
          id?: string | null
          is_owner?: never
          is_publicly_listed?: boolean | null
          location?: Json | null
          micro_slug?: string | null
          source_lang?: string | null
          start_date?: string | null
          start_timing?: string | null
          status?: string | null
          subcategory?: string | null
          teaser?: string | null
          teaser_i18n?: Json | null
          title?: string | null
          title_i18n?: Json | null
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
          source_lang: string | null
          start_date: string | null
          start_timing: string | null
          status: string | null
          subcategory: string | null
          teaser: string | null
          teaser_i18n: Json | null
          title: string | null
          title_i18n: Json | null
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
          source_lang?: string | null
          start_date?: string | null
          start_timing?: string | null
          status?: string | null
          subcategory?: string | null
          teaser?: string | null
          teaser_i18n?: Json | null
          title?: string | null
          title_i18n?: Json | null
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
          source_lang?: string | null
          start_date?: string | null
          start_timing?: string | null
          status?: string | null
          subcategory?: string | null
          teaser?: string | null
          teaser_i18n?: Json | null
          title?: string | null
          title_i18n?: Json | null
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
          created_at: string | null
          flags: string[] | null
          has_photos: boolean | null
          highlights: string[] | null
          id: string | null
          is_publicly_listed: boolean | null
          location: Json | null
          micro_slug: string | null
          professional_user_id: string | null
          source_lang: string | null
          start_date: string | null
          start_timing: string | null
          status: string | null
          subcategory: string | null
          teaser: string | null
          teaser_i18n: Json | null
          title: string | null
          title_i18n: Json | null
          updated_at: string | null
          worker_brief: string | null
        }
        Relationships: []
      }
      professional_matching_scores: {
        Row: {
          avg_rating: number | null
          completed_jobs_count: number | null
          has_live_listing: boolean | null
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
          hero_card_url: string | null
          hero_image_url: string | null
          hero_thumb_url: string | null
          id: string | null
          location_base: string | null
          micro_avg_rating: number | null
          micro_completed_count: number | null
          micro_id: string | null
          micro_name: string | null
          micro_rating_count: number | null
          micro_slug: string | null
          micro_verification_level: string | null
          pricing_summary: string | null
          provider_avatar: string | null
          provider_avatar_thumb: string | null
          provider_id: string | null
          provider_name: string | null
          provider_verification: string | null
          published_at: string | null
          repeat_client_count: number | null
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
      accept_quote_and_assign: {
        Args: { p_job_id: string; p_quote_id: string }
        Returns: undefined
      }
      admin_boost_category: {
        Args: { p_area: string; p_category: string }
        Returns: Json
      }
      admin_compute_action_outcomes: {
        Args: { p_action_types?: string[]; p_limit?: number }
        Returns: Json
      }
      admin_custom_jobs_classification_queue: {
        Args: { p_limit?: number }
        Returns: {
          area: string
          category: string
          created_at: string
          description: string
          has_accepted_classification: boolean
          has_jml: boolean
          job_id: string
          latest_suggested_at: string
          subcategory: string
          suggested_micro_slugs: string[]
          suggestion_status: string
          title: string
        }[]
      }
      admin_email_queue_details: { Args: never; Returns: Json }
      admin_force_complete_job: {
        Args: { p_job_id: string; p_reason?: string }
        Returns: Json
      }
      admin_health_snapshot: { Args: never; Returns: Json }
      admin_market_gap: {
        Args: { p_from_ts?: string; p_to_ts?: string }
        Returns: Json
      }
      admin_messaging_pulse: {
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
      admin_notify_matching_pros: { Args: { p_job_id: string }; Returns: Json }
      admin_nudge_client: { Args: { p_conversation_id: string }; Returns: Json }
      admin_onboarding_funnel: {
        Args: { p_from_ts?: string; p_to_ts?: string }
        Returns: Json
      }
      admin_onboarding_health: { Args: never; Returns: Json }
      admin_operator_alerts: { Args: never; Returns: Json }
      admin_recent_errors: { Args: { p_limit?: number }; Returns: Json }
      admin_recent_network_failures: {
        Args: { p_limit?: number }
        Returns: Json
      }
      admin_repeat_work: {
        Args: { p_from_ts?: string; p_to_ts?: string }
        Returns: Json
      }
      admin_retry_all_failed_emails: { Args: never; Returns: Json }
      admin_retry_failed_email: { Args: { p_email_id: string }; Returns: Json }
      admin_set_custom_job_micro_slugs: {
        Args: { p_job_id: string; p_micro_slugs: string[]; p_note?: string }
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
      aggregate_daily_metrics: { Args: { p_date: string }; Returns: undefined }
      aggregate_daily_metrics_internal: {
        Args: { p_date: string }
        Returns: undefined
      }
      become_professional: { Args: never; Returns: undefined }
      calculate_client_reputation: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      calculate_job_score: { Args: { p_job_id: string }; Returns: number }
      calculate_job_score_inline: {
        Args: { v_job: Database["public"]["Tables"]["jobs"]["Row"] }
        Returns: number
      }
      calculate_professional_ranking: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      calculate_worker_trust_score: {
        Args: { p_user_id: string }
        Returns: number
      }
      cancel_job: { Args: { p_job_id: string }; Returns: undefined }
      check_rate_limit: {
        Args: {
          p_action: string
          p_max_count: number
          p_user_id: string
          p_window_interval: string
        }
        Returns: boolean
      }
      check_rate_limit_by_key: {
        Args: {
          p_action: string
          p_key: string
          p_max_count: number
          p_window_interval: string
        }
        Returns: boolean
      }
      complete_job: { Args: { p_job_id: string }; Returns: Json }
      create_direct_conversation: {
        Args: { p_client_id: string; p_job_id: string; p_pro_id: string }
        Returns: string
      }
      create_draft_service_listings: {
        Args: { p_micro_ids: string[]; p_provider_id: string }
        Returns: {
          created_at: string
          display_title: string
          display_title_i18n: Json | null
          gallery: string[] | null
          hero_card_url: string | null
          hero_image_url: string | null
          hero_large_url: string | null
          hero_thumb_url: string | null
          id: string
          location_base: string | null
          micro_id: string
          pricing_summary: string | null
          provider_id: string
          published_at: string | null
          short_description: string | null
          short_description_i18n: Json | null
          source_lang: string | null
          status: string
          translation_status: string | null
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
      get_agent_performance_metrics: {
        Args: { p_since?: string; p_until?: string }
        Returns: {
          accepted: number
          agent_name: string
          dismissed: number
          failed: number
          succeeded: number
          triggered: number
        }[]
      }
      get_budget_range_for_micros: {
        Args: { p_micro_slugs: string[] }
        Returns: {
          p20: number
          p50: number
          p80: number
          sample_size: number
        }[]
      }
      get_conversation_counts_for_jobs: {
        Args: { p_job_ids: string[] }
        Returns: {
          conversation_count: number
          job_id: string
        }[]
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
      get_demand_snapshots: {
        Args: never
        Returns: {
          area: string
          category: string
          id: string
          job_count_30d: number
          job_count_7d: number
          pct_change_7d: number
          snapshot_date: string
        }[]
      }
      get_or_create_conversation: {
        Args: { p_job_id: string; p_pro_id: string }
        Returns: string
      }
      get_pending_nudges: {
        Args: never
        Returns: {
          job_id: string
          job_title: string
          nudge_type: string
          pro_name: string
          quote_count: number
          user_email: string
          user_id: string
        }[]
      }
      get_platform_assistant_summary: { Args: never; Returns: Json }
      get_professional_labels: {
        Args: { p_user_ids: string[] }
        Returns: {
          labels: string[]
          user_id: string
        }[]
      }
      get_professional_ranking_scores: {
        Args: { p_user_ids: string[] }
        Returns: {
          ranking_score: number
          user_id: string
        }[]
      }
      get_provider_area_jobs: {
        Args: { p_area: string; p_provider_id: string }
        Returns: number
      }
      get_provider_repeat_clients: {
        Args: { p_provider_id: string }
        Returns: number
      }
      get_provider_zone_jobs: {
        Args: { p_provider_id: string }
        Returns: {
          area: string
          job_count: number
        }[]
      }
      get_quote_funnel_metrics: { Args: never; Returns: Json }
      get_repeat_hire_pair: {
        Args: { p_client_id: string; p_pro_id: string }
        Returns: {
          hire_count: number
          last_hired_at: string
        }[]
      }
      get_saved_pros: {
        Args: never
        Returns: {
          avatar_thumb_url: string
          avatar_url: string
          display_name: string
          professional_id: string
          saved_at: string
          tagline: string
          verification_status: string
        }[]
      }
      get_stalled_quote_journeys: {
        Args: never
        Returns: {
          conversation_id: string
          hours_since_activity: number
          job_id: string
          job_title: string
          pro_display_name: string
          pro_id: string
          stall_type: string
        }[]
      }
      get_tier_limit: {
        Args: { _feature: string; _user_id: string }
        Returns: number
      }
      get_user_tier: {
        Args: { p_user_id: string }
        Returns: {
          commission_rate: number
          status: string
          tier: string
        }[]
      }
      grant_professional_access: {
        Args: { p_create_profile?: boolean; p_user_id: string }
        Returns: undefined
      }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      increment_job_edit_version: {
        Args: { p_job_id: string }
        Returns: undefined
      }
      increment_professional_micro_stats: {
        Args: { p_micro_id: string; p_rating?: number; p_user_id: string }
        Returns: undefined
      }
      increment_professional_micro_stats_batch: {
        Args: { p_micro_ids: string[]; p_rating?: number; p_user_id: string }
        Returns: undefined
      }
      is_admin_email: { Args: never; Returns: boolean }
      mark_nudge_sent: { Args: { p_nudge_id: string }; Returns: undefined }
      post_job: { Args: { p_job_id: string }; Returns: undefined }
      purge_stale_telemetry: { Args: never; Returns: undefined }
      refresh_demand_snapshots: { Args: never; Returns: undefined }
      request_job_cancellation: {
        Args: { p_job_id: string; p_reason?: string }
        Returns: undefined
      }
      request_job_completion: { Args: { p_job_id: string }; Returns: undefined }
      respond_to_cancellation: {
        Args: { p_accept: boolean; p_job_id: string }
        Returns: undefined
      }
      rpc_admin_dispute_analytics: { Args: never; Returns: Json }
      rpc_admin_dispute_inbox: {
        Args: never
        Returns: {
          age_hours: number
          ai_confidence_score: number
          analysis_exists: boolean
          closed_at: string
          completeness_level: string
          counterparty_id: string
          counterparty_name: string
          counterparty_responded_at: string
          created_at: string
          evidence_count: number
          evidence_deadline: string
          human_review_required: boolean
          id: string
          input_count: number
          issue_types: string[]
          job_area: string
          job_budget_value: number
          job_category: string
          job_id: string
          job_title: string
          raised_by: string
          raised_by_role: string
          raiser_name: string
          recommended_pathway: string
          requested_outcome: string
          resolved_at: string
          response_deadline: string
          status: string
          summary_neutral: string
          updated_at: string
        }[]
      }
      rpc_admin_platform_stats: {
        Args: never
        Returns: {
          active_jobs: number
          active_professionals: number
          completed_jobs: number
          new_support_tickets: number
          open_jobs: number
          open_support_tickets: number
          total_conversations: number
          total_jobs: number
          total_posts: number
          total_professionals: number
          total_users: number
        }[]
      }
      rpc_admin_support_inbox: {
        Args: never
        Returns: {
          age_hours: number
          assigned_to: string
          client_id: string
          conversation_id: string
          created_at: string
          created_by_role: string
          created_by_user_id: string
          id: string
          issue_type: string
          job_category: string
          job_id: string
          job_title: string
          last_message_at: string
          last_message_preview: string
          priority: string
          pro_id: string
          resolved_at: string
          status: string
          summary: string
          ticket_number: string
          updated_at: string
        }[]
      }
      rpc_admin_users_list: {
        Args: never
        Returns: {
          active_role: string
          created_at: string
          display_name: string
          id: string
          phone: string
          pro_is_listed: boolean
          pro_onboarding_phase: string
          pro_services_count: number
          pro_verification_status: string
          roles: string[]
          status: string
          suspended_at: string
          suspension_reason: string
        }[]
      }
      rpc_advance_dispute_status: {
        Args: { p_dispute_id: string; p_new_status: string }
        Returns: Json
      }
      rpc_create_bug_report_conversation: {
        Args: { p_report_id: string }
        Returns: string
      }
      rpc_dispute_completeness: {
        Args: { p_dispute_id: string }
        Returns: Json
      }
      rpc_dispute_qa_health_checks: { Args: never; Returns: Json }
      rpc_offer_resolution: {
        Args: {
          p_dispute_id: string
          p_resolution_description: string
          p_resolution_type: string
        }
        Returns: undefined
      }
      rpc_respond_to_resolution: {
        Args: {
          p_accept: boolean
          p_dispute_id: string
          p_rejection_reason?: string
        }
        Returns: undefined
      }
      run_platform_alert_rules: { Args: { p_date?: string }; Returns: number }
      run_platform_alert_rules_cron: {
        Args: { p_date: string }
        Returns: number
      }
      submit_quote_with_items: {
        Args: {
          p_exclusions_text?: string
          p_hourly_rate?: number
          p_job_id: string
          p_line_items?: Json
          p_notes?: string
          p_previous_quote_id?: string
          p_price_fixed?: number
          p_price_max?: number
          p_price_min?: number
          p_price_type: string
          p_revision_number?: number
          p_scope_text?: string
          p_start_date_estimate?: string
          p_subtotal?: number
          p_time_estimate_days?: number
          p_total?: number
          p_vat_percent?: number
        }
        Returns: string
      }
      suppress_nudge: {
        Args: { p_job_id: string; p_nudge_type: string }
        Returns: undefined
      }
      switch_active_role: { Args: { p_new_role: string }; Returns: undefined }
      sync_service_listings_for_provider: {
        Args: { p_provider_id: string }
        Returns: Json
      }
      toggle_saved_pro: { Args: { p_professional_id: string }; Returns: Json }
      track_event: {
        Args: { p_event_name: string; p_metadata?: Json; p_role?: string }
        Returns: undefined
      }
      trigger_qa_reminder: { Args: never; Returns: Json }
      withdraw_from_job: { Args: { p_job_id: string }; Returns: undefined }
    }
    Enums: {
      dispute_issue_type:
        | "quality"
        | "completion"
        | "delay"
        | "payment"
        | "scope_change"
        | "materials"
        | "access_site_conditions"
        | "communication_conduct"
        | "damage"
        | "abandonment"
        | "pricing_variation"
      dispute_status:
        | "draft"
        | "open"
        | "awaiting_counterparty"
        | "evidence_collection"
        | "assessment"
        | "resolution_offered"
        | "awaiting_acceptance"
        | "resolved"
        | "closed"
        | "escalated"
      resolution_pathway:
        | "corrective_work"
        | "financial_adjustment"
        | "shared_responsibility"
        | "expert_review"
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
      dispute_issue_type: [
        "quality",
        "completion",
        "delay",
        "payment",
        "scope_change",
        "materials",
        "access_site_conditions",
        "communication_conduct",
        "damage",
        "abandonment",
        "pricing_variation",
      ],
      dispute_status: [
        "draft",
        "open",
        "awaiting_counterparty",
        "evidence_collection",
        "assessment",
        "resolution_offered",
        "awaiting_acceptance",
        "resolved",
        "closed",
        "escalated",
      ],
      resolution_pathway: [
        "corrective_work",
        "financial_adjustment",
        "shared_responsibility",
        "expert_review",
      ],
    },
  },
} as const
