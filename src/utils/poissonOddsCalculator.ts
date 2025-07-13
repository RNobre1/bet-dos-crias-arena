
import { Tables } from "@/integrations/supabase/types";

// Interface para as odds de mercados de um jogador
export interface PlayerMarketOdds {
  id: string;
  gols: {
    under_3_5: number | null;
    under_2_5: number | null;
    under_1_5: number | null;
    under_0_5: number | null;
    over_0_5: number | null;
    over_1_5: number | null;
    over_2_5: number | null;
    over_3_5: number | null;
  };
  assistencias: {
    under_3_5: number | null;
    under_2_5: number | null;
    under_1_5: number | null;
    under_0_5: number | null;
    over_0_5: number | null;
    over_1_5: number | null;
    over_2_5: number | null;
    over_3_5: number | null;
  };
  desarmes: {
    under_3_5: number | null;
    under_2_5: number | null;
    under_1_5: number | null;
    under_0_5: number | null;
    over_0_5: number | null;
    over_1_5: number | null;
    over_2_5: number | null;
    over_3_5: number | null;
  };
  defesas: {
    under_3_5: number | null;
    under_2_5: number | null;
    under_1_5: number | null;
    under_0_5: number | null;
    over_0_5: number | null;
    over_1_5: number | null;
    over_2_5: number | null;
    over_3_5: number | null;
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
 * Calcula a probabilidade de ocorrer menos de N eventos (Under)
 * P(X < N) = Σ(k=0 to N-1) P(X=k)
 */
export const poissonUnderProbability = (threshold: number, lambda: number): number => {
  if (lambda === 0) {
    return threshold > 0 ? 1 : 0;
  }
  
  let cumulativeProbability = 0;
  
  // Somar probabilidades de 0 até threshold-1
  for (let k = 0; k < threshold; k++) {
    cumulativeProbability += poissonPMF(k, lambda);
  }
  
  return Math.max(0, Math.min(1, cumulativeProbability));
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
  
  let odds_raw = (1 / probability);
  const odds = odds_raw > 100 ? 100 : odds_raw;
  
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
      under_3_5: probabilityToOdds(poissonUnderProbability(4, lambdaGols)),
      under_2_5: probabilityToOdds(poissonUnderProbability(3, lambdaGols)),
      under_1_5: probabilityToOdds(poissonUnderProbability(2, lambdaGols)),
      under_0_5: probabilityToOdds(poissonUnderProbability(1, lambdaGols)),
      over_0_5: probabilityToOdds(poissonOverProbability(1, lambdaGols)),
      over_1_5: probabilityToOdds(poissonOverProbability(2, lambdaGols)),
      over_2_5: probabilityToOdds(poissonOverProbability(3, lambdaGols)),
      over_3_5: probabilityToOdds(poissonOverProbability(4, lambdaGols)),
    },
    assistencias: {
      under_3_5: probabilityToOdds(poissonUnderProbability(4, lambdaAssistencias)),
      under_2_5: probabilityToOdds(poissonUnderProbability(3, lambdaAssistencias)),
      under_1_5: probabilityToOdds(poissonUnderProbability(2, lambdaAssistencias)),
      under_0_5: probabilityToOdds(poissonUnderProbability(1, lambdaAssistencias)),
      over_0_5: probabilityToOdds(poissonOverProbability(1, lambdaAssistencias)),
      over_1_5: probabilityToOdds(poissonOverProbability(2, lambdaAssistencias)),
      over_2_5: probabilityToOdds(poissonOverProbability(3, lambdaAssistencias)),
      over_3_5: probabilityToOdds(poissonOverProbability(4, lambdaAssistencias)),
    },
    desarmes: {
      under_3_5: probabilityToOdds(poissonUnderProbability(4, lambdaDesarmes)),
      under_2_5: probabilityToOdds(poissonUnderProbability(3, lambdaDesarmes)),
      under_1_5: probabilityToOdds(poissonUnderProbability(2, lambdaDesarmes)),
      under_0_5: probabilityToOdds(poissonUnderProbability(1, lambdaDesarmes)),
      over_0_5: probabilityToOdds(poissonOverProbability(1, lambdaDesarmes)),
      over_1_5: probabilityToOdds(poissonOverProbability(2, lambdaDesarmes)),
      over_2_5: probabilityToOdds(poissonOverProbability(3, lambdaDesarmes)),
      over_3_5: probabilityToOdds(poissonOverProbability(4, lambdaDesarmes)),
    },
    defesas: {
      under_3_5: probabilityToOdds(poissonUnderProbability(4, lambdaDefesas)),
      under_2_5: probabilityToOdds(poissonUnderProbability(3, lambdaDefesas)),
      under_1_5: probabilityToOdds(poissonUnderProbability(2, lambdaDefesas)),
      under_0_5: probabilityToOdds(poissonUnderProbability(1, lambdaDefesas)),
      over_0_5: probabilityToOdds(poissonOverProbability(1, lambdaDefesas)),
      over_1_5: probabilityToOdds(poissonOverProbability(2, lambdaDefesas)),
      over_2_5: probabilityToOdds(poissonOverProbability(3, lambdaDefesas)),
      over_3_5: probabilityToOdds(poissonOverProbability(4, lambdaDefesas)),
    },
  };
};

/**
 * Calcula as odds para todos os jogadores
 */
export const calculateAllPlayersOdds = (players: Tables<"players">[]): PlayerMarketOdds[] => {
  return players.map(calculatePlayerMarketOdds);
};
