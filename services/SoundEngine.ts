export class SoundEngine {
    private ctx: AudioContext | null = null;
    private isMuted: boolean = false;
    private bgmInterval: any = null;
    private tempo: number = 120;

    constructor() {}

    public init(): void {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1): void {
        if (this.isMuted || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    public playPop(size: number): void {
        // Higher pitch for larger groups
        const baseFreq = 300 + (size * 50); 
        this.playTone(baseFreq, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(baseFreq * 1.5, 'triangle', 0.05, 0.05), 50);
    }

    public playBonus(): void {
        this.playTone(660, 'square', 0.1, 0.1);
        setTimeout(() => this.playTone(880, 'square', 0.3, 0.1), 100);
    }

    public playError(): void {
        this.playTone(150, 'sawtooth', 0.2, 0.1);
    }

    public playGameOver(): void {
        this.stopBGM();
        this.playTone(300, 'sawtooth', 0.5, 0.2);
        setTimeout(() => this.playTone(250, 'sawtooth', 0.5, 0.2), 400);
        setTimeout(() => this.playTone(200, 'sawtooth', 1.0, 0.2), 800);
    }

    public startBGM(): void {
        this.stopBGM();
        this.tempo = 150; 
        let noteIndex = 0;
        
        // Melody: Kawaii Bounce
        const melody = [
            523.25, 0,      659.25, 0,      
            783.99, 880.00, 783.99, 659.25, 
            523.25, 659.25, 783.99, 523.25, 
            659.25, 523.25, 392.00, 523.25  
        ];

        const bassLine = [
            261.63, 261.63, 349.23, 349.23, 
            392.00, 392.00, 261.63, 261.63  
        ];
        
        this.bgmInterval = setInterval(() => {
            if(this.ctx && this.ctx.state === 'running'){
                const tick = noteIndex % 16;
                const melNote = melody[tick];
                
                if (melNote > 0) {
                     this.playTone(melNote, 'square', 0.08, 0.05);
                }

                if (tick % 4 === 0) {
                    const bassNote = bassLine[Math.floor(tick / 4) % bassLine.length];
                    this.playTone(bassNote / 2, 'triangle', 0.2, 0.08);
                }
                
                noteIndex++;
            }
        }, 60000 / this.tempo / 4);
    }

    public stopBGM(): void {
        if (this.bgmInterval) clearInterval(this.bgmInterval);
    }
}

export const soundEngine = new SoundEngine();