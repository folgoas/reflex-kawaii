import { ColorDef, Tile, GameStats } from '../types';
import { soundEngine } from './SoundEngine';

export const COLORS: ColorDef[] = [
    { name: 'pink', hex: '#FF00FF', face: '^ w ^' },
    { name: 'cyan', hex: '#00FFFF', face: 'o _ o' },
    { name: 'yellow', hex: '#FFFF00', face: '> _ <' },
    { name: 'purple', hex: '#BD00FF', face: '- _ -' }
];

class Particle {
    x: number; y: number; color: string; vx: number; vy: number; life: number; decay: number; size: number;
    constructor(x: number, y: number, color: string) {
        this.x = x; this.y = y; this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
        this.size = Math.random() * 4 + 2;
    }
    update() {
        this.x += this.vx; this.y += this.vy; this.vy += 0.2;
        this.life -= this.decay; this.size *= 0.95;
    }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class FloatingText {
    x: number; y: number; text: string; color: string; scale: number; life: number; vy: number;
    constructor(x: number, y: number, text: string, color: string, scale = 1) {
        this.x = x; this.y = y; this.text = text; this.color = color; this.scale = scale;
        this.life = 1.0; this.vy = -2;
    }
    update() { this.y += this.vy; this.life -= 0.02; }
    draw(ctx: CanvasRenderingContext2D) {
        if (this.life <= 0) return;
        ctx.globalAlpha = this.life;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        ctx.font = "20px 'Fredoka One'";
        ctx.fillStyle = this.color;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeText(this.text, 0, 0);
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
        ctx.globalAlpha = 1.0;
    }
}

export class GameCore {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private cols = 7;
    private rows = 9;
    private grid: (Tile | null)[][] = [];
    private tileSize = 0;
    private offsetX = 0;
    private offsetY = 0;
    private particles: Particle[] = [];
    private floatingTexts: FloatingText[] = [];
    private stats: GameStats = { score: 0, time: 60, combo: 0, multiplier: 1 };
    private isRunning = false;
    private lastTime = 0;
    private shakeTime = 0;
    private onStatsUpdate: (stats: GameStats) => void;
    private onGameOver: (finalScore: number) => void;
    private onShake: (intensity: number) => void;

    constructor(
        canvas: HTMLCanvasElement, 
        onStatsUpdate: (stats: GameStats) => void,
        onGameOver: (finalScore: number) => void,
        onShake: (intensity: number) => void
    ) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.onStatsUpdate = onStatsUpdate;
        this.onGameOver = onGameOver;
        this.onShake = onShake;
        this.resize();
        this.loop = this.loop.bind(this);
    }

    public resize() {
        const parent = this.canvas.parentElement;
        if (parent) {
            this.canvas.width = parent.clientWidth;
            this.canvas.height = parent.clientHeight;
        }
        
        const tileW = this.canvas.width / this.cols;
        const tileH = this.canvas.height / (this.rows + 1);
        this.tileSize = Math.min(tileW, tileH);
        
        this.offsetX = (this.canvas.width - (this.tileSize * this.cols)) / 2;
        this.offsetY = (this.canvas.height - (this.tileSize * this.rows)) / 2 + 20;
    }

    public start() {
        this.initGrid();
        this.stats = { score: 0, time: 60, combo: 0, multiplier: 1 };
        this.particles = [];
        this.floatingTexts = [];
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop);
        this.onStatsUpdate(this.stats);
    }

    public stop() {
        this.isRunning = false;
    }

    private initGrid() {
        this.grid = [];
        for (let r = 0; r < this.rows; r++) {
            const row: Tile[] = [];
            for (let c = 0; c < this.cols; c++) {
                row.push(this.randomTile());
            }
            this.grid.push(row);
        }
    }

    private randomTile(): Tile {
        const typeIdx = Math.floor(Math.random() * COLORS.length);
        return {
            type: typeIdx,
            val: COLORS[typeIdx],
            scale: 1,
            offsetY: -this.canvas.height
        };
    }

    public handleInput(x: number, y: number) {
        if (!this.isRunning) return;

        const c = Math.floor((x - this.offsetX) / this.tileSize);
        const r = Math.floor((y - this.offsetY) / this.tileSize);

        if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
            this.attemptPop(r, c);
        }
    }

    private attemptPop(r: number, c: number) {
        const tile = this.grid[r][c];
        if (!tile) return;

        const matches: {r: number, c: number}[] = [];
        const visited = new Set<string>();
        const stack = [{r, c}];
        const targetType = tile.type;

        while (stack.length > 0) {
            const curr = stack.pop()!;
            const key = `${curr.r},${curr.c}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            matches.push(curr);

            const neighbors = [
                {r: curr.r+1, c: curr.c}, {r: curr.r-1, c: curr.c},
                {r: curr.r, c: curr.c+1}, {r: curr.r, c: curr.c-1}
            ];

            for (let n of neighbors) {
                if (n.r >= 0 && n.r < this.rows && n.c >= 0 && n.c < this.cols) {
                    const nTile = this.grid[n.r][n.c];
                    if (nTile && nTile.type === targetType) {
                        stack.push(n);
                    }
                }
            }
        }

        if (matches.length >= 2) {
            this.executePop(matches, r, c);
        } else {
            soundEngine.playError();
            if (this.grid[r][c]) this.grid[r][c]!.wiggle = 10;
        }
    }

    private executePop(matches: {r: number, c: number}[], originR: number, originC: number) {
        const basePoints = matches.length * 10;
        const bonus = Math.floor(Math.pow(matches.length, 1.5));
        const totalPoints = (basePoints + bonus) * this.stats.multiplier;
        
        this.stats.score += totalPoints;
        
        soundEngine.playPop(matches.length);
        this.createFloatingText(originC, originR, `+${totalPoints}`, '#fff');
        
        if (matches.length > 5) {
            this.shakeScreen(5);
            this.createFloatingText(originC, originR, "NICE!", COLORS[0].hex, 1.5);
            this.addCombo(10);
        }
        if (matches.length > 8) {
            this.shakeScreen(10);
            this.createFloatingText(originC, originR, "EPIC!", COLORS[2].hex, 2.0);
            soundEngine.playBonus();
            
            const px = (this.offsetX + originC * this.tileSize) / this.canvas.width;
            const py = (this.offsetY + originR * this.tileSize) / this.canvas.height;
            if (window.confetti) {
                window.confetti({ particleCount: 50, spread: 50, origin: { x: px, y: py } });
            }
            this.addCombo(30);
        } else {
            this.addCombo(5 * matches.length);
        }

        matches.forEach(m => {
            const tile = this.grid[m.r][m.c];
            if (tile) {
                for(let i=0; i<3; i++) {
                    const px = this.offsetX + m.c * this.tileSize + this.tileSize/2;
                    const py = this.offsetY + m.r * this.tileSize + this.tileSize/2;
                    this.particles.push(new Particle(px, py, tile.val.hex));
                }
            }
            this.grid[m.r][m.c] = null;
        });

        this.applyGravity();
        this.onStatsUpdate({...this.stats});
    }

    private applyGravity() {
        setTimeout(() => {
            for (let c = 0; c < this.cols; c++) {
                let writeIdx = this.rows - 1;
                for (let r = this.rows - 1; r >= 0; r--) {
                    if (this.grid[r][c] !== null) {
                        this.grid[writeIdx][c] = this.grid[r][c];
                        if (writeIdx !== r) {
                            if (this.grid[writeIdx][c]) this.grid[writeIdx][c]!.offsetY = -10;
                        }
                        writeIdx--;
                    }
                }
                while (writeIdx >= 0) {
                    this.grid[writeIdx][c] = this.randomTile();
                    writeIdx--;
                }
            }
        }, 50);
    }

    private addCombo(amount: number) {
        this.stats.combo += amount;
        if (this.stats.combo > 100) this.stats.combo = 100;
        
        if (this.stats.combo >= 90) this.stats.multiplier = 4;
        else if (this.stats.combo >= 50) this.stats.multiplier = 2;
        else this.stats.multiplier = 1;
    }

    private shakeScreen(intensity: number) {
        this.shakeTime = intensity;
        this.onShake(intensity);
    }

    private createFloatingText(c: number, r: number, text: string, color: string, scale: number = 1) {
        const x = this.offsetX + c * this.tileSize + this.tileSize/2;
        const y = this.offsetY + r * this.tileSize;
        this.floatingTexts.push(new FloatingText(x, y, text, color, scale));
    }

    private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    private loop(timestamp: number) {
        if (!this.isRunning) return;
        
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Shake offset
        let shakeX = 0;
        let shakeY = 0;
        if (this.shakeTime > 0) {
            shakeX = (Math.random() - 0.5) * this.shakeTime;
            shakeY = (Math.random() - 0.5) * this.shakeTime;
            this.shakeTime *= 0.9;
            if(this.shakeTime < 0.5) this.shakeTime = 0;
        }

        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);

        // Logic
        this.stats.time -= dt;
        this.stats.combo -= (10 * dt);
        if (this.stats.combo < 0) this.stats.combo = 0;
        if (this.stats.combo < 50) this.stats.multiplier = 1;
        else if (this.stats.combo < 90) this.stats.multiplier = 2;

        if (Math.floor(this.stats.time) % 1 === 0) {
             // Sync integer changes
             this.onStatsUpdate({...this.stats});
        }

        if (this.stats.time <= 0) {
            this.isRunning = false;
            this.onGameOver(this.stats.score);
            this.ctx.restore();
            return;
        }

        // --- DRAW ---
        
        // Grid
        for (let r = 0; r < this.rows; r++) {
            if (!this.grid[r]) continue;
            for (let c = 0; c < this.cols; c++) {
                const tile = this.grid[r][c];
                if (!tile) continue;

                let x = this.offsetX + c * this.tileSize;
                let y = this.offsetY + r * this.tileSize;
                
                if (tile.offsetY < 0) {
                    y += tile.offsetY;
                    tile.offsetY *= 0.8;
                    if(Math.abs(tile.offsetY) < 1) tile.offsetY = 0;
                }

                if (tile.wiggle) {
                    x += Math.sin(Date.now() / 50) * tile.wiggle;
                    tile.wiggle *= 0.8;
                    if(tile.wiggle < 0.5) tile.wiggle = 0;
                }

                const pad = 4;
                const size = this.tileSize - pad * 2;
                const squish = Math.sin(Date.now()/200 + c) * (this.stats.combo/400);

                this.ctx.fillStyle = tile.val.hex;
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = tile.val.hex;
                
                this.ctx.beginPath();
                this.roundRect(this.ctx, x + pad - squish, y + pad + squish, size + squish*2, size - squish, 10);
                this.ctx.fill();

                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
                this.ctx.beginPath();
                this.ctx.arc(x + pad + size*0.25, y + pad + size*0.25, size*0.1, 0, Math.PI*2);
                this.ctx.fill();

                this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
                this.ctx.font = `bold ${Math.floor(size/3.5)}px monospace`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(tile.val.face, x + this.tileSize/2, y + this.tileSize/2 + 2);
            }
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            p.draw(this.ctx);
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Text
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const t = this.floatingTexts[i];
            t.update();
            t.draw(this.ctx);
            if (t.life <= 0) this.floatingTexts.splice(i, 1);
        }

        this.ctx.restore();
        requestAnimationFrame(this.loop);
    }
}