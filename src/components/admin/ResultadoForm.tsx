
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

interface ResultadoFormProps {
  partida: Tables<"partidas">;
  onResultadoSubmitted: () => void;
}

interface PlayerStats {
  id: string;
  jogador: string;
  gols: number;
  assistencias: number;
  defesas: number;
  desarmes: number;
  faltas: number;
}

const ResultadoForm: React.FC<ResultadoFormProps> = ({ partida, onResultadoSubmitted }) => {
  const [jogadores, setJogadores] = useState<PlayerStats[]>([]);
  const [placarA, setPlacarA] = useState(0);
  const [placarB, setPlacarB] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadJogadores();
  }, []);

  const loadJogadores = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .neq('status', 'Lesionado')
        .order('jogador');

      if (error) throw error;

      setJogadores(data?.map(player => ({
        id: player.id,
        jogador: player.jogador,
        gols: 0,
        assistencias: 0,
        defesas: 0,
        desarmes: 0,
        faltas: 0
      })) || []);
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
      toast.error('Erro ao carregar jogadores');
    }
  };

  const updatePlayerStat = (playerId: string, stat: keyof PlayerStats, value: number) => {
    if (stat === 'id' || stat === 'jogador') return;
    
    setJogadores(prev => prev.map(player => 
      player.id === playerId 
        ? { ...player, [stat]: Math.max(0, value) }
        : player
    ));
  };

  const processarResultado = async () => {
    setLoading(true);
    try {
      console.log('=== INICIANDO PROCESSAMENTO DO RESULTADO ===');
      console.log('Partida ID:', partida.partida_id);
      console.log('Placar:', `${placarA}-${placarB}`);
      
      // Verificar se a partida existe e está no status correto
      const { data: partidaAtual, error: partidaError } = await supabase
        .from('partidas')
        .select('*')
        .eq('partida_id', partida.partida_id)
        .single();

      if (partidaError || !partidaAtual) {
        throw new Error('Partida não encontrada');
      }

      console.log('Status atual da partida:', partidaAtual.status);

      // Obter escalações da partida
      const escalacaoA = partida.time_a_jogadores || [];
      const escalacaoB = partida.time_b_jogadores || [];
      const todosJogadoresEscalados = [...escalacaoA, ...escalacaoB];
      
      console.log('Jogadores escalados:', todosJogadoresEscalados);

      // Atualizar estatísticas dos jogadores
      for (const playerStats of jogadores) {
        const hasStats = playerStats.gols > 0 || playerStats.assistencias > 0 || 
                        playerStats.defesas > 0 || playerStats.desarmes > 0 || playerStats.faltas > 0;
        
        const jogouPartida = todosJogadoresEscalados.includes(playerStats.id);

        if (hasStats || jogouPartida) {
          console.log(`Atualizando estatísticas de ${playerStats.jogador}:`, {
            hasStats,
            jogouPartida,
            stats: playerStats
          });

          const { data: currentPlayer } = await supabase
            .from('players')
            .select('*')
            .eq('id', playerStats.id)
            .single();

          if (currentPlayer) {
            const novoJogos = jogouPartida ? currentPlayer.jogos + 1 : currentPlayer.jogos;
            
            const { error } = await supabase
              .from('players')
              .update({
                gols: currentPlayer.gols + playerStats.gols,
                assistencias: currentPlayer.assistencias + playerStats.assistencias,
                defesas: currentPlayer.defesas + playerStats.defesas,
                desarmes: currentPlayer.desarmes + playerStats.desarmes,
                faltas: currentPlayer.faltas + playerStats.faltas,
                jogos: novoJogos,
                updated_at: new Date().toISOString()
              })
              .eq('id', playerStats.id);

            if (error) {
              console.error(`Erro ao atualizar jogador ${playerStats.jogador}:`, error);
              throw error;
            }
            
            console.log(`Jogador ${playerStats.jogador} atualizado com sucesso`);
          }
        }
      }

      // Atualizar resultado da partida
      const { error: partidaUpdateError } = await supabase
        .from('partidas')
        .update({
          resultado_final: `${placarA}-${placarB}`,
          status: 'FINALIZADA'
        })
        .eq('partida_id', partida.partida_id);

      if (partidaUpdateError) throw partidaUpdateError;

      console.log('Partida marcada como finalizada');

      // Aguardar um pouco para garantir que as atualizações foram processadas
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Processar apostas
      await processarApostas();

      toast.success('Resultado processado com sucesso!');
      onResultadoSubmitted();
    } catch (error) {
      console.error('Erro ao processar resultado:', error);
      toast.error('Erro ao processar resultado');
    } finally {
      setLoading(false);
    }
  };

  const processarApostas = async () => {
    try {
      console.log('=== INICIANDO PROCESSAMENTO DE APOSTAS ===');
      console.log('Buscando seleções para partida_id:', partida.partida_id);
      
      // Buscar todas as seleções pendentes para esta partida com mais detalhes
      const { data: selecoes, error: selecoesError } = await supabase
        .from('selecoes')
        .select(`
          *,
          bilhetes!inner (
            bilhete_id,
            user_id,
            status_bilhete,
            valor_apostado,
            odd_total
          )
        `)
        .eq('partida_id', partida.partida_id)
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

      // Processar cada seleção
      for (const selecao of selecoes) {
        let isGanha = false;

        console.log('=== PROCESSANDO SELEÇÃO ===');
        console.log('Seleção ID:', selecao.selecao_id);
        console.log('Categoria:', selecao.categoria_aposta);
        console.log('Detalhe original:', selecao.detalhe_aposta);
        console.log('Jogador alvo:', selecao.jogador_alvo_id);

        // Verificar resultado baseado no tipo de aposta
        switch (selecao.categoria_aposta) {
          case 'RESULTADO_PARTIDA':
            console.log('Processando aposta de resultado da partida');
            console.log('Placar:', `${placarA}-${placarB}`);
            
            if (selecao.detalhe_aposta === 'VITORIA_A' && placarA > placarB) {
              isGanha = true;
              console.log('Vitória Time A: GANHA');
            } else if (selecao.detalhe_aposta === 'VITORIA_B' && placarB > placarA) {
              isGanha = true;
              console.log('Vitória Time B: GANHA');
            } else if (selecao.detalhe_aposta === 'EMPATE' && placarA === placarB) {
              isGanha = true;
              console.log('Empate: GANHA');
            } else {
              console.log('Resultado da partida: PERDIDA');
            }
            break;
          
          case 'MERCADO_JOGADOR':
            if (selecao.jogador_alvo_id) {
              const playerStats = jogadores.find(p => p.id === selecao.jogador_alvo_id);
              if (playerStats) {
                console.log(`Processando aposta de jogador: ${playerStats.jogador}`);
                console.log('Estatísticas do jogador:', playerStats);

                // Parsing mais robusto do detalhe da aposta
                const detalhe = selecao.detalhe_aposta;
                console.log('Analisando detalhe:', detalhe);

                // Verificar diferentes tipos de apostas de jogador
                if (detalhe.includes('GOLS_MAIS_0.5')) {
                  isGanha = playerStats.gols >= 1;
                  console.log(`Gols +0.5: ${playerStats.gols} gols -> ${isGanha ? 'GANHA' : 'PERDIDA'}`);
                } else if (detalhe.includes('GOLS_MAIS_1.5')) {
                  isGanha = playerStats.gols >= 2;
                  console.log(`Gols +1.5: ${playerStats.gols} gols -> ${isGanha ? 'GANHA' : 'PERDIDA'}`);
                } else if (detalhe.includes('ASSIST_MAIS_0.5')) {
                  isGanha = playerStats.assistencias >= 1;
                  console.log(`Assistências +0.5: ${playerStats.assistencias} assistências -> ${isGanha ? 'GANHA' : 'PERDIDA'}`);
                } else if (detalhe.includes('DESARMES_MAIS_1.5')) {
                  isGanha = playerStats.desarmes >= 2;
                  console.log(`Desarmes +1.5: ${playerStats.desarmes} desarmes -> ${isGanha ? 'GANHA' : 'PERDIDA'}`);
                } else if (detalhe.includes('DEFESAS_MAIS_2.5')) {
                  isGanha = playerStats.defesas >= 3;
                  console.log(`Defesas +2.5: ${playerStats.defesas} defesas -> ${isGanha ? 'GANHA' : 'PERDIDA'}`);
                } else {
                  console.log('Tipo de aposta de jogador não reconhecido:', detalhe);
                }
              } else {
                console.log('Jogador não encontrado nas estatísticas:', selecao.jogador_alvo_id);
              }
            }
            break;

          default:
            console.log('Categoria de aposta não reconhecida:', selecao.categoria_aposta);
        }

        const statusFinal = isGanha ? 'GANHA' : 'PERDIDA';
        console.log(`Resultado final da seleção ${selecao.selecao_id}: ${statusFinal}`);

        // Atualizar status da seleção
        const { error: updateError } = await supabase
          .from('selecoes')
          .update({ status_selecao: statusFinal })
          .eq('selecao_id', selecao.selecao_id);

        if (updateError) {
          console.error('Erro ao atualizar seleção:', updateError);
          throw updateError;
        }

        console.log(`Seleção ${selecao.selecao_id} atualizada para ${statusFinal}`);
      }

      // Processar bilhetes únicos
      const bilhetesUnicos = [...new Set(selecoes.map(s => s.bilhete_id))];
      
      console.log('=== PROCESSANDO BILHETES ===');
      console.log('Bilhetes únicos encontrados:', bilhetesUnicos.length);

      for (const bilheteId of bilhetesUnicos) {
        console.log(`Processando bilhete ${bilheteId}`);

        // Buscar todas as seleções deste bilhete
        const { data: selecoesDoBlhete, error: selecoesError } = await supabase
          .from('selecoes')
          .select('status_selecao')
          .eq('bilhete_id', bilheteId);

        if (selecoesError) {
          console.error('Erro ao buscar seleções do bilhete:', selecoesError);
          continue;
        }

        console.log(`Seleções do bilhete ${bilheteId}:`, selecoesDoBlhete);

        const todasGanhas = selecoesDoBlhete?.every(s => s.status_selecao === 'GANHA');
        const algumaPendente = selecoesDoBlhete?.some(s => s.status_selecao === 'PENDENTE');
        
        // Só finalizar o bilhete se não houver seleções pendentes
        if (!algumaPendente) {
          const statusBilhete: 'GANHO' | 'PERDIDO' = todasGanhas ? 'GANHO' : 'PERDIDO';

          console.log(`Bilhete ${bilheteId}: ${statusBilhete} (todas ganhas: ${todasGanhas})`);

          // Atualizar status do bilhete
          const { error: bilheteError } = await supabase
            .from('bilhetes')
            .update({ status_bilhete: statusBilhete })
            .eq('bilhete_id', bilheteId);

          if (bilheteError) {
            console.error('Erro ao atualizar bilhete:', bilheteError);
            continue;
          }

          // Se ganhou, pagar o prêmio
          if (statusBilhete === 'GANHO') {
            const { data: bilhete } = await supabase
              .from('bilhetes')
              .select('user_id, valor_apostado, odd_total')
              .eq('bilhete_id', bilheteId)
              .single();

            if (bilhete) {
              const premio = bilhete.valor_apostado * bilhete.odd_total;
              
              console.log(`Pagando prêmio de ${premio} para usuário ${bilhete.user_id}`);
              
              const { data: usuario } = await supabase
                .from('usuarios')
                .select('saldo_ficticio')
                .eq('user_id', bilhete.user_id)
                .single();

              if (usuario) {
                const { error: saldoError } = await supabase
                  .from('usuarios')
                  .update({ saldo_ficticio: usuario.saldo_ficticio + premio })
                  .eq('user_id', bilhete.user_id);
                
                if (saldoError) {
                  console.error('Erro ao atualizar saldo:', saldoError);
                } else {
                  console.log(`Saldo atualizado para usuário ${bilhete.user_id}`);
                }
              }
            }
          }
        } else {
          console.log(`Bilhete ${bilheteId} ainda tem seleções pendentes`);
        }
      }
      
      console.log('=== PROCESSAMENTO DE APOSTAS CONCLUÍDO ===');
    } catch (error) {
      console.error('Erro ao processar apostas:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Placar */}
      <Card>
        <CardHeader>
          <CardTitle>Placar Final</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="text-center">
              <Label>{partida.time_a_nome}</Label>
              <Input
                type="number"
                value={placarA}
                onChange={(e) => setPlacarA(parseInt(e.target.value) || 0)}
                min="0"
                className="text-center text-2xl font-bold mt-2"
              />
            </div>
            <div className="text-center text-2xl font-bold">X</div>
            <div className="text-center">
              <Label>{partida.time_b_nome}</Label>
              <Input
                type="number"
                value={placarB}
                onChange={(e) => setPlacarB(parseInt(e.target.value) || 0)}
                min="0"
                className="text-center text-2xl font-bold mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas dos Jogadores */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas dos Jogadores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jogadores.map((player) => (
              <div key={player.id} className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center p-4 border rounded-lg">
                <div className="font-medium">{player.jogador}</div>
                
                <div>
                  <Label className="text-xs">Gols</Label>
                  <Input
                    type="number"
                    value={player.gols}
                    onChange={(e) => updatePlayerStat(player.id, 'gols', parseInt(e.target.value) || 0)}
                    min="0"
                    className="text-center"
                  />
                </div>

                <div>
                  <Label className="text-xs">Assist.</Label>
                  <Input
                    type="number"
                    value={player.assistencias}
                    onChange={(e) => updatePlayerStat(player.id, 'assistencias', parseInt(e.target.value) || 0)}
                    min="0"
                    className="text-center"
                  />
                </div>

                <div>
                  <Label className="text-xs">Defesas</Label>
                  <Input
                    type="number"
                    value={player.defesas}
                    onChange={(e) => updatePlayerStat(player.id, 'defesas', parseInt(e.target.value) || 0)}
                    min="0"
                    className="text-center"
                  />
                </div>

                <div>
                  <Label className="text-xs">Desarmes</Label>
                  <Input
                    type="number"
                    value={player.desarmes}
                    onChange={(e) => updatePlayerStat(player.id, 'desarmes', parseInt(e.target.value) || 0)}
                    min="0"
                    className="text-center"
                  />
                </div>

                <div>
                  <Label className="text-xs">Faltas</Label>
                  <Input
                    type="number"
                    value={player.faltas}
                    onChange={(e) => updatePlayerStat(player.id, 'faltas', parseInt(e.target.value) || 0)}
                    min="0"
                    className="text-center"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={processarResultado} 
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700"
        size="lg"
      >
        {loading ? 'Processando...' : 'Processar Resultado e Finalizar Partida'}
      </Button>
    </div>
  );
};

export default ResultadoForm;
