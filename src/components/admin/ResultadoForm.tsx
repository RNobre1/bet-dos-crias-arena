import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface JogadorData {
  id: string;
  jogador: string;
}

const ResultadoForm: React.FC = () => {
  const { profile } = useAuth();
  const [partidas, setPartidas] = useState<Tables<"partidas">[]>([]);
  const [partidaSelecionada, setPartidaSelecionada] = useState<Tables<"partidas"> | null>(null);
  const [jogadores, setJogadores] = useState<JogadorData[]>([]);
  const [carregandoJogadores, setCarregandoJogadores] = useState(false);
  const [resultados, setResultados] = useState<{ [key: string]: { gols: number; assistencias: number; desarmes: number; defesas: number; faltas: number } }>({});
  const [placar, setPlacar] = useState({ timeA: 0, timeB: 0 });
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    if (profile?.role === 'ADMIN') {
      loadPartidas();
    }
  }, [profile]);

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

  const loadJogadores = async (jogadorIds: string[]) => {
    if (!jogadorIds.length) return;
    
    setCarregandoJogadores(true);
    try {
      const { data, error } = await supabase
        .from('players')
        .select('id, jogador')
        .in('id', jogadorIds);

      if (error) throw error;
      
      setJogadores(data || []);
      console.log('Jogadores carregados:', data);
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
      toast.error('Erro ao carregar dados dos jogadores');
    } finally {
      setCarregandoJogadores(false);
    }
  };

  const processarResultado = async () => {
    if (!partidaSelecionada) {
      toast.error('Selecione uma partida');
      return;
    }

    setProcessando(true);
    console.log('=== INICIANDO PROCESSAMENTO DO RESULTADO ===');
    console.log('Partida ID:', partidaSelecionada.partida_id);
    console.log('Placar:', `${placar.timeA}-${placar.timeB}`);
    console.log('Status atual da partida:', partidaSelecionada.status);

    try {
      // Obter jogadores escalados
      const jogadoresEscalados = [
        ...(partidaSelecionada.time_a_jogadores || []),
        ...(partidaSelecionada.time_b_jogadores || [])
      ];

      console.log('Jogadores escalados:', jogadoresEscalados);
      console.log('Estado completo de resultados antes do processamento:', resultados);

      // Atualizar estatísticas dos jogadores
      for (const jogadorId of jogadoresEscalados) {
        // Garantir que todas as estatísticas tenham valores numéricos válidos
        const statsRaw = resultados[jogadorId] || {};
        const stats = {
          gols: Number(statsRaw.gols) || 0,
          assistencias: Number(statsRaw.assistencias) || 0,
          desarmes: Number(statsRaw.desarmes) || 0,
          defesas: Number(statsRaw.defesas) || 0,
          faltas: Number(statsRaw.faltas) || 0
        };
        
        console.log(`Estatísticas processadas para ${jogadorId}:`, stats);

        // Validar se todos os valores são números válidos
        const isValidStats = Object.values(stats).every(value => 
          typeof value === 'number' && !isNaN(value) && isFinite(value)
        );

        if (!isValidStats) {
          console.error(`Estatísticas inválidas para jogador ${jogadorId}:`, stats);
          throw new Error(`Estatísticas inválidas para jogador ${jogadorId}`);
        }

        // Primeiro, buscar os valores atuais do jogador
        const { data: jogadorAtual, error: fetchError } = await supabase
          .from('players')
          .select('jogos, gols, assistencias, desarmes, defesas, faltas')
          .eq('id', jogadorId)
          .single();

        if (fetchError) {
          console.error(`Erro ao buscar jogador ${jogadorId}:`, fetchError);
          throw fetchError;
        }

        console.log(`Valores atuais do jogador ${jogadorId}:`, jogadorAtual);

        // Calcular novos valores garantindo que todos sejam números válidos
        const novosValores = {
          jogos: Number(jogadorAtual?.jogos || 0) + 1,
          gols: Number(jogadorAtual?.gols || 0) + stats.gols,
          assistencias: Number(jogadorAtual?.assistencias || 0) + stats.assistencias,
          desarmes: Number(jogadorAtual?.desarmes || 0) + stats.desarmes,
          defesas: Number(jogadorAtual?.defesas || 0) + stats.defesas,
          faltas: Number(jogadorAtual?.faltas || 0) + stats.faltas,
          updated_at: new Date().toISOString()
        };

        console.log(`Novos valores calculados para ${jogadorId}:`, novosValores);

        // Validar novos valores antes da atualização
        const isValidUpdate = Object.entries(novosValores).every(([key, value]) => {
          if (key === 'updated_at') return true;
          return typeof value === 'number' && !isNaN(value) && isFinite(value);
        });

        if (!isValidUpdate) {
          console.error(`Valores de atualização inválidos para jogador ${jogadorId}:`, novosValores);
          throw new Error(`Valores de atualização inválidos para jogador ${jogadorId}`);
        }

        const { error: updateError } = await supabase
          .from('players')
          .update(novosValores)
          .eq('id', jogadorId);

        if (updateError) {
          console.error(`Erro ao atualizar jogador ${jogadorId}:`, updateError);
          throw updateError;
        }

        console.log(`Jogador ${jogadorId} atualizado com sucesso`);
      }

      // Atualizar partida como finalizada
      const { error: partidaError } = await supabase
        .from('partidas')
        .update({
          status: 'FINALIZADA',
          resultado_final: `${placar.timeA}-${placar.timeB}`
        })
        .eq('partida_id', partidaSelecionada.partida_id);

      if (partidaError) throw partidaError;
      console.log('Partida marcada como finalizada');

      // Processar apostas
      await processarApostas(partidaSelecionada.partida_id, jogadoresEscalados);

      toast.success('Resultado processado com sucesso!');
      setPartidaSelecionada(null);
      setJogadores([]);
      setResultados({});
      setPlacar({ timeA: 0, timeB: 0 });
      loadPartidas();

    } catch (error) {
      console.error('Erro ao processar resultado:', error);
      toast.error('Erro ao processar resultado');
    } finally {
      setProcessando(false);
    }
  };

  const processarApostas = async (partidaId: number, jogadoresEscalados: string[]) => {
    console.log('=== INICIANDO PROCESSAMENTO DE APOSTAS ===');
    console.log('Buscando seleções para partida_id:', partidaId);

    try {
      // Buscar seleções pendentes para esta partida
      const { data: selecoes, error: selecoesError } = await supabase
        .from('selecoes')
        .select('*')
        .eq('partida_id', partidaId)
        .eq('status_selecao', 'PENDENTE');

      if (selecoesError) {
        console.error('Erro ao buscar seleções:', selecoesError);
        throw selecoesError;
      }

      console.log('Seleções encontradas:', selecoes?.length || 0);
      console.log('Detalhes das seleções:', selecoes);

      if (!selecoes || selecoes.length === 0) {
        console.log('Nenhuma seleção pendente encontrada para esta partida');
        return;
      }

      const selecoesParaAtualizar: Array<{
        selecao_id: number;
        status: 'GANHA' | 'PERDIDA';
      }> = [];

      const bilhetesParaAtualizar = new Map<number, {
        bilhete_id: number;
        todas_ganhas: boolean;
        alguma_perdida: boolean;
      }>();

      // Processar cada seleção
      for (const selecao of selecoes) {
        console.log(`Processando seleção ${selecao.selecao_id}:`, {
          categoria: selecao.categoria_aposta,
          detalhe: selecao.detalhe_aposta,
          jogador_alvo: selecao.jogador_alvo_id
        });

        let statusSelecao: 'GANHA' | 'PERDIDA' = 'PERDIDA';

        if (selecao.categoria_aposta === 'RESULTADO_PARTIDA') {
          // Processar apostas de resultado
          if (selecao.detalhe_aposta === 'VITORIA_A' && placar.timeA > placar.timeB) {
            statusSelecao = 'GANHA';
          } else if (selecao.detalhe_aposta === 'VITORIA_B' && placar.timeB > placar.timeA) {
            statusSelecao = 'GANHA';
          } else if (selecao.detalhe_aposta === 'EMPATE' && placar.timeA === placar.timeB) {
            statusSelecao = 'GANHA';
          }
        } else if (selecao.categoria_aposta === 'MERCADO_JOGADOR' && selecao.jogador_alvo_id) {
          // Processar apostas de jogador
          const stats = resultados[selecao.jogador_alvo_id];
          if (stats) {
            const detalhe = selecao.detalhe_aposta;
            
            if (detalhe.startsWith('GOLS_MAIS_')) {
              const limite = parseFloat(detalhe.replace('GOLS_MAIS_', ''));
              if (stats.gols > limite) {
                statusSelecao = 'GANHA';
              }
            } else if (detalhe.startsWith('ASSIST_MAIS_')) {
              const limite = parseFloat(detalhe.replace('ASSIST_MAIS_', ''));
              if (stats.assistencias > limite) {
                statusSelecao = 'GANHA';
              }
            } else if (detalhe.startsWith('DESARMES_MAIS_')) {
              const limite = parseFloat(detalhe.replace('DESARMES_MAIS_', ''));
              if (stats.desarmes > limite) {
                statusSelecao = 'GANHA';
              }
            } else if (detalhe.startsWith('DEFESAS_MAIS_')) {
              const limite = parseFloat(detalhe.replace('DEFESAS_MAIS_', ''));
              if (stats.defesas > limite) {
                statusSelecao = 'GANHA';
              }
            }
          }
        }

        console.log(`Resultado da seleção ${selecao.selecao_id}: ${statusSelecao}`);

        selecoesParaAtualizar.push({
          selecao_id: selecao.selecao_id,
          status: statusSelecao
        });

        // Agrupar por bilhete para processar status do bilhete
        const bilheteId = selecao.bilhete_id;
        if (!bilhetesParaAtualizar.has(bilheteId)) {
          bilhetesParaAtualizar.set(bilheteId, {
            bilhete_id: bilheteId,
            todas_ganhas: true,
            alguma_perdida: false
          });
        }

        const bilheteStatus = bilhetesParaAtualizar.get(bilheteId)!;
        if (statusSelecao === 'PERDIDA') {
          bilheteStatus.todas_ganhas = false;
          bilheteStatus.alguma_perdida = true;
        }
      }

      // Atualizar status das seleções
      for (const selecao of selecoesParaAtualizar) {
        const { error: updateError } = await supabase
          .from('selecoes')
          .update({ status_selecao: selecao.status })
          .eq('selecao_id', selecao.selecao_id);

        if (updateError) {
          console.error(`Erro ao atualizar seleção ${selecao.selecao_id}:`, updateError);
        } else {
          console.log(`Seleção ${selecao.selecao_id} atualizada para ${selecao.status}`);
        }
      }

      // Atualizar status dos bilhetes
      for (const [bilheteId, bilheteInfo] of bilhetesParaAtualizar) {
        const statusBilhete = bilheteInfo.todas_ganhas ? 'GANHO' : 'PERDIDO';
        
        const { error: updateError } = await supabase
          .from('bilhetes')
          .update({ status_bilhete: statusBilhete })
          .eq('bilhete_id', bilheteId);

        if (updateError) {
          console.error(`Erro ao atualizar bilhete ${bilheteId}:`, updateError);
        } else {
          console.log(`Bilhete ${bilheteId} atualizado para ${statusBilhete}`);
        }
      }

      console.log('=== PROCESSAMENTO DE APOSTAS CONCLUÍDO ===');

    } catch (error) {
      console.error('Erro no processamento de apostas:', error);
      throw error;
    }
  };

  const handleResultadoChange = (jogadorId: string, campo: string, valor: number) => {
    console.log(`Alterando ${campo} para jogador ${jogadorId}: ${valor}`);
    
    setResultados(prev => {
      const currentStats = prev[jogadorId] || {
        gols: 0,
        assistencias: 0,
        desarmes: 0,
        defesas: 0,
        faltas: 0
      };

      const newStats = {
        ...currentStats,
        [campo]: Number(valor) || 0
      };

      console.log(`Novo estado para jogador ${jogadorId}:`, newStats);

      return {
        ...prev,
        [jogadorId]: newStats
      };
    });
  };

  const handlePartidaChange = async (partidaId: string) => {
    const partida = partidas.find(p => p.partida_id === Number(partidaId));
    setPartidaSelecionada(partida || null);
    
    if (partida) {
      // Limpar estados anteriores
      setJogadores([]);
      setResultados({});
      
      // Buscar dados dos jogadores escalados
      const jogadoresEscalados = [
        ...(partida.time_a_jogadores || []),
        ...(partida.time_b_jogadores || [])
      ];
      
      if (jogadoresEscalados.length > 0) {
        await loadJogadores(jogadoresEscalados);
      }
    }
  };

  const getNomeJogador = (jogadorId: string): string => {
    const jogador = jogadores.find(j => j.id === jogadorId);
    return jogador ? jogador.jogador : `Jogador ${jogadorId.substring(0, 8)}...`;
  };

  if (profile?.role !== 'ADMIN') {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-600">Acesso restrito para administradores.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Processar Resultado da Partida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="partida">Selecionar Partida</Label>
            <select
              id="partida"
              className="w-full mt-1 p-2 border rounded-md"
              value={partidaSelecionada?.partida_id || ''}
              onChange={(e) => handlePartidaChange(e.target.value)}
            >
              <option value="">Selecione uma partida</option>
              {partidas.map(partida => (
                <option key={partida.partida_id} value={partida.partida_id}>
                  {partida.time_a_nome} vs {partida.time_b_nome} - {new Date(partida.data_partida).toLocaleString('pt-BR')}
                </option>
              ))}
            </select>
          </div>

          {partidaSelecionada && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="placarA">Placar {partidaSelecionada.time_a_nome}</Label>
                  <Input
                    id="placarA"
                    type="number"
                    min="0"
                    value={placar.timeA}
                    onChange={(e) => setPlacar(prev => ({ ...prev, timeA: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="placarB">Placar {partidaSelecionada.time_b_nome}</Label>
                  <Input
                    id="placarB"
                    type="number"
                    min="0"
                    value={placar.timeB}
                    onChange={(e) => setPlacar(prev => ({ ...prev, timeB: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Estatísticas dos Jogadores</h3>
                {carregandoJogadores ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600">Carregando dados dos jogadores...</p>
                  </div>
                ) : (
                  [...(partidaSelecionada.time_a_jogadores || []), ...(partidaSelecionada.time_b_jogadores || [])].map(jogadorId => (
                    <div key={jogadorId} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2 text-blue-600">
                        {getNomeJogador(jogadorId)}
                      </h4>
                      <div className="grid grid-cols-5 gap-2">
                        <div>
                          <Label>Gols</Label>
                          <Input
                            type="number"
                            min="0"
                            value={resultados[jogadorId]?.gols || 0}
                            onChange={(e) => handleResultadoChange(jogadorId, 'gols', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>Assistências</Label>
                          <Input
                            type="number"
                            min="0"
                            value={resultados[jogadorId]?.assistencias || 0}
                            onChange={(e) => handleResultadoChange(jogadorId, 'assistencias', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>Desarmes</Label>
                          <Input
                            type="number"
                            min="0"
                            value={resultados[jogadorId]?.desarmes || 0}
                            onChange={(e) => handleResultadoChange(jogadorId, 'desarmes', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>Defesas</Label>
                          <Input
                            type="number"
                            min="0"
                            value={resultados[jogadorId]?.defesas || 0}
                            onChange={(e) => handleResultadoChange(jogadorId, 'defesas', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>Faltas</Label>
                          <Input
                            type="number"
                            min="0"
                            value={resultados[jogadorId]?.faltas || 0}
                            onChange={(e) => handleResultadoChange(jogadorId, 'faltas', Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Button 
                onClick={processarResultado} 
                className="w-full"
                disabled={processando || carregandoJogadores}
              >
                {processando ? 'Processando...' : 'Processar Resultado'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultadoForm;
