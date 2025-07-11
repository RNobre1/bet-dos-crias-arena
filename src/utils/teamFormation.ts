
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

export const generateTeams = (jogadores: Tables<"players">[]): { timeA: Team; timeB: Team; reservas: Tables<"players">[] } => {
  // Filtro 1: Separar disponíveis e lesionados
  const jogadoresDisponiveis = jogadores.filter(j => j.status !== 'Lesionado');
  const lesionados = jogadores.filter(j => j.status === 'Lesionado');
  
  // Calcular pontuações de posição para cada jogador
  const jogadoresComPontuacao: TeamPlayer[] = jogadoresDisponiveis.map(jogador => ({
    ...jogador,
    positionScores: calculatePositionScores(jogador)
  }));

  const timeA: TeamPlayer[] = [];
  const timeB: TeamPlayer[] = [];
  const jogadoresRestantes = [...jogadoresComPontuacao];

  // Filtro 2: Seleção de Goleiros
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
  } else if (goleiros.length === 1) {
    // Apenas 1 goleiro especialista
    const goleiroA = goleiros[0];
    goleiroA.assignedPosition = 'goleiro';
    timeA.push(goleiroA);
    jogadoresRestantes.splice(jogadoresRestantes.findIndex(j => j.id === goleiroA.id), 1);
    
    // Time B recebe um "Goleiro-Linha"
    const maisDefensivo = jogadoresRestantes
      .sort((a, b) => b.positionScores.goleiro - a.positionScores.goleiro)[0];
    if (maisDefensivo) {
      maisDefensivo.assignedPosition = 'goleiro';
      timeB.push(maisDefensivo);
      jogadoresRestantes.splice(jogadoresRestantes.findIndex(j => j.id === maisDefensivo.id), 1);
    }
  } else {
    // Nenhum goleiro especialista - improvisar dois goleiros-linha
    if (jogadoresRestantes.length >= 2) {
      const melhoresDefensivos = jogadoresRestantes
        .sort((a, b) => b.positionScores.goleiro - a.positionScores.goleiro);
      
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

  // Filtro 3: Preenchimento Obrigatório
  const especialistasAtaque = jogadoresRestantes
    .filter(j => j.positionScores.atacante > j.positionScores.volante)
    .sort((a, b) => b.positionScores.atacante - a.positionScores.atacante);
  
  const especialistasMeioCampo = jogadoresRestantes
    .filter(j => j.positionScores.volante >= j.positionScores.atacante)
    .sort((a, b) => b.positionScores.volante - a.positionScores.volante);

  // Garantir pelo menos 1 atacante por time
  if (especialistasAtaque.length >= 2) {
    const atacanteA = especialistasAtaque[0];
    const atacanteB = especialistasAtaque[1];
    atacanteA.assignedPosition = 'atacante';
    atacanteB.assignedPosition = 'atacante';
    timeA.push(atacanteA);
    timeB.push(atacanteB);
    
    jogadoresRestantes.splice(jogadoresRestantes.findIndex(j => j.id === atacanteA.id), 1);
    jogadoresRestantes.splice(jogadoresRestantes.findIndex(j => j.id === atacanteB.id), 1);
  } else if (especialistasAtaque.length === 1) {
    const atacanteA = especialistasAtaque[0];
    atacanteA.assignedPosition = 'atacante';
    timeA.push(atacanteA);
    jogadoresRestantes.splice(jogadoresRestantes.findIndex(j => j.id === atacanteA.id), 1);
  }

  // Garantir pelo menos 1 volante por time
  const volantesDisponiveis = especialistasMeioCampo.filter(v => 
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
  } else if (volantesDisponiveis.length === 1) {
    const volanteA = volantesDisponiveis[0];
    volanteA.assignedPosition = 'volante';
    timeA.push(volanteA);
    jogadoresRestantes.splice(jogadoresRestantes.findIndex(j => j.id === volanteA.id), 1);
  }

  // Filtro 4: Balanceamento Final - Garantir exatamente 5 jogadores por time
  while ((timeA.length < 5 || timeB.length < 5) && jogadoresRestantes.length > 0) {
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

    // Priorizar completar o time que tem menos jogadores
    if (timeA.length < timeB.length && timeA.length < 5) {
      timeA.push(melhorJogador);
    } else if (timeB.length < timeA.length && timeB.length < 5) {
      timeB.push(melhorJogador);
    } else if (timeA.length < 5 && (notaTimeA <= notaTimeB)) {
      timeA.push(melhorJogador);
    } else if (timeB.length < 5) {
      timeB.push(melhorJogador);
    }

    // Remover da lista
    jogadoresRestantes.splice(jogadoresRestantes.findIndex(j => j.id === melhorJogador.id), 1);
  }

  // Se ainda faltam jogadores, completar com os restantes
  while (timeA.length < 5 && jogadoresRestantes.length > 0) {
    const jogador = jogadoresRestantes.shift()!;
    jogador.assignedPosition = jogador.positionScores.atacante > jogador.positionScores.volante 
      ? 'atacante' : 'volante';
    timeA.push(jogador);
  }

  while (timeB.length < 5 && jogadoresRestantes.length > 0) {
    const jogador = jogadoresRestantes.shift()!;
    jogador.assignedPosition = jogador.positionScores.atacante > jogador.positionScores.volante 
      ? 'atacante' : 'volante';
    timeB.push(jogador);
  }

  // Adicionar jogadores restantes aos reservas
  const reservas = [...jogadoresRestantes, ...lesionados];

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

  return { timeA: timeAFinal, timeB: timeBFinal, reservas };
};
