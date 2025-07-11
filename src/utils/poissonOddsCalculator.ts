
import { Tables } from "@/integrations/supabase/types";

// Interface para as odds de mercados de um jogador
export interface PlayerMarketOdds {
  id: string;
  gols: {
    over_0_5: number | null;
    over_1_5: number | null;
    over_2_5: number | null;
  };
  assistencias: {
    over_0_5: number | null;
    over_1_5: number | null;
    over_2_5: number | null;
  };
  desarmes: {
    over_1_5: number | null;
    over_2_5: number | null;
    over_3_5: number | null;
  };
  defesas: {
    over_2_5: number | null;
    over_3_5: number | null;
    over_4_5: number | null;
  };
}

/**
 * Calcula o fatorial de um número
 */
export const factorial = (n: number): number => {
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
};

/**
 * Implementa a Função de Massa de Probabilidade de Poisson
 * P(X=k) = (λ^k * e^(-λ)) / k!
 */
export const poissonPMF = (k: number, lambda: number): number => {
  if (lambda === 0) {
    return k === 0 ? 1 : 0;
  }
  
  const numerator = Math.pow(lambda, k) * Math.exp(-lambda);
  const denominator = factorial(k);
  
  return numerator / denominator;
};

/**
 * Calcula a probabilidade de ocorrer pelo menos N eventos (Over)
 * P(X ≥ N) = 1 - Σ(k=0 to N-1) P(X=k)
 */
export const poissonOverProbability = (threshold: number, lambda: number): number => {
  if (lambda === 0) {
    return threshold <= 0 ? 1 : 0;
  }
  
  let cumulativeProbability = 0;
  
  // Somar probabilidades de 0 até threshold-1
  for (let k = 0; k < threshold; k++) {
    cumulativeProbability += poissonPMF(k, lambda);
  }
  
  // P(X ≥ threshold) = 1 - P(X < threshold)
  return Math.max(0, Math.min(1, 1 - cumulativeProbability));
};

/**
 * Converte probabilidade em odds decimais
 */
export const probabilityToOdds = (probability: number): number | null => {
  if (probability <= 0 || probability > 1) {
    return null; // Probabilidade inválida ou impossível
  }
  
  const odds = 1 / probability;
  
  // Se as odds forem muito altas (probabilidade muito baixa), considerar como infinito
  if (odds > 999) {
    return null;
  }
  
  return odds;
};

/**
 * Calcula a média por jogo (lambda) para uma estatística específica
 */
export const calculatePlayerLambda = (player: Tables<"players">, statistic: 'gols' | 'assistencias' | 'desarmes' | 'defesas'): number => {
  if (player.jogos === 0) {
    return 0;
  }
  
  const total = player[statistic];
  return total / player.jogos;
};

/**
 * Calcula todas as odds de mercados para um jogador usando Distribuição de Poisson
 */
export const calculatePlayerMarketOdds = (player: Tables<"players">): PlayerMarketOdds => {
  // Calcular lambdas para cada estatística
  const lambdaGols = calculatePlayerLambda(player, 'gols');
  const lambdaAssistencias = calculatePlayerLambda(player, 'assistencias');
  const lambdaDesarmes = calculatePlayerLambda(player, 'desarmes');
  const lambdaDefesas = calculatePlayerLambda(player, 'defesas');
  
  return {
    id: player.id,
    gols: {
      over_0_5: probabilityToOdds(poissonOverProbability(1, lambdaGols)),
      over_1_5: probabilityToOdds(poissonOverProbability(2, lambdaGols)),
      over_2_5: probabilityToOdds(poissonOverProbability(3, lambdaGols)),
    },
    assistencias: {
      over_0_5: probabilityToOdds(poissonOverProbability(1, lambdaAssistencias)),
      over_1_5: probabilityToOdds(poissonOverProbability(2, lambdaAssistencias)),
      over_2_5: probabilityToOdds(poissonOverProbability(3, lambdaAssistencias)),
    },
    desarmes: {
      over_1_5: probabilityToOdds(poissonOverProbability(2, lambdaDesarmes)),
      over_2_5: probabilityToOdds(poissonOverProbability(3, lambdaDesarmes)),
      over_3_5: probabilityToOdds(poissonOverProbability(4, lambdaDesarmes)),
    },
    defesas: {
      over_2_5: probabilityToOdds(poissonOverProbability(3, lambdaDefesas)),
      over_3_5: probabilityToOdds(poissonOverProbability(4, lambdaDefesas)),
      over_4_5: probabilityToOdds(poissonOverProbability(5, lambdaDefesas)),
    },
  };
};

/**
 * Calcula as odds para todos os jogadores
 */
export const calculateAllPlayersOdds = (players: Tables<"players">[]): PlayerMarketOdds[] => {
  return players.map(calculatePlayerMarketOdds);
};
