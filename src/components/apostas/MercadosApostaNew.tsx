import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import SelecaoPartida from './SelecaoPartida';
import BilheteAposta from './BilheteAposta';
import HistoricoApostas from './HistoricoApostas';
import ConflictDialog from './ConflictDialog';
import { TrendingUp, Lock, ChevronDown, ChevronUp } from "lucide-react";
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
  const [expandedMarkets, setExpandedMarkets] = useState<{ [key: string]: boolean }>({
    gols: true,
    assistencias: false,
    desarmes: false,
    defesas: false
  });
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

    const conflictResult = validateBetConflicts(novaSelecao, selecoes);

    if (conflictResult.hasConflict) {
      setConflictDialog({
        isOpen: true,
        conflict: conflictResult,
        pendingSelection: novaSelecao
      });
      return;
    }

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
      const selecoesAtualizadas = selecoes.filter(s => s.id !== conflictDialog.conflict.existingSelection?.id);
      
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

  const toggleMarket = (market: string) => {
    setExpandedMarkets(prev => ({
      ...prev,
      [market]: !prev[market]
    }));
  };

  const isSelectionInBilhete = (jogadorId: string, detalhe: string): boolean => {
    return selecoes.some(s => 
      s.jogador_id === jogadorId && 
      s.detalhe.includes(detalhe.split('_')[0]) && 
      s.detalhe.includes(detalhe.split('_')[1])
    );
  };

  const renderMarketButton = (
    jogadorId: string,
    jogadorNome: string,
    label: string,
    detalhe: string,
    odd: number | null,
    isBlocked: boolean = false
  ) => {
    const isSelected = isSelectionInBilhete(jogadorId, detalhe);
    
    if (odd === null || isBlocked) {
      return (
        <div className="p-2 border rounded bg-gray-100 text-center text-xs opacity-50 cursor-not-allowed">
          <div className="flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
          </div>
          <div className="text-gray-500">∞</div>
        </div>
      );
    }

    return (
      <button
        onClick={() => adicionarSelecao('MERCADO_JOGADOR', detalhe, odd, jogadorId, jogadorNome)}
        className={`p-2 border rounded text-center text-xs transition-colors ${
          isSelected 
            ? 'bg-green-100 border-green-500 text-green-800' 
            : 'hover:bg-gray-50 border-gray-300'
        }`}
      >
        <div className="font-medium">{label}</div>
        <div className={`font-bold ${isSelected ? 'text-green-700' : 'text-blue-600'}`}>
          {odd.toFixed(2)}
        </div>
      </button>
    );
  };

  const renderMarketSection = (
    title: string,
    marketKey: string,
    getPlayerOdds: (playerOdds: PlayerMarketOdds) => any,
    markets: Array<{ key: string; label: string; detailPrefix: string }>
  ) => {
    if (!partidaSelecionada) return null;

    const jogadoresEscalados = [
      ...(partidaSelecionada.time_a_jogadores || []),
      ...(partidaSelecionada.time_b_jogadores || [])
    ];

    const jogadoresDisponiveis = jogadores.filter(j => 
      jogadoresEscalados.includes(j.id) && j.id !== jogadorVinculado?.id
    );

    if (jogadoresDisponiveis.length === 0) return null;

    return (
      <Card key={marketKey}>
        <Collapsible 
          open={expandedMarkets[marketKey]} 
          onOpenChange={() => toggleMarket(marketKey)}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <span>{title}</span>
                {expandedMarkets[marketKey] ? 
                  <ChevronUp className="w-5 h-5" /> : 
                  <ChevronDown className="w-5 h-5" />
                }
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left p-2 font-medium text-sm">Jogador</th>
                      {markets.map(market => (
                        <th key={market.key} className="text-center p-2 font-medium text-sm min-w-[80px]">
                          {market.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jogadoresDisponiveis.map((jogador) => {
                      const playerOdds = playersOdds.find(p => p.id === jogador.id);
                      if (!playerOdds) return null;
                      
                      const marketOdds = getPlayerOdds(playerOdds);
                      
                      return (
                        <tr key={jogador.id} className="border-t">
                          <td className="p-2 font-medium text-sm">
                            {jogador.jogador}
                          </td>
                          {markets.map(market => (
                            <td key={market.key} className="p-2 text-center">
                              {renderMarketButton(
                                jogador.id,
                                jogador.jogador,
                                market.label,
                                `${market.detailPrefix}_${jogador.id}`,
                                marketOdds[market.key],
                                jogadorVinculado?.id === jogador.id
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

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
            <div className="space-y-4">
              {/* Mercado de Gols */}
              {renderMarketSection(
                "Mercado de Gols",
                "gols",
                (playerOdds) => playerOdds.gols,
                [
                  { key: 'under_3_5', label: '-3.5', detailPrefix: 'GOLS_MENOS_3.5' },
                  { key: 'under_2_5', label: '-2.5', detailPrefix: 'GOLS_MENOS_2.5' },
                  { key: 'under_1_5', label: '-1.5', detailPrefix: 'GOLS_MENOS_1.5' },
                  { key: 'under_0_5', label: '-0.5', detailPrefix: 'GOLS_MENOS_0.5' },
                  { key: 'over_0_5', label: '+0.5', detailPrefix: 'GOLS_MAIS_0.5' },
                  { key: 'over_1_5', label: '+1.5', detailPrefix: 'GOLS_MAIS_1.5' },
                  { key: 'over_2_5', label: '+2.5', detailPrefix: 'GOLS_MAIS_2.5' },
                  { key: 'over_3_5', label: '+3.5', detailPrefix: 'GOLS_MAIS_3.5' }
                ]
              )}

              {/* Mercado de Assistências */}
              {renderMarketSection(
                "Mercado de Assistências",
                "assistencias",
                (playerOdds) => playerOdds.assistencias,
                [
                  { key: 'under_3_5', label: '-3.5', detailPrefix: 'ASSIST_MENOS_3.5' },
                  { key: 'under_2_5', label: '-2.5', detailPrefix: 'ASSIST_MENOS_2.5' },
                  { key: 'under_1_5', label: '-1.5', detailPrefix: 'ASSIST_MENOS_1.5' },
                  { key: 'under_0_5', label: '-0.5', detailPrefix: 'ASSIST_MENOS_0.5' },
                  { key: 'over_0_5', label: '+0.5', detailPrefix: 'ASSIST_MAIS_0.5' },
                  { key: 'over_1_5', label: '+1.5', detailPrefix: 'ASSIST_MAIS_1.5' },
                  { key: 'over_2_5', label: '+2.5', detailPrefix: 'ASSIST_MAIS_2.5' },
                  { key: 'over_3_5', label: '+3.5', detailPrefix: 'ASSIST_MAIS_3.5' }
                ]
              )}

              {/* Mercado de Desarmes */}
              {renderMarketSection(
                "Mercado de Desarmes",
                "desarmes",
                (playerOdds) => playerOdds.desarmes,
                [
                  { key: 'under_3_5', label: '-3.5', detailPrefix: 'DESARMES_MENOS_3.5' },
                  { key: 'under_2_5', label: '-2.5', detailPrefix: 'DESARMES_MENOS_2.5' },
                  { key: 'under_1_5', label: '-1.5', detailPrefix: 'DESARMES_MENOS_1.5' },
                  { key: 'under_0_5', label: '-0.5', detailPrefix: 'DESARMES_MENOS_0.5' },
                  { key: 'over_0_5', label: '+0.5', detailPrefix: 'DESARMES_MAIS_0.5' },
                  { key: 'over_1_5', label: '+1.5', detailPrefix: 'DESARMES_MAIS_1.5' },
                  { key: 'over_2_5', label: '+2.5', detailPrefix: 'DESARMES_MAIS_2.5' },
                  { key: 'over_3_5', label: '+3.5', detailPrefix: 'DESARMES_MAIS_3.5' }
                ]
              )}

              {/* Mercado de Defesas */}
              {renderMarketSection(
                "Mercado de Defesas",
                "defesas",
                (playerOdds) => playerOdds.defesas,
                [
                  { key: 'under_3_5', label: '-3.5', detailPrefix: 'DEFESAS_MENOS_3.5' },
                  { key: 'under_2_5', label: '-2.5', detailPrefix: 'DEFESAS_MENOS_2.5' },
                  { key: 'under_1_5', label: '-1.5', detailPrefix: 'DEFESAS_MENOS_1.5' },
                  { key: 'under_0_5', label: '-0.5', detailPrefix: 'DEFESAS_MENOS_0.5' },
                  { key: 'over_0_5', label: '+0.5', detailPrefix: 'DEFESAS_MAIS_0.5' },
                  { key: 'over_1_5', label: '+1.5', detailPrefix: 'DEFESAS_MAIS_1.5' },
                  { key: 'over_2_5', label: '+2.5', detailPrefix: 'DEFESAS_MAIS_2.5' },
                  { key: 'over_3_5', label: '+3.5', detailPrefix: 'DEFESAS_MAIS_3.5' }
                ]
              )}
            </div>
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