
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import SelecaoPartida from './SelecaoPartida';
import BilheteAposta from './BilheteAposta';
import HistoricoApostas from './HistoricoApostas';
import { calculateOdds } from "@/utils/oddsCalculator";
import { TrendingUp } from "lucide-react";
import { Selecao } from "@/types/apostas";

interface MercadosApostaNewProps {
  jogadores: Tables<"players">[];
}

const MercadosApostaNew: React.FC<MercadosApostaNewProps> = ({ jogadores }) => {
  const { user, profile } = useAuth();
  const [partidas, setPartidas] = useState<Tables<"partidas">[]>([]);
  const [partidaSelecionada, setPartidaSelecionada] = useState<Tables<"partidas"> | null>(null);
  const [selecoes, setSelecoes] = useState<Selecao[]>([]);
  const [jogadorVinculado, setJogadorVinculado] = useState<Tables<"players"> | null>(null);

  useEffect(() => {
    if (user) {
      loadPartidas();
      loadJogadorVinculado();
    }
  }, [user]);

  const loadPartidas = async () => {
    try {
      const { data, error } = await supabase
        .from('partidas')
        .select('*')
        .in('status', ['AGENDADA', 'AO_VIVO'])
        .order('data_partida');

      if (error) throw error;
      setPartidas(data || []);
    } catch (error) {
      console.error('Erro ao carregar partidas:', error);
      toast.error('Erro ao carregar partidas');
    }
  };

  const loadJogadorVinculado = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setJogadorVinculado(data);
    } catch (error) {
      console.error('Erro ao carregar jogador vinculado:', error);
    }
  };

  const adicionarSelecao = (categoria: string, detalhe: string, odd: number, jogadorId?: string, jogadorNome?: string) => {
    if (!partidaSelecionada) return;

    // Verificar se usuário está tentando apostar em si mesmo
    if (jogadorVinculado && jogadorId === jogadorVinculado.id) {
      toast.error('Você não pode apostar em si mesmo!');
      return;
    }

    // Verificar se a seleção já existe
    const jaExiste = selecoes.some(s => 
      s.categoria === categoria && 
      s.detalhe === detalhe && 
      s.jogador_id === jogadorId &&
      s.partida_id === partidaSelecionada.partida_id
    );

    if (jaExiste) {
      toast.error('Esta seleção já foi adicionada');
      return;
    }

    const novaSelecao: Selecao = {
      id: `${Date.now()}_${Math.random()}`,
      partida_id: partidaSelecionada.partida_id,
      categoria,
      detalhe,
      descricao: jogadorNome ? `${jogadorNome} - ${detalhe.replace(`_${jogadorId}`, '')}` : detalhe,
      odd,
      jogador_id: jogadorId || null
    };

    setSelecoes([...selecoes, novaSelecao]);
    toast.success('Seleção adicionada ao bilhete');
  };

  const removerSelecao = (id: string) => {
    setSelecoes(selecoes.filter(s => s.id !== id));
  };

  const limparBilhete = () => {
    setSelecoes([]);
  };

  // Verificar se usuário está vinculado a um jogador
  if (!jogadorVinculado) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Mercados de Apostas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Você precisa estar vinculado a um jogador para poder fazer apostas. 
            Entre em contato com o administrador para vincular sua conta a um jogador.
          </p>
        </CardContent>
      </Card>
    );
  }

  const calcularOddsJogador = (jogador: Tables<"players">) => {
    // Calcular odds baseado nas estatísticas do jogador
    const golsPorJogo = jogador.jogos > 0 ? jogador.gols / jogador.jogos : 0;
    const assistPorJogo = jogador.jogos > 0 ? jogador.assistencias / jogador.jogos : 0;
    const desarmesPorJogo = jogador.jogos > 0 ? jogador.desarmes / jogador.jogos : 0;
    const defesasPorJogo = jogador.jogos > 0 ? jogador.defesas / jogador.jogos : 0;

    return {
      golsMais05: Math.max(1.5, 1 / Math.max(0.1, golsPorJogo * 0.8)),
      golsMais15: Math.max(2.0, 1 / Math.max(0.05, golsPorJogo * 0.4)),
      assistMais05: Math.max(1.8, 1 / Math.max(0.1, assistPorJogo * 0.7)),
      desarmesMais15: Math.max(1.6, 1 / Math.max(0.1, desarmesPorJogo * 0.6)),
      defesasMais25: Math.max(1.4, 1 / Math.max(0.1, defesasPorJogo * 0.5))
    };
  };

  const renderMercadosResultado = () => {
    if (!partidaSelecionada) return null;

    const oddsResultado = {
      VITORIA_A: 2.1,
      EMPATE: 3.2,
      VITORIA_B: 2.8
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultado da Partida</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => adicionarSelecao('RESULTADO_PARTIDA', 'VITORIA_A', oddsResultado.VITORIA_A)}
              className="p-3 border rounded-lg hover:bg-gray-50 text-center"
            >
              <div className="font-medium">{partidaSelecionada.time_a_nome}</div>
              <div className="text-green-600 font-bold">{oddsResultado.VITORIA_A}</div>
            </button>

            <button
              onClick={() => adicionarSelecao('RESULTADO_PARTIDA', 'EMPATE', oddsResultado.EMPATE)}
              className="p-3 border rounded-lg hover:bg-gray-50 text-center"
            >
              <div className="font-medium">Empate</div>
              <div className="text-green-600 font-bold">{oddsResultado.EMPATE}</div>
            </button>

            <button
              onClick={() => adicionarSelecao('RESULTADO_PARTIDA', 'VITORIA_B', oddsResultado.VITORIA_B)}
              className="p-3 border rounded-lg hover:bg-gray-50 text-center"
            >
              <div className="font-medium">{partidaSelecionada.time_b_nome}</div>
              <div className="text-green-600 font-bold">{oddsResultado.VITORIA_B}</div>
            </button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderMercadosJogador = () => {
    if (!partidaSelecionada) return null;

    // Obter jogadores escalados para esta partida
    const jogadoresEscalados = [
      ...(partidaSelecionada.time_a_jogadores || []),
      ...(partidaSelecionada.time_b_jogadores || [])
    ];

    const jogadoresDisponiveis = jogadores.filter(j => 
      jogadoresEscalados.includes(j.id) && j.id !== jogadorVinculado?.id
    );

    if (jogadoresDisponiveis.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Mercados de Jogadores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Nenhum jogador disponível para apostas nesta partida.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Mercados de Jogadores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jogadoresDisponiveis.map((jogador) => {
              const odds = calcularOddsJogador(jogador);
              
              return (
                <div key={jogador.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-lg mb-3">{jogador.jogador}</h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    <button
                      onClick={() => adicionarSelecao('MERCADO_JOGADOR', `GOLS_MAIS_0.5_${jogador.id}`, odds.golsMais05, jogador.id, jogador.jogador)}
                      className="p-2 border rounded hover:bg-gray-50 text-center text-sm"
                    >
                      <div>Gols +0.5</div>
                      <div className="text-green-600 font-bold">{odds.golsMais05.toFixed(2)}</div>
                    </button>

                    <button
                      onClick={() => adicionarSelecao('MERCADO_JOGADOR', `GOLS_MAIS_1.5_${jogador.id}`, odds.golsMais15, jogador.id, jogador.jogador)}
                      className="p-2 border rounded hover:bg-gray-50 text-center text-sm"
                    >
                      <div>Gols +1.5</div>
                      <div className="text-green-600 font-bold">{odds.golsMais15.toFixed(2)}</div>
                    </button>

                    <button
                      onClick={() => adicionarSelecao('MERCADO_JOGADOR', `ASSIST_MAIS_0.5_${jogador.id}`, odds.assistMais05, jogador.id, jogador.jogador)}
                      className="p-2 border rounded hover:bg-gray-50 text-center text-sm"
                    >
                      <div>Assist +0.5</div>
                      <div className="text-green-600 font-bold">{odds.assistMais05.toFixed(2)}</div>
                    </button>

                    <button
                      onClick={() => adicionarSelecao('MERCADO_JOGADOR', `DESARMES_MAIS_1.5_${jogador.id}`, odds.desarmesMais15, jogador.id, jogador.jogador)}
                      className="p-2 border rounded hover:bg-gray-50 text-center text-sm"
                    >
                      <div>Desarmes +1.5</div>
                      <div className="text-green-600 font-bold">{odds.desarmesMais15.toFixed(2)}</div>
                    </button>

                    <button
                      onClick={() => adicionarSelecao('MERCADO_JOGADOR', `DEFESAS_MAIS_2.5_${jogador.id}`, odds.defesasMais25, jogador.id, jogador.jogador)}
                      className="p-2 border rounded hover:bg-gray-50 text-center text-sm"
                    >
                      <div>Defesas +2.5</div>
                      <div className="text-green-600 font-bold">{odds.defesasMais25.toFixed(2)}</div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SelecaoPartida
            partidas={partidas}
            partidaSelecionada={partidaSelecionada}
            onPartidaChange={setPartidaSelecionada}
          />

          {partidaSelecionada && (
            <>
              {renderMercadosResultado()}
              {renderMercadosJogador()}
            </>
          )}
        </div>

        <div className="space-y-6">
          <BilheteAposta
            selecoes={selecoes}
            onRemoverSelecao={removerSelecao}
            onLimparBilhete={limparBilhete}
          />
        </div>
      </div>

      <HistoricoApostas />
    </div>
  );
};

export default MercadosApostaNew;
