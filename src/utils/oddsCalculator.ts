import { Tables } from "@/integrations/supabase/types";

const calculatePlayerNote = (player: Tables<"players">): number => {
  let nota = 7; // Nota base

  // Ajustes com base nas estatísticas
  nota += player.gols * 0.5;
  nota += player.assistencias * 0.3;
  nota += player.desarmes * 0.1;
  nota += player.defesas * 0.2;

  // Penalidades (opcional)
  nota -= player.cartoes_amarelos * 0.1;
  nota -= player.cartoes_vermelhos * 0.3;

  // Limitar a nota entre 0 e 10
  return Math.max(0, Math.min(10, nota));
};

export const gerarEscalacoes = (jogadores: Tables<"players">[]) => {
  // Filtrar jogadores ativos e calcular a nota de cada um
  const jogadoresAtivos = jogadores
    .filter(jogador => jogador.status === 'Ativo')
    .map(jogador => ({ ...jogador, nota: calculatePlayerNote(jogador) }));

  // Ordenar jogadores por nota (maior para menor)
  jogadoresAtivos.sort((a, b) => b.nota - a.nota);

  // Separar por posição
  const goleiros = jogadoresAtivos.filter(j => j.posicao === 'Goleiro');
  const defensores = jogadoresAtivos.filter(j => j.posicao === 'Zagueiro' || j.posicao === 'Lateral');
  const volantes = jogadoresAtivos.filter(j => j.posicao === 'Volante');
  const atacantes = jogadoresAtivos.filter(j => j.posicao === 'Atacante');

  // Escolher formação baseada na disponibilidade de jogadores
  const formacaoA = { defensores: 4, volantes: 3, atacantes: 3 };
  const formacaoB = { defensores: 4, volantes: 4, atacantes: 2 };

  // Montar times
  const timeA = [
    goleiros[0],
    ...defensores.slice(0, formacaoA.defensores),
    ...volantes.slice(0, formacaoA.volantes),
    ...atacantes.slice(0, formacaoA.atacantes)
  ].filter(Boolean);

  const timeB = [
    goleiros[1],
    ...defensores.slice(formacaoA.defensores, formacaoA.defensores + formacaoB.defensores),
    ...volantes.slice(formacaoA.volantes, formacaoA.volantes + formacaoB.volantes),
    ...atacantes.slice(formacaoA.atacantes, formacaoA.atacantes + formacaoB.atacantes)
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
