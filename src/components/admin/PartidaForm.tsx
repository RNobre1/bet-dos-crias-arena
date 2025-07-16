import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { 
  generateBalancedTeamsV3, 
  validateLineupInputs, 
  AVAILABLE_ROLES, 
  RequiredRoles, 
  LineupResult,
  TeamPlayerV3 
} from "@/utils/teamFormationV3";
import CampoFutebolV3 from "../escalacoes/CampoFutebolV3";
import { Settings, Users, Shuffle, AlertCircle } from "lucide-react";

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

  // Estados para escalação
  const [numPlayersPerTeam, setNumPlayersPerTeam] = useState(5);
  const [requiredRoles, setRequiredRoles] = useState<RequiredRoles>({ 'Goleiro': 1, 'Atacante': 1 });
  const [generatedLineup, setGeneratedLineup] = useState<LineupResult | null>(null);
  const [isGeneratingLineup, setIsGeneratingLineup] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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

  const availablePlayers = jogadores.filter(j => j.status !== 'Lesionado');
  const maxPlayersPerTeam = Math.min(11, Math.floor(availablePlayers.length / 2));

  const handleRoleChange = (role: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setRequiredRoles(prev => ({
      ...prev,
      [role]: numValue
    }));
  };

  const removeRole = (role: string) => {
    if (role === 'Goleiro') return;
    
    setRequiredRoles(prev => {
      const newRoles = { ...prev };
      delete newRoles[role];
      return newRoles;
    });
  };

  const addRole = (role: string) => {
    if (requiredRoles[role]) return;
    
    setRequiredRoles(prev => ({
      ...prev,
      [role]: 1
    }));
  };

  const validateLineupInputsLocal = () => {
    const validation = validateLineupInputs(
      availablePlayers.length,
      numPlayersPerTeam,
      requiredRoles,
      true // É sempre duas escalações
    );
    
    setValidationErrors(validation.errors);
    return validation.isValid;
  };

  const generateLineup = async () => {
    if (!validateLineupInputsLocal()) {
      toast.error('Corrija os erros antes de gerar a escalação');
      return;
    }

    setIsGeneratingLineup(true);
    try {
      const result = generateBalancedTeamsV3(jogadores, numPlayersPerTeam, requiredRoles);
      setGeneratedLineup(result);
      toast.success('Escalação gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar escalação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar escalação');
    } finally {
      setIsGeneratingLineup(false);
    }
  };

  const movePlayer = (playerId: string, fromTeam: 'A' | 'B', toTeam: 'A' | 'B') => {
    if (!generatedLineup || fromTeam === toTeam) return;

    setGeneratedLineup(prev => {
      if (!prev) return prev;

      const player = fromTeam === 'A' 
        ? prev.timeA.jogadores.find(p => p.id === playerId)
        : prev.timeB.jogadores.find(p => p.id === playerId);

      if (!player) return prev;

      const newTimeA = fromTeam === 'A' 
        ? prev.timeA.jogadores.filter(p => p.id !== playerId)
        : [...prev.timeA.jogadores, player];

      const newTimeB = fromTeam === 'B'
        ? prev.timeB.jogadores.filter(p => p.id !== playerId)
        : [...prev.timeB.jogadores, player];

      return {
        ...prev,
        timeA: { ...prev.timeA, jogadores: newTimeA },
        timeB: { ...prev.timeB, jogadores: newTimeB }
      };
    });
  };

  const criarPartida = async () => {
    if (!timeANome || !timeBNome || !dataPartida) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!generatedLineup) {
      toast.error('Gere uma escalação antes de criar a partida');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partidas')
        .insert({
          time_a_nome: timeANome,
          time_b_nome: timeBNome,
          data_partida: new Date(dataPartida).toISOString(),
          time_a_jogadores: generatedLineup.timeA.jogadores.map(j => j.id),
          time_b_jogadores: generatedLineup.timeB.jogadores.map(j => j.id),
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
    <div className="space-y-6">
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
              className="h-12 min-h-[44px]"
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
              className="h-12 min-h-[44px]"
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
              className="h-12 min-h-[44px]"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={criarPartida} 
              disabled={loading || !generatedLineup}
              className="flex-1 bg-green-600 hover:bg-green-700 h-12 min-h-[44px]"
            >
              {loading ? 'Criando...' : 'Criar Partida'}
            </Button>
            
            <Button 
              onClick={onCancel}
              variant="outline"
              className="flex-1 h-12 min-h-[44px]"
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gerador de Escalação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurar Escalação da Partida
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Configurações */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Jogadores por time: {numPlayersPerTeam}</Label>
                <Slider
                  value={[numPlayersPerTeam]}
                  onValueChange={(value) => setNumPlayersPerTeam(value[0])}
                  min={4}
                  max={maxPlayersPerTeam}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Mín: 4</span>
                  <span>Máx: {maxPlayersPerTeam}</span>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium">Funções Obrigatórias</Label>
                {Object.entries(requiredRoles).map(([role, count]) => (
                  <div key={role} className="flex items-center gap-2">
                    <Label className="flex-1">{role}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="5"
                      value={count}
                      onChange={(e) => handleRoleChange(role, e.target.value)}
                      className="w-20 h-10 min-h-[44px]"
                      disabled={role === 'Goleiro'}
                    />
                    {role !== 'Goleiro' && (
                      <Button
                        onClick={() => removeRole(role)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}

                <div className="pt-2 border-t">
                  <Label className="text-sm text-gray-600">Adicionar função:</Label>
                  <Select onValueChange={addRole}>
                    <SelectTrigger className="h-10 min-h-[44px]">
                      <SelectValue placeholder="Selecione uma função" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_ROLES.filter(role => !requiredRoles[role]).map(role => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={generateLineup}
                disabled={isGeneratingLineup || validationErrors.length > 0}
                className="w-full h-12 min-h-[44px]"
              >
                {isGeneratingLineup ? (
                  <>
                    <Shuffle className="w-4 h-4 mr-2 animate-spin" />
                    Gerando Escalação...
                  </>
                ) : (
                  'Gerar Escalação Oficial'
                )}
              </Button>
            </div>

            {/* Informações */}
            <div className="space-y-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Jogadores Disponíveis:</span>
                  <span className="font-medium">{availablePlayers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lesionados:</span>
                  <span className="font-medium">{jogadores.length - availablePlayers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total em Campo:</span>
                  <span className="font-medium">{numPlayersPerTeam * 2}</span>
                </div>
              </div>

              {generatedLineup && (
                <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm font-medium text-green-800">Escalação Gerada</div>
                  <div className="text-xs text-green-600 space-y-1">
                    <div>Custo de Desequilíbrio: {generatedLineup.custoDesequilibrio.toFixed(2)}</div>
                    <div>Diferença de Notas: {Math.abs(generatedLineup.timeA.scoreNotaTotal - generatedLineup.timeB.scoreNotaTotal).toFixed(1)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Visualização da Escalação */}
          {generatedLineup && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Escalação Oficial da Partida</h3>
                <CampoFutebolV3 
                  timeA={generatedLineup.timeA.jogadores}
                  timeB={generatedLineup.timeB.jogadores}
                  showTeam="AMBOS"
                />
              </div>

              {/* Opções de Edição */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600 text-lg">{timeANome || 'Time A'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {generatedLineup.timeA.jogadores.map((player) => (
                        <div key={player.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <div>
                            <span className="font-medium">{player.jogador}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {player.assignedRole}
                            </Badge>
                          </div>
                          <Button
                            onClick={() => movePlayer(player.id, 'A', 'B')}
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            → Time B
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-blue-600 text-lg">{timeBNome || 'Time B'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {generatedLineup.timeB.jogadores.map((player) => (
                        <div key={player.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                          <div>
                            <span className="font-medium">{player.jogador}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {player.assignedRole}
                            </Badge>
                          </div>
                          <Button
                            onClick={() => movePlayer(player.id, 'B', 'A')}
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-800"
                          >
                            ← Time A
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PartidaForm;