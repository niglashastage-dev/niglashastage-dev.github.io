// Memory Match Game for Test Number One Arcade

class MemoryGame {
    static config = {
        title: "Memory Match",
        subtitle: "Match the pairs of cyber symbols in record time",
        controls: {
            "CLICK": "Flip Card",
            "ESC": "Exit Game"
        },
        instructions: "Flip cards to find matching pairs of technology emojis. Keep flips to a minimum and beat the timer clock.<br><br><span style='color: var(--neon-magenta);'>Lower timer clock wins more XP</span>"
    };

    constructor(container, controller) {
        this.container = container;
        this.controller = controller;

        // Cards list (8 unique emojis = 16 cards total)
        this.symbols = ['👾', '🚀', '💻', '🛸', '🤖', '🎮', '💿', '🔋'];
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        
        this.timer = 0;
        this.timerInterval = null;
        this.isGameOver = false;

        // Create Grid Container
        this.gridEl = document.createElement('div');
        this.gridEl.className = 'memory-grid';
        this.container.appendChild(this.gridEl);
    }

    start() {
        this.gridEl.innerHTML = '';
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.timer = 0;
        this.isGameOver = false;

        // Reset sidebar score display (seconds)
        this.controller.updateScore('0.0s');

        // Populate and shuffle cards
        const cardDeck = [...this.symbols, ...this.symbols];
        this.shuffle(cardDeck);

        cardDeck.forEach((sym, index) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.index = index;
            card.dataset.symbol = sym;

            card.innerHTML = `
                <div class="memory-inner">
                    <div class="memory-back"></div>
                    <div class="memory-front">${sym}</div>
                </div>
            `;
            
            card.addEventListener('click', () => this.flipCard(card));
            this.gridEl.appendChild(card);
            this.cards.push(card);
        });

        // Start Timer
        const startTime = Date.now();
        this.timerInterval = setInterval(() => {
            if (this.isGameOver) return;
            this.timer = (Date.now() - startTime) / 1000;
            this.controller.updateScore(this.timer.toFixed(1) + 's');
        }, 100);
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    flipCard(card) {
        if (this.isGameOver) return;
        if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
        if (this.flippedCards.length >= 2) return;

        this.controller.sounds.playSelect();
        card.classList.add('flipped');
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.checkMatch();
        }
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;
        const sym1 = card1.dataset.symbol;
        const sym2 = card2.dataset.symbol;

        if (sym1 === sym2) {
            // Match found
            setTimeout(() => {
                card1.classList.add('matched');
                card2.classList.add('matched');
                this.controller.sounds.playEat(); // Match sound
                this.matchedPairs++;
                
                this.flippedCards = [];

                if (this.matchedPairs === this.symbols.length) {
                    this.gameWin();
                }
            }, 300);
        } else {
            // Mismatch
            setTimeout(() => {
                // Shake them
                card1.style.animation = 'matchPulse 0.3s ease';
                card2.style.animation = 'matchPulse 0.3s ease';
                
                setTimeout(() => {
                    card1.classList.remove('flipped');
                    card2.classList.remove('flipped');
                    card1.style.animation = '';
                    card2.style.animation = '';
                    this.flippedCards = [];
                }, 400);
            }, 600);
        }
    }

    gameWin() {
        this.isGameOver = true;
        clearInterval(this.timerInterval);
        this.controller.sounds.playSuccess();
        this.controller.saveHighScore('memory', this.timer);

        // Win screen overlay on grid
        const winOverlay = document.createElement('div');
        winOverlay.className = 'game-overlay';
        winOverlay.style.background = 'rgba(2, 2, 7, 0.95)';
        winOverlay.innerHTML = `
            <h3 class="overlay-title" style="color: var(--neon-magenta); text-shadow: var(--glow-magenta);">MATRIX MATCHED</h3>
            <p class="overlay-instructions">Completed in <span style="color: var(--neon-magenta); font-weight:bold;">${this.timer.toFixed(2)}s</span>!<br>Your record has been stored in memory.</p>
            <button class="overlay-btn" onclick="app.resetAndRestart()" style="box-shadow: var(--glow-magenta);">PLAY AGAIN</button>
        `;
        this.gridEl.appendChild(winOverlay);
    }

    destroy() {
        clearInterval(this.timerInterval);
        this.isGameOver = true;
    }
}

// Register
window.app.registerGame('memory', MemoryGame);
