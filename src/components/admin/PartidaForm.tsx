
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type StatusPartida = Tables<'partidas'>['status'];

interface PartidaFormProps {
  partidaAtiva: Tables<"partidas"> | null;
  onPartidaUpdate: () => void;
}

const PartidaForm: React.FC<PartidaFormProps> = ({ partidaAtiva, onPartidaUpdate }) => {
  const [formData, setFormData] = useState<{
    data_partida: string;
    time_a_nome: string;
    time_b_nome: string;
    status: StatusPartida;
  }>({
    data_partida: partidaAtiva?.data_partida ? new Date(partidaAtiva.data_partida).toISOString().slice(0, 16) : '',
    time_a_nome: partidaAtiva?.time_a_nome || 'Time A',
    time_b_nome: partidaAtiva?.time_b_nome || 'Time B',
    status: partidaAtiva?.status || 'AGENDADA'
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (partidaAtiva) {
        // Atualizar partida existente
        const { error } = await supabase
          .from('partidas')
          .update({
            data_partida: new Date(formData.data_partida).toISOString(),
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
            data_partida: new Date(formData.data_partida).toISOString(),
            time_a_nome: formData.time_a_nome,
            time_b_nome: formData.time_b_nome,
            status: formData.status
          });

        if (error) throw error;
        toast.success('Partida criada com sucesso!');
      }

      onPartidaUpdate();
    } catch (error) {
      console.error('Erro ao salvar partida:', error);
      toast.error('Erro ao salvar partida');
    } finally {
      setIsLoading(false);
    }
  };

  const criarNovaPartida = () => {
    setFormData({
      data_partida: '',
      time_a_nome: 'Time A',
      time_b_nome: 'Time B',
      status: 'AGENDADA'
    });
  };

  return (
    <div className="space-y-6">
      {!partidaAtiva && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Nova Partida</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={criarNovaPartida} className="w-full">
              Criar Partida
            </Button>
          </CardContent>
        </Card>
      )}

      {(partidaAtiva || formData.data_partida) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {partidaAtiva ? 'Editar Partida Ativa' : 'Nova Partida'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="data_partida">Data e Hora da Partida</Label>
                <Input
                  id="data_partida"
                  type="datetime-local"
                  value={formData.data_partida}
                  onChange={(e) => setFormData({...formData, data_partida: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="time_a_nome">Nome do Time A</Label>
                  <Input
                    id="time_a_nome"
                    value={formData.time_a_nome}
                    onChange={(e) => setFormData({...formData, time_a_nome: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="time_b_nome">Nome do Time B</Label>
                  <Input
                    id="time_b_nome"
                    value={formData.time_b_nome}
                    onChange={(e) => setFormData({...formData, time_b_nome: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status da Partida</Label>
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

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Salvando...' : (partidaAtiva ? 'Atualizar Partida' : 'Criar Partida')}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PartidaForm;
