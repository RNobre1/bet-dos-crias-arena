
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

interface PartidaFormProps {
  partidaAtiva: Tables<"partidas"> | null;
  onPartidaUpdate: () => void;
}

type StatusPartida = Tables<'partidas'>['status'];

const PartidaForm: React.FC<PartidaFormProps> = ({ partidaAtiva, onPartidaUpdate }) => {
  const [formData, setFormData] = useState<{
    data_partida: string;
    time_a_nome: string;
    time_b_nome: string;
    status: StatusPartida;
  }>({
    data_partida: '',
    time_a_nome: '',
    time_b_nome: '',
    status: 'AGENDADA'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (partidaAtiva) {
        // Atualizar partida existente
        const { error } = await supabase
          .from('partidas')
          .update({
            data_partida: formData.data_partida,
            time_a_nome: formData.time_a_nome,
            time_b_nome: formData.time_b_nome,
            status: formData.status
          })
          .eq('partida_id', partidaAtiva.partida_id);

        if (error) throw error;
        toast.success('Partida atualizada com sucesso!');
      } else {
        // Criar nova partida
        const { error } = await supabase
          .from('partidas')
          .insert({
            data_partida: formData.data_partida,
            time_a_nome: formData.time_a_nome,
            time_b_nome: formData.time_b_nome,
            status: formData.status
          });

        if (error) throw error;
        toast.success('Nova partida criada com sucesso!');
      }

      onPartidaUpdate();
      if (!partidaAtiva) {
        setFormData({
          data_partida: '',
          time_a_nome: '',
          time_b_nome: '',
          status: 'AGENDADA'
        });
      }
    } catch (error) {
      console.error('Erro ao salvar partida:', error);
      toast.error('Erro ao salvar partida');
    } finally {
      setLoading(false);
    }
  };

  // Preencher form com dados da partida ativa
  React.useEffect(() => {
    if (partidaAtiva) {
      setFormData({
        data_partida: new Date(partidaAtiva.data_partida).toISOString().slice(0, 16),
        time_a_nome: partidaAtiva.time_a_nome,
        time_b_nome: partidaAtiva.time_b_nome,
        status: partidaAtiva.status
      });
    }
  }, [partidaAtiva]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="time_a_nome">Nome do Time A</Label>
          <Input
            id="time_a_nome"
            value={formData.time_a_nome}
            onChange={(e) => setFormData({...formData, time_a_nome: e.target.value})}
            placeholder="Ex: Time Azul"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time_b_nome">Nome do Time B</Label>
          <Input
            id="time_b_nome"
            value={formData.time_b_nome}
            onChange={(e) => setFormData({...formData, time_b_nome: e.target.value})}
            placeholder="Ex: Time Vermelho"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data_partida">Data e Hora da Partida</Label>
          <Input
            id="data_partida"
            type="datetime-local"
            value={formData.data_partida}
            onChange={(e) => setFormData({...formData, data_partida: e.target.value})}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Status da Partida</Label>
          <Select value={formData.status} onValueChange={(value: StatusPartida) => setFormData({...formData, status: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AGENDADA">Agendada</SelectItem>
              <SelectItem value="AO_VIVO">Ao Vivo</SelectItem>
              <SelectItem value="FINALIZADA">Finalizada</SelectItem>
              <SelectItem value="ADIADA">Adiada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Salvando...' : (partidaAtiva ? 'Atualizar Partida' : 'Criar Nova Partida')}
      </Button>
    </form>
  );
};

export default PartidaForm;
