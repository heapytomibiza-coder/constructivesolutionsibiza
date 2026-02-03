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
      jobs: {
        Row: {
          answers: Json | null
          area: string | null
          budget_max: number | null
          budget_min: number | null
          budget_type: string | null
          budget_value: number | null
          category: string | null
          created_at: string
          description: string | null
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
          budget_max?: number | null
          budget_min?: number | null
          budget_type?: string | null
          budget_value?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
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
          budget_max?: number | null
          budget_min?: number | null
          budget_type?: string | null
          budget_value?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
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
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
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
      professional_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_publicly_listed: boolean
          location: Json | null
          metadata: Json | null
          onboarding_phase: string
          services_count: number
          updated_at: string
          user_id: string
          verification_status: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_publicly_listed?: boolean
          location?: Json | null
          metadata?: Json | null
          onboarding_phase?: string
          services_count?: number
          updated_at?: string
          user_id: string
          verification_status?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_publicly_listed?: boolean
          location?: Json | null
          metadata?: Json | null
          onboarding_phase?: string
          services_count?: number
          updated_at?: string
          user_id?: string
          verification_status?: string
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
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          micro_id: string
          notify?: boolean | null
          searchable?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          micro_id?: string
          notify?: boolean | null
          searchable?: boolean | null
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
        ]
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
            referencedRelation: "service_subcategories"
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
        ]
      }
      user_roles: {
        Row: {
          active_role: string
          created_at: string
          id: string
          roles: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          active_role?: string
          created_at?: string
          id?: string
          roles?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          active_role?: string
          created_at?: string
          id?: string
          roles?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
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
          created_at?: string | null
          description?: string | null
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
          created_at?: string | null
          description?: string | null
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
          created_at: string | null
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
          created_at?: string | null
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
          created_at?: string | null
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
          created_at: string | null
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
    }
    Functions: {
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
