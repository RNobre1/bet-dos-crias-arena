
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import PartidaForm from "./PartidaForm";
import ResultadoForm from "./ResultadoForm";
import { Calendar, Trophy, TrendingUp, Users, Clock } from "lucide-react";

const AdminDashboard = () => {
  const [partidaAtiva, setPartidaAtiva] = useState<Tables<"partidas"> | null>(null);
  const [todasPartidas, setTodasPartidas] = useState<Tables<"partidas">[]>([]);
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

      // Carregar todas as partidas
      const { data: partidas } = await supabase
        .from('partidas')
        .select('*')
        .order('data_partida', { ascending: false });

      setTodasPartidas(partidas || []);

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

  const finalizarPartida = async (partida: Tables<"partidas">) => {
    try {
      const { error } = await supabase
        .from('partidas')
        .update({ status: 'FINALIZADA' })
        .eq('partida_id', partida.partida_id);

      if (error) throw error;
      
      toast.success('Partida finalizada com sucesso!');
      loadDashboardData();
    } catch (error) {
      console.error('Erro ao finalizar partida:', error);
      toast.error('Erro ao finalizar partida');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AGENDADA': return 'bg-blue-100 text-blue-800';
      case 'AO_VIVO': return 'bg-green-100 text-green-800';
      case 'FINALIZADA': return 'bg-gray-100 text-gray-800';
      case 'ADIADA': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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
          <TabsTrigger value="historico">Histórico de Partidas</TabsTrigger>
        </TabsList>

        <TabsContent value="partida">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Partidas</CardTitle>
            </CardHeader>
            <CardContent>
              <PartidaForm 
                onPartidaCriada={() => loadDashboardData()} 
                onCancel={() => {}}
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

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Partidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todasPartidas.map((partida) => (
                  <div key={partida.partida_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">
                        {partida.time_a_nome} vs {partida.time_b_nome}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(partida.data_partida).toLocaleString('pt-BR')}</span>
                      </div>
                      {partida.resultado_final && (
                        <p className="text-sm font-medium text-green-600">
                          Resultado: {partida.resultado_final}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(partida.status)}`}>
                        {partida.status}
                      </span>
                      
                      {(partida.status === 'AGENDADA' || partida.status === 'AO_VIVO') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => finalizarPartida(partida)}
                        >
                          Finalizar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
