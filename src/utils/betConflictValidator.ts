
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
    const newBetValue = parseFloat(newSelection.detalhe.split('_')[2]);

    for (const existingBet of samePlayerBets) {
      const existingBetType = existingBet.detalhe.split('_')[0];
      const existingBetValue = parseFloat(existingBet.detalhe.split('_')[2]);

      // Verificar conflitos do mesmo tipo (ex: GOLS +0.5 vs GOLS +1.5)
      if (newBetType === existingBetType) {
        return {
          hasConflict: true,
          conflictType: 'SAME_TYPE',
          conflictMessage: `Você já tem uma aposta de ${getBetTypeDisplayName(newBetType)} para este jogador (${existingBetValue}). Deseja substituir?`,
          existingSelection: existingBet
        };
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
        message: 'Apostas do mesmo tipo para o mesmo jogador são conflitantes.'
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
