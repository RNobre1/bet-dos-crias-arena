
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";
import { gerarEscalacoes } from "@/utils/oddsCalculator";

interface EscalacoesViewProps {
  jogadores: Tables<"players">[];
}

const EscalacoesView: React.FC<EscalacoesViewProps> = ({ jogadores }) => {
  const escalacoes = gerarEscalacoes(jogadores);

  const getPosicaoColor = (posicao: string) => {
    switch (posicao) {
      case 'Goleiro': return 'bg-yellow-500';
      case 'Atacante': return 'bg-red-500';
      case 'Volante': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const renderTime = (time: any[], nome: string) => (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-center">{nome}</CardTitle>
        <p className="text-center text-sm text-gray-600">
          Nota Total: {time.reduce((sum, p) => sum + p.nota, 0).toFixed(1)}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {time.map((player, index) => (
            <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${getPosicaoColor(player.posicao)}`}></div>
                <div>
                  <p className="font-semibold">{player.jogador}</p>
                  <p className="text-xs text-gray-500">{player.posicao}</p>
                </div>
              </div>
              <Badge variant="secondary">{player.nota.toFixed(1)}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Escalações da Próxima Partida</h2>
        <p className="text-gray-600">Geradas automaticamente com base no desempenho dos jogadores</p>
      </div>

      <div className="flex gap-6">
        {renderTime(escalacoes.timeA, "Time A")}
        {renderTime(escalacoes.timeB, "Time B")}
      </div>

      {escalacoes.reservas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reservas e Lesionados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {escalacoes.reservas.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{player.jogador}</span>
                  <Badge variant={player.status === 'Lesionado' ? 'destructive' : 'secondary'}>
                    {player.status === 'Lesionado' ? 'Lesionado' : 'Reserva'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EscalacoesView;
