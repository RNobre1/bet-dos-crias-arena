
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { History, Trophy, X, Clock } from "lucide-react";

interface BilheteComSelecoes extends Tables<"bilhetes"> {
  selecoes: (Tables<"selecoes"> & {
    partidas: Tables<"partidas">;
    players: Tables<"players"> | null;
  })[];
}

const HistoricoApostas: React.FC = () => {
  const { profile } = useAuth();
  const [bilhetes, setBilhetes] = useState<BilheteComSelecoes[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.user_id) {
      loadHistorico();
    }
  }, [profile]);

  const loadHistorico = async () => {
    try {
      const { data, error } = await supabase
        .from('bilhetes')
        .select(`
          *,
          selecoes (
            *,
            partidas (*),
            players (*)
          )
        `)
        .eq('user_id', profile?.user_id)
        .order('data_aposta', { ascending: false });

      if (error) throw error;
      setBilhetes(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GANHO': return 'default';
      case 'PERDIDO': return 'destructive';
      case 'ANULADO': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'GANHO': return <Trophy className="w-4 h-4" />;
      case 'PERDIDO': return <X className="w-4 h-4" />;
      case 'ANULADO': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico de Apostas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando histórico...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bilhetes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico de Apostas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <History className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhuma aposta ainda</h3>
            <p className="text-gray-500">Suas apostas aparecerão aqui após serem feitas.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Histórico de Apostas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bilhetes.map((bilhete) => (
            <div key={bilhete.bilhete_id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(bilhete.status_bilhete)} className="flex items-center gap-1">
                    {getStatusIcon(bilhete.status_bilhete)}
                    {bilhete.status_bilhete}
                  </Badge>
                  <Badge variant="outline">
                    {bilhete.tipo_bilhete}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(bilhete.data_aposta).toLocaleString('pt-BR')}
                </div>
              </div>

              <div className="space-y-2 mb-3">
                {bilhete.selecoes.map((selecao, index) => (
                  <div key={selecao.selecao_id} className="bg-gray-50 p-2 rounded text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {selecao.partidas.time_a_nome} vs {selecao.partidas.time_b_nome}
                      </span>
                      <Badge variant="secondary">
                        {selecao.odd_selecao.toFixed(2)}
                      </Badge>
                    </div>
                    <div className="text-gray-600">
                      {selecao.categoria_aposta} - {selecao.detalhe_aposta}
                      {selecao.players && ` (${selecao.players.jogador})`}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center border-t pt-3">
                <div>
                  <span className="text-sm text-gray-600">Valor apostado: </span>
                  <span className="font-medium">R$ {bilhete.valor_apostado.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Odd total: </span>
                  <span className="font-bold">{bilhete.odd_total.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Retorno: </span>
                  <span className={`font-bold ${
                    bilhete.status_bilhete === 'GANHO' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    R$ {bilhete.status_bilhete === 'GANHO' 
                      ? (bilhete.valor_apostado * bilhete.odd_total).toFixed(2) 
                      : '0.00'
                    }
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoricoApostas;
