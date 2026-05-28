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
      ordens_servico: {
        Row: {
          amperagem: string | null
          assinatura_cliente: string | null
          chk_chegou: boolean | null
          chk_diagnostico: boolean | null
          chk_peca_trocada: boolean | null
          chk_teste_ok: boolean | null
          cliente_nome: string
          cliente_telefone: string
          created_at: string
          created_by: string | null
          data_agendada: string
          descricao_problema: string | null
          endereco: string
          forma_pagamento: string | null
          garantia_ate: string | null
          hora_finalizado: string | null
          id: string
          kg_gas: number | null
          laudo: string | null
          marca_modelo: string | null
          motivo_nao_realizado: string | null
          numero_os: number
          numero_serie: string | null
          pressao_alta: string | null
          pressao_baixa: string | null
          status: Database["public"]["Enums"]["os_status"]
          tecnico_id: string | null
          tipo_equipamento: string
          tipo_servico: string
          updated_at: string
          valor: number | null
        }
        Insert: {
          amperagem?: string | null
          assinatura_cliente?: string | null
          chk_chegou?: boolean | null
          chk_diagnostico?: boolean | null
          chk_peca_trocada?: boolean | null
          chk_teste_ok?: boolean | null
          cliente_nome: string
          cliente_telefone: string
          created_at?: string
          created_by?: string | null
          data_agendada: string
          descricao_problema?: string | null
          endereco: string
          forma_pagamento?: string | null
          garantia_ate?: string | null
          hora_finalizado?: string | null
          id?: string
          kg_gas?: number | null
          laudo?: string | null
          marca_modelo?: string | null
          motivo_nao_realizado?: string | null
          numero_os?: number
          numero_serie?: string | null
          pressao_alta?: string | null
          pressao_baixa?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          tecnico_id?: string | null
          tipo_equipamento: string
          tipo_servico: string
          updated_at?: string
          valor?: number | null
        }
        Update: {
          amperagem?: string | null
          assinatura_cliente?: string | null
          chk_chegou?: boolean | null
          chk_diagnostico?: boolean | null
          chk_peca_trocada?: boolean | null
          chk_teste_ok?: boolean | null
          cliente_nome?: string
          cliente_telefone?: string
          created_at?: string
          created_by?: string | null
          data_agendada?: string
          descricao_problema?: string | null
          endereco?: string
          forma_pagamento?: string | null
          garantia_ate?: string | null
          hora_finalizado?: string | null
          id?: string
          kg_gas?: number | null
          laudo?: string | null
          marca_modelo?: string | null
          motivo_nao_realizado?: string | null
          numero_os?: number
          numero_serie?: string | null
          pressao_alta?: string | null
          pressao_baixa?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          tecnico_id?: string | null
          tipo_equipamento?: string
          tipo_servico?: string
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "tecnicos"
            referencedColumns: ["id"]
          },
        ]
      }
      os_fotos: {
        Row: {
          created_at: string
          id: string
          os_id: string
          tipo: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          os_id: string
          tipo: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          os_id?: string
          tipo?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_fotos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string
          tecnico_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nome: string
          tecnico_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          tecnico_id?: string | null
        }
        Relationships: []
      }
      tecnicos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_tecnico_da_os: {
        Args: { _tecnico_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "tecnico"
      os_status: "agendado" | "em_andamento" | "concluido" | "nao_realizado"
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
      app_role: ["admin", "tecnico"],
      os_status: ["agendado", "em_andamento", "concluido", "nao_realizado"],
    },
  },
} as const
