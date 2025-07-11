
import { Tables } from "@/integrations/supabase/types";

export const calculatePlayerNote = (player: Tables<"players">): number => {
  if (player.jogos === 0) return 5.0;

  // Impacto Ofensivo
  const impactoOfensivo = ((player.gols * 2.0) + (player.assistencias * 1.0)) / player.jogos;

  // Impacto Defensivo
  const impactoDefensivo = ((player.defesas * 1.5) + (player.desarmes * 1.0)) / player.jogos;

  // Penalidade por Indisciplina
  const penalidade = (player.faltas * 0.25) / player.jogos;

  // Pontuação de Impacto Bruta
  const pontuacaoBruta = Math.max(impactoOfensivo, impactoDefensivo) - penalidade;

  // Converter para escala de 1-10 (simplificado)
  // Em uma implementação completa, você escalaria baseado em todos os jogadores
  const nota = Math.max(1.0, Math.min(10.0, 5.0 + (pontuacaoBruta * 2)));
  
  return Math.round(nota * 10) / 10; // Arredondar para 1 casa decimal
};

export const calculatePositionScores = (player: Tables<"players">) => {
  if (player.jogos === 0) {
    return { goleiro: 0, atacante: 0, volante: 0 };
  }

  // Pontuação de Goleiro
  const pontuacaoGoleiro = ((player.defesas * 2.0) - (player.faltas * 0.25) - 
                           (player.gols * 0.5) - (player.assistencias * 0.25)) / player.jogos;

  // Pontuação de Atacante
  const pontuacaoAtacante = ((player.gols * 2.0) + (player.assistencias * 1.0) - 
                            (player.faltas * 0.25)) / player.jogos;

  // Pontuação de Volante
  const pontuacaoVolante = ((player.gols * 0.5) + (player.assistencias * 1.5) + 
                           (player.desarmes * 1.5) - (player.faltas * 0.25)) / player.jogos;

  return {
    goleiro: Math.max(0, pontuacaoGoleiro),
    atacante: Math.max(0, pontuacaoAtacante),
    volante: Math.max(0, pontuacaoVolante)
  };
};
