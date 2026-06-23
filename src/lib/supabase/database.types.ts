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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_events: {
        Row: {
          action: string
          actor_admin_id: string | null
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          actor_admin_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          actor_admin_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_events_actor_admin_id_fkey"
            columns: ["actor_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_events: {
        Row: {
          created_at: string
          feature: Database["public"]["Enums"]["ai_feature"]
          id: string
          model: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          feature: Database["public"]["Enums"]["ai_feature"]
          id?: string
          model?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          feature?: Database["public"]["Enums"]["ai_feature"]
          id?: string
          model?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          daily_ai_limit: number
          id: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_ai_limit?: number
          id?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_ai_limit?: number
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          display_name: string
          display_name_normalized: string
          id: string
          is_deleted: boolean
          is_premium: boolean
          rejected_at: string | null
          rejected_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          display_name: string
          display_name_normalized: string
          id: string
          is_deleted?: boolean
          is_premium?: boolean
          rejected_at?: string | null
          rejected_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          display_name?: string
          display_name_normalized?: string
          id?: string
          is_deleted?: boolean
          is_premium?: boolean
          rejected_at?: string | null
          rejected_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          choices_en: Json
          choices_zh: Json | null
          correct_choice_index: number
          created_at: string
          domain_id: string
          explanation_en: string
          explanation_zh: string | null
          generated_at: string | null
          generated_by_user_id: string | null
          generated_model: string | null
          id: string
          question_en: string
          question_zh: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          section_id: string | null
          source_reference: string | null
          status: Database["public"]["Enums"]["question_status"]
          updated_at: string
        }
        Insert: {
          choices_en: Json
          choices_zh?: Json | null
          correct_choice_index: number
          created_at?: string
          domain_id: string
          explanation_en: string
          explanation_zh?: string | null
          generated_at?: string | null
          generated_by_user_id?: string | null
          generated_model?: string | null
          id?: string
          question_en: string
          question_zh?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          section_id?: string | null
          source_reference?: string | null
          status?: Database["public"]["Enums"]["question_status"]
          updated_at?: string
        }
        Update: {
          choices_en?: Json
          choices_zh?: Json | null
          correct_choice_index?: number
          created_at?: string
          domain_id?: string
          explanation_en?: string
          explanation_zh?: string | null
          generated_at?: string | null
          generated_by_user_id?: string | null
          generated_model?: string | null
          id?: string
          question_en?: string
          question_zh?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          section_id?: string | null
          source_reference?: string | null
          status?: Database["public"]["Enums"]["question_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "study_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_generated_by_user_id_fkey"
            columns: ["generated_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "study_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempt_answers: {
        Row: {
          answered_at: string | null
          attempt_id: string
          attempt_question_id: string
          created_at: string
          id: string
          is_correct: boolean | null
          question_id: string
          selected_choice_index: number | null
          updated_at: string
        }
        Insert: {
          answered_at?: string | null
          attempt_id: string
          attempt_question_id: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id: string
          selected_choice_index?: number | null
          updated_at?: string
        }
        Update: {
          answered_at?: string | null
          attempt_id?: string
          attempt_question_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string
          selected_choice_index?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempt_answers_attempt_question_id_fkey"
            columns: ["attempt_question_id"]
            isOneToOne: true
            referencedRelation: "quiz_attempt_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempt_questions: {
        Row: {
          attempt_id: string
          choice_order: number[]
          correct_choice_index_snapshot: number
          created_at: string
          id: string
          position: number
          question_id: string
          question_snapshot: Json
        }
        Insert: {
          attempt_id: string
          choice_order: number[]
          correct_choice_index_snapshot: number
          created_at?: string
          id?: string
          position: number
          question_id: string
          question_snapshot: Json
        }
        Update: {
          attempt_id?: string
          choice_order?: number[]
          correct_choice_index_snapshot?: number
          created_at?: string
          id?: string
          position?: number
          question_id?: string
          question_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempt_questions_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempt_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          language: string
          mode: Database["public"]["Enums"]["quiz_mode"]
          score: number | null
          started_at: string
          status: Database["public"]["Enums"]["quiz_attempt_status"]
          timer_deadline: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          language: string
          mode: Database["public"]["Enums"]["quiz_mode"]
          score?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["quiz_attempt_status"]
          timer_deadline?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          language?: string
          mode?: Database["public"]["Enums"]["quiz_mode"]
          score?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["quiz_attempt_status"]
          timer_deadline?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_queue: {
        Row: {
          added_at: string
          id: string
          question_id: string
          resolved_at: string | null
          source_attempt_id: string | null
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          question_id: string
          resolved_at?: string | null
          source_attempt_id?: string | null
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          question_id?: string
          resolved_at?: string | null
          source_attempt_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_queue_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_queue_source_attempt_id_fkey"
            columns: ["source_attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_domains: {
        Row: {
          created_at: string
          exam_weight: number
          id: string
          mock_question_count: number
          slug: string
          sort_order: number
          title_en: string
          title_zh: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          exam_weight: number
          id?: string
          mock_question_count: number
          slug: string
          sort_order: number
          title_en: string
          title_zh: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          exam_weight?: number
          id?: string
          mock_question_count?: number
          slug?: string
          sort_order?: number
          title_en?: string
          title_zh?: string
          updated_at?: string
        }
        Relationships: []
      }
      study_progress: {
        Row: {
          created_at: string
          domain_slug: string
          id: string
          is_read: boolean
          language: string
          last_viewed_at: string | null
          read_at: string | null
          section_id: string
          section_title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain_slug: string
          id?: string
          is_read?: boolean
          language: string
          last_viewed_at?: string | null
          read_at?: string | null
          section_id: string
          section_title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain_slug?: string
          id?: string
          is_read?: boolean
          language?: string
          last_viewed_at?: string | null
          read_at?: string | null
          section_id?: string
          section_title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sections: {
        Row: {
          created_at: string
          domain_id: string
          heading_anchor_en: string | null
          heading_anchor_zh: string | null
          id: string
          slug: string
          sort_order: number
          source_path_en: string
          source_path_zh: string
          title_en: string
          title_zh: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain_id: string
          heading_anchor_en?: string | null
          heading_anchor_zh?: string | null
          id?: string
          slug: string
          sort_order: number
          source_path_en: string
          source_path_zh: string
          title_en: string
          title_zh: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain_id?: string
          heading_anchor_en?: string | null
          heading_anchor_zh?: string | null
          id?: string
          slug?: string
          sort_order?: number
          source_path_en?: string
          source_path_zh?: string
          title_en?: string
          title_zh?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sections_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "study_domains"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ai_feature: "question_generation" | "tutor" | "translation"
      app_role: "student" | "admin"
      approval_status: "pending" | "approved" | "rejected"
      question_status: "draft" | "pending_review" | "active" | "disabled"
      quiz_attempt_status: "in_progress" | "completed" | "abandoned" | "expired"
      quiz_mode: "learning" | "mock_exam"
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
      ai_feature: ["question_generation", "tutor", "translation"],
      app_role: ["student", "admin"],
      approval_status: ["pending", "approved", "rejected"],
      question_status: ["draft", "pending_review", "active", "disabled"],
      quiz_attempt_status: ["in_progress", "completed", "abandoned", "expired"],
      quiz_mode: ["learning", "mock_exam"],
    },
  },
} as const
