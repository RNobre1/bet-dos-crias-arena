
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import PartidaForm from "./PartidaForm";
import ResultadoForm from "./ResultadoForm";
import { Calendar, Trophy, TrendingUp, Users } from "lucide-react";

const AdminDashboard = () => {
  const [partidaAtiva, setPartidaAtiva] = useState<Tables<"partidas"> | null>(null);
  const [estatisticas, setEstatisticas] = useState({
    totalJogadores: 0,
    totalUsuarios: 0,
    apostasAbertas: 0,
    partidasFinalizadas: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Carregar partida ativa
      const { data: partida } = await supabase
        .from('partidas')
        .select('*')
        .in('status', ['AGENDADA', 'AO_VIVO'])
        .order('data_partida')
        .limit(1)
        .single();

      setPartidaAtiva(partida);

      // Carregar estatísticas
      const [
        { count: totalJogadores },
        { count: totalUsuarios },
        { count: apostasAbertas },
        { count: partidasFinalizadas }
      ] = await Promise.all([
        supabase.from('players').select('*', { count: 'exact', head: true }),
        supabase.from('usuarios').select('*', { count: 'exact', head: true }),
        supabase.from('bilhetes').select('*', { count: 'exact', head: true }).eq('status_bilhete', 'ABERTO'),
        supabase.from('partidas').select('*', { count: 'exact', head: true }).eq('status', 'FINALIZADA')
      ]);

      setEstatisticas({
        totalJogadores: totalJogadores || 0,
        totalUsuarios: totalUsuarios || 0,
        apostasAbertas: apostasAbertas || 0,
        partidasFinalizadas: partidasFinalizadas || 0
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Jogadores</p>
                <p className="text-2xl font-bold">{estatisticas.totalJogadores}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Trophy className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usuários</p>
                <p className="text-2xl font-bold">{estatisticas.totalUsuarios}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Apostas Abertas</p>
                <p className="text-2xl font-bold">{estatisticas.apostasAbertas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Partidas Finalizadas</p>
                <p className="text-2xl font-bold">{estatisticas.partidasFinalizadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="partida" className="space-y-4">
        <TabsList>
          <TabsTrigger value="partida">Gerenciar Partida</TabsTrigger>
          <TabsTrigger value="resultado">Inserir Resultado</TabsTrigger>
        </TabsList>

        <TabsContent value="partida">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Partidas</CardTitle>
            </CardHeader>
            <CardContent>
              <PartidaForm 
                partidaAtiva={partidaAtiva} 
                onPartidaUpdate={() => loadDashboardData()} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resultado">
          <Card>
            <CardHeader>
              <CardTitle>Inserir Resultado da Partida</CardTitle>
            </CardHeader>
            <CardContent>
              {partidaAtiva ? (
                <ResultadoForm 
                  partida={partidaAtiva} 
                  onResultadoSubmitted={() => loadDashboardData()} 
                />
              ) : (
                <p className="text-gray-500">Não há partida ativa para inserir resultado.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
