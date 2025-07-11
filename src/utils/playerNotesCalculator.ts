
import { Tables } from "@/integrations/supabase/types";

export const calculatePlayerNote = (player: Tables<"players">, allPlayers: Tables<"players">[]): number => {
  if (player.jogos === 0) return 5.0;

  // Passo 1.1: Calcular os "Impactos" por Jogo
  const impactoOfensivo = ((player.gols * 2.0) + (player.assistencias * 1.0)) / player.jogos;
  const impactoDefensivo = ((player.defesas * 1.5) + (player.desarmes * 1.0)) / player.jogos;

  // Passo 1.2: Calcular a "Penalidade" por Jogo
  const penalidade = (player.faltas * 0.25) / player.jogos;

  // Passo 1.3: Calcular a "Pontuação de Impacto Bruta" (PIB)
  const pontuacaoImpactoBruta = Math.max(impactoOfensivo, impactoDefensivo) - penalidade;

  // Passo 1.4: Normalizar para a "Nota" Final (Escala 5.0-9.8)
  // Calcular PIB de todos os jogadores para normalização
  const todasPIBs = allPlayers.map(p => {
    if (p.jogos === 0) return 0;
    const iAtk = ((p.gols * 2.0) + (p.assistencias * 1.0)) / p.jogos;
    const iDef = ((p.defesas * 1.5) + (p.desarmes * 1.0)) / p.jogos;
    const pen = (p.faltas * 0.25) / p.jogos;
    return Math.max(iAtk, iDef) - pen;
  });

  const pibMaximo = Math.max(...todasPIBs);
  const pibMinimo = Math.min(...todasPIBs);
  
  // Evitar divisão por zero
  if (pibMaximo === pibMinimo) return 7.0;

  // Normalização linear para escala 5.0-9.8
  const notaMin = 5.0;
  const notaMax = 9.8;
  
  const nota = notaMin + ((pontuacaoImpactoBruta - pibMinimo) / (pibMaximo - pibMinimo)) * (notaMax - notaMin);
  
  return Math.round(Math.max(1.0, Math.min(10.0, nota)) * 10) / 10;
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
import { supabase } from "@/integrations/supabase/client";

export const recalcularTodasAsNotas = async (jogadores: Tables<"players">[]) => {
  const updates = jogadores.map(player => {
    const novaNota = calculatePlayerNote(player, jogadores);
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
