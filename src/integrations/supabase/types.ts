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
      abundance_deposits: {
        Row: {
          amount: number
          created_at: string
          currency: string
          date: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          date?: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          date?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      access_actions: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          meta: Json | null
          product_id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          product_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          product_id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_actions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "access_products"
            referencedColumns: ["id"]
          },
        ]
      }
      access_control: {
        Row: {
          created_at: string
          external_customer_id: string | null
          external_provider: string | null
          external_subscription_id: string | null
          external_transaction_id: string | null
          id: string
          program_id: string
          reason: string | null
          source: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          external_customer_id?: string | null
          external_provider?: string | null
          external_subscription_id?: string | null
          external_transaction_id?: string | null
          id?: string
          program_id: string
          reason?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          external_customer_id?: string | null
          external_provider?: string | null
          external_subscription_id?: string | null
          external_transaction_id?: string | null
          id?: string
          program_id?: string
          reason?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_control_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      access_entitlements: {
        Row: {
          ends_at: string | null
          external_customer_id: string | null
          external_subscription_id: string | null
          id: string
          product_id: string
          source: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ends_at?: string | null
          external_customer_id?: string | null
          external_subscription_id?: string | null
          id?: string
          product_id: string
          source?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ends_at?: string | null
          external_customer_id?: string | null
          external_subscription_id?: string | null
          id?: string
          product_id?: string
          source?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_entitlements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "access_products"
            referencedColumns: ["id"]
          },
        ]
      }
      access_events: {
        Row: {
          error: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          provider_event_id: string
          received_at: string
          status: string
        }
        Insert: {
          error?: string | null
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider: string
          provider_event_id: string
          received_at?: string
          status?: string
        }
        Update: {
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          provider_event_id?: string
          received_at?: string
          status?: string
        }
        Relationships: []
      }
      access_products: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string
          id: string
          pinned: boolean
          scope: string
          scope_id: string | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by: string
          id?: string
          pinned?: boolean
          scope?: string
          scope_id?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          id?: string
          pinned?: boolean
          scope?: string
          scope_id?: string | null
          title?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          provider: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          provider?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          provider?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      content_items: {
        Row: {
          created_at: string
          day_id: string
          id: string
          order: number
          title: string
          type: Database["public"]["Enums"]["content_type"]
          url: string
        }
        Insert: {
          created_at?: string
          day_id: string
          id?: string
          order?: number
          title: string
          type: Database["public"]["Enums"]["content_type"]
          url: string
        }
        Update: {
          created_at?: string
          day_id?: string
          id?: string
          order?: number
          title?: string
          type?: Database["public"]["Enums"]["content_type"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_items_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "days"
            referencedColumns: ["id"]
          },
        ]
      }
      days: {
        Row: {
          created_at: string
          date: string
          id: string
          number: number
          unlock_date: string
          week_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          number: number
          unlock_date: string
          week_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          number?: number
          unlock_date?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "days_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          date: string
          day_id: string | null
          id: string
          month_id: string | null
          updated_at: string
          user_id: string
          week_id: string | null
        }
        Insert: {
          content?: string
          created_at?: string
          date?: string
          day_id?: string | null
          id?: string
          month_id?: string | null
          updated_at?: string
          user_id: string
          week_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          date?: string
          day_id?: string | null
          id?: string
          month_id?: string | null
          updated_at?: string
          user_id?: string
          week_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_month_id_fkey"
            columns: ["month_id"]
            isOneToOne: false
            referencedRelation: "months"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_scores: {
        Row: {
          days_completed: number
          id: string
          period_key: string
          period_type: Database["public"]["Enums"]["period_type"]
          score: number
          updated_at: string
          user_id: string
          weeks_completed: number
        }
        Insert: {
          days_completed?: number
          id?: string
          period_key: string
          period_type: Database["public"]["Enums"]["period_type"]
          score?: number
          updated_at?: string
          user_id: string
          weeks_completed?: number
        }
        Update: {
          days_completed?: number
          id?: string
          period_key?: string
          period_type?: Database["public"]["Enums"]["period_type"]
          score?: number
          updated_at?: string
          user_id?: string
          weeks_completed?: number
        }
        Relationships: []
      }
      month_resources: {
        Row: {
          created_at: string
          description: string | null
          file_path: string | null
          id: string
          kind: string
          mime_type: string | null
          month_id: string
          size_bytes: number | null
          sort_order: number
          title: string | null
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          kind: string
          mime_type?: string | null
          month_id: string
          size_bytes?: number | null
          sort_order?: number
          title?: string | null
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          kind?: string
          mime_type?: string | null
          month_id?: string
          size_bytes?: number | null
          sort_order?: number
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "month_resources_month_id_fkey"
            columns: ["month_id"]
            isOneToOne: false
            referencedRelation: "months"
            referencedColumns: ["id"]
          },
        ]
      }
      month_task_assets: {
        Row: {
          created_at: string
          description: string | null
          file_path: string | null
          id: string
          kind: string
          mime_type: string | null
          month_task_id: string
          size_bytes: number | null
          sort_order: number
          title: string | null
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          kind: string
          mime_type?: string | null
          month_task_id: string
          size_bytes?: number | null
          sort_order?: number
          title?: string | null
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          kind?: string
          mime_type?: string | null
          month_task_id?: string
          size_bytes?: number | null
          sort_order?: number
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "month_task_assets_month_task_id_fkey"
            columns: ["month_task_id"]
            isOneToOne: false
            referencedRelation: "month_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      month_task_checks: {
        Row: {
          checked: boolean
          checked_at: string
          id: string
          month_id: string
          month_task_id: string
          user_id: string
        }
        Insert: {
          checked?: boolean
          checked_at?: string
          id?: string
          month_id: string
          month_task_id: string
          user_id: string
        }
        Update: {
          checked?: boolean
          checked_at?: string
          id?: string
          month_id?: string
          month_task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "month_task_checks_month_id_fkey"
            columns: ["month_id"]
            isOneToOne: false
            referencedRelation: "months"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "month_task_checks_month_task_id_fkey"
            columns: ["month_task_id"]
            isOneToOne: false
            referencedRelation: "month_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      month_task_notes: {
        Row: {
          created_at: string
          id: string
          month_id: string
          month_task_id: string
          note: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month_id: string
          month_task_id: string
          note?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month_id?: string
          month_task_id?: string
          note?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "month_task_notes_month_id_fkey"
            columns: ["month_id"]
            isOneToOne: false
            referencedRelation: "months"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "month_task_notes_month_task_id_fkey"
            columns: ["month_task_id"]
            isOneToOne: false
            referencedRelation: "month_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      month_task_subtask_checks: {
        Row: {
          checked: boolean
          checked_at: string
          id: string
          month_id: string
          subtask_id: string
          user_id: string
        }
        Insert: {
          checked?: boolean
          checked_at?: string
          id?: string
          month_id: string
          subtask_id: string
          user_id: string
        }
        Update: {
          checked?: boolean
          checked_at?: string
          id?: string
          month_id?: string
          subtask_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "month_task_subtask_checks_month_id_fkey"
            columns: ["month_id"]
            isOneToOne: false
            referencedRelation: "months"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "month_task_subtask_checks_subtask_id_fkey"
            columns: ["subtask_id"]
            isOneToOne: false
            referencedRelation: "month_task_subtasks"
            referencedColumns: ["id"]
          },
        ]
      }
      month_task_subtasks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          month_task_id: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          month_task_id: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          month_task_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "month_task_subtasks_month_task_id_fkey"
            columns: ["month_task_id"]
            isOneToOne: false
            referencedRelation: "month_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      month_tasks: {
        Row: {
          audio_url: string | null
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          image_url: string | null
          is_active: boolean
          month_id: string | null
          sort_order: number
          title: string
          type: string | null
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          month_id?: string | null
          sort_order?: number
          title: string
          type?: string | null
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          month_id?: string | null
          sort_order?: number
          title?: string
          type?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "month_tasks_month_id_fkey"
            columns: ["month_id"]
            isOneToOne: false
            referencedRelation: "months"
            referencedColumns: ["id"]
          },
        ]
      }
      months: {
        Row: {
          audio_url: string | null
          created_at: string
          id: string
          image_url: string | null
          macro_text: string | null
          name: string
          number: number
          program_id: string
          theme: string | null
          video_url: string | null
          year: number | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          macro_text?: string | null
          name: string
          number: number
          program_id: string
          theme?: string | null
          video_url?: string | null
          year?: number | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          macro_text?: string | null
          name?: string
          number?: number
          program_id?: string
          theme?: string | null
          video_url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "months_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      product_mappings: {
        Row: {
          action: string
          created_at: string
          external_product_id: string
          external_type: string
          id: string
          is_active: boolean
          metadata: Json
          program_id: string
          provider: string
        }
        Insert: {
          action?: string
          created_at?: string
          external_product_id: string
          external_type?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          program_id: string
          provider: string
        }
        Update: {
          action?: string
          created_at?: string
          external_product_id?: string
          external_type?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          program_id?: string
          provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_mappings_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_settings: {
        Row: {
          created_at: string
          daily_reminder: boolean
          id: string
          must_change_password: boolean
          reminder_time: string
          show_in_ranking: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_reminder?: boolean
          id?: string
          must_change_password?: boolean
          reminder_time?: string
          show_in_ranking?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_reminder?: boolean
          id?: string
          must_change_password?: boolean
          reminder_time?: string
          show_in_ranking?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_status: {
        Row: {
          ahorro_actual: string | null
          cierre_2025: string | null
          created_at: string
          deuda_total: string | null
          gastos_actuales: string | null
          id: string
          ingresos_actuales: string | null
          inversion_en_uno: string | null
          libros_leidos: string | null
          pagos_minimos: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ahorro_actual?: string | null
          cierre_2025?: string | null
          created_at?: string
          deuda_total?: string | null
          gastos_actuales?: string | null
          id?: string
          ingresos_actuales?: string | null
          inversion_en_uno?: string | null
          libros_leidos?: string | null
          pagos_minimos?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ahorro_actual?: string | null
          cierre_2025?: string | null
          created_at?: string
          deuda_total?: string | null
          gastos_actuales?: string | null
          id?: string
          ingresos_actuales?: string | null
          inversion_en_uno?: string | null
          libros_leidos?: string | null
          pagos_minimos?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          created_at: string
          end_date: string
          id: string
          name: string
          start_date: string
          year: number
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          name: string
          start_date: string
          year: number
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          year?: number
        }
        Relationships: []
      }
      provider_identities: {
        Row: {
          created_at: string
          email: string | null
          external_customer_id: string
          id: string
          provider: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          external_customer_id: string
          id?: string
          provider: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          external_customer_id?: string
          id?: string
          provider?: string
          user_id?: string
        }
        Relationships: []
      }
      task_checks: {
        Row: {
          checked_at: string
          day_id: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          checked_at?: string
          day_id: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          checked_at?: string
          day_id?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checks_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_checks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_notes: {
        Row: {
          content: string
          created_at: string
          day_id: string
          id: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          day_id: string
          id?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          day_id?: string
          id?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_notes_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_notes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          category: Database["public"]["Enums"]["task_category"]
          created_at: string
          day_id: string
          description: string | null
          id: string
          is_active: boolean
          media_audio_url: string | null
          media_image_url: string | null
          media_video_url: string | null
          order: number
          task_kind: string
          title: string
        }
        Insert: {
          category: Database["public"]["Enums"]["task_category"]
          created_at?: string
          day_id: string
          description?: string | null
          id?: string
          is_active?: boolean
          media_audio_url?: string | null
          media_image_url?: string | null
          media_video_url?: string | null
          order?: number
          task_kind?: string
          title: string
        }
        Update: {
          category?: Database["public"]["Enums"]["task_category"]
          created_at?: string
          day_id?: string
          description?: string | null
          id?: string
          is_active?: boolean
          media_audio_url?: string | null
          media_image_url?: string | null
          media_video_url?: string | null
          order?: number
          task_kind?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "days"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          current_streak: number
          id: string
          last_completed_date: string | null
          max_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_completed_date?: string | null
          max_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_completed_date?: string | null
          max_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          error: string | null
          event_id: string
          id: string
          payload: Json | null
          processed_at: string | null
          provider: string
          received_at: string
          status: string
        }
        Insert: {
          error?: string | null
          event_id: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          provider: string
          received_at?: string
          status?: string
        }
        Update: {
          error?: string | null
          event_id?: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          provider?: string
          received_at?: string
          status?: string
        }
        Relationships: []
      }
      week_blocks: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_visible: boolean
          order_index: number
          title: string | null
          type: string
          updated_at: string
          week_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          order_index?: number
          title?: string | null
          type: string
          updated_at?: string
          week_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          order_index?: number
          title?: string | null
          type?: string
          updated_at?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "week_blocks_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      weeks: {
        Row: {
          audio_url: string | null
          cover_url: string | null
          created_at: string
          description_long: string | null
          id: string
          mental_playlist_url: string | null
          month_id: string
          name: string
          number: number
          objective: string | null
          schedule_image_url: string | null
          schedule_pdf_url: string | null
          spiritual_playlist_url: string | null
          status: string
        }
        Insert: {
          audio_url?: string | null
          cover_url?: string | null
          created_at?: string
          description_long?: string | null
          id?: string
          mental_playlist_url?: string | null
          month_id: string
          name: string
          number: number
          objective?: string | null
          schedule_image_url?: string | null
          schedule_pdf_url?: string | null
          spiritual_playlist_url?: string | null
          status?: string
        }
        Update: {
          audio_url?: string | null
          cover_url?: string | null
          created_at?: string
          description_long?: string | null
          id?: string
          mental_playlist_url?: string | null
          month_id?: string
          name?: string
          number?: number
          objective?: string | null
          schedule_image_url?: string | null
          schedule_pdf_url?: string | null
          spiritual_playlist_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "weeks_month_id_fkey"
            columns: ["month_id"]
            isOneToOne: false
            referencedRelation: "months"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_user_score: {
        Args: {
          p_period_key: string
          p_period_type: Database["public"]["Enums"]["period_type"]
          p_user_id: string
        }
        Returns: Json
      }
      get_leaderboard: {
        Args: {
          p_limit?: number
          p_period_key: string
          p_period_type: Database["public"]["Enums"]["period_type"]
        }
        Returns: Json
      }
      get_leaderboard_v2: {
        Args: { p_program_id: string; p_scope: string }
        Returns: Json
      }
      get_month_calendar: {
        Args: { p_month_id: string; p_user_id: string }
        Returns: Json
      }
      get_my_ranking_summary: {
        Args: { p_program_id: string; p_user_id: string }
        Returns: Json
      }
      get_user_progress: {
        Args: { p_date?: string; p_user_id: string }
        Returns: Json
      }
      get_week_days_progress: {
        Args: { p_user_id: string; p_week_id: string }
        Returns: Json
      }
      get_year_calendar: {
        Args: { p_user_id: string; p_year: number }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      resolve_day_id: {
        Args: { p_day_number: number; p_week_id: string }
        Returns: string
      }
      seed_program_months: {
        Args: { p_program_id: string }
        Returns: undefined
      }
      update_user_streak: { Args: { p_user_id: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user"
      content_type: "pdf" | "audio" | "video" | "link"
      period_type: "week" | "month" | "year"
      task_category: "cuerpo" | "mente" | "alma" | "finanzas"
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
      app_role: ["admin", "user"],
      content_type: ["pdf", "audio", "video", "link"],
      period_type: ["week", "month", "year"],
      task_category: ["cuerpo", "mente", "alma", "finanzas"],
    },
  },
} as const
