export interface ColorDef {
    name: string;
    hex: string;
    face: string;
}

export interface Tile {
    type: number;
    val: ColorDef;
    scale: number;
    offsetY: number;
    wiggle?: number;
}

export type GameState = 'START' | 'PLAY' | 'GAMEOVER';

export interface GameStats {
    score: number;
    time: number;
    combo: number;
    multiplier: number;
}

// Global augmentation for CDN loaded libraries
declare global {
    interface Window {
        confetti: any;
        webkitAudioContext: typeof AudioContext;
    }
}