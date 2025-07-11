
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { calculatePlayerNote } from "@/utils/playerNotesCalculator";

interface TabelaClassificacaoProps {
  jogadores: Tables<"players">[];
}

const TabelaClassificacao: React.FC<TabelaClassificacaoProps> = ({ jogadores }) => {
  // Calcular notas usando a fórmula correta
  const jogadoresComNota = jogadores.map(player => ({
    ...player,
    notaCalculada: calculatePlayerNote(player, jogadores)
  })).sort((a, b) => b.notaCalculada - a.notaCalculada);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'Lesionado': return 'destructive';
      case 'Disponível': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-600 rounded mr-2"></div>
            Classificação dos Jogadores
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-gray-500 hover:text-gray-700" />
              </TooltipTrigger>
              <TooltipContent className="max-w-md p-3">
                <div className="text-sm">
                  <p className="font-semibold mb-2">Como a Nota é Calculada:</p>
                  <p className="mb-1">• <strong>Impacto Ofensivo:</strong> (Gols × 2.0 + Assistências × 1.0) / Jogos</p>
                  <p className="mb-1">• <strong>Impacto Defensivo:</strong> (Defesas × 1.5 + Desarmes × 1.0) / Jogos</p>
                  <p className="mb-1">• <strong>Penalidade:</strong> (Faltas × 0.25) / Jogos</p>
                  <p className="mb-1">• <strong>PIB:</strong> Máximo(Imp. Ofensivo, Imp. Defensivo) - Penalidade</p>
                  <p>• <strong>Nota Final:</strong> Normalizada na escala 5.0-9.8 baseada no desempenho do elenco</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-2 font-semibold">#</th>
                  <th className="text-left p-2 font-semibold">Jogador</th>
                  <th className="text-center p-2 font-semibold">Nota</th>
                  <th className="text-center p-2 font-semibold">Jogos</th>
                  <th className="text-center p-2 font-semibold">Gols</th>
                  <th className="text-center p-2 font-semibold">Assist</th>
                  <th className="text-center p-2 font-semibold">Defesas</th>
                  <th className="text-center p-2 font-semibold">Desarmes</th>
                  <th className="text-center p-2 font-semibold">Faltas</th>
                  <th className="text-center p-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {jogadoresComNota.map((player, index) => (
                  <tr key={player.id} className={`border-b border-gray-100 ${index < 3 ? 'bg-green-50' : ''}`}>
                    <td className="p-2 font-semibold text-center">
                      {index + 1}
                      {index === 0 && "🥇"}
                      {index === 1 && "🥈"} 
                      {index === 2 && "🥉"}
                    </td>
                    <td className="p-2 font-medium">{player.jogador}</td>
                    <td className="p-2 text-center">
                      <Badge variant={index < 3 ? "default" : "secondary"} className="font-bold">
                        {player.notaCalculada.toFixed(1)}
                      </Badge>
                    </td>
                    <td className="p-2 text-center">{player.jogos}</td>
                    <td className="p-2 text-center text-blue-600 font-semibold">{player.gols}</td>
                    <td className="p-2 text-center text-purple-600 font-semibold">{player.assistencias}</td>
                    <td className="p-2 text-center text-green-600 font-semibold">{player.defesas}</td>
                    <td className="p-2 text-center text-orange-600 font-semibold">{player.desarmes}</td>
                    <td className="p-2 text-center text-red-600 font-semibold">{player.faltas}</td>
                    <td className="p-2 text-center">
                      <Badge variant={getStatusColor(player.status)}>
                        {player.status || 'N/A'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default TabelaClassificacao;
