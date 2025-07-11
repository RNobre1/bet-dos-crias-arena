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

// Alias para compatibilidade
export const calcularNotaJogador = calculatePlayerNote;

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

export const calculateOdds = (timeA: Tables<"players">[], timeB: Tables<"players">[], todosJogadores: Tables<"players">[]) => {
  // Parte 1: Odds do Resultado da Partida
  const notaTotalA = timeA.reduce((sum, player) => sum + player.nota, 0);
  const notaTotalB = timeB.reduce((sum, player) => sum + player.nota, 0);
  
  // Passo 1.2: Calcular as Probabilidades Base
  const probVitoriaABase = notaTotalA / (notaTotalA + notaTotalB);
  const probVitoriaBBase = notaTotalB / (notaTotalA + notaTotalB);
  const probEmpateBase = (1 - Math.abs(notaTotalA - notaTotalB) / Math.max(notaTotalA, notaTotalB)) * 0.4;

  // Passo 1.3: Normalizar as Probabilidades
  const somaProbs = probVitoriaABase + probVitoriaBBase + probEmpateBase;
  const probVitoriaANorm = probVitoriaABase / somaProbs;
  const probVitoriaBNorm = probVitoriaBBase / somaProbs;
  const probEmpateNorm = probEmpateBase / somaProbs;

  // Passo 1.4: Aplicar a Margem da Casa (15%)
  const margemCasa = 1.15;
  const probVitoriaAImplicita = probVitoriaANorm * margemCasa;
  const probVitoriaBImplicita = probVitoriaBNorm * margemCasa;
  const probEmpateImplicita = probEmpateNorm * margemCasa;

  // Passo 1.5: Calcular Odds com Piso Mínimo
  const oddTimeA = Math.max(1 / probVitoriaAImplicita, 1.01);
  const oddTimeB = Math.max(1 / probVitoriaBImplicita, 1.01);
  const oddEmpate = Math.max(1 / probEmpateImplicita, 1.01);

  // Parte 2: Odds dos Jogadores
  const jogadoresOdds = todosJogadores.map(jogador => {
    if (jogador.jogos === 0) {
      return {
        id: jogador.id,
        // Gols
        gols_0_5: 3.50,
        gols_1_5: 8.00,
        gols_2_5: 15.00,
        // Assistências
        assistencias_0_5: 4.00,
        assistencias_1_5: 9.00,
        assistencias_2_5: 18.00,
        // Desarmes (apenas jogadores de linha)
        desarmes_1_5: 2.50,
        desarmes_2_5: 5.00,
        desarmes_3_5: 10.00,
        // Defesas (apenas goleiros)
        defesas_2_5: 2.00,
        defesas_3_5: 4.00,
        defesas_4_5: 8.00
      };
    }

    // Calcular médias por jogo
    const golsPorJogo = jogador.gols / jogador.jogos;
    const assistenciasPorJogo = jogador.assistencias / jogador.jogos;
    const desarmesPorJogo = jogador.desarmes / jogador.jogos;
    const defesasPorJogo = jogador.defesas / jogador.jogos;

    // Calcular probabilidades com fatores de confiança
    // Gols
    const probGols05 = Math.min(0.95, golsPorJogo * 1.20);
    const probGols15 = Math.min(0.90, Math.pow(golsPorJogo / 1.5, 2) * 1.10);
    const probGols25 = Math.min(0.85, Math.pow(golsPorJogo / 2.5, 3) * 1.05);

    // Assistências
    const probAssist05 = Math.min(0.95, assistenciasPorJogo * 1.15);
    const probAssist15 = Math.min(0.90, Math.pow(assistenciasPorJogo / 1.5, 2) * 1.10);
    const probAssist25 = Math.min(0.85, Math.pow(assistenciasPorJogo / 2.5, 3) * 1.05);

    // Desarmes
    const probDesarmes15 = Math.min(0.95, (desarmesPorJogo / 1.5) * 1.10);
    const probDesarmes25 = Math.min(0.90, Math.pow(desarmesPorJogo / 2.5, 2) * 1.05);
    const probDesarmes35 = Math.min(0.85, Math.pow(desarmesPorJogo / 3.5, 3) * 1.02);

    // Defesas
    const probDefesas25 = Math.min(0.95, (defesasPorJogo / 2.5) * 1.10);
    const probDefesas35 = Math.min(0.90, Math.pow(defesasPorJogo / 3.5, 2) * 1.05);
    const probDefesas45 = Math.min(0.85, Math.pow(defesasPorJogo / 4.5, 3) * 1.02);

    return {
      id: jogador.id,
      // Gols
      gols_0_5: Math.max(1 / probGols05, 1.01),
      gols_1_5: Math.max(1 / probGols15, 1.01),
      gols_2_5: Math.max(1 / probGols25, 1.01),
      // Assistências
      assistencias_0_5: Math.max(1 / probAssist05, 1.01),
      assistencias_1_5: Math.max(1 / probAssist15, 1.01),
      assistencias_2_5: Math.max(1 / probAssist25, 1.01),
      // Desarmes
      desarmes_1_5: Math.max(1 / probDesarmes15, 1.01),
      desarmes_2_5: Math.max(1 / probDesarmes25, 1.01),
      desarmes_3_5: Math.max(1 / probDesarmes35, 1.01),
      // Defesas
      defesas_2_5: Math.max(1 / probDefesas25, 1.01),
      defesas_3_5: Math.max(1 / probDefesas35, 1.01),
      defesas_4_5: Math.max(1 / probDefesas45, 1.01)
    };
  });

  return {
    resultado: {
      timeA: Number(oddTimeA.toFixed(2)),
      timeB: Number(oddTimeB.toFixed(2)),
      empate: Number(oddEmpate.toFixed(2))
    },
    jogadores: jogadoresOdds
  };
};

export const gerarEscalacoes = (jogadores: Tables<"players">[]) => {
  // Filtrar jogadores ativos e calcular a nota de cada um
  const jogadoresAtivos = jogadores
    .filter(jogador => jogador.status === 'Ativo')
    .map(jogador => ({ ...jogador, notaCalculada: calculatePlayerNote(jogador, jogadores) }));

  // Ordenar jogadores por nota (maior para menor)
  jogadoresAtivos.sort((a, b) => b.notaCalculada - a.notaCalculada);

  // Como não temos posições específicas na tabela, vamos distribuir por aptidão
  const jogadoresComPontuacao = jogadoresAtivos.map(jogador => ({
    ...jogador,
    positionScores: calculatePositionScores(jogador)
  }));

  // Selecionar goleiros (melhores em defesa)
  const goleiros = jogadoresComPontuacao
    .sort((a, b) => b.positionScores.goleiro - a.positionScores.goleiro)
    .slice(0, 2);

  // Selecionar atacantes (melhores em ataque)  
  const atacantes = jogadoresComPontuacao
    .filter(j => !goleiros.includes(j))
    .sort((a, b) => b.positionScores.atacante - a.positionScores.atacante)
    .slice(0, 4);

  // Selecionar volantes (melhores em meio-campo)
  const volantes = jogadoresComPontuacao
    .filter(j => !goleiros.includes(j) && !atacantes.includes(j))
    .sort((a, b) => b.positionScores.volante - a.positionScores.volante)
    .slice(0, 4);

  // Montar times balanceados
  const timeA = [
    goleiros[0],
    ...atacantes.slice(0, 2),
    ...volantes.slice(0, 2)
  ].filter(Boolean);

  const timeB = [
    goleiros[1],
    ...atacantes.slice(2, 4),
    ...volantes.slice(2, 4)
  ].filter(Boolean);

  // Reservas e lesionados
  const reservas = jogadoresAtivos.slice(timeA.length + timeB.length);
  const lesionados = jogadores.filter(jogador => jogador.status === 'Lesionado');

  return {
    timeA,
    timeB,
    reservas: [...reservas, ...lesionados]
  };
};
