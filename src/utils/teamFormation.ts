
import { Tables } from "@/integrations/supabase/types";
import { calculatePositionScores } from "./playerNotesCalculator";

interface TeamPlayer extends Tables<"players"> {
  positionScores: {
    goleiro: number;
    atacante: number;
    volante: number;
  };
  assignedPosition?: 'goleiro' | 'atacante' | 'volante';
}

export interface Team {
  nome: string;
  jogadores: TeamPlayer[];
  notaTotal: number;
  formacao: string;
}

export const generateTeams = (jogadores: Tables<"players">[]): { timeA: Team; timeB: Team } => {
  // Filtrar jogadores disponíveis
  const jogadoresDisponiveis = jogadores.filter(j => j.status !== 'Lesionado');
  
  // Calcular pontuações de posição para cada jogador
  const jogadoresComPontuacao: TeamPlayer[] = jogadoresDisponiveis.map(jogador => ({
    ...jogador,
    positionScores: calculatePositionScores(jogador)
  }));

  // Separar jogadores lesionados para reservas
  const reservas = jogadores.filter(j => j.status === 'Lesionado');

  // Algoritmo de draft estratégico
  const timeA: TeamPlayer[] = [];
  const timeB: TeamPlayer[] = [];
  const jogadoresRestantes = [...jogadoresComPontuacao];

  // 1. Seleção de Goleiros
  const goleiros = jogadoresRestantes
    .filter(j => j.positionScores.goleiro > 0)
    .sort((a, b) => b.positionScores.goleiro - a.positionScores.goleiro);

  if (goleiros.length >= 2) {
    // Dois goleiros especialistas
    const goleiroA = goleiros[0];
    const goleiroB = goleiros[1];
    goleiroA.assignedPosition = 'goleiro';
    goleiroB.assignedPosition = 'goleiro';
    timeA.push(goleiroA);
    timeB.push(goleiroB);
    
    // Remover da lista
    const indexA = jogadoresRestantes.findIndex(j => j.id === goleiroA.id);
    const indexB = jogadoresRestantes.findIndex(j => j.id === goleiroB.id);
    jogadoresRestantes.splice(Math.max(indexA, indexB), 1);
    jogadoresRestantes.splice(Math.min(indexA, indexB), 1);
  } else {
    // Improvisar goleiros
    const melhoresDefensivos = jogadoresRestantes
      .sort((a, b) => b.positionScores.goleiro - a.positionScores.goleiro);
    
    if (melhoresDefensivos.length >= 2) {
      const goleiroA = melhoresDefensivos[0];
      const goleiroB = melhoresDefensivos[1];
      goleiroA.assignedPosition = 'goleiro';
      goleiroB.assignedPosition = 'goleiro';
      timeA.push(goleiroA);
      timeB.push(goleiroB);
      
      jogadoresRestantes.splice(jogadoresRestantes.findIndex(j => j.id === goleiroA.id), 1);
      jogadoresRestantes.splice(jogadoresRestantes.findIndex(j => j.id === goleiroB.id), 1);
    }
  }

  // 2. Garantir pelo menos 1 atacante e 1 volante por time
  const atacantes = jogadoresRestantes
    .sort((a, b) => b.positionScores.atacante - a.positionScores.atacante);
  
  const volantes = jogadoresRestantes
    .sort((a, b) => b.positionScores.volante - a.positionScores.volante);

  // Adicionar melhores atacantes
  if (atacantes.length >= 2) {
    const atacanteA = atacantes[0];
    const atacanteB = atacantes[1];
    atacanteA.assignedPosition = 'atacante';
    atacanteB.assignedPosition = 'atacante';
    timeA.push(atacanteA);
    timeB.push(atacanteB);
    
    jogadoresRestantes.splice(jogadoresRestantes.findIndex(j => j.id === atacanteA.id), 1);
    jogadoresRestantes.splice(jogadoresRestantes.findIndex(j => j.id === atacanteB.id), 1);
  }

  // Adicionar melhores volantes (que não sejam os atacantes já selecionados)
  const volantesDisponiveis = volantes.filter(v => 
    !timeA.some(t => t.id === v.id) && !timeB.some(t => t.id === v.id)
  );
  
  if (volantesDisponiveis.length >= 2) {
    const volanteA = volantesDisponiveis[0];
    const volanteB = volantesDisponiveis[1];
    volanteA.assignedPosition = 'volante';
    volanteB.assignedPosition = 'volante';
    timeA.push(volanteA);
    timeB.push(volanteB);
    
    jogadoresRestantes.splice(jogadoresRestantes.findIndex(j => j.id === volanteA.id), 1);
    jogadoresRestantes.splice(jogadoresRestantes.findIndex(j => j.id === volanteB.id), 1);
  }

  // 3. Balanceamento final
  while (timeA.length < 5 && timeB.length < 5 && jogadoresRestantes.length > 0) {
    // Calcular nota total atual de cada time
    const notaTimeA = timeA.reduce((sum, j) => sum + j.nota, 0);
    const notaTimeB = timeB.reduce((sum, j) => sum + j.nota, 0);

    // Selecionar melhor jogador disponível
    const melhorJogador = jogadoresRestantes.reduce((melhor, atual) => {
      const pontuacaoAtual = Math.max(atual.positionScores.atacante, atual.positionScores.volante);
      const pontuacaoMelhor = Math.max(melhor.positionScores.atacante, melhor.positionScores.volante);
      return pontuacaoAtual > pontuacaoMelhor ? atual : melhor;
    });

    // Definir posição do jogador
    melhorJogador.assignedPosition = melhorJogador.positionScores.atacante > melhorJogador.positionScores.volante 
      ? 'atacante' : 'volante';

    // Adicionar ao time com menor nota total
    if (notaTimeA <= notaTimeB && timeA.length < 5) {
      timeA.push(melhorJogador);
    } else if (timeB.length < 5) {
      timeB.push(melhorJogador);
    }

    // Remover da lista
    jogadoresRestantes.splice(jogadoresRestantes.findIndex(j => j.id === melhorJogador.id), 1);
  }

  // Calcular formações
  const getFormacao = (time: TeamPlayer[]): string => {
    const goleiros = time.filter(j => j.assignedPosition === 'goleiro').length;
    const volantes = time.filter(j => j.assignedPosition === 'volante').length;
    const atacantes = time.filter(j => j.assignedPosition === 'atacante').length;
    return `${goleiros}-${volantes}-${atacantes}`;
  };

  const timeAFinal: Team = {
    nome: "Time A",
    jogadores: timeA,
    notaTotal: timeA.reduce((sum, j) => sum + j.nota, 0),
    formacao: getFormacao(timeA)
  };

  const timeBFinal: Team = {
    nome: "Time B",
    jogadores: timeB,
    notaTotal: timeB.reduce((sum, j) => sum + j.nota, 0),
    formacao: getFormacao(timeB)
  };

  return { timeA: timeAFinal, timeB: timeBFinal };
};
