import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Algoritmo de Cálculo de Nota V2.2: Nota Média de Performance
 * 
 * Este algoritmo transforma as estatísticas totais acumuladas de um jogador 
 * em uma única "Nota" final, que representa seu desempenho médio e consistente por jogo.
 */
export const calculatePlayerNote = (player: Tables<"players">): number => {
  // Se o jogador não tem jogos, retorna nota mínima
  if (player.jogos === 0) return 5.0;

  // Passo 1 e 2.1: Calcular a Pontuação Bruta Total
  // Tabela de Pontos de Ação (Recalibrada para Médias):
  // - GOL MARCADO: +3.0
  // - ASSISTÊNCIA: +2.0  
  // - DESARME: +0.5
  // - DEFESA: +0.8
  // - FALTA COMETIDA: -0.2
  const pontuacaoBrutaTotal = 
    (player.gols * 3.0) + 
    (player.assistencias * 2.0) + 
    (player.desarmes * 0.5) + 
    (player.defesas * 0.8) - 
    (player.faltas * 0.2);

  // Passo 2.2: Calcular a Pontuação Média por Jogo
  const pontuacaoMediaPorJogo = pontuacaoBrutaTotal / player.jogos;

  // Passo 3: Mapeamento da Pontuação Média para a Nota Final
  // Usando função de curva logística com parâmetros calibrados:
  // - Piso: 5.0 (nota mínima absoluta)
  // - Amplitude: 5.0 (escala de 5.0 a 10.0)
  // - Ponto de Inflexão: 5.0 (jogador que gera 6.0 pontos/jogo = nota 7.5)
  // - k (Sensibilidade): 0.5 (diferenciação entre jogadores com médias próximas)
  
  const piso = 5.0;
  const amplitude = 5.0;
  const pontoInflexao = 5.0;
  const k = 0.5;

  const notaFinal = piso + (amplitude / (1 + Math.exp(-k * (pontuacaoMediaPorJogo - pontoInflexao))));

  // Garantir que a nota esteja dentro dos limites (5.0 - 10.0)
  return Math.max(5.0, Math.min(10.0, Math.round(notaFinal * 10) / 10));
};

export const calculatePositionScores = (player: Tables<"players">) => {
  if (player.jogos === 0) {
    return { goleiro: 0, atacante: 0, volante: 0 };
  }

  // Pontuação de Goleiro - "pureza" defensiva
  const pontuacaoGoleiro = ((player.defesas * 2.0) - (player.faltas * 0.25) - 
                           (player.gols * 0.5) - (player.assistencias * 0.25)) / player.jogos;

  // Pontuação de Atacante - foco em finalização
  const pontuacaoAtacante = ((player.gols * 2.0) + (player.assistencias * 1.0) - 
                            (player.faltas * 0.25)) / player.jogos;

  // Pontuação de Volante - equilíbrio entre criação e defesa
  const pontuacaoVolante = ((player.gols * 0.5) + (player.assistencias * 1.5) + 
                           (player.desarmes * 1.5) - (player.faltas * 0.25)) / player.jogos;

  return {
    goleiro: Math.max(0, pontuacaoGoleiro),
    atacante: Math.max(0, pontuacaoAtacante),
    volante: Math.max(0, pontuacaoVolante)
  };
};

// Função para recalcular e atualizar todas as notas no banco
export const recalcularTodasAsNotas = async (jogadores: Tables<"players">[]) => {
  const updates = jogadores.map(player => {
    const novaNota = calculatePlayerNote(player);
    return {
      id: player.id,
      nota: novaNota
    };
  });

  // Atualizar todas as notas no banco de dados
  for (const update of updates) {
    await supabase
      .from('players')
      .update({ nota: update.nota })
      .eq('id', update.id);
  }
};