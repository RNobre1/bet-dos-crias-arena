import React from 'react';
import { Badge } from "@/components/ui/badge";
import { TeamPlayerV3 } from "@/utils/teamFormationV3";
import { useIsMobile } from "@/hooks/use-mobile";

interface CampoFutebolV3Props {
  timeA: TeamPlayerV3[];
  timeB: TeamPlayerV3[];
  showTeam: 'A' | 'B' | 'AMBOS';
}

const CampoFutebolV3: React.FC<CampoFutebolV3Props> = ({ timeA, timeB, showTeam }) => {
  const isMobile = useIsMobile();

  const renderPlayer = (player: TeamPlayerV3, isTeamA: boolean) => (
    <div
      key={player.id}
      className={`flex flex-col items-center p-2 rounded-lg ${
        isTeamA ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
      } shadow-lg ${isMobile ? 'min-w-[55px] max-w-[65px]' : 'min-w-[75px] max-w-[90px]'}`}
    >
      <div className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold`}>
        {player.scoreNota.toFixed(1)}
      </div>
      <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-center font-medium truncate w-full`}>
        {isMobile ? player.jogador.split(' ')[0] : player.jogador}
      </div>
      <Badge variant="secondary" className={`${isMobile ? 'text-xs' : 'text-xs'} mt-1`}>
        {getRoleAbbreviation(player.assignedRole || player.primaryAptitude)}
      </Badge>
      {!isMobile && (
        <div className="text-xs mt-1 opacity-75">
          A:{player.scoreAtaque.toFixed(1)} D:{player.scoreDefesa.toFixed(1)}
        </div>
      )}
    </div>
  );

  const getRoleAbbreviation = (role: string): string => {
    const abbreviations: { [key: string]: string } = {
      'Goleiro': 'GOL',
      'Zagueiro': 'ZAG',
      'Lateral': 'LAT',
      'Volante': 'VOL',
      'Meia': 'MEI',
      'Ponta': 'PTA',
      'Atacante': 'ATK',
      'P_GOL': 'GOL',
      'P_ZAG': 'ZAG',
      'P_LAT': 'LAT',
      'P_VOL': 'VOL',
      'P_MEI': 'MEI',
      'P_PTA': 'PTA',
      'P_ATK': 'ATK'
    };
    return abbreviations[role] || 'JOG';
  };

  const organizePlayersByPosition = (team: TeamPlayerV3[]) => {
    const positions = {
      goleiro: team.filter(p => {
        const role = p.assignedRole || p.primaryAptitude;
        return role === 'Goleiro' || role === 'P_GOL';
      }),
      defensores: team.filter(p => {
        const role = p.assignedRole || p.primaryAptitude;
        return role === 'Zagueiro' || role === 'Lateral' || role === 'P_ZAG' || role === 'P_LAT';
      }),
      meios: team.filter(p => {
        const role = p.assignedRole || p.primaryAptitude;
        return role === 'Volante' || role === 'Meia' || 
               role === 'P_VOL' || role === 'P_MEI';
      }),
      atacantes: team.filter(p => {
        const role = p.assignedRole || p.primaryAptitude;
        return role === 'Atacante' ||  role === 'Ponta' || 
               role === 'P_ATK' || role === 'P_PTA';
      })
    };

    // Verificar se há jogadores não categorizados e distribuí-los
    const categorizedIds = new Set([
      ...positions.goleiro.map(p => p.id),
      ...positions.defensores.map(p => p.id),
      ...positions.meios.map(p => p.id),
      ...positions.atacantes.map(p => p.id)
    ]);

    const uncategorized = team.filter(p => !categorizedIds.has(p.id));
    
    // Distribuir jogadores não categorizados baseado em suas aptidões
    uncategorized.forEach(player => {
      const role = player.assignedRole || player.primaryAptitude;
      
      // Se ainda assim não conseguir categorizar, usar como meio-campo por padrão
      if (player.scoreAtaque > player.scoreDefesa) {
        positions.atacantes.push(player);
      } else {
        positions.meios.push(player);
      }
    });

    return positions;
  };

  const renderTeamFormation = (team: TeamPlayerV3[], isTeamA: boolean) => {
    const positions = organizePlayersByPosition(team);
    
    // Determinar quantas linhas têm jogadores
    const activeLines = [
      positions.goleiro.length > 0,
      positions.defensores.length > 0,
      positions.meios.length > 0,
      positions.atacantes.length > 0
    ].filter(Boolean).length;

    // Ajustar espaçamento baseado no número de linhas ativas
    const getVerticalSpacing = () => {
      if (activeLines <= 2) return 'justify-around';
      if (activeLines === 3) return 'justify-between';
      return 'justify-between'; // Para 4 linhas
    };

    const verticalSpacing = getVerticalSpacing();

    return (
      <div className={`flex flex-col items-center h-full ${verticalSpacing} ${
        isMobile ? 'py-1' : 'py-2'
      } ${isTeamA ? '' : 'flex-col-reverse'}`}>
        
        {/* Goleiro - sempre na extremidade */}
        {positions.goleiro.length > 0 && (
          <div className={`flex justify-center w-full ${isMobile ? 'mb-1' : 'mb-2'}`}>
            <div className={`flex justify-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
              {positions.goleiro.map(player => renderPlayer(player, isTeamA))}
            </div>
          </div>
        )}
        
        {/* Defensores - segunda linha */}
        {positions.defensores.length > 0 && (
          <div className={`flex justify-center w-full ${isMobile ? 'mb-1' : 'mb-2'}`}>
            <div className={`flex justify-center flex-wrap ${isMobile ? 'gap-1' : 'gap-2'}`}>
              {positions.defensores.map(player => renderPlayer(player, isTeamA))}
            </div>
          </div>
        )}
        
        {/* Meio-campo - terceira linha */}
        {positions.meios.length > 0 && (
          <div className={`flex justify-center w-full ${isMobile ? 'mb-1' : 'mb-2'}`}>
            <div className={`flex justify-center flex-wrap ${isMobile ? 'gap-1' : 'gap-2'}`}>
              {positions.meios.map(player => renderPlayer(player, isTeamA))}
            </div>
          </div>
        )}
        
        {/* Atacantes - quarta linha */}
        {positions.atacantes.length > 0 && (
          <div className="flex justify-center w-full">
            <div className={`flex justify-center flex-wrap ${isMobile ? 'gap-1' : 'gap-2'}`}>
              {positions.atacantes.map(player => renderPlayer(player, isTeamA))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Campo de futebol */}
      <div 
        className="relative bg-green-500 rounded-lg shadow-xl overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(255,255,255,0.2) 50%, transparent 50%),
            linear-gradient(rgba(255,255,255,0.2) 50%, transparent 50%)
          `,
          backgroundSize: isMobile ? '15px 15px' : '20px 20px',
          minHeight: isMobile ? '500px' : '700px' // Aumentado para melhor espaçamento
        }}
      >
        {/* Linhas do campo */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Linha central */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white transform -translate-y-1/2"></div>
          
          {/* Círculo central */}
          <div className={`absolute top-1/2 left-1/2 ${isMobile ? 'w-16 h-16' : 'w-24 h-24'} border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2`}></div>
          
          {/* Áreas do goleiro - mais próximas das extremidades */}
          <div className={`absolute top-1 left-1/2 ${isMobile ? 'w-20 h-10' : 'w-28 h-14'} border-2 border-white transform -translate-x-1/2`}></div>
          <div className={`absolute bottom-1 left-1/2 ${isMobile ? 'w-20 h-10' : 'w-28 h-14'} border-2 border-white transform -translate-x-1/2`}></div>
          
          {/* Grandes áreas */}
          <div className={`absolute top-1 left-1/2 ${isMobile ? 'w-32 h-16' : 'w-40 h-20'} border-2 border-white transform -translate-x-1/2 opacity-60`}></div>
          <div className={`absolute bottom-1 left-1/2 ${isMobile ? 'w-32 h-16' : 'w-40 h-20'} border-2 border-white transform -translate-x-1/2 opacity-60`}></div>
        </div>

        {/* Time A (parte superior) */}
        {(showTeam === 'A' || showTeam === 'AMBOS') && (
          <div className="absolute top-0 left-0 right-0 h-1/2">
            {renderTeamFormation(timeA, true)}
          </div>
        )}

        {/* Time B (parte inferior) */}
        {(showTeam === 'B' || showTeam === 'AMBOS') && (
          <div className="absolute bottom-0 left-0 right-0 h-1/2">
            {renderTeamFormation(timeB, false)}
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className={`flex justify-center ${isMobile ? 'gap-4' : 'gap-8'} mt-4`}>
        {(showTeam === 'A' || showTeam === 'AMBOS') && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <span className={`font-medium ${isMobile ? 'text-sm' : ''}`}>Time A</span>
          </div>
        )}
        {(showTeam === 'B' || showTeam === 'AMBOS') && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            <span className={`font-medium ${isMobile ? 'text-sm' : ''}`}>Time B</span>
          </div>
        )}
      </div>

      {/* Informações adicionais para mobile */}
      {isMobile && (
        <div className="mt-4 text-xs text-gray-600 text-center">
          <p>Nota • Ataque/Defesa • Função</p>
        </div>
      )}
    </div>
  );
};

export default CampoFutebolV3;