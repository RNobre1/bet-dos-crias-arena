import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { RadarData, RadarSkills } from '@/utils/calculateRadarSkills';

interface PlayerRadarChartProps {
  data: RadarData[];
  skills: RadarSkills;
  playerName: string;
}

const PlayerRadarChart: React.FC<PlayerRadarChartProps> = ({ data, skills, playerName }) => {
  return (
    <div className="relative w-full h-96 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
          <PolarGrid 
            stroke="#374151" 
            strokeWidth={1}
            radialLines={true}
          />
          <PolarAngleAxis 
            dataKey="skill" 
            tick={{ 
              fontSize: 14, 
              fontWeight: 'bold',
              fill: '#374151'
            }}
            className="text-sm font-semibold"
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={false}
            axisLine={false}
          />
          <Radar
            name={playerName}
            dataKey="value"
            stroke="#059669"
            fill="#10b981"
            fillOpacity={0.3}
            strokeWidth={3}
            dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      {/* Overall central circle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          {/* Outer yellow ring */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-lg">
            {/* Inner dark circle */}
            <div className="w-16 h-16 rounded-full bg-gray-800 flex flex-col items-center justify-center">
              <div className="text-yellow-400 text-2xl font-bold">
                {skills.overall}
              </div>
              <div className="text-yellow-400 text-xs font-semibold tracking-wider">
                OVR
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerRadarChart;