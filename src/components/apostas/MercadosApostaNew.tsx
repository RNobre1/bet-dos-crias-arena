import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import SelecaoPartida from './SelecaoPartida';
import BilheteAposta from './BilheteAposta';
import HistoricoApostas from './HistoricoApostas';
import ConflictDialog from './ConflictDialog';
import { TrendingUp, Lock } from "lucide-react";
import { Selecao } from "@/types/apostas";
import { validateBetConflicts, ConflictResult } from "@/utils/betConflictValidator";
import { calculateAllPlayersOdds, PlayerMarketOdds } from "@/utils/poissonOddsCalculator";

interface MercadosApostaNewProps {
  jogadores: Tables<"players">[];
}

const MercadosApostaNew: React.FC<MercadosApostaNewProps> = ({ jogadores }) => {
  const { user, profile } = useAuth();
  const [partidas, setPartidas] = useState<Tables<"partidas">[]>([]);
  const [partidaSelecionada, setPartidaSelecionada] = useState<Tables<"partidas"> | null>(null);
  const [selecoes, setSelecoes] = useState<Selecao[]>([]);
  const [jogadorVinculado, setJogadorVinculado] = useState<Tables<"players"> | null>(null);
  const [playersOdds, setPlayersOdds] = useState<PlayerMarketOdds[]>([]);
  const [conflictDialog, setConflictDialog] = useState<{
    isOpen: boolean;
    conflict: ConflictResult;
    pendingSelection: Omit<Selecao, 'id'> | null;
  }>({
    isOpen: false,
    conflict: { hasConflict: false },
    pendingSelection: null
  });

  useEffect(() => {
    if (user) {
      loadPartidas();
      loadJogadorVinculado();
    }
  }, [user]);

  useEffect(() => {
    // Calcular odds usando Distribuição de Poisson quando jogadores mudarem
    if (jogadores.length > 0) {
      const odds = calculateAllPlayersOdds(jogadores);
      setPlayersOdds(odds);
    }
  }, [jogadores]);

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

    const novaSelecao: Omit<Selecao, 'id'> = {
      partida_id: partidaSelecionada.partida_id,
      categoria,
      detalhe,
      descricao: jogadorNome ? `${jogadorNome} - ${detalhe.replace(`_${jogadorId}`, '')}` : detalhe,
      odd,
      jogador_id: jogadorId || null
    };

    // Validar conflitos
    const conflictResult = validateBetConflicts(novaSelecao, selecoes);

    if (conflictResult.hasConflict) {
      setConflictDialog({
        isOpen: true,
        conflict: conflictResult,
        pendingSelection: novaSelecao
      });
      return;
    }

    // Adicionar seleção normalmente se não há conflitos
    const selecaoCompleta: Selecao = {
      ...novaSelecao,
      id: `${Date.now()}_${Math.random()}`
    };

    setSelecoes([...selecoes, selecaoCompleta]);
    toast.success('Seleção adicionada ao bilhete');
  };

  const handleConflictResolution = (action: 'replace' | 'cancel') => {
    if (action === 'cancel') {
      setConflictDialog({
        isOpen: false,
        conflict: { hasConflict: false },
        pendingSelection: null
      });
      return;
    }

    if (action === 'replace' && conflictDialog.pendingSelection && conflictDialog.conflict.existingSelection) {
      // Remover seleção conflitante
      const selecoesAtualizadas = selecoes.filter(s => s.id !== conflictDialog.conflict.existingSelection?.id);
      
      // Adicionar nova seleção
      const novaSelecao: Selecao = {
        ...conflictDialog.pendingSelection,
        id: `${Date.now()}_${Math.random()}`
      };

      setSelecoes([...selecoesAtualizadas, novaSelecao]);
      toast.success('Seleção substituída no bilhete');
    }

    setConflictDialog({
      isOpen: false,
      conflict: { hasConflict: false },
      pendingSelection: null
    });
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

  const renderMarketButton = (
    label: string,
    odd: number | null,
    onClick: () => void,
    isBlocked: boolean = false
  ) => {
    if (odd === null || isBlocked) {
      return (
        <div className="p-2 border rounded bg-gray-100 text-center text-sm opacity-50 cursor-not-allowed">
          <div className="flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            <span>{label}</span>
          </div>
          <div className="text-gray-500">∞</div>
        </div>
      );
    }

    return (
      <button
        onClick={onClick}
        className="p-2 border rounded hover:bg-gray-50 text-center text-sm"
      >
        <div>{label}</div>
        <div className="text-green-600 font-bold">{odd.toFixed(2)}</div>
      </button>
    );
  };

  const renderMercadosJogador = () => {
    if (!partidaSelecionada) return null;

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
          <CardTitle>Mercados de Jogadores (Distribuição de Poisson)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jogadoresDisponiveis.map((jogador) => {
              const playerOdds = playersOdds.find(p => p.id === jogador.id);
              
              if (!playerOdds) return null;
              
              return (
                <div key={jogador.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-lg mb-3">{jogador.jogador}</h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    {renderMarketButton(
                      'Gols +0.5',
                      playerOdds.gols.over_0_5,
                      () => adicionarSelecao(
                        'MERCADO_JOGADOR', 
                        `GOLS_MAIS_0.5_${jogador.id}`, 
                        playerOdds.gols.over_0_5!, 
                        jogador.id, 
                        jogador.jogador
                      )
                    )}

                    {renderMarketButton(
                      'Gols +1.5',
                      playerOdds.gols.over_1_5,
                      () => adicionarSelecao(
                        'MERCADO_JOGADOR', 
                        `GOLS_MAIS_1.5_${jogador.id}`, 
                        playerOdds.gols.over_1_5!, 
                        jogador.id, 
                        jogador.jogador
                      )
                    )}

                    {renderMarketButton(
                      'Assist +0.5',
                      playerOdds.assistencias.over_0_5,
                      () => adicionarSelecao(
                        'MERCADO_JOGADOR', 
                        `ASSIST_MAIS_0.5_${jogador.id}`, 
                        playerOdds.assistencias.over_0_5!, 
                        jogador.id, 
                        jogador.jogador
                      )
                    )}

                    {renderMarketButton(
                      'Desarmes +1.5',
                      playerOdds.desarmes.over_1_5,
                      () => adicionarSelecao(
                        'MERCADO_JOGADOR', 
                        `DESARMES_MAIS_1.5_${jogador.id}`, 
                        playerOdds.desarmes.over_1_5!, 
                        jogador.id, 
                        jogador.jogador
                      )
                    )}

                    {renderMarketButton(
                      'Defesas +2.5',
                      playerOdds.defesas.over_2_5,
                      () => adicionarSelecao(
                        'MERCADO_JOGADOR', 
                        `DEFESAS_MAIS_2.5_${jogador.id}`, 
                        playerOdds.defesas.over_2_5!, 
                        jogador.id, 
                        jogador.jogador
                      )
                    )}
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

      <ConflictDialog
        isOpen={conflictDialog.isOpen}
        conflict={conflictDialog.conflict}
        onResolve={handleConflictResolution}
      />
    </div>
  );
};

export default MercadosApostaNew;
