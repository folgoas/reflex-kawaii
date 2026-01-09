import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameCore } from './services/GameCore';
import { soundEngine } from './services/SoundEngine';
import { GameState, GameStats } from './types';
import { HUD } from './components/HUD';
import { StartScreen, GameOverScreen } from './components/Overlays';

const App: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameCoreRef = useRef<GameCore | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [gameState, setGameState] = useState<GameState>('START');
    const [stats, setStats] = useState<GameStats>({ score: 0, time: 60, combo: 0, multiplier: 1 });
    const [highScore, setHighScore] = useState<number>(0);
    const [isShaking, setIsShaking] = useState(false);

    // Initialize High Score
    useEffect(() => {
        const stored = localStorage.getItem('neonpop_highscore');
        if (stored) setHighScore(parseInt(stored));
    }, []);

    // Initialize Game Engine
    useEffect(() => {
        if (!canvasRef.current) return;

        const engine = new GameCore(
            canvasRef.current,
            (newStats) => setStats(newStats), // Update UI stats
            (finalScore) => handleGameOver(finalScore),
            (intensity) => triggerShake()
        );

        gameCoreRef.current = engine;

        const handleResize = () => engine.resize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            engine.stop();
        };
    }, []);

    const triggerShake = useCallback(() => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
    }, []);

    const handleStart = () => {
        soundEngine.init();
        soundEngine.startBGM();
        setGameState('PLAY');
        gameCoreRef.current?.start();
    };

    const handleGameOver = (finalScore: number) => {
        soundEngine.playGameOver();
        setGameState('GAMEOVER');
        
        setHighScore(prev => {
            if (finalScore > prev) {
                localStorage.setItem('neonpop_highscore', finalScore.toString());
                if (window.confetti) {
                    window.confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#ff00ff', '#00ffff', '#ffff00']
                    });
                }
                return finalScore;
            }
            return prev;
        });
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (gameState !== 'PLAY' || !gameCoreRef.current || !canvasRef.current) return;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        gameCoreRef.current.handleInput(x, y);
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-black">
            {/* Arcade Cabinet Container */}
            <div 
                ref={containerRef}
                id="arcade-cabinet"
                className={`
                    w-full max-w-md h-full max-h-[90vh] aspect-[9/16] md:aspect-[3/4] 
                    bg-black relative scanlines shadow-2xl rounded-lg border-4 border-gray-800
                    overflow-hidden
                    shadow-[0_0_20px_#ff00ff,inset_0_0_50px_rgba(0,0,0,0.8)]
                    ${isShaking ? 'shake' : ''}
                `}
            >
                {/* Game Canvas */}
                <canvas 
                    ref={canvasRef}
                    className="block w-full h-full cursor-pointer touch-none"
                    onPointerDown={handlePointerDown}
                />

                {/* UI Layers */}
                {gameState !== 'START' && <HUD stats={stats} />}
                
                {gameState === 'START' && (
                    <StartScreen onStart={handleStart} />
                )}

                {gameState === 'GAMEOVER' && (
                    <GameOverScreen 
                        score={stats.score} 
                        highScore={highScore} 
                        onRestart={handleStart} 
                    />
                )}
            </div>
        </div>
    );
};

export default App;