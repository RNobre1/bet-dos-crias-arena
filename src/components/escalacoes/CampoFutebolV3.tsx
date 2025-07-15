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
      } shadow-lg ${isMobile ? 'min-w-[60px] max-w-[70px]' : 'min-w-[80px] max-w-[100px]'}`}
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
      <div className={`${isMobile ? 'text-xs' : 'text-xs'} mt-1 opacity-75`}>
        A:{player.scoreAtaque.toFixed(1)} D:{player.scoreDefesa.toFixed(1)}
      </div>
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
      goleiro: team.filter(p => (p.assignedRole || p.primaryAptitude).includes('GOL')),
      defensores: team.filter(p => {
        const role = p.assignedRole || p.primaryAptitude;
        return role.includes('ZAG') || role.includes('LAT');
      }),
      meios: team.filter(p => {
        const role = p.assignedRole || p.primaryAptitude;
        return role.includes('VOL') || role.includes('MEI') || role.includes('PTA');
      }),
      atacantes: team.filter(p => (p.assignedRole || p.primaryAptitude).includes('ATK'))
    };

    // Se não há jogadores em uma posição específica, distribuir os restantes
    const unassigned = team.filter(p => {
      const role = p.assignedRole || p.primaryAptitude;
      return !role.includes('GOL') && !role.includes('ZAG') && !role.includes('LAT') && 
             !role.includes('VOL') && !role.includes('MEI') && !role.includes('PTA') && 
             !role.includes('ATK');
    });

    // Adicionar jogadores não atribuídos aos atacantes por padrão
    positions.atacantes.push(...unassigned);

    return positions;
  };

  const renderTeamFormation = (team: TeamPlayerV3[], isTeamA: boolean) => {
    const positions = organizePlayersByPosition(team);
    
    // Determine vertical spacing based on number of lines with players
    const activeLines = [
      positions.goleiro.length > 0,
      positions.defensores.length > 0,
      positions.meios.length > 0,
      positions.atacantes.length > 0
    ].filter(Boolean).length;

    // Adjust gap based on number of active lines
    let verticalGapClass = 'justify-between'; // Default for 4 lines
    if (activeLines === 3) {
      verticalGapClass = 'justify-around'; // More space if fewer lines
    } else if (activeLines < 3) {
      verticalGapClass = 'justify-evenly'; // Even more space
    }

    return (
      <div className={`flex flex-col items-center h-full py-2 ${verticalGapClass} ${
        isTeamA ? '' : 'flex-col-reverse'
      }`}>
        {/* Goleiro */}
        {positions.goleiro.length > 0 && (
          <div className="flex justify-center w-full">
            {positions.goleiro.map(player => renderPlayer(player, isTeamA))}
          </div>
        )}
        
        {/* Defensores */}
        {positions.defensores.length > 0 && (
          <div className={`flex justify-center w-full ${isMobile ? 'gap-2' : 'gap-4'}`}>
          <div className={`flex justify-center ${isMobile ? 'gap-2' : 'gap-4'}`}>
            {positions.defensores.map(player => renderPlayer(player, isTeamA))}
          </div>
        )}
        
        {/* Meio-campo */}
        {positions.meios.length > 0 && (
          <div className={`flex justify-center w-full ${isMobile ? 'gap-2' : 'gap-4'}`}>
          <div className={`flex justify-center ${isMobile ? 'gap-2' : 'gap-4'}`}>
            {positions.meios.map(player => renderPlayer(player, isTeamA))}
          </div>
        )}
        
        {/* Atacantes */}
        {positions.atacantes.length > 0 && (
          <div className={`flex justify-center w-full ${isMobile ? 'gap-2' : 'gap-4'}`}>
          <div className={`flex justify-center ${isMobile ? 'gap-2' : 'gap-4'}`}>
            {positions.atacantes.map(player => renderPlayer(player, isTeamA))}
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Campo de futebol */}
      <div 
        className="relative bg-green-500 rounded-lg shadow-xl"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(255,255,255,0.2) 50%, transparent 50%),
            linear-gradient(rgba(255,255,255,0.2) 50%, transparent 50%)
          `,
          backgroundSize: isMobile ? '15px 15px' : '20px 20px',
          minHeight: isMobile ? '450px' : '650px' // Increased minHeight
        }}
      >
        {/* Linhas do campo */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Linha central */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white transform -translate-y-1/2"></div>
          
          {/* Círculo central */}
          <div className={`absolute top-1/2 left-1/2 ${isMobile ? 'w-16 h-16' : 'w-24 h-24'} border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2`}></div>
          
          {/* Áreas do goleiro */}
          {/* Adjusted positioning to be closer to the edge */}
          <div className={`absolute top-2 left-1/2 ${isMobile ? 'w-24 h-12' : 'w-32 h-16'} border-2 border-white transform -translate-x-1/2`}></div>
          <div className={`absolute bottom-2 left-1/2 ${isMobile ? 'w-24 h-12' : 'w-32 h-16'} border-2 border-white transform -translate-x-1/2`}></div>
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
    </div>
  );
};

export default CampoFutebolV3;