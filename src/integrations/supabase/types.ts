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
      public_job_details: {
        Row: {
          area: string | null
          budget_max: number | null
          budget_min: number | null
          budget_type: string | null
          budget_value: number | null
          category: string | null
          created_at: string | null
          description: string | null
          has_photos: boolean | null
          id: string | null
          micro_slug: string | null
          start_date: string | null
          start_timing: string | null
          status: string | null
          subcategory: string | null
          teaser: string | null
          title: string | null
        }
        Insert: {
          area?: string | null
          budget_max?: number | null
          budget_min?: number | null
          budget_type?: string | null
          budget_value?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          has_photos?: boolean | null
          id?: string | null
          micro_slug?: string | null
          start_date?: string | null
          start_timing?: string | null
          status?: string | null
          subcategory?: string | null
          teaser?: string | null
          title?: string | null
        }
        Update: {
          area?: string | null
          budget_max?: number | null
          budget_min?: number | null
          budget_type?: string | null
          budget_value?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          has_photos?: boolean | null
          id?: string | null
          micro_slug?: string | null
          start_date?: string | null
          start_timing?: string | null
          status?: string | null
          subcategory?: string | null
          teaser?: string | null
          title?: string | null
        }
        Relationships: []
      }
      public_jobs_preview: {
        Row: {
          area: string | null
          budget_max: number | null
          budget_min: number | null
          budget_type: string | null
          budget_value: number | null
          category: string | null
          created_at: string | null
          has_photos: boolean | null
          id: string | null
          is_publicly_listed: boolean | null
          micro_slug: string | null
          start_date: string | null
          start_timing: string | null
          status: string | null
          subcategory: string | null
          teaser: string | null
          title: string | null
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
          id?: string | null
          is_publicly_listed?: boolean | null
          micro_slug?: string | null
          start_date?: string | null
          start_timing?: string | null
          status?: string | null
          subcategory?: string | null
          teaser?: string | null
          title?: string | null
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
          id?: string | null
          is_publicly_listed?: boolean | null
          micro_slug?: string | null
          start_date?: string | null
          start_timing?: string | null
          status?: string | null
          subcategory?: string | null
          teaser?: string | null
          title?: string | null
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
      [_ in never]: never
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
