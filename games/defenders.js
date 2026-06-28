// Space Defenders Game for Test Number One Arcade

class SpaceDefendersGame {
    static config = {
        title: "Space Defenders",
        subtitle: "Eliminate the cyber-invaders falling down the stream",
        controls: {
            "← → / A D": "Move Spaceship",
            "SPACE / W": "Fire Laser",
            "ESC": "Exit Game"
        },
        instructions: "Control your interceptor spaceship. Shoot down cyber alien blocks before they reach the bottom of the grid.<br><br><span style='color: var(--neon-cyan);'>Voxel alien destroy = +15 XP</span>"
    };

    constructor(container, controller) {
        this.container = container;
        this.controller = controller;

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'game-canvas';
        this.ctx = this.canvas.getContext('2d');

        this.canvas.width = 480;
        this.canvas.height = 360;
        this.container.appendChild(this.canvas);

        // Game states
        this.player = { x: 220, y: 320, width: 36, height: 16, speed: 6 };
        this.lasers = [];
        this.invaders = [];
        this.stars = [];
        this.particles = [];
        this.score = 0;
        
        this.spawnTimer = 0;
        this.spawnRate = 1200; // spawn rate in ms
        this.lastSpawnTime = 0;
        this.difficultyMultiplier = 1;
        
        this.isGameOver = false;
        this.loopTimer = null;
        this.keys = {};

        // Event hooks
        this.boundKeyDown = (e) => { this.keys[e.key] = true; };
        this.boundKeyUp = (e) => { this.keys[e.key] = false; };
    }

    start() {
        this.score = 0;
        this.lasers = [];
        this.invaders = [];
        this.particles = [];
        this.isGameOver = false;
        this.difficultyMultiplier = 1.0;
        this.player.x = (this.canvas.width - this.player.width) / 2;

        // Initialize starfield
        this.stars = [];
        for (let i = 0; i < 40; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 1.5 + 0.5,
                speed: Math.random() * 1.5 + 0.5
            });
        }

        window.addEventListener('keydown', this.boundKeyDown);
        window.addEventListener('keyup', this.boundKeyUp);
        
        this.lastSpawnTime = Date.now();
        this.tick();
    }

    tick() {
        if (this.isGameOver) return;

        this.update();
        this.draw();

        this.loopTimer = requestAnimationFrame(() => this.tick());
    }

    update() {
        // Player Input
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            this.player.x = Math.max(0, this.player.x - this.player.speed);
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            this.player.x = Math.min(this.canvas.width - this.player.width, this.player.x + this.player.speed);
        }
        if (this.keys[' '] || this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
            this.fireLaser();
        }

        // Star scrolling
        this.stars.forEach(s => {
            s.y += s.speed;
            if (s.y > this.canvas.height) {
                s.y = 0;
                s.x = Math.random() * this.canvas.width;
            }
        });

        // Laser movement
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const l = this.lasers[i];
            l.y -= 7;
            if (l.y < 0) {
                this.lasers.splice(i, 1);
            }
        }

        // Spawn Invaders
        const now = Date.now();
        if (now - this.lastSpawnTime > (this.spawnRate / this.difficultyMultiplier)) {
            this.spawnInvader();
            this.lastSpawnTime = now;
            // Ramp up difficulty slowly
            this.difficultyMultiplier = Math.min(2.5, this.difficultyMultiplier + 0.02);
        }

        // Invader movement & bounds check
        for (let i = this.invaders.length - 1; i >= 0; i--) {
            const inv = this.invaders[i];
            inv.y += inv.speed;
            
            // Collides with ground or player
            if (inv.y + inv.height >= this.player.y) {
                this.gameOver();
                return;
            }
        }

        // Collision: Lasers vs Invaders
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const l = this.lasers[i];
            for (let j = this.invaders.length - 1; j >= 0; j--) {
                const inv = this.invaders[j];

                if (l.x + l.width > inv.x && l.x < inv.x + inv.width &&
                    l.y + l.height > inv.y && l.y < inv.y + inv.height) {
                    
                    // Trigger sound & explode
                    this.controller.sounds.playExplosion();
                    this.createExplosion(inv.x + inv.width/2, inv.y + inv.height/2, inv.color);
                    
                    this.invaders.splice(j, 1);
                    this.lasers.splice(i, 1);

                    this.score += 15;
                    this.controller.updateScore(this.score);
                    break; // break inner loop since laser hit something
                }
            }
        }

        // Particle updates
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.04;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    fireLaser() {
        // Laser cooldown
        const now = Date.now();
        if (this.lastLaserTime && now - this.lastLaserTime < 280) return;
        
        this.lasers.push({
            x: this.player.x + this.player.width/2 - 2,
            y: this.player.y - 8,
            width: 4,
            height: 10
        });
        
        this.controller.sounds.playLaser();
        this.lastLaserTime = now;
    }

    spawnInvader() {
        const width = 24;
        const height = 20;
        const colors = ['#fe019a', '#00f2fe', '#ffdd53', '#00ff87'];
        this.invaders.push({
            x: Math.random() * (this.canvas.width - width),
            y: -height,
            width: width,
            height: height,
            speed: (Math.random() * 0.7 + 0.6) * this.difficultyMultiplier,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }

    createExplosion(x, y, color) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                alpha: 1,
                color: color
            });
        }
    }

    draw() {
        this.ctx.fillStyle = '#020207';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw starfield
        this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
        this.stars.forEach(s => {
            this.ctx.fillRect(s.x, s.y, s.size, s.size);
        });

        // Draw Player
        this.ctx.save();
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00f2fe';
        this.ctx.fillStyle = '#00f2fe';
        
        // Custom Spaceship Shape
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + this.player.width/2, this.player.y);
        this.ctx.lineTo(this.player.x + this.player.width, this.player.y + this.player.height);
        this.ctx.lineTo(this.player.x + this.player.width * 0.8, this.player.y + this.player.height * 0.8);
        this.ctx.lineTo(this.player.x + this.player.width * 0.2, this.player.y + this.player.height * 0.8);
        this.ctx.lineTo(this.player.x, this.player.y + this.player.height);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();

        // Draw Lasers
        this.ctx.save();
        this.ctx.fillStyle = '#00ff87';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = '#00ff87';
        this.lasers.forEach(l => {
            this.ctx.fillRect(l.x, l.y, l.width, l.height);
        });
        this.ctx.restore();

        // Draw Invaders
        this.invaders.forEach(inv => {
            this.ctx.save();
            this.ctx.fillStyle = inv.color;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = inv.color;
            
            // Draw invader voxel style shape
            this.ctx.beginPath();
            this.ctx.roundRect(inv.x, inv.y, inv.width, inv.height, 4);
            this.ctx.fill();
            
            // Subtle digital stripes
            this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
            this.ctx.fillRect(inv.x + 4, inv.y + 4, 4, 4);
            this.ctx.fillRect(inv.x + inv.width - 8, inv.y + 4, 4, 4);
            
            this.ctx.restore();
        });

        // Draw Particles
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, Math.random() * 2 + 1, 0, Math.PI*2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    gameOver() {
        this.isGameOver = true;
        this.controller.sounds.playFailure();
        this.controller.saveHighScore('defenders', this.score);

        // Overlay Game Over Text
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(254, 1, 154, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#fe019a';
        this.ctx.fillStyle = '#fe019a';
        this.ctx.font = "bold 32px 'Orbitron'";
        this.ctx.textAlign = 'center';
        this.ctx.fillText("SHIELD COLLAPSED", this.canvas.width/2, this.canvas.height/2 - 10);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = "14px 'Outfit'";
        this.ctx.shadowBlur = 0;
        this.ctx.fillText("Press RESTART or ESC to return", this.canvas.width/2, this.canvas.height/2 + 25);
        this.ctx.restore();
    }

    destroy() {
        cancelAnimationFrame(this.loopTimer);
        window.removeEventListener('keydown', this.boundKeyDown);
        window.removeEventListener('keyup', this.boundKeyUp);
    }
}

// Register
window.app.registerGame('defenders', SpaceDefendersGame);
