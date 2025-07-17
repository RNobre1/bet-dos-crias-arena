
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { calculatePlayerNote } from "@/utils/playerNotesCalculator";
import { useIsMobile } from "@/hooks/use-mobile";

interface TabelaClassificacaoProps {
  jogadores: Tables<"players">[];
}

const TabelaClassificacao: React.FC<TabelaClassificacaoProps> = ({ jogadores }) => {
  const isMobile = useIsMobile();
  
  // Calcular notas usando a fórmula correta
  const jogadoresComNota = jogadores.map(player => ({
    ...player,
    notaCalculada: calculatePlayerNote(player)
  })).sort((a, b) => b.notaCalculada - a.notaCalculada);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'Lesionado': return 'destructive';
      case 'Disponível': return 'default';
      default: return 'secondary';
    }
  };

  const MobileCard = ({ player, index }: { player: any, index: number }) => (
    <Card className={`mb-4 ${index < 3 ? 'bg-green-50 border-green-200' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg">
              #{index + 1}
              {index === 0 && " 🥇"}
              {index === 1 && " 🥈"} 
              {index === 2 && " 🥉"}
            </span>
            <div>
              <Link to={`/player/${player.id}`}>
                <h3 className="font-semibold text-lg text-blue-600 hover:text-blue-800 cursor-pointer transition-colors">
                  {player.jogador}
                </h3>
              </Link>
              <Badge variant={getStatusColor(player.status)} className="text-xs">
                {player.status || 'N/A'}
              </Badge>
            </div>
          </div>
          <Badge variant={index < 3 ? "default" : "secondary"} className="font-bold text-lg">
            {player.notaCalculada.toFixed(1)}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Jogos:</span>
              <span className="font-medium">{player.jogos}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600">Gols:</span>
              <span className="font-semibold text-blue-600">{player.gols}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-600">Assist:</span>
              <span className="font-semibold text-purple-600">{player.assistencias}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-green-600">Defesas:</span>
              <span className="font-semibold text-green-600">{player.defesas}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-600">Desarmes:</span>
              <span className="font-semibold text-orange-600">{player.desarmes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600">Faltas:</span>
              <span className="font-semibold text-red-600">{player.faltas}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <div className="w-6 h-6 bg-green-600 rounded mr-2"></div>
            Classificação dos Jogadores
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-gray-500 hover:text-gray-700 transition-colors">
                  <HelpCircle className="w-4 h-4" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Como a Nota é Calculada (V2.2)</DialogTitle>
                </DialogHeader>
                <div className="text-sm space-y-3">
                  <div>
                    <p className="font-semibold mb-2">Algoritmo: Nota Média de Performance</p>
                    <p className="mb-2">Transforma estatísticas totais em uma nota que representa o desempenho médio por jogo.</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold mb-1">Pontos de Ação:</p>
                    <ul className="text-xs space-y-1">
                      <li>• <strong>Gol:</strong> +3.0 pontos</li>
                      <li>• <strong>Assistência:</strong> +2.0 pontos</li>
                      <li>• <strong>Desarme:</strong> +0.5 pontos</li>
                      <li>• <strong>Defesa:</strong> +0.8 pontos</li>
                      <li>• <strong>Falta:</strong> -0.2 pontos</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-semibold mb-1">Cálculo:</p>
                    <ol className="text-xs space-y-1">
                      <li>1. <strong>Pontuação Total:</strong> Soma de todos os pontos de ação</li>
                      <li>2. <strong>Média por Jogo:</strong> Pontuação Total ÷ Jogos</li>
                      <li>3. <strong>Nota Final:</strong> Mapeamento usando curva logística (escala 5.0-10.0)</li>
                    </ol>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            <div className="space-y-4">
              {jogadoresComNota.map((player, index) => (
                <MobileCard key={player.id} player={player} index={index} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-2 font-semibold">#</th>
                    <th className="text-left p-2 font-semibold">Jogador</th>
                    <th className="text-center p-2 font-semibold">Nota</th>
                    <th className="text-center p-2 font-semibold">Jogos</th>
                    <th className="text-center p-2 font-semibold">Gols</th>
                    <th className="text-center p-2 font-semibold">Assist</th>
                    <th className="text-center p-2 font-semibold">Defesas</th>
                    <th className="text-center p-2 font-semibold">Desarmes</th>
                    <th className="text-center p-2 font-semibold">Faltas</th>
                    <th className="text-center p-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jogadoresComNota.map((player, index) => (
                    <tr key={player.id} className={`border-b border-gray-100 ${index < 3 ? 'bg-green-50' : ''}`}>
                    <tr key={player.id} className={`border-b border-gray-100 dark:border-slate-700 ${
                      index < 3 ? 'bg-green-50 dark:bg-green-500/10' : ''
                    } ${
                      player.status === 'Lesionado' ? 'bg-red-50 dark:bg-red-500/15' : ''
                    }`}>
                      <td className="p-2 font-semibold text-center">
                        {index + 1}
                        {index === 0 && "🥇"}
                        {index === 1 && "🥈"} 
                        {index === 2 && "🥉"}
                      </td>
                     <td className="p-2 font-medium">
                       <Link to={`/player/${player.id}`} className="text-blue-600 hover:text-blue-800 transition-colors">
                         {player.jogador}
                       </Link>
                     </td>
                      <td className="p-2 text-center">
                        <Badge variant={index < 3 ? "default" : "secondary"} className="font-bold">
                          {player.notaCalculada.toFixed(1)}
                        </Badge>
                      </td>
                      <td className="p-2 text-center">{player.jogos}</td>
                      <td className="p-2 text-center text-blue-600 font-semibold">{player.gols}</td>
                      <td className="p-2 text-center text-purple-600 font-semibold">{player.assistencias}</td>
                      <td className="p-2 text-center text-green-600 font-semibold">{player.defesas}</td>
                      <td className="p-2 text-center text-orange-600 font-semibold">{player.desarmes}</td>
                      <td className="p-2 text-center text-red-600 font-semibold">{player.faltas}</td>
                      <td className="p-2 text-center">
                        <Badge variant={getStatusColor(player.status)}>
                          {player.status || 'N/A'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TabelaClassificacao;
