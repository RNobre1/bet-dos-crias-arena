
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { gerarEscalacoes } from "@/utils/teamFormation";

interface PartidaFormProps {
  onPartidaCriada: () => void;
  onCancel: () => void;
}

const PartidaForm: React.FC<PartidaFormProps> = ({ onPartidaCriada, onCancel }) => {
  const [timeANome, setTimeANome] = useState('');
  const [timeBNome, setTimeBNome] = useState('');
  const [dataPartida, setDataPartida] = useState('');
  const [loading, setLoading] = useState(false);
  const [jogadores, setJogadores] = useState<Tables<"players">[]>([]);

  useEffect(() => {
    loadJogadores();
  }, []);

  const loadJogadores = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .neq('status', 'Lesionado')
        .order('nota', { ascending: false });

      if (error) throw error;
      setJogadores(data || []);
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
      toast.error('Erro ao carregar jogadores');
    }
  };

  const criarPartida = async () => {
    if (!timeANome || !timeBNome || !dataPartida) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (jogadores.length < 10) {
      toast.error('É necessário ter pelo menos 10 jogadores disponíveis para criar uma partida');
      return;
    }

    setLoading(true);
    try {
      // Gerar escalações automaticamente
      const escalacoes = gerarEscalacoes(jogadores);
      
      if (!escalacoes) {
        toast.error('Não foi possível gerar escalações válidas com os jogadores disponíveis');
        return;
      }

      const { data, error } = await supabase
        .from('partidas')
        .insert({
          time_a_nome: timeANome,
          time_b_nome: timeBNome,
          data_partida: new Date(dataPartida).toISOString(),
          time_a_jogadores: escalacoes.timeA.map(j => j.id),
          time_b_jogadores: escalacoes.timeB.map(j => j.id),
          status: 'AGENDADA'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Partida criada com sucesso!');
      onPartidaCriada();
    } catch (error) {
      console.error('Erro ao criar partida:', error);
      toast.error('Erro ao criar partida');
    } finally {
      setLoading(false);
    }
  };

  // Definir data mínima como agora
  const agora = new Date();
  const dataMinima = agora.toISOString().slice(0, 16);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Partida</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="timeA">Nome do Time A</Label>
          <Input
            id="timeA"
            type="text"
            value={timeANome}
            onChange={(e) => setTimeANome(e.target.value)}
            placeholder="Ex: Time Azul"
          />
        </div>

        <div>
          <Label htmlFor="timeB">Nome do Time B</Label>
          <Input
            id="timeB"
            type="text"
            value={timeBNome}
            onChange={(e) => setTimeBNome(e.target.value)}
            placeholder="Ex: Time Vermelho"
          />
        </div>

        <div>
          <Label htmlFor="data">Data e Hora da Partida</Label>
          <Input
            id="data"
            type="datetime-local"
            value={dataPartida}
            onChange={(e) => setDataPartida(e.target.value)}
            min={dataMinima}
          />
        </div>

        <div className="text-sm text-gray-600">
          <p>As escalações serão geradas automaticamente baseadas nas notas dos jogadores.</p>
          <p>Jogadores disponíveis: {jogadores.length}</p>
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={criarPartida} 
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Criando...' : 'Criar Partida'}
          </Button>
          
          <Button 
            onClick={onCancel}
            variant="outline"
            className="flex-1"
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PartidaForm;
