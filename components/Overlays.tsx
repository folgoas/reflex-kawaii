import React from 'react';

interface StartScreenProps {
    onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
    return (
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm z-20">
            <h1 className="text-4xl md:text-5xl text-center mb-6 animate-flicker font-fredoka leading-tight" style={{ color: '#00ffff', textShadow: '0 0 10px #ff00ff' }}>
                NEON<br/>JELLY<br/>POP
            </h1>
            <p className="text-[10px] text-pink-300 mb-8 text-center max-w-[80%] leading-relaxed font-pixel">
                MATCH COLORS.<br/>
                POP EVERYTHING.<br/>
                STAY KAWAII.
            </p>
            <button 
                onClick={onStart}
                className="arcade-btn px-8 py-4 text-xl rounded-full text-white cursor-pointer hover:brightness-110 font-fredoka active:scale-95 transition-transform"
            >
                START
            </button>
            <p className="mt-8 text-[8px] text-gray-500 animate-pulse font-pixel">SOUND REQUIRED</p>
        </div>
    );
};

interface GameOverScreenProps {
    score: number;
    highScore: number;
    onRestart: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, highScore, onRestart }) => {
    return (
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm z-20">
            <h2 className="text-3xl text-red-500 mb-2 font-fredoka drop-shadow-[0_0_10px_red]">GAME OVER</h2>
            
            <div className="bg-gray-900 border-2 border-cyan-500 p-6 rounded-lg mb-6 text-center w-[80%] shadow-[0_0_15px_#00ffff]">
                <p className="text-xs text-gray-400 mb-2 font-pixel">FINAL SCORE</p>
                <p className="text-2xl text-white mb-4 font-pixel">{Math.floor(score)}</p>
                
                <p className="text-xs text-gray-400 mb-2 font-pixel">HIGH SCORE</p>
                <p className="text-xl text-yellow-300 font-pixel">{Math.floor(highScore)}</p>
            </div>

            <button 
                onClick={onRestart}
                className="arcade-btn px-6 py-3 text-lg rounded-full text-white cursor-pointer hover:brightness-110 font-fredoka active:scale-95 transition-transform"
            >
                REPLAY
            </button>
        </div>
    );
};