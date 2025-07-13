
import { Tables } from "@/integrations/supabase/types";
import { calculatePositionScores, calculatePlayerNote } from "./playerNotesCalculator";

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
  
  // Verificar se há jogadores suficientes (mínimo 10 para formar 2 times completos)
  if (jogadoresDisponiveis.length < 10) {
    console.warn('Não há jogadores suficientes para formar dois times completos');
  }
  
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
    
    jogadoresRestantes = jogadoresRestantes.filter(j => j.id !== goleiroA.id && j.id !== goleiroB.id);
  } else if (goleirosEspecialistas.length === 1) {
    // Cenário B: 1 goleiro especialista
    const goleiroA = goleirosEspecialistas[0];
    goleiroA.assignedPosition = 'goleiro';
    timeA.push(goleiroA);
    
    // Selecionar goleiro-linha (maior P_GOL entre jogadores de linha)
    const candidatosGoleiroLinha = jogadoresRestantes
      .filter(j => j.id !== goleiroA.id)
      .sort((a, b) => {
        if (Math.abs(b.positionScores.goleiro - a.positionScores.goleiro) < 0.01) {
          // Critério de desempate: menor P_ATK
          return a.positionScores.atacante - b.positionScores.atacante;
        }
        return b.positionScores.goleiro - a.positionScores.goleiro;
      });
    
    const goleiroLinha = candidatosGoleiroLinha[0];
    if (goleiroLinha) {
      goleiroLinha.assignedPosition = 'goleiro';
      timeB.push(goleiroLinha);
      jogadoresRestantes = jogadoresRestantes.filter(j => j.id !== goleiroA.id && j.id !== goleiroLinha.id);
    }
  } else {
    // Nenhum goleiro especialista - selecionar dois goleiros-linha
    const candidatosGoleiro = jogadoresRestantes
      .sort((a, b) => {
        if (Math.abs(b.positionScores.goleiro - a.positionScores.goleiro) < 0.01) {
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

  // 2.2 - Prioridade 2: Draft Obrigatório (Garantir pelo menos 1 ATK e 1 VOL por time)
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
    
    jogadoresRestantes = jogadoresRestantes.filter(j => j.id !== atacanteA.id && j.id !== atacanteB.id);
  } else if (especialistasAtaque.length === 1) {
    const atacanteA = especialistasAtaque[0];
    atacanteA.assignedPosition = 'atacante';
    timeA.push(atacanteA);
    
    // Se não há segundo especialista em ataque, usar o melhor jogador restante como atacante
    const melhorRestante = jogadoresRestantes
      .filter(j => j.id !== atacanteA.id)
      .sort((a, b) => b.positionScores.atacante - a.positionScores.atacante)[0];
    
    if (melhorRestante) {
      melhorRestante.assignedPosition = 'atacante';
      timeB.push(melhorRestante);
      jogadoresRestantes = jogadoresRestantes.filter(j => j.id !== atacanteA.id && j.id !== melhorRestante.id);
    }
  } else {
    // Se não há especialistas em ataque, usar os 2 melhores jogadores restantes
    const melhoresAtacantes = jogadoresRestantes
      .sort((a, b) => b.positionScores.atacante - a.positionScores.atacante)
      .slice(0, 2);
    
    if (melhoresAtacantes.length >= 2) {
      melhoresAtacantes[0].assignedPosition = 'atacante';
      melhoresAtacantes[1].assignedPosition = 'atacante';
      
      timeA.push(melhoresAtacantes[0]);
      timeB.push(melhoresAtacantes[1]);
      
      jogadoresRestantes = jogadoresRestantes.filter(j => 
        j.id !== melhoresAtacantes[0].id && j.id !== melhoresAtacantes[1].id
      );
    }
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
    
    jogadoresRestantes = jogadoresRestantes.filter(j => j.id !== volanteA.id && j.id !== volanteB.id);
  } else if (volantesDisponiveis.length === 1) {
    const volanteA = volantesDisponiveis[0];
    volanteA.assignedPosition = 'volante';
    timeA.push(volanteA);
    
    // Se não há segundo especialista em volante, usar qualquer jogador restante
    const melhorVolante = jogadoresRestantes
      .filter(j => j.id !== volanteA.id && !timeA.some(t => t.id === j.id) && !timeB.some(t => t.id === j.id))
      .sort((a, b) => b.positionScores.volante - a.positionScores.volante)[0];
    
    if (melhorVolante) {
      melhorVolante.assignedPosition = 'volante';
      timeB.push(melhorVolante);
      jogadoresRestantes = jogadoresRestantes.filter(j => j.id !== volanteA.id && j.id !== melhorVolante.id);
    }
  } else {
    // Se não há especialistas em volante, usar os melhores jogadores restantes
    const melhoresVolantes = jogadoresRestantes
      .filter(j => !timeA.some(t => t.id === j.id) && !timeB.some(t => t.id === j.id))
      .sort((a, b) => b.positionScores.volante - a.positionScores.volante)
      .slice(0, 2);
    
    if (melhoresVolantes.length >= 2) {
      melhoresVolantes[0].assignedPosition = 'volante';
      melhoresVolantes[1].assignedPosition = 'volante';
      
      timeA.push(melhoresVolantes[0]);
      timeB.push(melhoresVolantes[1]);
      
      jogadoresRestantes = jogadoresRestantes.filter(j => 
        j.id !== melhoresVolantes[0].id && j.id !== melhoresVolantes[1].id
      );
    } else if (melhoresVolantes.length === 1) {
      melhoresVolantes[0].assignedPosition = 'volante';
      timeA.push(melhoresVolantes[0]);
      jogadoresRestantes = jogadoresRestantes.filter(j => j.id !== melhoresVolantes[0].id);
    }
  }

  // 2.3 - Prioridade 3: Completar até 5 jogadores por time (Balanceamento Final)
  while ((timeA.length < 5 || timeB.length < 5) && jogadoresRestantes.length > 0) {
    // Ordenar por valor de linha (MÁXIMO(P_ATK, P_VOL))
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

    // Alocar para o time com menor nota total, respeitando o limite de 5 por time
    if (timeA.length < 5 && (timeB.length >= 5 || notaTimeA <= notaTimeB)) {
      timeA.push(melhorJogador);
    } else if (timeB.length < 5) {
      timeB.push(melhorJogador);
    } else {
      // Se ambos os times estão completos, parar
      break;
    }

    jogadoresRestantes = jogadoresRestantes.filter(j => j.id !== melhorJogador.id);
  }

  // Verificação final e correção se necessário
  if (timeA.length < 5 && jogadoresRestantes.length > 0) {
    const faltam = 5 - timeA.length;
    const adicionais = jogadoresRestantes.slice(0, faltam);
    adicionais.forEach(j => {
      j.assignedPosition = j.positionScores.atacante > j.positionScores.volante ? 'atacante' : 'volante';
      timeA.push(j);
    });
    jogadoresRestantes = jogadoresRestantes.slice(faltam);
  }

  if (timeB.length < 5 && jogadoresRestantes.length > 0) {
    const faltam = 5 - timeB.length;
    const adicionais = jogadoresRestantes.slice(0, faltam);
    adicionais.forEach(j => {
      j.assignedPosition = j.positionScores.atacante > j.positionScores.volante ? 'atacante' : 'volante';
      timeB.push(j);
    });
    jogadoresRestantes = jogadoresRestantes.slice(faltam);
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
