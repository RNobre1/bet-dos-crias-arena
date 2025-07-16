import { Selecao } from "@/types/apostas";

export interface ConflictResult {
  hasConflict: boolean;
  conflictType?: string;
  conflictMessage?: string;
  existingSelection?: Selecao;
}

export const validateBetConflicts = (
  newSelection: Omit<Selecao, 'id'>,
  existingSelections: Selecao[]
): ConflictResult => {
  // Verificar se é aposta de jogador
  if (newSelection.categoria === 'MERCADO_JOGADOR' && newSelection.jogador_id) {
    const samePlayerBets = existingSelections.filter(
      selection => 
        selection.categoria === 'MERCADO_JOGADOR' &&
        selection.jogador_id === newSelection.jogador_id &&
        selection.partida_id === newSelection.partida_id
    );

    if (samePlayerBets.length === 0) {
      return { hasConflict: false };
    }

    // Extrair tipo de aposta (GOLS, ASSIST, DESARMES, DEFESAS)
    const newBetType = newSelection.detalhe.split('_')[0];
    const newBetModifier = newSelection.detalhe.split('_')[1]; // MAIS ou MENOS
    const newBetValue = parseFloat(newSelection.detalhe.split('_')[2]);

    for (const existingBet of samePlayerBets) {
      const existingBetType = existingBet.detalhe.split('_')[0];
      const existingBetModifier = existingBet.detalhe.split('_')[1]; // MAIS ou MENOS
      const existingBetValue = parseFloat(existingBet.detalhe.split('_')[2]);

      // Verificar conflitos do mesmo tipo (ex: GOLS)
      if (newBetType === existingBetType) {
        // Caso 1: Mesmo modificador (MAIS/MAIS ou MENOS/MENOS)
        if (newBetModifier === existingBetModifier) {
          // Verificar redundância
          if (newBetModifier === 'MAIS') {
            // Para apostas "MAIS", a menor é redundante (ex: +0.5 é redundante se já tem +1.5)
            if (newBetValue <= existingBetValue) {
              return {
                hasConflict: true,
                conflictType: 'REDUNDANT_BET',
                conflictMessage: `A aposta ${getBetTypeDisplayName(newBetType)} +${newBetValue} é redundante com a aposta existente +${existingBetValue}. A aposta menor já está coberta pela maior.`,
                existingSelection: existingBet
              };
            } else {
              // Nova aposta é maior, substituir a existente
              return {
                hasConflict: true,
                conflictType: 'SAME_TYPE',
                conflictMessage: `Você já tem uma aposta de ${getBetTypeDisplayName(newBetType)} +${existingBetValue} para este jogador. A nova aposta +${newBetValue} é mais específica. Deseja substituir?`,
                existingSelection: existingBet
              };
            }
          } else if (newBetModifier === 'MENOS') {
            // Para apostas "MENOS", a maior é redundante (ex: -2.5 é redundante se já tem -1.5)
            if (newBetValue >= existingBetValue) {
              return {
                hasConflict: true,
                conflictType: 'REDUNDANT_BET',
                conflictMessage: `A aposta ${getBetTypeDisplayName(newBetType)} -${newBetValue} é redundante com a aposta existente -${existingBetValue}. A aposta maior já está coberta pela menor.`,
                existingSelection: existingBet
              };
            } else {
              // Nova aposta é menor, substituir a existente
              return {
                hasConflict: true,
                conflictType: 'SAME_TYPE',
                conflictMessage: `Você já tem uma aposta de ${getBetTypeDisplayName(newBetType)} -${existingBetValue} para este jogador. A nova aposta -${newBetValue} é mais específica. Deseja substituir?`,
                existingSelection: existingBet
              };
            }
          }
        } 
        // Caso 2: Modificadores diferentes (MAIS/MENOS)
        else {
          // Verificar se as apostas são contraditórias ou formam um intervalo válido
          let lowerBound, upperBound;
          
          if (newBetModifier === 'MAIS' && existingBetModifier === 'MENOS') {
            lowerBound = newBetValue;
            upperBound = existingBetValue;
          } else if (newBetModifier === 'MENOS' && existingBetModifier === 'MAIS') {
            lowerBound = existingBetValue;
            upperBound = newBetValue;
          }
          
          // Verificar se há sobreposição válida
          if (lowerBound !== undefined && upperBound !== undefined) {
            const difference = upperBound - lowerBound;
            
            if (difference <= 0) {
              // Apostas contraditórias (ex: +2.5 e -1.5)
              return {
                hasConflict: true,
                conflictType: 'CONTRADICTORY_OVER_UNDER',
                conflictMessage: `As apostas ${getBetTypeDisplayName(newBetType)} +${lowerBound} e -${upperBound} são contraditórias. Não há valores que satisfaçam ambas as condições.`,
                existingSelection: existingBet
              };
            } else if (difference === 1) {
              // Combinação válida que resulta em valor exato (ex: +1.5 e -2.5 = exatamente 2)
              // Permitir esta combinação
              return { hasConflict: false };
            } else if (difference > 1) {
              // Combinação válida que resulta em intervalo (ex: +1.5 e -3.5 = 2 ou 3)
              // Permitir esta combinação
              return { hasConflict: false };
            }
          }
        }
      }
    }
  }

  // Verificar conflitos de resultado da partida
  if (newSelection.categoria === 'RESULTADO_PARTIDA') {
    const sameMatchResultBets = existingSelections.filter(
      selection => 
        selection.categoria === 'RESULTADO_PARTIDA' &&
        selection.partida_id === newSelection.partida_id
    );

    if (sameMatchResultBets.length > 0) {
      const existingBet = sameMatchResultBets[0];
      return {
        hasConflict: true,
        conflictType: 'MATCH_RESULT',
        conflictMessage: `Você já tem uma aposta no resultado desta partida (${getResultDisplayName(existingBet.detalhe)}). Deseja substituir?`,
        existingSelection: existingBet
      };
    }
  }

  return { hasConflict: false };
};

const getBetTypeDisplayName = (betType: string): string => {
  switch (betType) {
    case 'GOLS': return 'Gols';
    case 'ASSIST': return 'Assistências';
    case 'DESARMES': return 'Desarmes';
    case 'DEFESAS': return 'Defesas';
    default: return betType;
  }
};

const getResultDisplayName = (detalhe: string): string => {
  switch (detalhe) {
    case 'VITORIA_A': return 'Vitória Time A';
    case 'VITORIA_B': return 'Vitória Time B';
    case 'EMPATE': return 'Empate';
    default: return detalhe;
  }
};

export const getConflictResolutionOptions = (conflictType: string) => {
  switch (conflictType) {
    case 'SAME_TYPE':
      return {
        replace: 'Substituir aposta existente',
        cancel: 'Cancelar nova aposta',
        message: 'A nova aposta é mais específica que a existente.'
      };
    case 'REDUNDANT_BET':
      return {
        replace: 'Manter aposta existente',
        cancel: 'Cancelar nova aposta',
        message: 'A nova aposta é redundante e já está coberta pela existente.'
      };
    case 'CONTRADICTORY_OVER_UNDER':
      return {
        replace: 'Substituir aposta existente',
        cancel: 'Cancelar nova aposta',
        message: 'As apostas são contraditórias e não podem coexistir.'
      };
    case 'MATCH_RESULT':
      return {
        replace: 'Substituir aposta de resultado',
        cancel: 'Cancelar nova aposta',
        message: 'Você só pode ter uma aposta no resultado da partida.'
      };
    default:
      return {
        replace: 'Substituir',
        cancel: 'Cancelar',
        message: 'Conflito detectado entre apostas.'
      };
  }
};