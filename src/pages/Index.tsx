
import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import AuthForm from '@/components/auth/AuthForm';
import Navigation from '@/components/layout/Navigation';
import TabelaClassificacao from '@/components/classificacao/TabelaClassificacao';
import EscalacoesView from '@/components/escalacoes/EscalacoesView';
import MercadosAposta from '@/components/apostas/MercadosAposta';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Loader2 } from 'lucide-react';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('classificacao');
  const [jogadores, setJogadores] = useState<Tables<"players">[]>([]);
  const [partida, setPartida] = useState<Tables<"partidas"> | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Carregar jogadores
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .order('created_at');

      if (playersError) throw playersError;
      setJogadores(playersData || []);

      // Carregar próxima partida
      const { data: partidaData, error: partidaError } = await supabase
        .from('partidas')
        .select('*')
        .eq('status', 'AGENDADA')
        .order('data_partida')
        .limit(1)
        .single();

      if (!partidaError && partidaData) {
        setPartida(partidaData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  if (loadingData) {
    return (
      <div className="min-h-screen">
        <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'classificacao':
        return <TabelaClassificacao jogadores={jogadores} />;
      case 'escalacoes':
        return <EscalacoesView jogadores={jogadores} />;
      case 'apostas':
        return <MercadosAposta jogadores={jogadores} partida={partida} />;
      case 'historico':
        return <div className="text-center p-8">Histórico em desenvolvimento...</div>;
      case 'admin':
        return <div className="text-center p-8">Painel Admin em desenvolvimento...</div>;
      default:
        return <TabelaClassificacao jogadores={jogadores} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="container mx-auto p-6">
        {renderPage()}
      </main>
    </div>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
