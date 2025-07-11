
import { Tables } from "@/integrations/supabase/types";

export interface Selecao {
  id: string; // ID único para a seleção no bilhete (gerado no cliente)
  partida_id: number;
  categoria: string; // Ex: 'RESULTADO_PARTIDA'
  detalhe: string; // Ex: 'VITORIA_A' ou 'GOLS_MAIS_0.5_uuid-do-jogador'
  descricao: string; // Descrição amigável para o usuário. Ex: "Time A para Vencer"
  odd: number;
  jogador_id?: string | null; // UUID do jogador da tabela 'players'
}
