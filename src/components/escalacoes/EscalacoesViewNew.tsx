
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { generateTeams } from "@/utils/teamFormation";
import CampoFutebol from "./CampoFutebol";
import { useIsMobile } from "@/hooks/use-mobile";

interface EscalacoesViewNewProps {
  jogadores: Tables<"players">[];
}

const EscalacoesViewNew: React.FC<EscalacoesViewNewProps> = ({ jogadores }) => {
  const [showTeam, setShowTeam] = useState<'A' | 'B' | 'AMBOS'>('AMBOS');
  const isMobile = useIsMobile();
  
  const { timeA, timeB, reservas } = generateTeams(jogadores);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'Lesionado': return 'destructive';
      case 'Disponível': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <TooltipProvider>
      <div className={`space-y-6 ${isMobile ? 'pb-20' : ''}`}>
        <div className="text-center px-4">
          <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-2 flex items-center justify-center gap-2`}>
            Escalações da Próxima Partida
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-gray-500 hover:text-gray-700" />
              </TooltipTrigger>
              <TooltipContent className="max-w-md p-3">
                <div className="text-sm">
                  <p className="font-semibold mb-2">Como a Escalação é Montada:</p>
                  <p className="mb-1">• <strong>Goleiros:</strong> Avaliados por "pureza defensiva" (Defesas × 2.0 - penalidades)</p>
                  <p className="mb-1">• <strong>Atacantes:</strong> Focados em finalização (Gols × 2.0 + Assistências)</p>
                  <p className="mb-1">• <strong>Volantes:</strong> Equilibrio entre ataque e defesa</p>
                  <p className="mb-1">• <strong>Balanceamento:</strong> Times equilibrados em nota total</p>
                  <p>• <strong>Lesionados:</strong> Automaticamente movidos para reservas</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </h2>
          <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>
            Geradas automaticamente com base no desempenho dos jogadores
          </p>
        </div>

        {/* Controle de visualização */}
        <Card className="mx-4">
          <CardHeader>
            <CardTitle className={isMobile ? 'text-lg' : 'text-xl'}>Visualização das Escalações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <label className="font-medium">Mostrar:</label>
              <Select value={showTeam} onValueChange={(value: 'A' | 'B' | 'AMBOS') => setShowTeam(value)}>
                <SelectTrigger className={isMobile ? 'w-40' : 'w-48'}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AMBOS">Ambos os Times</SelectItem>
                  <SelectItem value="A">Apenas Time A</SelectItem>
                  <SelectItem value="B">Apenas Time B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={`${isMobile ? 'space-y-4' : 'flex gap-6'}`}>
              {/* Campo de futebol */}
              <div className="flex-1">
                <CampoFutebol 
                  timeA={timeA.jogadores}
                  timeB={timeB.jogadores}
                  showTeam={showTeam}
                />
              </div>

              {/* Reservas */}
              {reservas.length > 0 && (
                <div className={isMobile ? 'w-full' : 'w-64'}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Reservas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`${isMobile ? 'grid grid-cols-2 gap-2' : 'space-y-3'}`}>
                        {reservas.map((player) => (
                          <div key={player.id} className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} p-2 bg-gray-50 rounded`}>
                            <div className={isMobile ? 'text-center' : ''}>
                              <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>{player.jogador}</p>
                              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>Nota: {player.nota.toFixed(1)}</p>
                            </div>
                            <Badge variant={getStatusColor(player.status)} className={`${isMobile ? 'text-xs mt-1 self-center' : ''}`}>
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
        <div className={`${isMobile ? 'space-y-4 mx-4' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}`}>
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
    </TooltipProvider>
  );
};

export default EscalacoesViewNew;
