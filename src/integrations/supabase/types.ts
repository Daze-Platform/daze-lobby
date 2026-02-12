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
      activity_logs: {
        Row: {
          action: string
          client_id: string
          created_at: string
          details: Json | null
          id: string
          is_auto_logged: boolean | null
          user_id: string | null
        }
        Insert: {
          action: string
          client_id: string
          created_at?: string
          details?: Json | null
          id?: string
          is_auto_logged?: boolean | null
          user_id?: string | null
        }
        Update: {
          action?: string
          client_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          is_auto_logged?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_hotel_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      blocker_alerts: {
        Row: {
          auto_rule: string | null
          blocker_type: Database["public"]["Enums"]["blocker_type"]
          client_id: string
          created_at: string
          created_by_id: string | null
          id: string
          reason: string
          resolved_at: string | null
          resolved_by_id: string | null
          task_id: string | null
        }
        Insert: {
          auto_rule?: string | null
          blocker_type: Database["public"]["Enums"]["blocker_type"]
          client_id: string
          created_at?: string
          created_by_id?: string | null
          id?: string
          reason: string
          resolved_at?: string | null
          resolved_by_id?: string | null
          task_id?: string | null
        }
        Update: {
          auto_rule?: string | null
          blocker_type?: Database["public"]["Enums"]["blocker_type"]
          client_id?: string
          created_at?: string
          created_by_id?: string | null
          id?: string
          reason?: string
          resolved_at?: string | null
          resolved_by_id?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocker_alerts_hotel_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocker_alerts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "onboarding_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          client_id: string
          created_at: string
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_contacts_hotel_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          arr: number | null
          assigned_team_member_id: string | null
          authorized_signer_name: string | null
          authorized_signer_title: string | null
          billing_address: string | null
          brand_palette: Json | null
          client_code: string | null
          client_slug: string | null
          contract_value: number | null
          created_at: string
          deleted_at: string | null
          id: string
          legal_entity_name: string | null
          logo_url: string | null
          name: string
          next_milestone: string | null
          next_milestone_date: string | null
          notes: string | null
          onboarding_progress: number | null
          phase: Database["public"]["Enums"]["lifecycle_phase"]
          phase_started_at: string
          updated_at: string
        }
        Insert: {
          arr?: number | null
          assigned_team_member_id?: string | null
          authorized_signer_name?: string | null
          authorized_signer_title?: string | null
          billing_address?: string | null
          brand_palette?: Json | null
          client_code?: string | null
          client_slug?: string | null
          contract_value?: number | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          legal_entity_name?: string | null
          logo_url?: string | null
          name: string
          next_milestone?: string | null
          next_milestone_date?: string | null
          notes?: string | null
          onboarding_progress?: number | null
          phase?: Database["public"]["Enums"]["lifecycle_phase"]
          phase_started_at?: string
          updated_at?: string
        }
        Update: {
          arr?: number | null
          assigned_team_member_id?: string | null
          authorized_signer_name?: string | null
          authorized_signer_title?: string | null
          billing_address?: string | null
          brand_palette?: Json | null
          client_code?: string | null
          client_slug?: string | null
          contract_value?: number | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          legal_entity_name?: string | null
          logo_url?: string | null
          name?: string
          next_milestone?: string | null
          next_milestone_date?: string | null
          notes?: string | null
          onboarding_progress?: number | null
          phase?: Database["public"]["Enums"]["lifecycle_phase"]
          phase_started_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          client_id: string
          created_at: string
          device_type: string
          id: string
          install_date: string | null
          is_daze_owned: boolean
          last_check_in: string | null
          serial_number: string
          status: Database["public"]["Enums"]["device_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          device_type: string
          id?: string
          install_date?: string | null
          is_daze_owned?: boolean
          last_check_in?: string | null
          serial_number: string
          status?: Database["public"]["Enums"]["device_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          device_type?: string
          id?: string
          install_date?: string | null
          is_daze_owned?: boolean
          last_check_in?: string | null
          serial_number?: string
          status?: Database["public"]["Enums"]["device_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_hotel_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      document_analyses: {
        Row: {
          analysis_type: string
          client_id: string
          completeness_score: number
          created_at: string
          document_id: string
          extracted_data: Json
          id: string
          missing_fields: Json
          summary: string | null
        }
        Insert: {
          analysis_type: string
          client_id: string
          completeness_score?: number
          created_at?: string
          document_id: string
          extracted_data?: Json
          id?: string
          missing_fields?: Json
          summary?: string | null
        }
        Update: {
          analysis_type?: string
          client_id?: string
          completeness_score?: number
          created_at?: string
          document_id?: string
          extracted_data?: Json
          id?: string
          missing_fields?: Json
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_analyses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_analyses_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          client_id: string
          created_at: string
          display_name: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          updated_at: string
          uploaded_by_id: string | null
        }
        Insert: {
          category?: string | null
          client_id: string
          created_at?: string
          display_name: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          updated_at?: string
          uploaded_by_id?: string | null
        }
        Update: {
          category?: string | null
          client_id?: string
          created_at?: string
          display_name?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          updated_at?: string
          uploaded_by_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_hotel_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          client_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_tasks: {
        Row: {
          client_id: string
          completed_at: string | null
          completed_by_id: string | null
          created_at: string
          data: Json | null
          id: string
          is_completed: boolean
          task_key: string
          task_name: string
          updated_at: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          completed_by_id?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_completed?: boolean
          task_key: string
          task_name: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          completed_by_id?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_completed?: boolean
          task_key?: string
          task_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tasks_hotel_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          alert_agreement_signed: boolean | null
          alert_device_offline: boolean | null
          alert_new_property: boolean | null
          avatar_url: string | null
          created_at: string
          dark_mode: boolean | null
          full_name: string | null
          id: string
          two_factor_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_agreement_signed?: boolean | null
          alert_device_offline?: boolean | null
          alert_new_property?: boolean | null
          avatar_url?: string | null
          created_at?: string
          dark_mode?: boolean | null
          full_name?: string | null
          id?: string
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_agreement_signed?: boolean | null
          alert_device_offline?: boolean | null
          alert_new_property?: boolean | null
          avatar_url?: string | null
          created_at?: string
          dark_mode?: boolean | null
          full_name?: string | null
          id?: string
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      specifications: {
        Row: {
          content: string
          created_at: string
          created_by_id: string | null
          id: string
          name: string
          updated_at: string
          version: string | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by_id?: string | null
          id?: string
          name: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by_id?: string | null
          id?: string
          name?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      user_clients: {
        Row: {
          client_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_hotels_hotel_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      venue_menus: {
        Row: {
          created_at: string
          file_name: string
          file_url: string
          id: string
          label: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_url: string
          id?: string
          label?: string
          venue_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_url?: string
          id?: string
          label?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_menus_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          additional_logo_url: string | null
          client_id: string
          color_palette: Json | null
          created_at: string
          id: string
          logo_url: string | null
          menu_pdf_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          additional_logo_url?: string | null
          client_id: string
          color_palette?: Json | null
          created_at?: string
          id?: string
          logo_url?: string | null
          menu_pdf_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          additional_logo_url?: string | null
          client_id?: string
          color_palette?: Json | null
          created_at?: string
          id?: string
          logo_url?: string | null
          menu_pdf_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_hotel_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          dark_mode: boolean | null
          full_name: string | null
          id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          dark_mode?: boolean | null
          full_name?: string | null
          id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          dark_mode?: boolean | null
          full_name?: string | null
          id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_client: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_hotel: {
        Args: { _hotel_id: string; _user_id: string }
        Returns: boolean
      }
      check_client_inactivity: { Args: never; Returns: Json }
      generate_slug: { Args: { input_text: string }; Returns: string }
      get_user_client_id: { Args: { _user_id: string }; Returns: string }
      get_user_hotel_id: { Args: { _user_id: string }; Returns: string }
      has_dashboard_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_client: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "ops_manager" | "support" | "client"
      blocker_type: "manual" | "automatic"
      device_status: "online" | "offline" | "maintenance"
      lifecycle_phase: "onboarding" | "reviewing" | "pilot_live" | "contracted"
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
      app_role: ["admin", "ops_manager", "support", "client"],
      blocker_type: ["manual", "automatic"],
      device_status: ["online", "offline", "maintenance"],
      lifecycle_phase: ["onboarding", "reviewing", "pilot_live", "contracted"],
    },
  },
} as const
