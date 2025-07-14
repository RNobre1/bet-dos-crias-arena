import React, { useState } from 'react';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Info, Settings, Calendar } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { generateTeams } from "@/utils/teamFormation";
import { supabase } from "@/integrations/supabase/client";
import CampoFutebol from "./CampoFutebol";
import CustomLineupGenerator from "./CustomLineupGenerator";
import { useIsMobile } from "@/hooks/use-mobile";

interface EscalacoesViewNewProps {
  jogadores: Tables<"players">[];
}

const EscalacoesViewNew: React.FC<EscalacoesViewNewProps> = ({ jogadores }) => {
  const [showTeam, setShowTeam] = useState<'A' | 'B' | 'AMBOS'>('AMBOS');
  const [currentView, setCurrentView] = useState<'official' | 'custom'>('official');
  const [nextMatch, setNextMatch] = useState<Tables<"partidas"> | null>(null);
  const [officialLineup, setOfficialLineup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    loadNextMatch();
  }, []);

  const loadNextMatch = async () => {
    try {
      const { data: partida, error } = await supabase
        .from('partidas')
        .select('*')
        .in('status', ['AGENDADA', 'AO_VIVO'])
        .order('data_partida')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      setNextMatch(partida);
      
      if (partida && partida.time_a_jogadores && partida.time_b_jogadores) {
        // Carregar dados dos jogadores escalados
        const allPlayerIds = [...partida.time_a_jogadores, ...partida.time_b_jogadores];
        
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .in('id', allPlayerIds);

        if (playersError) throw playersError;

        const timeAPlayers = playersData?.filter(p => partida.time_a_jogadores?.includes(p.id)) || [];
        const timeBPlayers = playersData?.filter(p => partida.time_b_jogadores?.includes(p.id)) || [];
        
        setOfficialLineup({
          timeA: { nome: partida.time_a_nome, jogadores: timeAPlayers },
          timeB: { nome: partida.time_b_nome, jogadores: timeBPlayers }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar próxima partida:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fallback para escalação automática se não houver escalação oficial
  const fallbackLineup = generateTeams(jogadores);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'Lesionado': return 'destructive';
      case 'Disponível': return 'default';
      default: return 'secondary';
    }
  };

  if (currentView === 'custom') {
    return <CustomLineupGenerator jogadores={jogadores} onBack={() => setCurrentView('official')} />;
  }

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

        {/* Escalação Oficial ou Automática */}
        <Card className="mx-4">
          <CardHeader>
            <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {nextMatch ? 'Escalação Oficial da Próxima Partida' : 'Escalação Automática Sugerida'}
              </div>
              <Button 
                onClick={() => setCurrentView('custom')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Gere sua própria escalação
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextMatch && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-800">
                      {nextMatch.time_a_nome} vs {nextMatch.time_b_nome}
                    </h3>
                    <p className="text-sm text-blue-600">
                      {new Date(nextMatch.data_partida).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <Badge variant="default">
                    {nextMatch.status}
                  </Badge>
                </div>
              </div>
            )}

            {!nextMatch && (
              <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-700">
                  Nenhuma partida agendada. Exibindo escalação automática baseada nas notas dos jogadores.
                </p>
              </div>
            )}

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
                  timeA={officialLineup ? officialLineup.timeA.jogadores : fallbackLineup.timeA.jogadores}
                  timeB={officialLineup ? officialLineup.timeB.jogadores : fallbackLineup.timeB.jogadores}
                  showTeam={showTeam}
                />
              </div>

              {/* Reservas */}
              {(!officialLineup ? fallbackLineup.reservas : []).length > 0 && (
                <div className={isMobile ? 'w-full' : 'w-64'}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Reservas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`${isMobile ? 'grid grid-cols-2 gap-2' : 'space-y-3'}`}>
                        {(!officialLineup ? fallbackLineup.reservas : []).map((player) => (
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
              <CardTitle className="text-green-600">
                {officialLineup ? officialLineup.timeA.nome : fallbackLineup.timeA.nome}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Formação:</strong> {officialLineup ? 'Personalizada' : fallbackLineup.timeA.formacao}</p>
                <p><strong>Jogadores:</strong> {officialLineup ? officialLineup.timeA.jogadores.length : fallbackLineup.timeA.jogadores.length}</p>
                {!officialLineup && (
                  <>
                    <p><strong>Nota Total:</strong> {fallbackLineup.timeA.notaTotal.toFixed(1)}</p>
                    <p><strong>Média:</strong> {(fallbackLineup.timeA.notaTotal / fallbackLineup.timeA.jogadores.length).toFixed(1)}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">
                {officialLineup ? officialLineup.timeB.nome : fallbackLineup.timeB.nome}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Formação:</strong> {officialLineup ? 'Personalizada' : fallbackLineup.timeB.formacao}</p>
                <p><strong>Jogadores:</strong> {officialLineup ? officialLineup.timeB.jogadores.length : fallbackLineup.timeB.jogadores.length}</p>
                {!officialLineup && (
                  <>
                    <p><strong>Nota Total:</strong> {fallbackLineup.timeB.notaTotal.toFixed(1)}</p>
                    <p><strong>Média:</strong> {(fallbackLineup.timeB.notaTotal / fallbackLineup.timeB.jogadores.length).toFixed(1)}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default EscalacoesViewNew;