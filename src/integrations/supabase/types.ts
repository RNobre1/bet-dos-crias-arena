export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bilhetes: {
        Row: {
          bilhete_id: number
          data_aposta: string
          odd_total: number
          status_bilhete: Database["public"]["Enums"]["bilhete_status"]
          tipo_bilhete: Database["public"]["Enums"]["bilhete_tipo"]
          user_id: string
          valor_apostado: number
        }
        Insert: {
          bilhete_id?: number
          data_aposta?: string
          odd_total: number
          status_bilhete?: Database["public"]["Enums"]["bilhete_status"]
          tipo_bilhete: Database["public"]["Enums"]["bilhete_tipo"]
          user_id: string
          valor_apostado: number
        }
        Update: {
          bilhete_id?: number
          data_aposta?: string
          odd_total?: number
          status_bilhete?: Database["public"]["Enums"]["bilhete_status"]
          tipo_bilhete?: Database["public"]["Enums"]["bilhete_tipo"]
          user_id?: string
          valor_apostado?: number
        }
        Relationships: [
          {
            foreignKeyName: "bilhetes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["user_id"]
          },
        ]
      }
      partidas: {
        Row: {
          created_at: string
          data_partida: string
          partida_id: number
          resultado_final: string | null
          status: Database["public"]["Enums"]["partida_status"]
          time_a_jogadores: string[] | null
          time_a_nome: string
          time_b_jogadores: string[] | null
          time_b_nome: string
        }
        Insert: {
          created_at?: string
          data_partida: string
          partida_id?: number
          resultado_final?: string | null
          status?: Database["public"]["Enums"]["partida_status"]
          time_a_jogadores?: string[] | null
          time_a_nome: string
          time_b_jogadores?: string[] | null
          time_b_nome: string
        }
        Update: {
          created_at?: string
          data_partida?: string
          partida_id?: number
          resultado_final?: string | null
          status?: Database["public"]["Enums"]["partida_status"]
          time_a_jogadores?: string[] | null
          time_a_nome?: string
          time_b_jogadores?: string[] | null
          time_b_nome?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          assistencias: number
          created_at: string
          defesas: number
          desarmes: number
          faltas: number
          gols: number
          id: string
          jogador: string
          jogos: number
          nota: number
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistencias?: number
          created_at?: string
          defesas?: number
          desarmes?: number
          faltas?: number
          gols?: number
          id?: string
          jogador: string
          jogos?: number
          nota?: number
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistencias?: number
          created_at?: string
          defesas?: number
          desarmes?: number
          faltas?: number
          gols?: number
          id?: string
          jogador?: string
          jogos?: number
          nota?: number
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["user_id"]
          },
        ]
      }
      selecoes: {
        Row: {
          bilhete_id: number
          categoria_aposta: string
          detalhe_aposta: string
          jogador_alvo_id: string | null
          odd_selecao: number
          partida_id: number
          selecao_id: number
          status_selecao: Database["public"]["Enums"]["selecao_status"]
        }
        Insert: {
          bilhete_id: number
          categoria_aposta: string
          detalhe_aposta: string
          jogador_alvo_id?: string | null
          odd_selecao: number
          partida_id: number
          selecao_id?: number
          status_selecao?: Database["public"]["Enums"]["selecao_status"]
        }
        Update: {
          bilhete_id?: number
          categoria_aposta?: string
          detalhe_aposta?: string
          jogador_alvo_id?: string | null
          odd_selecao?: number
          partida_id?: number
          selecao_id?: number
          status_selecao?: Database["public"]["Enums"]["selecao_status"]
        }
        Relationships: [
          {
            foreignKeyName: "selecoes_bilhete_id_fkey"
            columns: ["bilhete_id"]
            isOneToOne: false
            referencedRelation: "bilhetes"
            referencedColumns: ["bilhete_id"]
          },
          {
            foreignKeyName: "selecoes_jogador_alvo_id_fkey"
            columns: ["jogador_alvo_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "selecoes_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "partidas"
            referencedColumns: ["partida_id"]
          },
        ]
      }
      usuarios: {
        Row: {
          created_at: string
          email: string
          primeiro_login: boolean
          role: Database["public"]["Enums"]["role_type"]
          saldo_ficticio: number
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          primeiro_login?: boolean
          role?: Database["public"]["Enums"]["role_type"]
          saldo_ficticio?: number
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          primeiro_login?: boolean
          role?: Database["public"]["Enums"]["role_type"]
          saldo_ficticio?: number
          updated_at?: string
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
      [_ in never]: never
    }
    Enums: {
      bilhete_status: "ABERTO" | "GANHO" | "PERDIDO" | "ANULADO"
      bilhete_tipo: "SIMPLES" | "MULTIPLA"
      partida_status: "AGENDADA" | "AO_VIVO" | "FINALIZADA" | "ADIADA"
      role_type: "USER" | "ADMIN"
      selecao_status: "PENDENTE" | "GANHA" | "PERDIDA" | "ANULADA"
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
      bilhete_status: ["ABERTO", "GANHO", "PERDIDO", "ANULADO"],
      bilhete_tipo: ["SIMPLES", "MULTIPLA"],
      partida_status: ["AGENDADA", "AO_VIVO", "FINALIZADA", "ADIADA"],
      role_type: ["USER", "ADMIN"],
      selecao_status: ["PENDENTE", "GANHA", "PERDIDA", "ANULADA"],
    },
  },
} as const
