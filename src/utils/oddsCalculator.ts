
import { Tables } from "@/integrations/supabase/types";

type Player = Tables<"players">;

// Cálculo da "Nota" do jogador baseado no blueprint
export const calcularNotaJogador = (player: Player): number => {
  if (player.jogos === 0) return 5.0;
  
  const impactoOfensivo = ((player.gols * 2.0) + (player.assistencias * 1.0)) / player.jogos;
  const impactoDefensivo = ((player.defesas * 1.5) + (player.desarmes * 1.0)) / player.jogos;
  const penalidade = (player.faltas * 0.25) / player.jogos;
  
  const pontuacaoImpactoBruta = Math.max(impactoOfensivo, impactoDefensivo) - penalidade;
  
  // Escalonamento para 1-10 (simplificado)
  const nota = Math.max(1, Math.min(10, 5 + (pontuacaoImpactoBruta * 2)));
  
  return Math.round(nota * 10) / 10;
};

// Cálculo das pontuações por posição
export const calcularPontuacoesPosicao = (player: Player) => {
  if (player.jogos === 0) return { goleiro: 0, atacante: 0, volante: 0 };
  
  const goleiro = ((player.defesas * 2.0) - (player.faltas * 0.25) - (player.gols * 0.5) - (player.assistencias * 0.25)) / player.jogos;
  const atacante = ((player.gols * 2.0) + (player.assistencias * 1.0) - (player.faltas * 0.25)) / player.jogos;
  const volante = ((player.gols * 0.5) + (player.assistencias * 1.5) + (player.desarmes * 1.5) - (player.faltas * 0.25)) / player.jogos;
  
  return { goleiro, atacante, volante };
};

// Algoritmo de escalação inteligente
export const gerarEscalacoes = (jogadores: Player[]) => {
  const disponiveis = jogadores.filter(p => p.status !== 'Lesionado');
  const lesionados = jogadores.filter(p => p.status === 'Lesionado');
  
  // Calcular pontuações para cada jogador
  const jogadoresComPontuacao = disponiveis.map(player => ({
    ...player,
    pontuacoes: calcularPontuacoesPosicao(player),
    nota: calcularNotaJogador(player)
  }));
  
  // Separar goleiros (especialistas) e jogadores de linha
  const goleirosEspecialistas = jogadoresComPontuacao.filter(p => p.pontuacoes.goleiro > 0);
  const jogadoresLinha = jogadoresComPontuacao.filter(p => p.pontuacoes.goleiro <= 0);
  
  const timeA: any[] = [];
  const timeB: any[] = [];
  
  // 1. Seleção de goleiros
  if (goleirosEspecialistas.length >= 2) {
    const melhoresGoleiros = goleirosEspecialistas
      .sort((a, b) => b.pontuacoes.goleiro - a.pontuacoes.goleiro)
      .slice(0, 2);
    timeA.push({ ...melhoresGoleiros[0], posicao: 'Goleiro' });
    timeB.push({ ...melhoresGoleiros[1], posicao: 'Goleiro' });
  } else if (goleirosEspecialistas.length === 1) {
    timeA.push({ ...goleirosEspecialistas[0], posicao: 'Goleiro' });
    // Time B pega o melhor "goleiro-linha"
    const melhorGoleiroLinha = jogadoresLinha
      .sort((a, b) => b.pontuacoes.goleiro - a.pontuacoes.goleiro)[0];
    timeB.push({ ...melhorGoleiroLinha, posicao: 'Goleiro' });
    jogadoresLinha.splice(jogadoresLinha.indexOf(melhorGoleiroLinha), 1);
  } else {
    // Ambos os times pegam goleiros-linha
    const melhoresGoleirosLinha = jogadoresLinha
      .sort((a, b) => b.pontuacoes.goleiro - a.pontuacoes.goleiro)
      .slice(0, 2);
    timeA.push({ ...melhoresGoleirosLinha[0], posicao: 'Goleiro' });
    timeB.push({ ...melhoresGoleirosLinha[1], posicao: 'Goleiro' });
    jogadoresLinha.splice(jogadoresLinha.indexOf(melhoresGoleirosLinha[0]), 1);
    jogadoresLinha.splice(jogadoresLinha.indexOf(melhoresGoleirosLinha[1]), 1);
  }
  
  // 2. Garantir pelo menos 1 atacante por time
  const melhoresAtacantes = jogadoresLinha
    .sort((a, b) => b.pontuacoes.atacante - a.pontuacoes.atacante)
    .slice(0, 2);
  
  timeA.push({ ...melhoresAtacantes[0], posicao: 'Atacante' });
  timeB.push({ ...melhoresAtacantes[1], posicao: 'Atacante' });
  jogadoresLinha.splice(jogadoresLinha.indexOf(melhoresAtacantes[0]), 1);
  jogadoresLinha.splice(jogadoresLinha.indexOf(melhoresAtacantes[1]), 1);
  
  // 3. Garantir pelo menos 1 volante por time
  const melhoresVolantes = jogadoresLinha
    .sort((a, b) => b.pontuacoes.volante - a.pontuacoes.volante)
    .slice(0, 2);
  
  timeA.push({ ...melhoresVolantes[0], posicao: 'Volante' });
  timeB.push({ ...melhoresVolantes[1], posicao: 'Volante' });
  jogadoresLinha.splice(jogadoresLinha.indexOf(melhoresVolantes[0]), 1);
  jogadoresLinha.splice(jogadoresLinha.indexOf(melhoresVolantes[1]), 1);
  
  // 4. Preencher vagas restantes balanceando as notas
  while (timeA.length < 5 && timeB.length < 5 && jogadoresLinha.length > 0) {
    const melhorJogador = jogadoresLinha
      .sort((a, b) => Math.max(b.pontuacoes.atacante, b.pontuacoes.volante) - Math.max(a.pontuacoes.atacante, a.pontuacoes.volante))[0];
    
    const somaNotasA = timeA.reduce((sum, p) => sum + p.nota, 0);
    const somaNotasB = timeB.reduce((sum, p) => sum + p.nota, 0);
    
    const posicao = melhorJogador.pontuacoes.atacante > melhorJogador.pontuacoes.volante ? 'Atacante' : 'Volante';
    
    if (somaNotasA <= somaNotasB) {
      timeA.push({ ...melhorJogador, posicao });
    } else {
      timeB.push({ ...melhorJogador, posicao });
    }
    
    jogadoresLinha.splice(jogadoresLinha.indexOf(melhorJogador), 1);
  }
  
  return {
    timeA: timeA.slice(0, 5),
    timeB: timeB.slice(0, 5),
    reservas: [...jogadoresLinha, ...lesionados]
  };
};

// Cálculo de odds para resultado da partida
export const calcularOddsResultado = (timeA: any[], timeB: any[]) => {
  const notaTotalA = timeA.reduce((sum, player) => sum + player.nota, 0);
  const notaTotalB = timeB.reduce((sum, player) => sum + player.nota, 0);
  
  const probABase = notaTotalA / (notaTotalA + notaTotalB);
  const probBBase = notaTotalB / (notaTotalA + notaTotalB);
  
  const diferencaNotas = Math.abs(notaTotalA - notaTotalB);
  const probEmpateBase = (1 - (diferencaNotas / Math.max(notaTotalA, notaTotalB))) * 0.4;
  
  const somaProbs = probABase + probBBase + probEmpateBase;
  const probFinalA = probABase / somaProbs;
  const probFinalB = probBBase / somaProbs;
  const probFinalEmpate = probEmpateBase / somaProbs;
  
  return {
    vitoria_a: +(1 / probFinalA).toFixed(2),
    empate: +(1 / probFinalEmpate).toFixed(2),
    vitoria_b: +(1 / probFinalB).toFixed(2)
  };
};

// Cálculo de odds para mercados de jogadores
export const calcularOddsJogador = (player: any) => {
  const mediaGols = player.gols / (player.jogos || 1);
  const mediaAssist = player.assistencias / (player.jogos || 1);
  const mediaDesarmes = player.desarmes / (player.jogos || 1);
  const mediaDefesas = player.defesas / (player.jogos || 1);
  
  const probGol05 = Math.min(0.9, mediaGols * 0.8);
  const probGol15 = Math.min(0.7, Math.pow(mediaGols / 1.5, 2) * 0.7);
  const probAssist05 = Math.min(0.8, mediaAssist * 0.7);
  const probDesarme15 = Math.min(0.9, (mediaDesarmes / 1.5) * 0.9);
  const probDefesa25 = Math.min(0.9, (mediaDefesas / 2.5) * 0.9);
  
  return {
    gol_05: probGol05 > 0.1 ? +(1 / probGol05).toFixed(2) : 10.0,
    gol_15: probGol15 > 0.05 ? +(1 / probGol15).toFixed(2) : 20.0,
    assist_05: probAssist05 > 0.1 ? +(1 / probAssist05).toFixed(2) : 10.0,
    desarme_15: probDesarme15 > 0.1 ? +(1 / probDesarme15).toFixed(2) : 10.0,
    defesa_25: probDefesa25 > 0.1 ? +(1 / probDefesa25).toFixed(2) : 10.0
  };
};
