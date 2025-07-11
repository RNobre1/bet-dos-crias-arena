
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tables } from "@/integrations/supabase/types";
import { Calendar, Clock } from "lucide-react";

interface SelecaoPartidaProps {
  partidas: Tables<"partidas">[];
  partidaSelecionada: Tables<"partidas"> | null;
  onPartidaChange: (partida: Tables<"partidas"> | null) => void;
}

const SelecaoPartida: React.FC<SelecaoPartidaProps> = ({ 
  partidas, 
  partidaSelecionada, 
  onPartidaChange 
}) => {
  const partidasDisponiveis = partidas.filter(p => 
    p.status === 'AGENDADA' || p.status === 'AO_VIVO'
  );

  if (partidasDisponiveis.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Nenhuma Partida Disponível
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Não há partidas disponíveis para apostas no momento.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Selecione a Partida
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select 
          value={partidaSelecionada?.partida_id.toString() || ""} 
          onValueChange={(value) => {
            const partida = partidasDisponiveis.find(p => p.partida_id.toString() === value);
            onPartidaChange(partida || null);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Escolha uma partida para apostar" />
          </SelectTrigger>
          <SelectContent>
            {partidasDisponiveis.map((partida) => (
              <SelectItem key={partida.partida_id} value={partida.partida_id.toString()}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {partida.time_a_nome} vs {partida.time_b_nome}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-3 h-3" />
                    {new Date(partida.data_partida).toLocaleString('pt-BR')}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {partidaSelecionada && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">
              {partidaSelecionada.time_a_nome} vs {partidaSelecionada.time_b_nome}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{new Date(partidaSelecionada.data_partida).toLocaleString('pt-BR')}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SelecaoPartida;
