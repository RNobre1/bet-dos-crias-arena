import { Tables } from "@/integrations/supabase/types";
import { calculatePlayerNote } from "./playerNotesCalculator";

// Interfaces para o novo algoritmo
export interface TeamPlayerV3 extends Tables<"players"> {
  scoreNota: number;
  scoreAtaque: number;
  scoreDefesa: number;
  primaryAptitude: string;
  aptitudeScores: {
    P_GOL: number;
    P_ZAG: number;
    P_LAT: number;
    P_VOL: number;
    P_MEI: number;
    P_PTA: number;
    P_ATK: number;
  };
  assignedRole?: string;
}

export interface TeamV3 {
  nome: string;
  jogadores: TeamPlayerV3[];
  scoreNotaTotal: number;
  scoreAtaqueTotal: number;
  scoreDefesaTotal: number;
  formacao: string;
}

export interface RequiredRoles {
  [key: string]: number;
}

export interface LineupResult {
  timeA: TeamV3;
  timeB: TeamV3;
  reservas: Tables<"players">[];
  custoDesequilibrio: number;
}

/**
 * Calcula os scores universais de performance de um jogador
 */
export const calculateUniversalScores = (player: Tables<"players">) => {
  const jogosPerJogo = player.jogos || 1; // Evitar divisão por zero
  
  const scoreNota = calculatePlayerNote(player);
  const scoreAtaque = (player.gols / jogosPerJogo * 3.0) + (player.assistencias / jogosPerJogo * 2.0);
  const scoreDefesa = (player.desarmes / jogosPerJogo * 0.5) + (player.defesas / jogosPerJogo * 0.8);
  
  return { scoreNota, scoreAtaque, scoreDefesa };
};

/**
 * Calcula as pontuações de aptidão por função
 */
export const calculateAptitudeScores = (player: Tables<"players">) => {
  const jogos = player.jogos || 1;
  
  const aptitudeScores = {
    P_GOL: (player.defesas * 2.0 - player.faltas * 0.25) / jogos,
    P_ZAG: (player.desarmes * 2.0 + player.defesas * 1.0 - player.faltas * 0.25) / jogos,
    P_LAT: (player.assistencias * 1.5 + player.desarmes * 1.5 + player.gols * 0.5 - player.faltas * 0.25) / jogos,
    P_VOL: (player.desarmes * 2.5 + player.assistencias * 1.0 - player.faltas * 0.25) / jogos,
    P_MEI: (player.gols * 1.0 + player.assistencias * 1.5 + player.desarmes * 1.0 - player.faltas * 0.25) / jogos,
    P_PTA: (player.gols * 1.5 + player.assistencias * 2.0 - player.faltas * 0.25) / jogos,
    P_ATK: (player.gols * 2.5 + player.assistencias * 1.0 - player.faltas * 0.25) / jogos
  };
  
  return aptitudeScores;
};

/**
 * Determina a aptidão primária do jogador
 */
export const getPrimaryAptitude = (aptitudeScores: any): string => {
  const roles = ['P_GOL', 'P_ZAG', 'P_LAT', 'P_VOL', 'P_MEI', 'P_PTA', 'P_ATK'];
  let maxScore = -Infinity;
  let primaryRole = 'P_ATK'; // Default
  
  roles.forEach(role => {
    if (aptitudeScores[role] > maxScore) {
      maxScore = aptitudeScores[role];
      primaryRole = role;
    }
  });
  
  return primaryRole;
};

/**
 * Mapeia aptidão primária para nome da função
 */
export const mapAptitudeToRole = (aptitude: string): string => {
  const mapping: { [key: string]: string } = {
    'P_GOL': 'Goleiro',
    'P_ZAG': 'Zagueiro',
    'P_LAT': 'Lateral',
    'P_VOL': 'Volante',
    'P_MEI': 'Meia',
    'P_PTA': 'Ponta',
    'P_ATK': 'Atacante'
  };
  
  return mapping[aptitude] || 'Atacante';
};

/**
 * Prepara os jogadores com todos os scores e aptidões
 */
export const preparePlayersV3 = (players: Tables<"players">[]): TeamPlayerV3[] => {
  // Filtrar jogadores lesionados
  const availablePlayers = players.filter(p => p.status !== 'Lesionado');
  
  return availablePlayers.map(player => {
    const universalScores = calculateUniversalScores(player);
    const aptitudeScores = calculateAptitudeScores(player);
    const primaryAptitude = getPrimaryAptitude(aptitudeScores);
    
    return {
      ...player,
      scoreNota: universalScores.scoreNota,
      scoreAtaque: universalScores.scoreAtaque,
      scoreDefesa: universalScores.scoreDefesa,
      primaryAptitude,
      aptitudeScores
    };
  });
};

/**
 * Calcula o custo de desequilíbrio entre dois times
 */
export const calculateImbalanceCost = (teamA: TeamPlayerV3[], teamB: TeamPlayerV3[]): number => {
  const somaNotaA = teamA.reduce((sum, p) => sum + p.scoreNota, 0);
  const somaNotaB = teamB.reduce((sum, p) => sum + p.scoreNota, 0);
  
  const somaAtaqueA = teamA.reduce((sum, p) => sum + p.scoreAtaque, 0);
  const somaAtaqueB = teamB.reduce((sum, p) => sum + p.scoreAtaque, 0);
  
  const somaDefesaA = teamA.reduce((sum, p) => sum + p.scoreDefesa, 0);
  const somaDefesaB = teamB.reduce((sum, p) => sum + p.scoreDefesa, 0);
  
  const diffNota = Math.abs(somaNotaA - somaNotaB);
  const diffAtaque = Math.abs(somaAtaqueA - somaAtaqueB);
  const diffDefesa = Math.abs(somaDefesaA - somaDefesaB);
  
  return (diffNota * 1.5) + (diffAtaque * 1.0) + (diffDefesa * 1.0);
};

/**
 * Gera todas as combinações possíveis de n elementos de um array
 */
export const generateCombinations = <T>(arr: T[], n: number): T[][] => {
  if (n === 0) return [[]];
  if (n > arr.length) return [];
  
  const result: T[][] = [];
  
  function backtrack(start: number, current: T[]) {
    if (current.length === n) {
      result.push([...current]);
      return;
    }
    
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  
  backtrack(0, []);
  return result;
};

/**
 * Verifica se uma combinação de jogadores satisfaz as funções obrigatórias
 */
export const satisfiesRequiredRoles = (players: TeamPlayerV3[], requiredRoles: RequiredRoles): [boolean, { [playerId: string]: string } | null] => {
  const assignments: { [playerId: string]: string } = {};
  
  // Função auxiliar para mapear função para aptidão
  const getRoleAptitude = (role: string): string => {
    const mapping: { [key: string]: string } = {
      'Goleiro': 'P_GOL',
      'Zagueiro': 'P_ZAG',
      'Lateral': 'P_LAT',
      'Volante': 'P_VOL',
      'Meia': 'P_MEI',
      'Ponta': 'P_PTA',
      'Atacante': 'P_ATK'
    };
    return mapping[role] || 'P_ATK';
  };

  // Abordagem greedy: atribuir jogadores às funções obrigatórias
  // Priorizar goleiro primeiro, depois outras funções
  const roleOrder = ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Ponta', 'Atacante'];
  
  for (const role of roleOrder) {
    const required = requiredRoles[role] || 0;
    if (required > 0) {
      // Obter jogadores não atribuídos e ordená-los por aptidão para esta função
      const unassignedPlayers = players.filter(player => !assignments[player.id]);
      const sortedPlayers = [...unassignedPlayers].sort((a, b) => {
        const aptitudeA = a.aptitudeScores[getRoleAptitude(role)];
        const aptitudeB = b.aptitudeScores[getRoleAptitude(role)];
        return aptitudeB - aptitudeA;
      });
      
      // Verificar se há jogadores suficientes disponíveis
      if (sortedPlayers.length < required) {
        return [false, null];
      }
      
      // Tentar atribuir os N melhores jogadores para esta função
      let assigned = 0;
      for (let i = 0; i < sortedPlayers.length && assigned < required; i++) {
        const player = sortedPlayers[i];
        assignments[player.id] = role;
        assigned++;
      }
      
      if (assigned < required) {
        return [false, null];
      }
    }
  }

  return [true, assignments];
};

/**
 * Gera times válidos que satisfazem as restrições de funções
 */
export const generateValidTeams = (
  players: TeamPlayerV3[], 
  numPlayersPerTeam: number, 
  requiredRoles: RequiredRoles
): TeamPlayerV3[][] => { // Returns combinations with assignedRole set
  const validTeams: TeamPlayerV3[][] = [];
  const combinations = generateCombinations(players, numPlayersPerTeam);
  
  combinations.forEach(combination => {
    const [isSatisfied, assignments] = satisfiesRequiredRoles(combination, requiredRoles);
    if (isSatisfied && assignments) {
      const teamWithAssignedRoles = combination.map(player => ({
        ...player,
        assignedRole: assignments[player.id] // Explicitly set the assigned role
      }));
      validTeams.push(teamWithAssignedRoles);
    }
  });
  
  return validTeams;
};

/**
 * Algoritmo de Escalação Inteligente v3.0
 */
export const generateBalancedTeamsV3 = (
  allPlayers: Tables<"players">[],
  numPlayersPerTeam: number,
  requiredRoles: RequiredRoles
): LineupResult => {
  // Fase 1: Análise e Geração de Perfis de Jogador
  const preparedPlayers = preparePlayersV3(allPlayers);
  const lesionados = allPlayers.filter(p => p.status === 'Lesionado');
  
  if (preparedPlayers.length < numPlayersPerTeam * 2) {
    throw new Error('Não há jogadores suficientes para formar dois times');
  }
  
  // Fase 2: Processo de Otimização Combinatória
  console.log('Gerando times válidos...');
  const validTeamsA = generateValidTeams(preparedPlayers, numPlayersPerTeam, requiredRoles);
  
  if (validTeamsA.length === 0) {
    throw new Error('Não foi possível gerar times que satisfaçam as funções obrigatórias');
  }
  
  let bestCombination: { teamA: TeamPlayerV3[], teamB: TeamPlayerV3[], cost: number } | null = null;
  let minCost = Infinity;
  
  console.log(`Avaliando ${validTeamsA.length} combinações de Time A...`);
  
  // Para cada time A válido, encontrar o melhor time B
  validTeamsA.forEach((teamA, indexA) => {
    if (indexA % 100 === 0) {
      console.log(`Processando combinação ${indexA + 1}/${validTeamsA.length}`);
    }
    
    // Jogadores restantes para formar o time B
    const remainingPlayers = preparedPlayers.filter(p => !teamA.some(ta => ta.id === p.id));
    
    if (remainingPlayers.length >= numPlayersPerTeam) {
      const validTeamsB = generateValidTeams(remainingPlayers, numPlayersPerTeam, requiredRoles);
      
      validTeamsB.forEach(teamB => {
        const cost = calculateImbalanceCost(teamA, teamB);
        
        if (cost < minCost) {
          minCost = cost;
          bestCombination = { teamA, teamB, cost };
        }
      });
    }
  });
  
  if (!bestCombination) {
    throw new Error('Não foi possível encontrar uma combinação válida de times');
  }
  
  // Fase 3: Apresentação do Resultado
  const reservas = preparedPlayers.filter(p => 
    !bestCombination!.teamA.some(ta => ta.id === p.id) &&
    !bestCombination!.teamB.some(tb => tb.id === p.id)
  );
  
  const timeA: TeamV3 = {
    nome: "Time A",
    jogadores: bestCombination.teamA,
    scoreNotaTotal: bestCombination.teamA.reduce((sum, p) => sum + p.scoreNota, 0),
    scoreAtaqueTotal: bestCombination.teamA.reduce((sum, p) => sum + p.scoreAtaque, 0),
    scoreDefesaTotal: bestCombination.teamA.reduce((sum, p) => sum + p.scoreDefesa, 0),
    formacao: generateFormation(bestCombination.teamA)
  };
  
  const timeB: TeamV3 = {
    nome: "Time B",
    jogadores: bestCombination.teamB,
    scoreNotaTotal: bestCombination.teamB.reduce((sum, p) => sum + p.scoreNota, 0),
    scoreAtaqueTotal: bestCombination.teamB.reduce((sum, p) => sum + p.scoreAtaque, 0),
    scoreDefesaTotal: bestCombination.teamB.reduce((sum, p) => sum + p.scoreDefesa, 0),
    formacao: generateFormation(bestCombination.teamB)
  };
  
  return {
    timeA,
    timeB,
    reservas: [...reservas, ...lesionados],
    custoDesequilibrio: bestCombination.cost
  };
};

/**
 * Gera a formação baseada nas funções dos jogadores
 */
export const generateFormation = (team: TeamPlayerV3[]): string => {
  const roleCounts: { [key: string]: number } = {};
  
  team.forEach(player => {
    const role = player.assignedRole || mapAptitudeToRole(player.primaryAptitude);
    roleCounts[role] = (roleCounts[role] || 0) + 1;
  });
  
  const goleiros = roleCounts['Goleiro'] || 0;
  const defensores = (roleCounts['Zagueiro'] || 0) + (roleCounts['Lateral'] || 0);
  const meios = (roleCounts['Volante'] || 0) + (roleCounts['Meia'] || 0) + (roleCounts['Ponta'] || 0);
  const atacantes = roleCounts['Atacante'] || 0;
  
  return `${goleiros}-${defensores}-${meios}-${atacantes}`;
};

/**
 * Funções disponíveis para seleção
 */
export const AVAILABLE_ROLES = [
  'Goleiro',
  'Zagueiro', 
  'Lateral',
  'Volante',
  'Meia',
  'Ponta',
  'Atacante'
];

/**
 * Validações para as entradas do usuário
 */
export const validateLineupInputs = (
  totalPlayers: number,
  numPlayersPerTeam: number,
  requiredRoles: RequiredRoles,
  isDoubleLineup: boolean = false
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validar número mínimo e máximo de jogadores por time
  if (numPlayersPerTeam < 4) {
    errors.push('Cada time deve ter pelo menos 4 jogadores');
  }
  
  if (numPlayersPerTeam > 11) {
    errors.push('Cada time não pode ter mais de 11 jogadores');
  }
  
  // Validar se há jogadores suficientes
  if (isDoubleLineup) {
    if (totalPlayers < 8) {
      errors.push('É necessário pelo menos 8 jogadores para criar duas escalações');
    }
    
    if (numPlayersPerTeam * 2 > totalPlayers) {
      errors.push('Não há jogadores suficientes para formar dois times com essa quantidade');
    }
    
    const maxPerTeam = Math.min(11, Math.floor(totalPlayers / 2));
    if (numPlayersPerTeam > maxPerTeam) {
      errors.push(`Com ${totalPlayers} jogadores, cada time pode ter no máximo ${maxPerTeam} jogadores`);
    }
  } else {
    if (numPlayersPerTeam > totalPlayers) {
      errors.push('Não há jogadores suficientes para formar um time com essa quantidade');
    }
  }
  
  // Validar goleiro obrigatório
  if (!requiredRoles['Goleiro'] || requiredRoles['Goleiro'] !== 1) {
    errors.push('Cada time deve ter exatamente 1 goleiro');
  }
  
  // Validar se a soma das funções obrigatórias não excede o número de jogadores
  const totalRequired = Object.values(requiredRoles).reduce((sum, count) => sum + count, 0);
  if (totalRequired > numPlayersPerTeam) {
    errors.push('A soma das funções obrigatórias não pode exceder o número de jogadores por time');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};