import { Tables } from "@/integrations/supabase/types";
import { calculatePlayerNote } from "./playerNotesCalculator";

export interface RadarSkills {
  finalizacao: number;
  criacao: number;
  defesa: number;
  fisico: number;
  disciplina: number;
  overall: number;
}

export interface RadarData {
  skill: string;
  value: number;
  fullMark: number;
}

/**
 * Calcula as habilidades do radar para um jogador baseado no algoritmo v1.1
 */
export const calculateRadarSkills = (player: Tables<"players">): RadarSkills => {
  // Tratar caso de jogos = 0 para evitar divisão por zero
  if (player.jogos === 0) {
    return {
      finalizacao: 20,
      criacao: 20,
      defesa: 20,
      fisico: 20,
      disciplina: 20,
      overall: 20
    };
  }

  // Passo 1: Cálculo das Métricas Base por Jogo
  const golsPorJogo = player.gols / player.jogos;
  const assistenciasPorJogo = player.assistencias / player.jogos;
  const faltasPorJogo = player.faltas / player.jogos;
  const pontuacaoDefensivaPorJogo = (player.desarmes * 0.5 + player.defesas * 0.8) / player.jogos;
  const mediaParticipacoesPorJogo = (player.gols + player.assistencias + player.desarmes + player.defesas + player.faltas) / player.jogos;

  // Passo 2: Cálculo dos 5 Atributos do Radar (Escala 20-99)
  
  // 1. Finalização (Shooting)
  const maxGols = 3.0;
  const finalizacao = Math.min(99, (golsPorJogo / maxGols) * 80 + 20);

  // 2. Criação (Passing)
  const maxAssist = 3.0;
  const criacao = Math.min(99, (assistenciasPorJogo / maxAssist) * 80 + 20);

  //TO-DO: Reavaliar benchmark posteriormente com mais infos
  // 3. Defesa (Defending)
  const maxDef = 2.0;
  const defesa = Math.min(99, (pontuacaoDefensivaPorJogo / maxDef) * 80 + 20);

  // 4. Físico (Physicality)
  const maxParticipacao = 6.0;
  const fisico = Math.min(99, (mediaParticipacoesPorJogo / maxParticipacao) * 80 + 20);

  //TO-DO: Reavaliar benchmark posteriormente com mais infos
  // 5. Disciplina (Discipline)
  const maxFaltas = 2.0;
  const disciplina = Math.max(20, 99 - (faltasPorJogo / maxFaltas) * 79);

  // Passo 3: Cálculo do Atributo Central (Overall)
  const novaNota = calculatePlayerNote(player);
  const overall = Math.round(((novaNota - 5.0) / 5.0) * 80 + 20);

  return {
    finalizacao: Math.round(finalizacao),
    criacao: Math.round(criacao),
    defesa: Math.round(defesa),
    fisico: Math.round(fisico),
    disciplina: Math.round(disciplina),
    overall: Math.max(20, Math.min(99, overall))
  };
};

/**
 * Converte as habilidades do radar para o formato esperado pelo componente RadarChart
 */
export const formatRadarData = (skills: RadarSkills): RadarData[] => {
  return [
    { skill: 'Finalização', value: skills.finalizacao, fullMark: 100 },
    { skill: 'Criação', value: skills.criacao, fullMark: 100 },
    { skill: 'Defesa', value: skills.defesa, fullMark: 100 },
    { skill: 'Físico', value: skills.fisico, fullMark: 100 },
    { skill: 'Disciplina', value: skills.disciplina, fullMark: 100 }
  ];
};