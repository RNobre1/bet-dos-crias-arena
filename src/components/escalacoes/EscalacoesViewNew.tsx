
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";
import { generateTeams } from "@/utils/teamFormation";
import CampoFutebol from "./CampoFutebol";

interface EscalacoesViewNewProps {
  jogadores: Tables<"players">[];
}

const EscalacoesViewNew: React.FC<EscalacoesViewNewProps> = ({ jogadores }) => {
  const [showTeam, setShowTeam] = useState<'A' | 'B' | 'AMBOS'>('AMBOS');
  
  const { timeA, timeB, reservas } = generateTeams(jogadores);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'Lesionado': return 'destructive';
      case 'Disponível': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Escalações da Próxima Partida</h2>
        <p className="text-gray-600">Geradas automaticamente com base no desempenho dos jogadores</p>
      </div>

      {/* Controle de visualização */}
      <Card>
        <CardHeader>
          <CardTitle>Visualização das Escalações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <label className="font-medium">Mostrar:</label>
            <Select value={showTeam} onValueChange={(value: 'A' | 'B' | 'AMBOS') => setShowTeam(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AMBOS">Ambos os Times</SelectItem>
                <SelectItem value="A">Apenas Time A</SelectItem>
                <SelectItem value="B">Apenas Time B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-6">
            {/* Campo de futebol */}
            <div className="flex-1">
              <CampoFutebol 
                timeA={timeA.jogadores}
                timeB={timeB.jogadores}
                showTeam={showTeam}
              />
            </div>

            {/* Reservas na lateral */}
            {reservas.length > 0 && (
              <div className="w-64">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Reservas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reservas.map((player) => (
                        <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium">{player.jogador}</p>
                            <p className="text-xs text-gray-500">Nota: {player.nota.toFixed(1)}</p>
                          </div>
                          <Badge variant={getStatusColor(player.status)}>
                            {player.status === 'Lesionado' ? 'Lesionado' : 'Reserva'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas dos times */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Time A</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Formação:</strong> {timeA.formacao}</p>
              <p><strong>Nota Total:</strong> {timeA.notaTotal.toFixed(1)}</p>
              <p><strong>Média:</strong> {(timeA.notaTotal / timeA.jogadores.length).toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Time B</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Formação:</strong> {timeB.formacao}</p>
              <p><strong>Nota Total:</strong> {timeB.notaTotal.toFixed(1)}</p>
              <p><strong>Média:</strong> {(timeB.notaTotal / timeB.jogadores.length).toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EscalacoesViewNew;
