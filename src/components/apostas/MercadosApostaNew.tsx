
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { calculateOdds } from "@/utils/oddsCalculator";
import { generateTeams } from "@/utils/teamFormation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import BilheteAposta from "./BilheteAposta";
import SelecaoPartida from "./SelecaoPartida";
import HistoricoApostas from "./HistoricoApostas";
import { Trophy, Users, AlertTriangle } from "lucide-react";
import { Selecao } from '@/types/apostas';
import { toast } from "sonner";

interface MercadosApostaNewProps {
  jogadores: Tables<"players">[];
}

const MercadosApostaNew: React.FC<MercadosApostaNewProps> = ({ jogadores }) => {
  const { profile } = useAuth();
  const [selecoes, setSelecoes] = useState<Selecao[]>([]);
  const [odds, setOdds] = useState<any>(null);
  const [escalacoes, setEscalacoes] = useState<any>(null);
  const [partidas, setPartidas] = useState<Tables<"partidas">[]>([]);
  const [partidaSelecionada, setPartidaSelecionada] = useState<Tables<"partidas"> | null>(null);
  const [showHistorico, setShowHistorico] = useState(false);
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPartidas();
  }, []);

  useEffect(() => {
    if (partidaSelecionada && jogadores.length > 0) {
      // Gerar escalações
      const teams = generateTeams(jogadores);
      setEscalacoes(teams);

      // Calcular odds baseadas nas escalações
      const calculatedOdds = calculateOdds(teams.timeA.jogadores, teams.timeB.jogadores, jogadores);
      setOdds(calculatedOdds);
    } else {
      setEscalacoes(null);
      setOdds(null);
    }
  }, [partidaSelecionada, jogadores]);

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
    }
  };

  const verificarApostasConflitantes = (novaSelecao: Selecao): boolean => {
    // Verificar se há conflito com resultado da partida
    if (novaSelecao.categoria === 'RESULTADO_PARTIDA') {
      const conflito = selecoes.find(s => 
        s.categoria === 'RESULTADO_PARTIDA' && 
        s.partida_id === novaSelecao.partida_id &&
        s.detalhe !== novaSelecao.detalhe
      );
      
      if (conflito) {
        toast.error(`Conflito detectado: Não é possível apostar em "${novaSelecao.descricao}" e "${conflito.descricao}" ao mesmo tempo!`);
        return true;
      }
    }

    // Verificar outros tipos de conflito (mesmo mercado, mesmo jogador)
    const conflito = selecoes.find(s => 
      s.categoria === novaSelecao.categoria &&
      s.detalhe.split('_')[0] === novaSelecao.detalhe.split('_')[0] &&
      s.jogador_id === novaSelecao.jogador_id &&
      s.partida_id === novaSelecao.partida_id
    );

    if (conflito) {
      toast.error('Já existe uma aposta similar para este mercado!');
      return true;
    }

    return false;
  };

  const adicionarSelecao = (categoria: string, detalhe: string, odd: number, descricao: string, jogadorAlvo?: Tables<"players">) => {
    if (!partidaSelecionada) return;
    
    // Verificar se usuário não está apostando em si mesmo
    if (jogadorAlvo && profile?.user_id) {
      const jogadorDoUsuario = jogadores.find(j => j.user_id === profile.user_id);
      if (jogadorDoUsuario && jogadorAlvo.id === jogadorDoUsuario.id) {
        toast.error('Você não pode apostar em si mesmo!');
        return;
      }
    }

    const novaSelecao: Selecao = {
      id: crypto.randomUUID(),
      partida_id: partidaSelecionada.partida_id,
      categoria,
      detalhe,
      descricao,
      odd,
      jogador_id: jogadorAlvo?.id || null
    };

    // Verificar conflitos
    if (verificarApostasConflitantes(novaSelecao)) {
      return;
    }

    // Adicionar ou substituir seleção
    const conflito = selecoes.find(s => 
      s.categoria === categoria && 
      s.detalhe.split('_')[0] === detalhe.split('_')[0] &&
      s.jogador_id === novaSelecao.jogador_id
    );

    if (conflito) {
      setSelecoes(prev => prev.map(s => 
        s.id === conflito.id ? novaSelecao : s
      ));
      toast.info('Seleção atualizada no bilhete!');
    } else {
      setSelecoes(prev => [...prev, novaSelecao]);
      toast.success('Seleção adicionada ao bilhete!');
    }
  };

  const removerSelecao = (id: string) => {
    setSelecoes(prev => prev.filter(s => s.id !== id));
  };

  const limparBilhete = () => {
    setSelecoes([]);
  };

  const togglePlayerExpanded = (playerId: string) => {
    setExpandedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  if (showHistorico) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Histórico de Apostas</h2>
          <Button onClick={() => setShowHistorico(false)} variant="outline">
            Voltar às Apostas
          </Button>
        </div>
        <HistoricoApostas />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sistema de Apostas</h2>
        <Button onClick={() => setShowHistorico(true)} variant="outline">
          Ver Histórico
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mercados de Apostas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Seleção de Partida */}
          <SelecaoPartida 
            partidas={partidas}
            partidaSelecionada={partidaSelecionada}
            onPartidaChange={setPartidaSelecionada}
          />

          {partidaSelecionada && odds && escalacoes && (
            <>
              {/* Info da Partida */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    {partidaSelecionada.time_a_nome} vs {partidaSelecionada.time_b_nome}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {new Date(partidaSelecionada.data_partida).toLocaleString('pt-BR')}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <h4 className="font-semibold">{escalacoes.timeA.nome}</h4>
                      <p className="text-sm text-gray-600">Formação: {escalacoes.timeA.formacao}</p>
                      <p className="text-lg font-bold text-green-600">
                        Nota: {escalacoes.timeA.notaTotal.toFixed(1)}
                      </p>
                    </div>
                    <div className="text-center">
                      <h4 className="font-semibold">{escalacoes.timeB.nome}</h4>
                      <p className="text-sm text-gray-600">Formação: {escalacoes.timeB.formacao}</p>
                      <p className="text-lg font-bold text-blue-600">
                        Nota: {escalacoes.timeB.notaTotal.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resultado da Partida */}
              <Card>
                <CardHeader>
                  <CardTitle>Resultado da Partida</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      className="flex flex-col p-4 h-auto"
                      onClick={() => adicionarSelecao(
                        'RESULTADO_PARTIDA',
                        'VITORIA_A',
                        odds.resultado.timeA,
                        `${partidaSelecionada.time_a_nome} para Vencer`
                      )}
                    >
                      <span className="text-sm">{partidaSelecionada.time_a_nome}</span>
                      <span className="text-lg font-bold">{odds.resultado.timeA.toFixed(2)}</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="flex flex-col p-4 h-auto"
                      onClick={() => adicionarSelecao(
                        'RESULTADO_PARTIDA',
                        'EMPATE',
                        odds.resultado.empate,
                        'Empate'
                      )}
                    >
                      <span className="text-sm">Empate</span>
                      <span className="text-lg font-bold">{odds.resultado.empate.toFixed(2)}</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="flex flex-col p-4 h-auto"
                      onClick={() => adicionarSelecao(
                        'RESULTADO_PARTIDA',
                        'VITORIA_B',
                        odds.resultado.timeB,
                        `${partidaSelecionada.time_b_nome} para Vencer`
                      )}
                    >
                      <span className="text-sm">{partidaSelecionada.time_b_nome}</span>
                      <span className="text-lg font-bold">{odds.resultado.timeB.toFixed(2)}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Mercados de Jogadores */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Mercados de Jogadores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {odds.jogadores.map((jogadorOdds: any) => {
                      const jogador = jogadores.find(j => j.id === jogadorOdds.id);
                      if (!jogador) return null;

                      const isOwnPlayer = profile?.user_id && jogador.user_id === profile.user_id;
                      const isExpanded = expandedPlayers.has(jogador.id);

                      return (
                        <Collapsible key={jogador.id} open={isExpanded} onOpenChange={() => togglePlayerExpanded(jogador.id)}>
                          <div className={`p-4 border rounded-lg ${isOwnPlayer ? 'bg-red-50 border-red-200' : ''}`}>
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center justify-between mb-3 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{jogador.jogador}</h4>
                                  {isOwnPlayer && <Badge variant="destructive">Você</Badge>}
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                                <Badge variant="outline">
                                  Nota: {jogador.nota.toFixed(1)}
                                </Badge>
                              </div>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <div className="space-y-4">
                                {/* Seção de Gols */}
                                <div>
                                  <h5 className="font-medium text-sm mb-2 text-blue-600">Gols</h5>
                                  <div className="grid grid-cols-3 gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={isOwnPlayer}
                                      onClick={() => adicionarSelecao(
                                        'MERCADO_JOGADOR',
                                        `GOLS_MAIS_0.5_${jogador.id}`,
                                        jogadorOdds.gols_0_5,
                                        `${jogador.jogador} +0.5 Gols`,
                                        jogador
                                      )}
                                    >
                                      <div className="text-center">
                                        <div className="text-xs">+0.5</div>
                                        <div className="font-bold">{jogadorOdds.gols_0_5.toFixed(2)}</div>
                                      </div>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={isOwnPlayer}
                                      onClick={() => adicionarSelecao(
                                        'MERCADO_JOGADOR',
                                        `GOLS_MAIS_1.5_${jogador.id}`,
                                        jogadorOdds.gols_1_5,
                                        `${jogador.jogador} +1.5 Gols`,
                                        jogador
                                      )}
                                    >
                                      <div className="text-center">
                                        <div className="text-xs">+1.5</div>
                                        <div className="font-bold">{jogadorOdds.gols_1_5.toFixed(2)}</div>
                                      </div>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={isOwnPlayer}
                                      onClick={() => adicionarSelecao(
                                        'MERCADO_JOGADOR',
                                        `GOLS_MAIS_2.5_${jogador.id}`,
                                        jogadorOdds.gols_2_5,
                                        `${jogador.jogador} +2.5 Gols`,
                                        jogador
                                      )}
                                    >
                                      <div className="text-center">
                                        <div className="text-xs">+2.5</div>
                                        <div className="font-bold">{jogadorOdds.gols_2_5.toFixed(2)}</div>
                                      </div>
                                    </Button>
                                  </div>
                                </div>

                                {/* Seção de Assistências */}
                                <div>
                                  <h5 className="font-medium text-sm mb-2 text-purple-600">Assistências</h5>
                                  <div className="grid grid-cols-3 gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={isOwnPlayer}
                                      onClick={() => adicionarSelecao(
                                        'MERCADO_JOGADOR',
                                        `ASSIST_MAIS_0.5_${jogador.id}`,
                                        jogadorOdds.assistencias_0_5,
                                        `${jogador.jogador} +0.5 Assist`,
                                        jogador
                                      )}
                                    >
                                      <div className="text-center">
                                        <div className="text-xs">+0.5</div>
                                        <div className="font-bold">{jogadorOdds.assistencias_0_5.toFixed(2)}</div>
                                      </div>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={isOwnPlayer}
                                      onClick={() => adicionarSelecao(
                                        'MERCADO_JOGADOR',
                                        `ASSIST_MAIS_1.5_${jogador.id}`,
                                        jogadorOdds.assistencias_1_5,
                                        `${jogador.jogador} +1.5 Assist`,
                                        jogador
                                      )}
                                    >
                                      <div className="text-center">
                                        <div className="text-xs">+1.5</div>
                                        <div className="font-bold">{jogadorOdds.assistencias_1_5.toFixed(2)}</div>
                                      </div>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={isOwnPlayer}
                                      onClick={() => adicionarSelecao(
                                        'MERCADO_JOGADOR',
                                        `ASSIST_MAIS_2.5_${jogador.id}`,
                                        jogadorOdds.assistencias_2_5,
                                        `${jogador.jogador} +2.5 Assist`,
                                        jogador
                                      )}
                                    >
                                      <div className="text-center">
                                        <div className="text-xs">+2.5</div>
                                        <div className="font-bold">{jogadorOdds.assistencias_2_5.toFixed(2)}</div>
                                      </div>
                                    </Button>
                                  </div>
                                </div>

                                {/* Seção de Desarmes - apenas para jogadores com desarmes */}
                                {jogador.desarmes > 0 && (
                                  <div>
                                    <h5 className="font-medium text-sm mb-2 text-orange-600">Desarmes</h5>
                                    <div className="grid grid-cols-3 gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isOwnPlayer}
                                        onClick={() => adicionarSelecao(
                                          'MERCADO_JOGADOR',
                                          `DESARMES_MAIS_1.5_${jogador.id}`,
                                          jogadorOdds.desarmes_1_5,
                                          `${jogador.jogador} +1.5 Desarmes`,
                                          jogador
                                        )}
                                      >
                                        <div className="text-center">
                                          <div className="text-xs">+1.5</div>
                                          <div className="font-bold">{jogadorOdds.desarmes_1_5.toFixed(2)}</div>
                                        </div>
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isOwnPlayer}
                                        onClick={() => adicionarSelecao(
                                          'MERCADO_JOGADOR',
                                          `DESARMES_MAIS_2.5_${jogador.id}`,
                                          jogadorOdds.desarmes_2_5,
                                          `${jogador.jogador} +2.5 Desarmes`,
                                          jogador
                                        )}
                                      >
                                        <div className="text-center">
                                          <div className="text-xs">+2.5</div>
                                          <div className="font-bold">{jogadorOdds.desarmes_2_5.toFixed(2)}</div>
                                        </div>
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isOwnPlayer}
                                        onClick={() => adicionarSelecao(
                                          'MERCADO_JOGADOR',
                                          `DESARMES_MAIS_3.5_${jogador.id}`,
                                          jogadorOdds.desarmes_3_5,
                                          `${jogador.jogador} +3.5 Desarmes`,
                                          jogador
                                        )}
                                      >
                                        <div className="text-center">
                                          <div className="text-xs">+3.5</div>
                                          <div className="font-bold">{jogadorOdds.desarmes_3_5.toFixed(2)}</div>
                                        </div>
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {/* Seção de Defesas - apenas para goleiros */}
                                {jogador.defesas > 0 && (
                                  <div>
                                    <h5 className="font-medium text-sm mb-2 text-green-600">Defesas</h5>
                                    <div className="grid grid-cols-3 gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isOwnPlayer}
                                        onClick={() => adicionarSelecao(
                                          'MERCADO_JOGADOR',
                                          `DEFESAS_MAIS_2.5_${jogador.id}`,
                                          jogadorOdds.defesas_2_5,
                                          `${jogador.jogador} +2.5 Defesas`,
                                          jogador
                                        )}
                                      >
                                        <div className="text-center">
                                          <div className="text-xs">+2.5</div>
                                          <div className="font-bold">{jogadorOdds.defesas_2_5.toFixed(2)}</div>
                                        </div>
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isOwnPlayer}
                                        onClick={() => adicionarSelecao(
                                          'MERCADO_JOGADOR',
                                          `DEFESAS_MAIS_3.5_${jogador.id}`,
                                          jogadorOdds.defesas_3_5,
                                          `${jogador.jogador} +3.5 Defesas`,
                                          jogador
                                        )}
                                      >
                                        <div className="text-center">
                                          <div className="text-xs">+3.5</div>
                                          <div className="font-bold">{jogadorOdds.defesas_3_5.toFixed(2)}</div>
                                        </div>
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isOwnPlayer}
                                        onClick={() => adicionarSelecao(
                                          'MERCADO_JOGADOR',
                                          `DEFESAS_MAIS_4.5_${jogador.id}`,
                                          jogadorOdds.defesas_4_5,
                                          `${jogador.jogador} +4.5 Defesas`,
                                          jogador
                                        )}
                                      >
                                        <div className="text-center">
                                          <div className="text-xs">+4.5</div>
                                          <div className="font-bold">{jogadorOdds.defesas_4_5.toFixed(2)}</div>
                                        </div>
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Bilhete de Aposta */}
        <div className="lg:col-span-1">
          <BilheteAposta 
            selecoes={selecoes}
            onRemoverSelecao={removerSelecao}
            onLimparBilhete={limparBilhete}
          />
        </div>
      </div>
    </div>
  );
};

export default MercadosApostaNew;
