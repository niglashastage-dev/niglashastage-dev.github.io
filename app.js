// Central Application Controller for "Test Number One" Arcade

class SoundController {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
    playTone(freq, type, duration, endFreq = null) {
        if (!this.enabled) return;
        this.init();
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            if (endFreq !== null) {
                osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
            }
            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) { console.warn('Audio Context not allowed yet', e); }
    }
    playNoise(duration, lowpassFreq = 800) {
        if (!this.enabled) return;
        this.init();
        try {
            const bufferSize = this.ctx.sampleRate * duration;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(lowpassFreq, this.ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + duration);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start();
            noise.stop(this.ctx.currentTime + duration);
        } catch(e) { console.warn('Audio Context error', e); }
    }
    playLaser() { this.playTone(850, 'sawtooth', 0.15, 100); }
    playExplosion() { this.playNoise(0.35, 350); }
    playEat() { this.playTone(380, 'sine', 0.08, 620); }
    playSelect() { this.playTone(550, 'sine', 0.05); }
    playSuccess() {
        this.init();
        setTimeout(() => this.playTone(350, 'sine', 0.08), 0);
        setTimeout(() => this.playTone(440, 'sine', 0.08), 80);
        setTimeout(() => this.playTone(554, 'sine', 0.08), 160);
        setTimeout(() => this.playTone(659, 'sine', 0.2), 240);
    }
    playFailure() {
        this.init();
        this.playTone(280, 'sawtooth', 0.18, 120);
        setTimeout(() => this.playTone(140, 'sawtooth', 0.35, 70), 180);
    }
}

class ArcadeApp {
    constructor() {
        this.sounds = new SoundController();
        this.games = {}; // Game implementations will register here
        this.activeGameInstance = null;
        this.activeGameId = null;

        // UI selectors
        this.modal = document.getElementById('game-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalSubtitle = document.getElementById('modal-subtitle');
        this.gameViewport = document.getElementById('game-viewport');
        
        this.sidebarScore = document.getElementById('sidebar-score');
        this.sidebarHighScore = document.getElementById('sidebar-highscore');
        this.sidebarControls = document.getElementById('sidebar-controls');
        
        this.overlay = document.getElementById('game-overlay');
        this.overlayTitle = document.getElementById('overlay-title');
        this.overlayInstructions = document.getElementById('overlay-instructions');
        this.overlayBtn = document.getElementById('overlay-btn');
        this.restartBtn = document.getElementById('restart-btn');
        
        this.audioToggleBtn = document.getElementById('audio-toggle-btn');
        this.globalXpEl = document.getElementById('global-xp');

        this.init();
    }

    init() {
        // Toggle Audio
        this.audioToggleBtn.addEventListener('click', () => {
            const enabled = this.sounds.toggle();
            this.audioToggleBtn.textContent = enabled ? '⚡ ON' : '❌ MUTED';
            this.audioToggleBtn.style.color = enabled ? 'var(--neon-cyan)' : 'var(--text-secondary)';
            this.sounds.playSelect();
        });

        // Overlay main launch button
        this.overlayBtn.addEventListener('click', () => {
            this.sounds.init();
            this.sounds.playSelect();
            this.startGame();
        });

        // Restart button
        this.restartBtn.addEventListener('click', () => {
            this.sounds.playSelect();
            this.resetAndRestart();
        });

        // Close on escape key
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.closeActiveGame();
            }
        });

        // Load existing scores
        this.loadStats();
    }

    registerGame(id, gameClass) {
        this.games[id] = gameClass;
    }

    loadStats() {
        let totalXp = 0;
        
        // Snake
        const snakeScore = parseInt(localStorage.getItem('snake-score')) || 0;
        document.getElementById('snake-high').textContent = snakeScore;
        totalXp += snakeScore * 10;

        // Defenders
        const defendersScore = parseInt(localStorage.getItem('defenders-score')) || 0;
        document.getElementById('defenders-high').textContent = defendersScore;
        totalXp += defendersScore * 15;

        // Memory
        const memoryTime = localStorage.getItem('memory-best');
        if (memoryTime) {
            document.getElementById('memory-high').textContent = memoryTime + 's';
            // Faster times give more points
            const timeVal = parseFloat(memoryTime);
            totalXp += Math.max(50, Math.floor(10000 / timeVal));
        } else {
            document.getElementById('memory-high').textContent = '--';
        }

        // Color Flood
        const floodMoves = localStorage.getItem('flood-best');
        if (floodMoves) {
            document.getElementById('flood-high').textContent = floodMoves;
            totalXp += Math.max(50, (30 - parseInt(floodMoves)) * 40);
        } else {
            document.getElementById('flood-high').textContent = '--';
        }

        this.globalXpEl.textContent = totalXp;
    }

    saveHighScore(gameId, score) {
        if (gameId === 'snake' || gameId === 'defenders') {
            const currentHigh = parseInt(localStorage.getItem(`${gameId}-score`)) || 0;
            if (score > currentHigh) {
                localStorage.setItem(`${gameId}-score`, score);
                this.sounds.playSuccess();
            }
        } else if (gameId === 'memory') {
            // Lower time is better
            const currentBest = parseFloat(localStorage.getItem('memory-best'));
            if (!currentBest || score < currentBest) {
                localStorage.setItem('memory-best', score.toFixed(1));
                this.sounds.playSuccess();
            }
        } else if (gameId === 'flood') {
            // Lower moves is better
            const currentBest = parseInt(localStorage.getItem('flood-best'));
            if (!currentBest || score < currentBest) {
                localStorage.setItem('flood-best', score);
                this.sounds.playSuccess();
            }
        }
        this.loadStats();
    }

    openGame(gameId) {
        if (!this.games[gameId]) return;
        this.activeGameId = gameId;
        this.sounds.init();
        this.sounds.playSelect();

        const GameClass = this.games[gameId];
        const config = GameClass.config;

        this.modalTitle.textContent = config.title;
        this.modalSubtitle.textContent = config.subtitle;

        // Render controls list
        this.sidebarControls.innerHTML = '';
        Object.entries(config.controls).forEach(([key, desc]) => {
            const item = document.createElement('div');
            item.className = 'control-item';
            item.innerHTML = `<span class="control-key">${key}</span> <span>${desc}</span>`;
            this.sidebarControls.appendChild(item);
        });

        // Setup scores
        this.sidebarScore.textContent = '0';
        let high = '--';
        if (gameId === 'snake' || gameId === 'defenders') {
            high = localStorage.getItem(`${gameId}-score`) || '0';
        } else if (gameId === 'memory') {
            high = localStorage.getItem('memory-best') ? localStorage.getItem('memory-best') + 's' : '--';
        } else if (gameId === 'flood') {
            high = localStorage.getItem('flood-best') || '--';
        }
        this.sidebarHighScore.textContent = high;

        // Clean play area (remove canvas or old grid grids)
        const oldCanvas = this.gameViewport.querySelector('canvas');
        if (oldCanvas) oldCanvas.remove();
        const oldGrid = this.gameViewport.querySelector('.memory-grid, .flood-grid');
        if (oldGrid) oldGrid.remove();

        // Setup Overlay
        this.overlayTitle.textContent = config.title;
        this.overlayInstructions.innerHTML = config.instructions;
        this.overlayBtn.textContent = 'LAUNCH EMULATION';
        this.overlay.classList.remove('hidden');

        // Show Modal
        this.modal.classList.add('active');
        
        // Instantiate the game class
        this.activeGameInstance = new GameClass(this.gameViewport, this);
    }

    startGame() {
        this.overlay.classList.add('hidden');
        if (this.activeGameInstance) {
            this.activeGameInstance.start();
        }
    }

    resetAndRestart() {
        this.overlay.classList.add('hidden');
        if (this.activeGameInstance) {
            this.activeGameInstance.destroy();
            
            // Clean view again
            const oldCanvas = this.gameViewport.querySelector('canvas');
            if (oldCanvas) oldCanvas.remove();
            const oldGrid = this.gameViewport.querySelector('.memory-grid, .flood-grid');
            if (oldGrid) oldGrid.remove();

            // Instantiate clean
            const GameClass = this.games[this.activeGameId];
            this.activeGameInstance = new GameClass(this.gameViewport, this);
            this.activeGameInstance.start();
        }
    }

    closeActiveGame() {
        if (this.activeGameInstance) {
            this.activeGameInstance.destroy();
            this.activeGameInstance = null;
        }
        this.modal.classList.remove('active');
        this.activeGameId = null;
        this.sounds.playSelect();
    }

    updateScore(scoreVal) {
        this.sidebarScore.textContent = scoreVal;
    }
}

// Global Application Instance
window.app = new ArcadeApp();
