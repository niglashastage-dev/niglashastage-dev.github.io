// Neon Snake Game for Test Number One Arcade

class SnakeGame {
    static config = {
        title: "Neon Snake",
        subtitle: "Collect cyber-pellets and expand your data tail",
        controls: {
            "← ↑ ↓ →": "Move Snake",
            "W A S D": "Move Snake",
            "ESC": "Exit Game"
        },
        instructions: "Navigate the grid. Do not hit the boundaries or your own tail. Each cyber-pellet increases speed and adds particles to the grid.<br><br><span style='color: var(--neon-green);'>Green Pellets = +10 XP</span>"
    };

    constructor(container, controller) {
        this.container = container;
        this.controller = controller;

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'game-canvas';
        this.ctx = this.canvas.getContext('2d');

        // Dimensions
        this.gridSize = 20;
        this.cols = 24;
        this.rows = 18;

        this.canvas.width = this.cols * this.gridSize;
        this.canvas.height = this.rows * this.gridSize;
        this.container.appendChild(this.canvas);

        // Core states
        this.snake = [];
        this.dir = { x: 1, y: 0 };
        this.nextDir = { x: 1, y: 0 };
        this.food = { x: 0, y: 0 };
        this.score = 0;
        this.speed = 130; // ms per tick
        this.loopTimer = null;
        this.particles = [];
        this.isGameOver = false;

        // Keylistener binding
        this.boundKeys = this.handleKeys.bind(this);
    }

    start() {
        this.snake = [
            { x: 5, y: 10 },
            { x: 4, y: 10 },
            { x: 3, y: 10 }
        ];
        this.dir = { x: 1, y: 0 };
        this.nextDir = { x: 1, y: 0 };
        this.score = 0;
        this.speed = 130;
        this.isGameOver = false;
        this.particles = [];

        this.spawnFood();
        window.addEventListener('keydown', this.boundKeys);
        this.gameTick();
    }

    spawnFood() {
        let valid = false;
        while (!valid) {
            this.food.x = Math.floor(Math.random() * this.cols);
            this.food.y = Math.floor(Math.random() * this.rows);
            valid = !this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y);
        }
    }

    handleKeys(e) {
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (this.dir.y === 0) this.nextDir = { x: 0, y: -1 };
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (this.dir.y === 0) this.nextDir = { x: 0, y: 1 };
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (this.dir.x === 0) this.nextDir = { x: -1, y: 0 };
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (this.dir.x === 0) this.nextDir = { x: 1, y: 0 };
                break;
        }
    }

    gameTick() {
        if (this.isGameOver) return;

        this.dir = this.nextDir;
        const head = this.snake[0];
        const newHead = { x: head.x + this.dir.x, y: head.y + this.dir.y };

        // Collision Check (boundaries)
        if (newHead.x < 0 || newHead.x >= this.cols || newHead.y < 0 || newHead.y >= this.rows) {
            this.gameOver();
            return;
        }

        // Collision Check (self)
        if (this.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
            this.gameOver();
            return;
        }

        // Move
        this.snake.unshift(newHead);

        // Check Food
        if (newHead.x === this.food.x && newHead.y === this.food.y) {
            this.score += 10;
            this.controller.updateScore(this.score);
            this.controller.sounds.playEat();
            this.createExplosion(this.food.x * this.gridSize + this.gridSize/2, this.food.y * this.gridSize + this.gridSize/2, '#00ff87');
            this.spawnFood();
            // Scale speed slightly
            this.speed = Math.max(60, 130 - Math.floor(this.score / 5) * 4);
        } else {
            this.snake.pop();
        }

        this.updateParticles();
        this.draw();

        this.loopTimer = setTimeout(() => this.gameTick(), this.speed);
    }

    createExplosion(x, y, color) {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                alpha: 1,
                decay: 0.03 + Math.random() * 0.02,
                color: color
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw() {
        this.ctx.fillStyle = '#020207';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid overlay
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.cols; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
        }
        for (let j = 0; j < this.rows; j++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, j * this.gridSize);
            this.ctx.lineTo(this.canvas.width, j * this.gridSize);
            this.ctx.stroke();
        }

        // Draw Food
        this.ctx.save();
        this.ctx.shadowBlur = 12;
        this.ctx.shadowColor = '#00ff87';
        this.ctx.fillStyle = '#00ff87';
        this.ctx.beginPath();
        const fX = this.food.x * this.gridSize + this.gridSize/2;
        const fY = this.food.y * this.gridSize + this.gridSize/2;
        this.ctx.arc(fX, fY, this.gridSize/2 - 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        // Draw Snake
        this.snake.forEach((seg, i) => {
            this.ctx.save();
            const color = i === 0 ? '#ffffff' : `hsl(150, 100%, ${Math.max(40, 70 - i * 1.5)}%)`;
            this.ctx.fillStyle = color;
            
            if (i === 0) {
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#00ff87';
            }

            this.ctx.beginPath();
            const pad = 1.5;
            this.ctx.roundRect(
                seg.x * this.gridSize + pad,
                seg.y * this.gridSize + pad,
                this.gridSize - pad * 2,
                this.gridSize - pad * 2,
                4
            );
            this.ctx.fill();
            this.ctx.restore();
        });

        // Draw Particles
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    gameOver() {
        this.isGameOver = true;
        this.controller.sounds.playFailure();
        this.controller.saveHighScore('snake', this.score);

        // Overprint "SYSTEM FAILURE" text on screen
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(254, 1, 154, 0.15)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#fe019a';
        this.ctx.fillStyle = '#fe019a';
        this.ctx.font = "bold 30px 'Orbitron'";
        this.ctx.textAlign = 'center';
        this.ctx.fillText("GRID OVERLOAD", this.canvas.width / 2, this.canvas.height / 2 - 10);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = "14px 'Outfit'";
        this.ctx.shadowBlur = 0;
        this.ctx.fillText("Press RESTART or ESC to return", this.canvas.width / 2, this.canvas.height / 2 + 25);
        this.ctx.restore();
    }

    destroy() {
        clearTimeout(this.loopTimer);
        window.removeEventListener('keydown', this.boundKeys);
    }
}

// Register
window.app.registerGame('snake', SnakeGame);
