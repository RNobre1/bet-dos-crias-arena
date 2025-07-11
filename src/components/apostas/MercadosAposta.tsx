
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";
import { gerarEscalacoes, calcularOddsResultado, calcularOddsJogador } from "@/utils/oddsCalculator";
import BilheteAposta from './BilheteAposta';

interface MercadosApostaProps {
  jogadores: Tables<"players">[];
  partida: Tables<"partidas"> | null;
}

export interface Selecao {
  id: string;
  descricao: string;
  odd: number;
  categoria: string;
  detalhe: string;
  jogador_id?: string;
  partida_id: number;
}

const MercadosAposta: React.FC<MercadosApostaProps> = ({ jogadores, partida }) => {
  const [selecoes, setSelecoes] = useState<Selecao[]>([]);

  if (!partida) {
    return (
      <Card>
        <CardContent className="text-center p-8">
          <p>Nenhuma partida agendada no momento.</p>
        </CardContent>
      </Card>
    );
  }

  const escalacoes = gerarEscalacoes(jogadores);
  const oddsResultado = calcularOddsResultado(escalacoes.timeA, escalacoes.timeB);

  const adicionarSelecao = (selecao: Selecao) => {
    // Verificar se já existe uma seleção conflitante
    const conflito = selecoes.find(s => 
      s.categoria === selecao.categoria && 
      s.jogador_id === selecao.jogador_id
    );

    if (conflito) {
      // Substituir a seleção conflitante
      setSelecoes(prev => prev.map(s => s.id === conflito.id ? selecao : s));
    } else {
      setSelecoes(prev => [...prev, selecao]);
    }
  };

  const removerSelecao = (id: string) => {
    setSelecoes(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Mercado de Resultado */}
        <Card>
          <CardHeader>
            <CardTitle>Resultado da Partida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => adicionarSelecao({
                  id: `resultado_vitoria_a_${Date.now()}`,
                  descricao: `Vitória ${partida.time_a_nome}`,
                  odd: oddsResultado.vitoria_a,
                  categoria: 'RESULTADO_PARTIDA',
                  detalhe: 'VITORIA_A',
                  partida_id: partida.partida_id
                })}
              >
                <span className="font-semibold">{partida.time_a_nome}</span>
                <Badge variant="default">{oddsResultado.vitoria_a}</Badge>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => adicionarSelecao({
                  id: `resultado_empate_${Date.now()}`,
                  descricao: 'Empate',
                  odd: oddsResultado.empate,
                  categoria: 'RESULTADO_PARTIDA',
                  detalhe: 'EMPATE',
                  partida_id: partida.partida_id
                })}
              >
                <span className="font-semibold">Empate</span>
                <Badge variant="default">{oddsResultado.empate}</Badge>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => adicionarSelecao({
                  id: `resultado_vitoria_b_${Date.now()}`,
                  descricao: `Vitória ${partida.time_b_nome}`,
                  odd: oddsResultado.vitoria_b,
                  categoria: 'RESULTADO_PARTIDA',
                  detalhe: 'VITORIA_B',
                  partida_id: partida.partida_id
                })}
              >
                <span className="font-semibold">{partida.time_b_nome}</span>
                <Badge variant="default">{oddsResultado.vitoria_b}</Badge>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mercados de Jogadores */}
        <Card>
          <CardHeader>
            <CardTitle>Mercados de Jogadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...escalacoes.timeA, ...escalacoes.timeB].map(player => {
                const odds = calcularOddsJogador(player);
                
                return (
                  <div key={player.id} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">{player.jogador} ({player.posicao})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex flex-col items-center space-y-1"
                        onClick={() => adicionarSelecao({
                          id: `gol_${player.id}_${Date.now()}`,
                          descricao: `${player.jogador} +0.5 Gols`,
                          odd: odds.gol_05,
                          categoria: 'MERCADO_JOGADOR',
                          detalhe: 'GOLS_MAIS_0.5',
                          jogador_id: player.id,
                          partida_id: partida.partida_id
                        })}
                      >
                        <span className="text-xs">+0.5 Gols</span>
                        <Badge variant="secondary" className="text-xs">{odds.gol_05}</Badge>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="flex flex-col items-center space-y-1"
                        onClick={() => adicionarSelecao({
                          id: `assist_${player.id}_${Date.now()}`,
                          descricao: `${player.jogador} +0.5 Assistências`,
                          odd: odds.assist_05,
                          categoria: 'MERCADO_JOGADOR',
                          detalhe: 'ASSISTENCIAS_MAIS_0.5',
                          jogador_id: player.id,
                          partida_id: partida.partida_id
                        })}
                      >
                        <span className="text-xs">+0.5 Assist</span>
                        <Badge variant="secondary" className="text-xs">{odds.assist_05}</Badge>
                      </Button>

                      {player.posicao !== 'Goleiro' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex flex-col items-center space-y-1"
                          onClick={() => adicionarSelecao({
                            id: `desarme_${player.id}_${Date.now()}`,
                            descricao: `${player.jogador} +1.5 Desarmes`,
                            odd: odds.desarme_15,
                            categoria: 'MERCADO_JOGADOR',
                            detalhe: 'DESARMES_MAIS_1.5',
                            jogador_id: player.id,
                            partida_id: partida.partida_id
                          })}
                        >
                          <span className="text-xs">+1.5 Desarmes</span>
                          <Badge variant="secondary" className="text-xs">{odds.desarme_15}</Badge>
                        </Button>
                      )}

                      {player.posicao === 'Goleiro' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex flex-col items-center space-y-1"
                          onClick={() => adicionarSelecao({
                            id: `defesa_${player.id}_${Date.now()}`,
                            descricao: `${player.jogador} +2.5 Defesas`,
                            odd: odds.defesa_25,
                            categoria: 'MERCADO_JOGADOR',
                            detalhe: 'DEFESAS_MAIS_2.5',
                            jogador_id: player.id,
                            partida_id: partida.partida_id
                          })}
                        >
                          <span className="text-xs">+2.5 Defesas</span>
                          <Badge variant="secondary" className="text-xs">{odds.defesa_25}</Badge>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bilhete de Aposta */}
      <div className="lg:col-span-1">
        <BilheteAposta 
          selecoes={selecoes}
          onRemoverSelecao={removerSelecao}
          onLimparBilhete={() => setSelecoes([])}
        />
      </div>
    </div>
  );
};

export default MercadosAposta;
