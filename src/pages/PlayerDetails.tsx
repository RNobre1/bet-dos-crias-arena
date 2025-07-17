import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Target, Shield, Zap, Heart, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { calculateRadarSkills, formatRadarData } from "@/utils/calculateRadarSkills";
import PlayerRadarChart from "@/components/player/RadarChart";
import { toast } from "sonner";

const PlayerDetails: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const [player, setPlayer] = useState<Tables<"players"> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (playerId) {
      loadPlayerData();
    }
  }, [playerId]);

  const loadPlayerData = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (error) throw error;
      setPlayer(data);
    } catch (error) {
      console.error('Erro ao carregar dados do jogador:', error);
      toast.error('Erro ao carregar dados do jogador');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'Lesionado': return 'destructive';
      case 'Disponível': return 'default';
      default: return 'secondary';
    }
  };

  const getSkillIcon = (skillName: string) => {
    switch (skillName) {
      case 'Finalização': return <Target className="w-5 h-5" />;
      case 'Criação': return <Users className="w-5 h-5" />;
      case 'Defesa': return <Shield className="w-5 h-5" />;
      case 'Físico': return <Zap className="w-5 h-5" />;
      case 'Disciplina': return <Heart className="w-5 h-5" />;
      default: return <Trophy className="w-5 h-5" />;
    }
  };

  const getSkillColor = (value: number) => {
    if (value >= 80) return 'text-green-600 bg-green-100';
    if (value >= 60) return 'text-blue-600 bg-blue-100';
    if (value >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dados do jogador...</p>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Jogador não encontrado</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">O jogador solicitado não foi encontrado.</p>
            <Link to="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const skills = calculateRadarSkills(player);
  const radarData = formatRadarData(skills);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-green-800 dark:bg-gray-800 text-white p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-green-700 dark:hover:bg-gray-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{player.jogador}</h1>
            <p className="text-green-200 dark:text-gray-300">Análise Detalhada de Performance</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Player Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <span>Informações do Jogador</span>
              </div>
              <Badge variant={getStatusColor(player.status)}>
                {player.status || 'N/A'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{player.nota.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Nota Geral</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{player.jogos}</p>
                <p className="text-sm text-gray-600">Jogos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{player.gols}</p>
                <p className="text-sm text-gray-600">Gols</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{player.assistencias}</p>
                <p className="text-sm text-gray-600">Assistências</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Radar de Habilidades</CardTitle>
            <p className="text-center text-gray-600">
              Análise detalhada das capacidades do jogador (escala 20-99)
            </p>
          </CardHeader>
          <CardContent>
            <PlayerRadarChart 
              data={radarData} 
              skills={skills} 
              playerName={player.jogador}
            />
          </CardContent>
        </Card>

        {/* Skills Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento das Habilidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {radarData.map((skill) => {
                const skillValue = skill.value;
                const skillKey = skill.skill.toLowerCase().replace('ção', 'cao').replace('í', 'i') as keyof typeof skills;
                const actualValue = skills[skillKey as keyof RadarSkills];
                
                return (
                  <div key={skill.skill} className={`p-4 rounded-lg border ${getSkillColor(actualValue)}`}>
                    <div className="flex items-center gap-3 mb-2">
                      {getSkillIcon(skill.skill)}
                      <h3 className="font-semibold">{skill.skill}</h3>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{actualValue}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-current h-2 rounded-full transition-all duration-300"
                          style={{ width: `${actualValue}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas Detalhadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{player.gols}</p>
                <p className="text-sm text-gray-600">Gols Totais</p>
                <p className="text-xs text-gray-500">
                  {player.jogos > 0 ? (player.gols / player.jogos).toFixed(2) : '0.00'} por jogo
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{player.assistencias}</p>
                <p className="text-sm text-gray-600">Assistências</p>
                <p className="text-xs text-gray-500">
                  {player.jogos > 0 ? (player.assistencias / player.jogos).toFixed(2) : '0.00'} por jogo
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{player.defesas}</p>
                <p className="text-sm text-gray-600">Defesas</p>
                <p className="text-xs text-gray-500">
                  {player.jogos > 0 ? (player.defesas / player.jogos).toFixed(2) : '0.00'} por jogo
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{player.desarmes}</p>
                <p className="text-sm text-gray-600">Desarmes</p>
                <p className="text-xs text-gray-500">
                  {player.jogos > 0 ? (player.desarmes / player.jogos).toFixed(2) : '0.00'} por jogo
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{player.faltas}</p>
                <p className="text-sm text-gray-600">Faltas</p>
                <p className="text-xs text-gray-500">
                  {player.jogos > 0 ? (player.faltas / player.jogos).toFixed(2) : '0.00'} por jogo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlayerDetails;