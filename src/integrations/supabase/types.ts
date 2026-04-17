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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      login_attempts: {
        Row: {
          attempt_count: number
          email: string
          id: string
          locked_until: string | null
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          email: string
          id?: string
          locked_until?: string | null
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          email?: string
          id?: string
          locked_until?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notas_corretagem: {
        Row: {
          arquivo_nome: string | null
          corretora: string
          created_at: string
          data_operacao: string | null
          id: string
          taxas: number | null
          taxas_detalhadas: Json | null
          updated_at: string
          user_id: string
          valor_compras: number | null
          valor_total: number | null
          valor_vendas: number | null
        }
        Insert: {
          arquivo_nome?: string | null
          corretora: string
          created_at?: string
          data_operacao?: string | null
          id?: string
          taxas?: number | null
          taxas_detalhadas?: Json | null
          updated_at?: string
          user_id: string
          valor_compras?: number | null
          valor_total?: number | null
          valor_vendas?: number | null
        }
        Update: {
          arquivo_nome?: string | null
          corretora?: string
          created_at?: string
          data_operacao?: string | null
          id?: string
          taxas?: number | null
          taxas_detalhadas?: Json | null
          updated_at?: string
          user_id?: string
          valor_compras?: number | null
          valor_total?: number | null
          valor_vendas?: number | null
        }
        Relationships: []
      }
      operacoes: {
        Row: {
          ativo: string
          created_at: string
          id: string
          nota_id: string | null
          preco_unitario: number
          quantidade: number
          tipo: string
          user_id: string
          valor_total: number
        }
        Insert: {
          ativo: string
          created_at?: string
          id?: string
          nota_id?: string | null
          preco_unitario?: number
          quantidade?: number
          tipo: string
          user_id: string
          valor_total?: number
        }
        Update: {
          ativo?: string
          created_at?: string
          id?: string
          nota_id?: string | null
          preco_unitario?: number
          quantidade?: number
          tipo?: string
          user_id?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "operacoes_nota_id_fkey"
            columns: ["nota_id"]
            isOneToOne: false
            referencedRelation: "notas_corretagem"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          nome: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id: string
          nome?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      signup_attempts: {
        Row: {
          created_at: string
          email: string
          error_message: string | null
          id: string
          nome: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          error_message?: string | null
          id?: string
          nome?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          error_message?: string | null
          id?: string
          nome?: string | null
          status?: string
        }
        Relationships: []
      }
      ticker_changes: {
        Row: {
          bonus_price: number | null
          bonus_ratio: number | null
          bonus_ticker: string | null
          change_date: string
          created_at: string
          description: string | null
          id: string
          new_ticker: string
          old_ticker: string
          reason: string
        }
        Insert: {
          bonus_price?: number | null
          bonus_ratio?: number | null
          bonus_ticker?: string | null
          change_date: string
          created_at?: string
          description?: string | null
          id?: string
          new_ticker: string
          old_ticker: string
          reason?: string
        }
        Update: {
          bonus_price?: number | null
          bonus_ratio?: number | null
          bonus_ticker?: string | null
          change_date?: string
          created_at?: string
          description?: string | null
          id?: string
          new_ticker?: string
          old_ticker?: string
          reason?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          starts_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_login_locked: { Args: { p_email: string }; Returns: Json }
      increment_login_attempts: { Args: { p_email: string }; Returns: Json }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      reset_login_attempts: { Args: { p_email: string }; Returns: undefined }
    }
    Enums: {
      subscription_plan: "basic" | "premium" | "platinum"
      subscription_status: "active" | "cancelled" | "expired"
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
      subscription_plan: ["basic", "premium", "platinum"],
      subscription_status: ["active", "cancelled", "expired"],
    },
  },
} as const
