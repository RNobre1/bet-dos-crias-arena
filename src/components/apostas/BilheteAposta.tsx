
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Selecao } from '@/types/apostas';

interface BilheteApostaProps {
  selecoes: Selecao[];
  onRemoverSelecao: (id: string) => void;
  onLimparBilhete: () => void;
}

const BilheteAposta: React.FC<BilheteApostaProps> = ({ 
  selecoes, 
  onRemoverSelecao, 
  onLimparBilhete 
}) => {
  const { profile } = useAuth();
  const [valorAposta, setValorAposta] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const oddTotal = selecoes.reduce((total, selecao) => total * selecao.odd, 1);
  const retornoPotencial = parseFloat(valorAposta || '0') * oddTotal;
  const tipoBilhete = selecoes.length > 1 ? 'MULTIPLA' : 'SIMPLES';

  const confirmarAposta = async () => {
    if (!profile) {
      toast.error('Você precisa estar logado para apostar');
      return;
    }

    if (selecoes.length === 0) {
      toast.error('Adicione pelo menos uma seleção ao bilhete');
      return;
    }

    const valor = parseFloat(valorAposta);
    if (!valor || valor <= 0) {
      toast.error('Digite um valor válido para a aposta');
      return;
    }

    if (valor > (profile.saldo_ficticio || 0)) {
      toast.error('Saldo insuficiente');
      return;
    }

    setIsLoading(true);

    try {
      // Criar o bilhete
      const { data: bilhete, error: bilheteError } = await supabase
        .from('bilhetes')
        .insert({
          user_id: profile.user_id,
          valor_apostado: valor,
          odd_total: oddTotal,
          tipo_bilhete: tipoBilhete
        })
        .select()
        .single();

      if (bilheteError) throw bilheteError;

      // Criar as seleções
      const selecoesData = selecoes.map(selecao => ({
        bilhete_id: bilhete.bilhete_id,
        partida_id: selecao.partida_id,
        odd_selecao: selecao.odd,
        categoria_aposta: selecao.categoria,
        detalhe_aposta: selecao.detalhe,
        jogador_alvo_id: selecao.jogador_id || null
      }));

      const { error: selecoesError } = await supabase
        .from('selecoes')
        .insert(selecoesData);

      if (selecoesError) throw selecoesError;

      // Atualizar saldo do usuário
      const { error: saldoError } = await supabase
        .from('usuarios')
        .update({ saldo_ficticio: (profile.saldo_ficticio || 0) - valor })
        .eq('user_id', profile.user_id);

      if (saldoError) throw saldoError;

      toast.success('Aposta confirmada com sucesso!');
      onLimparBilhete();
      setValorAposta('');
      
      // Recarregar a página para atualizar o saldo
      window.location.reload();
    } catch (error) {
      console.error('Erro ao confirmar aposta:', error);
      toast.error('Erro ao confirmar aposta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Bilhete de Aposta
          {selecoes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLimparBilhete}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selecoes.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Clique nas odds para adicionar seleções ao seu bilhete
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {selecoes.map((selecao) => (
                <div key={selecao.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{selecao.descricao}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {selecao.odd}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoverSelecao(selecao.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Tipo:</span>
                <Badge variant={tipoBilhete === 'MULTIPLA' ? 'default' : 'secondary'}>
                  {tipoBilhete}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Odd Total:</span>
                <Badge variant="default" className="font-bold">
                  {oddTotal.toFixed(2)}
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Valor da Aposta (R$)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={valorAposta}
                  onChange={(e) => setValorAposta(e.target.value)}
                  step="0.01"
                  min="0.01"
                  max={profile?.saldo_ficticio || 0}
                  className="h-12 min-h-[44px]"
                />
              </div>

              {valorAposta && parseFloat(valorAposta) > 0 && (
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Retorno Potencial:</span>
                    <span className="font-bold text-green-700">
                      R$ {retornoPotencial.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <Button 
                onClick={confirmarAposta}
                disabled={isLoading || !valorAposta || parseFloat(valorAposta) <= 0}
                className="w-full h-12 min-h-[44px]"
              >
                {isLoading ? 'Confirmando...' : 'Confirmar Aposta'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BilheteAposta;
