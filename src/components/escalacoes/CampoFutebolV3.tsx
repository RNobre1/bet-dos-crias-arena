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

  const getOrganizedPlayers = (team: TeamPlayerV3[]) => {
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

    // Handle any players not explicitly assigned to a primary role (e.g., if a player's primary aptitude was not one of the defined roles)
    const assignedPlayerIds = new Set([
      ...positions.goleiro.map(p => p.id),
      ...positions.defensores.map(p => p.id),
      ...positions.meios.map(p => p.id),
      ...positions.atacantes.map(p => p.id),
    ]);

    const unassigned = team.filter(p => !assignedPlayerIds.has(p.id));

    // Distribute unassigned players to the 'meios' line as a fallback
    positions.meios.push(...unassigned);

    // Sort players within each group for consistent rendering
    return positions;
  };

  const teamAOrganized = getOrganizedPlayers(timeA);
  const teamBOrganized = getOrganizedPlayers(timeB);

  const fieldMinHeight = isMobile ? '600px' : '800px'; // Increased height for better spacing

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
          minHeight: fieldMinHeight
        }}
      >
        {/* Linhas do campo */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Linha central */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white transform -translate-y-1/2"></div>
          
          {/* Círculo central */}
          <div className={`absolute top-1/2 left-1/2 ${isMobile ? 'w-16 h-16' : 'w-24 h-24'} border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2`}></div>
          
          {/* Áreas do goleiro */}
          <div className={`absolute top-0 left-1/2 ${isMobile ? 'w-24 h-12' : 'w-32 h-16'} border-2 border-white transform -translate-x-1/2`}></div>
          <div className={`absolute bottom-0 left-1/2 ${isMobile ? 'w-24 h-12' : 'w-32 h-16'} border-2 border-white transform -translate-x-1/2`}></div>
        </div>

        {/* Time A (parte superior) */}
        {(showTeam === 'A' || showTeam === 'AMBOS') && (
          <>
            {/* Goleiro A */}
            <div className="absolute top-[1%] left-0 right-0 flex justify-center items-center">
              {teamAOrganized.goleiro.map(player => renderPlayer(player, true))}
            </div>
            {/* Defensores A (Zagueiros + Laterais) */}
            <div className="absolute top-[18%] left-0 right-0 flex justify-center items-center gap-4">
              {teamAOrganized.defensores.map(player => renderPlayer(player, true))}
            </div>
            {/* Meio-campo A (Volantes + Meias + Pontas) */}
            <div className="absolute top-[35%] left-0 right-0 flex justify-center items-center gap-4">
              {teamAOrganized.meios.map(player => renderPlayer(player, true))}
            </div>
            {/* Atacantes A */}
            <div className="absolute top-[52%] left-0 right-0 flex justify-center items-center gap-4">
              {teamAOrganized.atacantes.map(player => renderPlayer(player, true))}
            </div>
          </>
        )}

        {/* Time B (parte inferior) */}
        {(showTeam === 'B' || showTeam === 'AMBOS') && (
          <>
            {/* Goleiro B */}
            <div className="absolute bottom-[1%] left-0 right-0 flex justify-center items-center">
              {teamBOrganized.goleiro.map(player => renderPlayer(player, false))}
            </div>
            {/* Defensores B (Zagueiros + Laterais) */}
            <div className="absolute bottom-[18%] left-0 right-0 flex justify-center items-center gap-4">
              {teamBOrganized.defensores.map(player => renderPlayer(player, false))}
            </div>
            {/* Meio-campo B (Volantes + Meias + Pontas) */}
            <div className="absolute bottom-[35%] left-0 right-0 flex justify-center items-center gap-4">
              {teamBOrganized.meios.map(player => renderPlayer(player, false))}
            </div>
            {/* Atacantes B */}
            <div className="absolute bottom-[52%] left-0 right-0 flex justify-center items-center gap-4">
              {teamBOrganized.atacantes.map(player => renderPlayer(player, false))}
            </div>
          </>
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