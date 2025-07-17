
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";
import { useIsMobile } from "@/hooks/use-mobile";

interface TeamPlayer extends Tables<"players"> {
  assignedPosition?: 'goleiro' | 'atacante' | 'volante';
}

interface CampoFutebolProps {
  timeA: TeamPlayer[];
  timeB: TeamPlayer[];
  showTeam: 'A' | 'B' | 'AMBOS';
}

const CampoFutebol: React.FC<CampoFutebolProps> = ({ timeA, timeB, showTeam }) => {
  const isMobile = useIsMobile();

  const renderPlayer = (player: TeamPlayer, isTeamA: boolean) => (
    <div
      key={player.id}
      className={`flex flex-col items-center p-2 rounded-lg ${
        isTeamA ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
      } shadow-lg ${isMobile ? 'min-w-[60px] max-w-[70px]' : 'min-w-[80px] max-w-[100px]'}`}
    >
      <div className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold`}>
        {player.nota.toFixed(1)}
      </div>
      <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-center font-medium truncate w-full`}>
        {isMobile ? player.jogador.split(' ')[0] : player.jogador}
      </div>
      <Badge variant="secondary" className={`${isMobile ? 'text-xs' : 'text-xs'} mt-1`}>
        {player.assignedPosition === 'goleiro' ? 'GOL' : 
         player.assignedPosition === 'atacante' ? 'ATA' : 'VOL'}
      </Badge>
    </div>
  );

  const renderTeamFormation = (team: TeamPlayer[], isTeamA: boolean) => {
    const goleiro = team.find(p => p.assignedPosition === 'goleiro');
    const atacantes = team.filter(p => p.assignedPosition === 'atacante');
    const volantes = team.filter(p => p.assignedPosition === 'volante');

    return (
      <div className={`flex flex-col items-center h-full justify-between py-2 ${
        isTeamA ? '' : 'flex-col-reverse'
      }`}>
        {/* Goleiro */}
        <div className="flex justify-center">
          {goleiro && renderPlayer(goleiro, isTeamA)}
        </div>
        
        {/* Volantes */}
        <div className={`flex justify-center ${isMobile ? 'gap-2' : 'gap-4'}`}>
          {volantes.map(player => renderPlayer(player, isTeamA))}
        </div>
        
        {/* Atacantes */}
        <div className={`flex justify-center ${isMobile ? 'gap-2' : 'gap-4'}`}>
          {atacantes.map(player => renderPlayer(player, isTeamA))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Campo de futebol */}
      <div 
        className="relative bg-green-500 dark:bg-green-600 rounded-lg shadow-xl"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(255,255,255,0.2) 50%, transparent 50%),
            linear-gradient(rgba(255,255,255,0.2) 50%, transparent 50%)
          `,
          backgroundSize: isMobile ? '15px 15px' : '20px 20px',
          minHeight: isMobile ? '400px' : '600px'
        }}
      >
        {/* Linhas do campo */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Linha central */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white transform -translate-y-1/2"></div>
          
          {/* Círculo central */}
          <div className={`absolute top-1/2 left-1/2 ${isMobile ? 'w-16 h-16' : 'w-24 h-24'} border-2 border-white dark:border-gray-200 rounded-full transform -translate-x-1/2 -translate-y-1/2`}></div>
          
          {/* Áreas do goleiro */}
          <div className={`absolute top-4 left-1/2 ${isMobile ? 'w-24 h-12' : 'w-32 h-16'} border-2 border-white dark:border-gray-200 transform -translate-x-1/2`}></div>
          <div className={`absolute bottom-4 left-1/2 ${isMobile ? 'w-24 h-12' : 'w-32 h-16'} border-2 border-white dark:border-gray-200 transform -translate-x-1/2`}></div>
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

export default CampoFutebol;
