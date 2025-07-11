
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import SelecaoPartida from './SelecaoPartida';
import BilheteAposta from './BilheteAposta';
import HistoricoApostas from './HistoricoApostas';
import { calcularOdds } from "@/utils/oddsCalculator";
import { TrendingUp } from "lucide-react";

interface MercadosApostaNewProps {
  jogadores: Tables<"players">[];
}

interface SelecaoAposta {
  categoria: string;
  detalhe: string;
  odd: number;
  jogadorId?: string;
  jogadorNome?: string;
  partidaId: number;
}

const MercadosApostaNew: React.FC<MercadosApostaNewProps> = ({ jogadores }) => {
  const { user, profile } = useAuth();
  const [partidas, setPartidas] = useState<Tables<"partidas">[]>([]);
  const [partidaSelecionada, setPartidaSelecionada] = useState<Tables<"partidas"> | null>(null);
  const [selecoes, setSelecoes] = useState<SelecaoAposta[]>([]);
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

  const adicionarSelecao = (selecao: SelecaoAposta) => {
    // Verificar se usuário está tentando apostar em si mesmo
    if (jogadorVinculado && selecao.jogadorId === jogadorVinculado.id) {
      toast.error('Você não pode apostar em si mesmo!');
      return;
    }

    // Verificar se a seleção já existe
    const jaExiste = selecoes.some(s => 
      s.categoria === selecao.categoria && 
      s.detalhe === selecao.detalhe && 
      s.jogadorId === selecao.jogadorId &&
      s.partidaId === selecao.partidaId
    );

    if (jaExiste) {
      toast.error('Esta seleção já foi adicionada');
      return;
    }

    setSelecoes([...selecoes, selecao]);
    toast.success('Seleção adicionada ao bilhete');
  };

  const removerSelecao = (index: number) => {
    setSelecoes(selecoes.filter((_, i) => i !== index));
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
              onClick={() => adicionarSelecao({
                categoria: 'RESULTADO_PARTIDA',
                detalhe: 'VITORIA_A',
                odd: oddsResultado.VITORIA_A,
                partidaId: partidaSelecionada.partida_id
              })}
              className="p-3 border rounded-lg hover:bg-gray-50 text-center"
            >
              <div className="font-medium">{partidaSelecionada.time_a_nome}</div>
              <div className="text-green-600 font-bold">{oddsResultado.VITORIA_A}</div>
            </button>

            <button
              onClick={() => adicionarSelecao({
                categoria: 'RESULTADO_PARTIDA',
                detalhe: 'EMPATE',
                odd: oddsResultado.EMPATE,
                partidaId: partidaSelecionada.partida_id
              })}
              className="p-3 border rounded-lg hover:bg-gray-50 text-center"
            >
              <div className="font-medium">Empate</div>
              <div className="text-green-600 font-bold">{oddsResultado.EMPATE}</div>
            </button>

            <button
              onClick={() => adicionarSelecao({
                categoria: 'RESULTADO_PARTIDA',
                detalhe: 'VITORIA_B',
                odd: oddsResultado.VITORIA_B,
                partidaId: partidaSelecionada.partida_id
              })}
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
              const odds = calcularOdds(jogador);
              
              return (
                <div key={jogador.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-lg mb-3">{jogador.jogador}</h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    <button
                      onClick={() => adicionarSelecao({
                        categoria: 'MERCADO_JOGADOR',
                        detalhe: `GOLS_MAIS_0.5_${jogador.id}`,
                        odd: odds.golsMais05,
                        jogadorId: jogador.id,
                        jogadorNome: jogador.jogador,
                        partidaId: partidaSelecionada.partida_id
                      })}
                      className="p-2 border rounded hover:bg-gray-50 text-center text-sm"
                    >
                      <div>Gols +0.5</div>
                      <div className="text-green-600 font-bold">{odds.golsMais05}</div>
                    </button>

                    <button
                      onClick={() => adicionarSelecao({
                        categoria: 'MERCADO_JOGADOR',
                        detalhe: `GOLS_MAIS_1.5_${jogador.id}`,
                        odd: odds.golsMais15,
                        jogadorId: jogador.id,
                        jogadorNome: jogador.jogador,
                        partidaId: partidaSelecionada.partida_id
                      })}
                      className="p-2 border rounded hover:bg-gray-50 text-center text-sm"
                    >
                      <div>Gols +1.5</div>
                      <div className="text-green-600 font-bold">{odds.golsMais15}</div>
                    </button>

                    <button
                      onClick={() => adicionarSelecao({
                        categoria: 'MERCADO_JOGADOR',
                        detalhe: `ASSIST_MAIS_0.5_${jogador.id}`,
                        odd: odds.assistMais05,
                        jogadorId: jogador.id,
                        jogadorNome: jogador.jogador,
                        partidaId: partidaSelecionada.partida_id
                      })}
                      className="p-2 border rounded hover:bg-gray-50 text-center text-sm"
                    >
                      <div>Assist +0.5</div>
                      <div className="text-green-600 font-bold">{odds.assistMais05}</div>
                    </button>

                    <button
                      onClick={() => adicionarSelecao({
                        categoria: 'MERCADO_JOGADOR',
                        detalhe: `DESARMES_MAIS_1.5_${jogador.id}`,
                        odd: odds.desarmesMais15,
                        jogadorId: jogador.id,
                        jogadorNome: jogador.jogador,
                        partidaId: partidaSelecionada.partida_id
                      })}
                      className="p-2 border rounded hover:bg-gray-50 text-center text-sm"
                    >
                      <div>Desarmes +1.5</div>
                      <div className="text-green-600 font-bold">{odds.desarmesMais15}</div>
                    </button>

                    <button
                      onClick={() => adicionarSelecao({
                        categoria: 'MERCADO_JOGADOR',
                        detalhe: `DEFESAS_MAIS_2.5_${jogador.id}`,
                        odd: odds.defesasMais25,
                        jogadorId: jogador.id,
                        jogadorNome: jogador.jogador,
                        partidaId: partidaSelecionada.partida_id
                      })}
                      className="p-2 border rounded hover:bg-gray-50 text-center text-sm"
                    >
                      <div>Defesas +2.5</div>
                      <div className="text-green-600 font-bold">{odds.defesasMais25}</div>
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
            onApostaFinalizada={loadPartidas}
          />
        </div>
      </div>

      <HistoricoApostas />
    </div>
  );
};

export default MercadosApostaNew;
