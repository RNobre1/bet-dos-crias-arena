
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tables } from "@/integrations/supabase/types";
import { generateTeams } from "@/utils/teamFormation";
import CampoFutebol from "./CampoFutebol";

interface EscalacoesViewNewProps {
  jogadores: Tables<"players">[];
}

const EscalacoesViewNew: React.FC<EscalacoesViewNewProps> = ({ jogadores }) => {
  const [showTeam, setShowTeam] = useState<'A' | 'B' | 'AMBOS'>('AMBOS');
  
  const escalacoes = generateTeams(jogadores);

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

          {/* Campo de futebol */}
          <CampoFutebol 
            timeA={escalacoes.timeA.jogadores}
            timeB={escalacoes.timeB.jogadores}
            showTeam={showTeam}
          />
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
              <p><strong>Formação:</strong> {escalacoes.timeA.formacao}</p>
              <p><strong>Nota Total:</strong> {escalacoes.timeA.notaTotal.toFixed(1)}</p>
              <p><strong>Média:</strong> {(escalacoes.timeA.notaTotal / escalacoes.timeA.jogadores.length).toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Time B</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Formação:</strong> {escalacoes.timeB.formacao}</p>
              <p><strong>Nota Total:</strong> {escalacoes.timeB.notaTotal.toFixed(1)}</p>
              <p><strong>Média:</strong> {(escalacoes.timeB.notaTotal / escalacoes.timeB.jogadores.length).toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EscalacoesViewNew;
