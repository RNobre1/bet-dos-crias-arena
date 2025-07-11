
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
  // Fase 1: Preparação e Análise
  
  // 1.1 - Filtrar jogadores disponíveis (remover lesionados)
  const jogadoresDisponiveis = jogadores.filter(j => j.status !== 'Lesionado');
  const lesionados = jogadores.filter(j => j.status === 'Lesionado');
  
  // 1.2 - Calcular aptidão para cada função
  const jogadoresComPontuacao: TeamPlayer[] = jogadoresDisponiveis.map(jogador => ({
    ...jogador,
    positionScores: calculatePositionScores(jogador)
  }));

  const timeA: TeamPlayer[] = [];
  const timeB: TeamPlayer[] = [];
  let jogadoresRestantes = [...jogadoresComPontuacao];

  // Fase 2: O Draft Estratégico
  
  // 2.1 - Prioridade 1: Seleção de Goleiros
  const goleirosEspecialistas = jogadoresRestantes
    .filter(j => j.positionScores.goleiro > 0)
    .sort((a, b) => b.positionScores.goleiro - a.positionScores.goleiro);

  if (goleirosEspecialistas.length >= 2) {
    // Cenário A: 2+ goleiros especialistas
    const goleiroA = goleirosEspecialistas[0];
    const goleiroB = goleirosEspecialistas[1];
    
    goleiroA.assignedPosition = 'goleiro';
    goleiroB.assignedPosition = 'goleiro';
    
    timeA.push(goleiroA);
    timeB.push(goleiroB);
    
    // Remover da lista
    jogadoresRestantes = jogadoresRestantes.filter(j => j.id !== goleiroA.id && j.id !== goleiroB.id);
  } else if (goleirosEspecialistas.length === 1) {
    // Cenário B: 1 goleiro especialista
    const goleiroA = goleirosEspecialistas[0];
    goleiroA.assignedPosition = 'goleiro';
    timeA.push(goleiroA);
    
    // Selecionar goleiro-linha (maior P_GOL entre jogadores de linha)
    const goleiroLinha = jogadoresRestantes
      .filter(j => j.id !== goleiroA.id)
      .sort((a, b) => {
        if (b.positionScores.goleiro === a.positionScores.goleiro) {
          // Critério de desempate: menor P_ATK
          return a.positionScores.atacante - b.positionScores.atacante;
        }
        return b.positionScores.goleiro - a.positionScores.goleiro;
      })[0];
    
    if (goleiroLinha) {
      goleiroLinha.assignedPosition = 'goleiro';
      timeB.push(goleiroLinha);
      jogadoresRestantes = jogadoresRestantes.filter(j => j.id !== goleiroA.id && j.id !== goleiroLinha.id);
    }
  } else {
    // Nenhum goleiro especialista - selecionar dois goleiros-linha
    const candidatosGoleiro = jogadoresRestantes
      .sort((a, b) => {
        if (b.positionScores.goleiro === a.positionScores.goleiro) {
          return a.positionScores.atacante - b.positionScores.atacante;
        }
        return b.positionScores.goleiro - a.positionScores.goleiro;
      });
    
    if (candidatosGoleiro.length >= 2) {
      const goleiroA = candidatosGoleiro[0];
      const goleiroB = candidatosGoleiro[1];
      
      goleiroA.assignedPosition = 'goleiro';
      goleiroB.assignedPosition = 'goleiro';
      
      timeA.push(goleiroA);
      timeB.push(goleiroB);
      
      jogadoresRestantes = jogadoresRestantes.filter(j => j.id !== goleiroA.id && j.id !== goleiroB.id);
    }
  }

  // 2.2 - Prioridade 2: Garantia da Estrutura Tática
  const especialistasAtaque = jogadoresRestantes
    .filter(j => j.positionScores.atacante > j.positionScores.volante)
    .sort((a, b) => b.positionScores.atacante - a.positionScores.atacante);
  
  const especialistasMeioCampo = jogadoresRestantes
    .filter(j => j.positionScores.volante >= j.positionScores.atacante)
    .sort((a, b) => b.positionScores.volante - a.positionScores.volante);

  // Draft obrigatório - atacantes
  if (especialistasAtaque.length >= 2) {
    const atacanteA = especialistasAtaque[0];
    const atacanteB = especialistasAtaque[1];
    
    atacanteA.assignedPosition = 'atacante';
    atacanteB.assignedPosition = 'atacante';
    
    timeA.push(atacanteA);
    timeB.push(atacanteB);
    
    jogadoresRestantes = jogadoresRestantes.filter(j => j.id !== atacanteA.id && j.id !== atacanteB.id);
  } else if (especialistasAtaque.length === 1) {
    const atacanteA = especialistasAtaque[0];
    atacanteA.assignedPosition = 'atacante';
    timeA.push(atacanteA);
    jogadoresRestantes = jogadoresRestantes.filter(j => j.id !== atacanteA.id);
  }

  // Draft obrigatório - volantes
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
    
    jogadoresRestantes = jogadoresRestantes.filter(j => j.id !== volanteA.id && j.id !== volanteB.id);
  } else if (volantesDisponiveis.length === 1) {
    const volanteA = volantesDisponiveis[0];
    volanteA.assignedPosition = 'volante';
    timeA.push(volanteA);
    jogadoresRestantes = jogadoresRestantes.filter(j => j.id !== volanteA.id);
  }

  // 2.3 - Prioridade 3: Balanceamento Final por "Nota"
  // Completar os times até 5 jogadores cada
  while ((timeA.length < 5 || timeB.length < 5) && jogadoresRestantes.length > 0) {
    // Ordenar jogadores restantes por valor de linha (MÁXIMO(P_ATK, P_VOL))
    jogadoresRestantes.sort((a, b) => {
      const valorLinhaA = Math.max(a.positionScores.atacante, a.positionScores.volante);
      const valorLinhaB = Math.max(b.positionScores.atacante, b.positionScores.volante);
      return valorLinhaB - valorLinhaA;
    });

    const melhorJogador = jogadoresRestantes[0];
    
    // Definir posição baseada na maior aptidão
    melhorJogador.assignedPosition = melhorJogador.positionScores.atacante > melhorJogador.positionScores.volante 
      ? 'atacante' : 'volante';

    // Calcular notas totais atuais
    const notaTimeA = timeA.reduce((sum, j) => sum + j.nota, 0);
    const notaTimeB = timeB.reduce((sum, j) => sum + j.nota, 0);

    // Alocar para o time com menor nota total
    if (timeA.length < 5 && (timeB.length >= 5 || notaTimeA <= notaTimeB)) {
      timeA.push(melhorJogador);
    } else if (timeB.length < 5) {
      timeB.push(melhorJogador);
    }

    // Remover da lista
    jogadoresRestantes = jogadoresRestantes.filter(j => j.id !== melhorJogador.id);
  }

  // Fase 3: Finalização
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
