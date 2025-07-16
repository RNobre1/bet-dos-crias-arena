import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tables } from "@/integrations/supabase/types";
import { 
  generateBalancedTeamsV3, 
  validateLineupInputs, 
  AVAILABLE_ROLES, 
  RequiredRoles, 
  LineupResult 
} from "@/utils/teamFormationV3";
import CampoFutebolV3 from "./CampoFutebolV3";
import { Loader2, Settings, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface CustomLineupGeneratorProps {
  jogadores: Tables<"players">[];
  onBack: () => void;
}

const CustomLineupGenerator: React.FC<CustomLineupGeneratorProps> = ({ jogadores, onBack }) => {
  const [isDoubleLineup, setIsDoubleLineup] = useState(false);
  const [numPlayersPerTeam, setNumPlayersPerTeam] = useState(5);
  const [requiredRoles, setRequiredRoles] = useState<RequiredRoles>({
    'Goleiro': 1,
    'Atacante': 1
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLineup, setGeneratedLineup] = useState<LineupResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const availablePlayers = jogadores.filter(p => p.status !== 'Lesionado');
  const totalPlayers = availablePlayers.length;
  
  const maxPlayersPerTeam = isDoubleLineup 
    ? Math.min(11, Math.floor(totalPlayers / 2))
    : Math.min(11, totalPlayers);

  const handleRoleChange = (role: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setRequiredRoles(prev => ({
      ...prev,
      [role]: numValue
    }));
  };

  const removeRole = (role: string) => {
    if (role === 'Goleiro') return; // Não pode remover goleiro
    
    setRequiredRoles(prev => {
      const newRoles = { ...prev };
      delete newRoles[role];
      return newRoles;
    });
  };

  const addRole = (role: string) => {
    if (requiredRoles[role]) return; // Já existe
    
    setRequiredRoles(prev => ({
      ...prev,
      [role]: 1
    }));
  };

  const validateInputs = () => {
    const validation = validateLineupInputs(
      totalPlayers,
      numPlayersPerTeam,
      requiredRoles,
      isDoubleLineup
    );
    
    setValidationErrors(validation.errors);
    return validation.isValid;
  };

  const generateLineup = async () => {
    if (!validateInputs()) {
      toast.error('Corrija os erros antes de gerar a escalação');
      return;
    }

    setIsGenerating(true);
    try {
      const result = generateBalancedTeamsV3(jogadores, numPlayersPerTeam, requiredRoles);
      setGeneratedLineup(result);
      toast.success('Escalação gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar escalação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar escalação');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setGeneratedLineup(null);
    setValidationErrors([]);
    setRequiredRoles({
      'Goleiro': 1,
      'Atacante': 1
    });
    setNumPlayersPerTeam(5);
  };

  if (generatedLineup) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Escalação Gerada</h2>
          <div className="flex gap-2">
            <Button onClick={resetForm} variant="outline">
              Gerar Nova Escalação
            </Button>
            <Button onClick={onBack} variant="ghost">
              Voltar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {generatedLineup.custoDesequilibrio.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Custo de Desequilíbrio</div>
                <div className="text-xs text-gray-500 mt-1">
                  (Menor = Mais Equilibrado)
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {generatedLineup.timeA.scoreNotaTotal.toFixed(1)} vs {generatedLineup.timeB.scoreNotaTotal.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Notas Totais</div>
                <div className="text-xs text-gray-500 mt-1">
                  Diferença: {Math.abs(generatedLineup.timeA.scoreNotaTotal - generatedLineup.timeB.scoreNotaTotal).toFixed(1)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {generatedLineup.timeA.formacao} vs {generatedLineup.timeB.formacao}
                </div>
                <div className="text-sm text-gray-600">Formações</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <CampoFutebolV3 
          timeA={generatedLineup.timeA.jogadores}
          timeB={generatedLineup.timeB.jogadores}
          showTeam="AMBOS"
        />

        {generatedLineup.reservas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Reservas e Lesionados ({generatedLineup.reservas.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {generatedLineup.reservas.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{player.jogador}</span>
                    <Badge variant={player.status === 'Lesionado' ? 'destructive' : 'secondary'}>
                      {player.status === 'Lesionado' ? 'Lesionado' : 'Reserva'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Gerador de Escalação Personalizada
        </h2>
        <Button onClick={onBack} variant="ghost">
          Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Configurações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="double-lineup"
                  checked={isDoubleLineup}
                  onCheckedChange={setIsDoubleLineup}
                  disabled={totalPlayers < 8}
                />
                <Label htmlFor="double-lineup">
                  Criar duas escalações para comparar
                </Label>
              </div>

              {totalPlayers < 8 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    É necessário pelo menos 8 jogadores para criar duas escalações.
                    Atualmente há {totalPlayers} jogadores disponíveis.
                  </AlertDescription>
                </Alert>
              )}

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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Funções Obrigatórias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(requiredRoles).map(([role, count]) => (
                <div key={role} className="flex items-center gap-2">
                  <Label className="flex-1">{role}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="5"
                    value={count}
                    onChange={(e) => handleRoleChange(role, e.target.value)}
                    className="w-20"
                    disabled={role === 'Goleiro'} // Goleiro sempre 1
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
                  <SelectTrigger>
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

              <div className="text-xs text-gray-500">
                Total de funções obrigatórias: {Object.values(requiredRoles).reduce((sum, count) => sum + count, 0)} / {numPlayersPerTeam}
              </div>
            </CardContent>
          </Card>

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
            disabled={isGenerating || validationErrors.length > 0}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando Escalação...
              </>
            ) : (
              'Gerar Escalação Otimizada'
            )}
          </Button>
        </div>

        {/* Informações */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Total de Jogadores:</div>
                  <div className="text-gray-600">{totalPlayers}</div>
                </div>
                <div>
                  <div className="font-medium">Lesionados:</div>
                  <div className="text-gray-600">{jogadores.length - totalPlayers}</div>
                </div>
                <div>
                  <div className="font-medium">Jogadores por Time:</div>
                  <div className="text-gray-600">{numPlayersPerTeam}</div>
                </div>
                <div>
                  <div className="font-medium">Total em Campo:</div>
                  <div className="text-gray-600">{isDoubleLineup ? numPlayersPerTeam * 2 : numPlayersPerTeam}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Como Funciona o Algoritmo v3.0</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="font-medium mb-1">Fase 1: Análise de Jogadores</div>
                <div className="text-gray-600">
                  Calcula scores de performance (Nota, Ataque, Defesa) e aptidões por função para cada jogador.
                </div>
              </div>
              
              <div>
                <div className="font-medium mb-1">Fase 2: Otimização Combinatória</div>
                <div className="text-gray-600">
                  Gera todas as combinações válidas de times e seleciona a com menor custo de desequilíbrio.
                </div>
              </div>
              
              <div>
                <div className="font-medium mb-1">Fase 3: Resultado Otimizado</div>
                <div className="text-gray-600">
                  Apresenta os times mais equilibrados possíveis respeitando as funções obrigatórias.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomLineupGenerator;