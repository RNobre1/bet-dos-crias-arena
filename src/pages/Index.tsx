
import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import AuthForm from '@/components/auth/AuthForm';
import PlayerSelection from '@/components/auth/PlayerSelection';
import Navigation from '@/components/layout/Navigation';
import TabelaClassificacao from '@/components/classificacao/TabelaClassificacao';
import EscalacoesViewNew from '@/components/escalacoes/EscalacoesViewNew';
import MercadosApostaNew from '@/components/apostas/MercadosApostaNew';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Loader2 } from 'lucide-react';
import { recalcularTodasAsNotas } from '@/utils/playerNotesCalculator';
import { useIsMobile } from '@/hooks/use-mobile';

const AppContent = () => {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('classificacao');
  const [jogadores, setJogadores] = useState<Tables<"players">[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const isMobile = useIsMobile();

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
      
      if (playersData && playersData.length > 0) {
        // Recalcular todas as notas quando carregar os dados
        await recalcularTodasAsNotas(playersData);
        
        // Recarregar os dados atualizados
        const { data: updatedPlayersData, error: updatedError } = await supabase
          .from('players')
          .select('*')
          .order('nota', { ascending: false });

        if (updatedError) throw updatedError;
        setJogadores(updatedPlayersData || []);
      } else {
        setJogadores([]);
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

  // Se é o primeiro login, mostrar seleção de jogador
  if (profile?.primeiro_login) {
    return <PlayerSelection />;
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
        return <EscalacoesViewNew jogadores={jogadores} />;
      case 'apostas':
        return <MercadosApostaNew jogadores={jogadores} />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <TabelaClassificacao jogadores={jogadores} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className={`${isMobile ? 'pt-16 pb-20 px-0' : 'container mx-auto p-6'}`}>
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
