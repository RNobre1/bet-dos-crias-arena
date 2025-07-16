
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Users } from "lucide-react";

const PlayerSelection = () => {
  const { user } = useAuth();
  const [jogadores, setJogadores] = useState<Tables<"players">[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    loadJogadores();
  }, []);

  const loadJogadores = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('nota', { ascending: false });

      if (error) throw error;
      setJogadores(data || []);
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
      toast.error('Erro ao carregar jogadores');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlayer = async (playerId: string) => {
    if (!user) return;
    
    setSelecting(true);
    try {
      // Vincular jogador ao usuário
      const { error: playerError } = await supabase
        .from('players')
        .update({ user_id: user.id })
        .eq('id', playerId);

      if (playerError) throw playerError;

      // Atualizar perfil do usuário para marcar que não é mais primeiro login
      const { error: userError } = await supabase
        .from('usuarios')
        .update({ primeiro_login: false })
        .eq('user_id', user.id);

      if (userError) throw userError;

      toast.success('Jogador selecionado com sucesso!');
      // A página será recarregada automaticamente quando o useAuth detectar a mudança
      window.location.reload();
    } catch (error) {
      console.error('Erro ao selecionar jogador:', error);
      toast.error('Erro ao selecionar jogador');
    } finally {
      setSelecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-green-700">
        <div className="text-white text-lg">Carregando jogadores...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-700 flex items-center justify-center gap-2">
              <Users className="w-6 h-6" />
              Escolha seu Jogador
            </CardTitle>
            <p className="text-gray-600">
              Selecione o jogador que você representa no sistema. Esta escolha é permanente e você não poderá apostar em si mesmo.
            </p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jogadores.map((jogador) => {
            const isOccupied = jogador.user_id !== null;
            const mediaGols = jogador.jogos > 0 ? (jogador.gols / jogador.jogos).toFixed(1) : '0.0';
            const mediaAssist = jogador.jogos > 0 ? (jogador.assistencias / jogador.jogos).toFixed(1) : '0.0';

            return (
              <Card 
                key={jogador.id}
                className={`transition-all duration-200 ${
                  isOccupied 
                    ? 'opacity-50 bg-gray-100' 
                    : 'hover:shadow-lg hover:scale-105 cursor-pointer border-green-200'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg">{jogador.jogador}</h3>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold text-green-600">
                        {jogador.nota.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Jogos:</span>
                      <span className="font-medium">{jogador.jogos}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Gols (média):</span>
                      <span className="font-medium">{jogador.gols} ({mediaGols})</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Assistências (média):</span>
                      <span className="font-medium">{jogador.assistencias} ({mediaAssist})</span>
                    </div>
                    {jogador.defesas > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Defesas:</span>
                        <span className="font-medium">{jogador.defesas}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <Badge variant={jogador.status === 'Lesionado' ? 'destructive' : 'default'}>
                      {jogador.status || 'Disponível'}
                    </Badge>

                    {isOccupied ? (
                      <Badge variant="secondary">Ocupado</Badge>
                    ) : (
                      <Button 
                        onClick={() => handleSelectPlayer(jogador.id)}
                        disabled={selecting}
                        className="bg-green-600 hover:bg-green-700 h-10 min-h-[44px] px-4"
                      >
                        {selecting ? 'Selecionando...' : 'Escolher'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlayerSelection;
