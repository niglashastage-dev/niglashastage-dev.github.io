// Color Flood Game for Test Number One Arcade

class ColorFloodGame {
    static config = {
        title: "Color Flood",
        subtitle: "Flood-fill the screen in a single color within 22 moves",
        controls: {
            "CLICK PADS": "Choose Color",
            "ESC": "Exit Game"
        },
        instructions: "Start from the top-left cell. Select color buttons below to expand the flooded territory. Match all cells before running out of attempts.<br><br><span style='color: var(--neon-yellow);'>Victory under limit = +40 XP per left moves</span>"
    };

    constructor(container, controller) {
        this.container = container;
        this.controller = controller;

        this.cols = 12;
        this.rows = 12;
        this.maxMoves = 22;
        this.moves = 0;
        this.isGameOver = false;

        // Color palettes
        this.colors = [
            '#00f2fe', // cyan
            '#fe019a', // magenta
            '#ffdd53', // yellow
            '#00ff87', // green
            '#9d4edd', // purple
            '#ff6b6b'  // coral/orange
        ];

        this.grid = [];

        // Build wrapper
        this.wrapper = document.createElement('div');
        this.wrapper.style.display = 'flex';
        this.wrapper.style.flexDirection = 'column';
        this.wrapper.style.width = '100%';
        this.wrapper.style.height = '100%';
        this.container.appendChild(this.wrapper);

        // Build grid element
        this.gridEl = document.createElement('div');
        this.gridEl.className = 'flood-grid';
        this.gridEl.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        this.gridEl.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;
        this.gridEl.style.flexGrow = '1';
        this.wrapper.appendChild(this.gridEl);

        // Build controls row
        this.controlsEl = document.createElement('div');
        this.controlsEl.className = 'flood-controls';
        this.wrapper.appendChild(this.controlsEl);
    }

    start() {
        this.gridEl.innerHTML = '';
        this.controlsEl.innerHTML = '';
        this.grid = [];
        this.moves = 0;
        this.isGameOver = false;

        this.controller.updateScore(`0 / ${this.maxMoves}`);

        // Populate cells
        for (let y = 0; y < this.rows; y++) {
            const row = [];
            for (let x = 0; x < this.cols; x++) {
                const colIdx = Math.floor(Math.random() * this.colors.length);
                row.push(colIdx);

                const cell = document.createElement('div');
                cell.className = 'flood-cell';
                cell.id = `flood-cell-${x}-${y}`;
                cell.style.backgroundColor = this.colors[colIdx];
                this.gridEl.appendChild(cell);
            }
            this.grid.push(row);
        }

        // Populate color control buttons
        this.colors.forEach((colCode, index) => {
            const btn = document.createElement('button');
            btn.className = 'flood-color-btn';
            btn.style.backgroundColor = colCode;
            btn.addEventListener('click', () => this.handleColorSelect(index));
            this.controlsEl.appendChild(btn);
        });
    }

    handleColorSelect(colorIndex) {
        if (this.isGameOver) return;

        const targetColor = this.grid[0][0];
        // If clicking the current color, do nothing
        if (targetColor === colorIndex) return;

        this.controller.sounds.playSelect();
        this.moves++;
        this.controller.updateScore(`${this.moves} / ${this.maxMoves}`);

        // Perform flood fill recursion
        this.floodFill(0, 0, targetColor, colorIndex);

        // Refresh DOM cell colors
        this.updateGridUI();

        // Check conditions
        if (this.checkWinCondition()) {
            this.gameWin();
        } else if (this.moves >= this.maxMoves) {
            this.gameOver();
        }
    }

    floodFill(x, y, targetColor, replacementColor) {
        if (targetColor === replacementColor) return;
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return;
        if (this.grid[y][x] !== targetColor) return;

        this.grid[y][x] = replacementColor;

        this.floodFill(x + 1, y, targetColor, replacementColor);
        this.floodFill(x - 1, y, targetColor, replacementColor);
        this.floodFill(x, y + 1, targetColor, replacementColor);
        this.floodFill(x, y - 1, targetColor, replacementColor);
    }

    updateGridUI() {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const cell = document.getElementById(`flood-cell-${x}-${y}`);
                if (cell) {
                    cell.style.backgroundColor = this.colors[this.grid[y][x]];
                }
            }
        }
    }

    checkWinCondition() {
        const first = this.grid[0][0];
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x] !== first) return false;
            }
        }
        return true;
    }

    gameWin() {
        this.isGameOver = true;
        this.controller.sounds.playSuccess();
        this.controller.saveHighScore('flood', this.moves);

        // Win Overlay
        const overlay = document.createElement('div');
        overlay.className = 'game-overlay';
        overlay.style.background = 'rgba(2, 2, 7, 0.95)';
        overlay.innerHTML = `
            <h3 class="overlay-title" style="color: var(--neon-yellow); text-shadow: var(--glow-yellow);">COLOR HARMONY</h3>
            <p class="overlay-instructions">Flooded the grid in <span style="color: var(--neon-yellow); font-weight:bold;">${this.moves} moves</span>!<br>Bonus XP points calculated successfully.</p>
            <button class="overlay-btn" onclick="app.resetAndRestart()" style="box-shadow: var(--glow-yellow);">PLAY AGAIN</button>
        `;
        this.gridEl.appendChild(overlay);
    }

    gameOver() {
        this.isGameOver = true;
        this.controller.sounds.playFailure();

        // Overprint Game Over Overlay
        const overlay = document.createElement('div');
        overlay.className = 'game-overlay';
        overlay.style.background = 'rgba(2, 2, 7, 0.95)';
        overlay.innerHTML = `
            <h3 class="overlay-title" style="color: var(--neon-magenta); text-shadow: var(--glow-magenta);">OUT OF LIFELINE</h3>
            <p class="overlay-instructions">Failed to flood the board under limit.<br>Better luck next attempt!</p>
            <button class="overlay-btn" onclick="app.resetAndRestart()">TRY AGAIN</button>
        `;
        this.gridEl.appendChild(overlay);
    }

    destroy() {
        this.isGameOver = true;
    }
}

// Register
window.app.registerGame('flood', ColorFloodGame);
