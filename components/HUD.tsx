import React from 'react';
import { GameStats } from '../types';

interface HUDProps {
    stats: GameStats;
}

export const HUD: React.FC<HUDProps> = ({ stats }) => {
    return (
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-10 font-pixel">
            <div className="text-left">
                <p className="text-[10px] text-cyan-300 mb-1">SCORE</p>
                <p className="text-xl text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
                    {Math.floor(stats.score)}
                </p>
            </div>
            <div className="text-center">
                 <p className="text-[10px] text-yellow-300 mb-1">COMBO</p>
                 <div className="w-24 h-4 border border-white bg-gray-900 rounded-full overflow-hidden">
                     <div 
                        className="h-full bg-gradient-to-r from-yellow-400 to-red-500 transition-all duration-200"
                        style={{ width: `${stats.combo}%` }}
                     />
                 </div>
                 <p className={`text-xs text-yellow-300 mt-1 ${stats.multiplier > 1 ? 'animate-flicker' : ''}`}>
                    x{stats.multiplier}
                 </p>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-pink-300 mb-1">TIME</p>
                <p className={`text-xl ${stats.time < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {Math.ceil(stats.time)}
                </p>
            </div>
        </div>
    );
};