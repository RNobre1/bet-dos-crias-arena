
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
  const nota = Math.max(1.0, Math.min(10.0, 5.0 + (pontuacaoBruta * 2)));
  
  return Math.round(nota * 10) / 10; // Arredondar para 1 casa decimal
};

// Alias para compatibilidade
export const calcularNotaJogador = calculatePlayerNote;

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

export const gerarEscalacoes = (jogadores: Tables<"players">[]) => {
  // Filtrar jogadores ativos e calcular a nota de cada um
  const jogadoresAtivos = jogadores
    .filter(jogador => jogador.status === 'Ativo')
    .map(jogador => ({ ...jogador, notaCalculada: calculatePlayerNote(jogador) }));

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

export const calculateOdds = (timeA: Tables<"players">[], timeB: Tables<"players">[], todosJogadores: Tables<"players">[]) => {
  const notaTimeA = timeA.reduce((sum, player) => sum + player.nota, 0) / timeA.length;
  const notaTimeB = timeB.reduce((sum, player) => sum + player.nota, 0) / timeB.length;
  
  // Calcular probabilidades baseadas nas notas dos times
  const forcaTotal = notaTimeA + notaTimeB;
  const probTimeA = notaTimeA / forcaTotal;
  const probTimeB = notaTimeB / forcaTotal;
  const probEmpate = 0.25; // 25% de chance de empate

  // Ajustar probabilidades para somar 100%
  const fatorAjuste = 1 / (probTimeA + probTimeB + probEmpate);
  const probAjustadaA = probTimeA * fatorAjuste;
  const probAjustadaB = probTimeB * fatorAjuste;
  const probAjustadaEmpate = probEmpate * fatorAjuste;

  // Converter em odds decimais (com margem da casa)
  const margem = 0.1; // 10% de margem
  const oddTimeA = (1 / probAjustadaA) * (1 + margem);
  const oddTimeB = (1 / probAjustadaB) * (1 + margem);
  const oddEmpate = (1 / probAjustadaEmpate) * (1 + margem);

  // Calcular odds para jogadores individuais
  const jogadoresOdds = todosJogadores.map(jogador => {
    const baseOdd = 2.0 + (10 - jogador.nota); // Jogadores melhores têm odds menores
    
    return {
      id: jogador.id,
      gols_0_5: Math.max(1.1, baseOdd * (1 - jogador.gols * 0.1)),
      assistencias_0_5: Math.max(1.1, baseOdd * (1 - jogador.assistencias * 0.05)),
      desarmes_1_5: Math.max(1.1, baseOdd * (1 - jogador.desarmes * 0.02)),
      defesas_2_5: Math.max(1.1, baseOdd * (1 - jogador.defesas * 0.01))
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
