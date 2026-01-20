/**
 * CARO CRUSH SAGA - Match-3 Puzzle Minigame
 * Inspired by Candy Crush Saga
 *
 * FEATURES:
 * - 6 colorful candy types with unique shapes
 * - Rare Caro candies (~5% chance) as special treats
 * - Special candies: Striped, Wrapped, Color Bomb
 * - Glossy, vibrant graphics with rainbow effects
 * - Time-based energy system
 * - Highscore and coin rewards
 */

const CrushGame = {
    canvas: null,
    ctx: null,
    isRunning: false,
    animationFrame: null,
    coinsEarned: 0,
    onExit: null,

    // Audio context
    audioCtx: null,

    // Game configuration
    gridSize: 8,
    cellSize: 0,
    gridOffsetX: 0,
    gridOffsetY: 0,
    animationTime: 0,

    // Game state
    grid: [],
    frozenTiles: [], // 2D array tracking ice/frozen tiles
    selected: null,
    isSwapping: false,
    isMatching: false,
    isFalling: false,
    isAnimating: false,
    score: 0,
    highscore: 0,
    combo: 0,
    gameOver: false,
    lastMatchTime: 0,
    freezeTimer: 0,
    nextFreezeTime: 15000, // First freeze after 15 seconds

    // Time/Energy system
    energy: 100,
    maxEnergy: 100,
    baseEnergyDecayRate: 0.15, // Base decay rate (slower start)
    energyDecayRate: 0.06,
    energyGainPerMatch: 4,
    energyGainPerSpecial: 8,

    // Progressive difficulty (time-based, not FPS-based)
    gameStartTime: 0,
    lastUpdateTime: 0,
    difficultyMultiplier: 1.8,

    // Touch handling
    touchStartX: 0,
    touchStartY: 0,
    isDragging: false,
    draggedCell: null,
    swipeProcessed: false,

    // Animation
    animations: [],
    particles: [],
    floatingTexts: [],
    backgroundStars: [],

    // Caro spawn chance (very rare!)
    caroSpawnChance: 0.015, // 2% chance - Caro is special and rare!

    // 6 Candy types (like original Candy Crush)
    candyTypes: [
        { id: 0, name: 'red', color: '#FF4757', darkColor: '#C0392B', shape: 'jellybean' },
        { id: 1, name: 'orange', color: '#FFA502', darkColor: '#E67E22', shape: 'lollipop' },
        { id: 2, name: 'yellow', color: '#FFDD59', darkColor: '#F1C40F', shape: 'lemon' },
        { id: 3, name: 'green', color: '#2ED573', darkColor: '#27AE60', shape: 'apple' },
        { id: 4, name: 'blue', color: '#3498DB', darkColor: '#2980B9', shape: 'blueberry' },
        { id: 5, name: 'purple', color: '#9B59B6', darkColor: '#8E44AD', shape: 'grape' }
    ],

    // Special candy types
    specialTypes: {
        NONE: 0,
        STRIPE_H: 1,    // Horizontal stripe
        STRIPE_V: 2,    // Vertical stripe
        WRAPPED: 3,     // Wrapped candy (explodes 3x3 twice)
        COLOR_BOMB: 4,  // Color bomb (clears all of one color)
        CARO: 5         // Special Caro candy
    },

    // ============================================
    // SOUND EFFECTS
    // ============================================
    initAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    },

    playSound(type) {
        if (!this.audioCtx) return;

        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        switch (type) {
            case 'swap': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(500, now);
                osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
                break;
            }
            case 'match': {
                const notes = [523, 659, 784];
                notes.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + i * 0.05);
                    gain.gain.setValueAtTime(0.15, now + i * 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.15);
                    osc.start(now + i * 0.05);
                    osc.stop(now + i * 0.05 + 0.15);
                });
                break;
            }
            case 'special': {
                const notes = [523, 659, 784, 1047];
                notes.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + i * 0.06);
                    gain.gain.setValueAtTime(0.18, now + i * 0.06);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.2);
                    osc.start(now + i * 0.06);
                    osc.stop(now + i * 0.06 + 0.2);
                });
                break;
            }
            case 'coin': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(988, now);
                osc.frequency.setValueAtTime(1319, now + 0.08);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            }
            case 'combo': {
                const baseFreq = 500 + Math.min(this.combo, 10) * 80;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(baseFreq, now);
                osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, now + 0.12);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            }
            case 'explosion': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
                break;
            }
            case 'caro': {
                // Special magical sound for Caro
                const notes = [784, 988, 1175, 1568];
                notes.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + i * 0.08);
                    gain.gain.setValueAtTime(0.15, now + i * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.3);
                    osc.start(now + i * 0.08);
                    osc.stop(now + i * 0.08 + 0.3);
                });
                break;
            }
            case 'gameOver': {
                for (let i = 0; i < 4; i++) {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(400 - i * 70, now + i * 0.18);
                    gain.gain.setValueAtTime(0.12, now + i * 0.18);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.18 + 0.18);
                    osc.start(now + i * 0.18);
                    osc.stop(now + i * 0.18 + 0.18);
                }
                break;
            }
            case 'noMatch': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.setValueAtTime(150, now + 0.08);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);
                break;
            }
            case 'freeze': {
                // Icy crystallizing sound
                const notes = [1200, 1400, 1100, 1500];
                notes.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + i * 0.04);
                    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + i * 0.04 + 0.15);
                    gain.gain.setValueAtTime(0.1, now + i * 0.04);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.04 + 0.2);
                    osc.start(now + i * 0.04);
                    osc.stop(now + i * 0.04 + 0.2);
                });
                break;
            }
            case 'thaw': {
                // Melting/cracking ice sound
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            }
        }
    },

    // ============================================
    // INITIALIZATION
    // ============================================
    init(canvas, onExitCallback) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onExit = onExitCallback;
        this.resize();
        this.setupEvents();
        this.initAudio();
        this.loadHighscore();
        this.createBackgroundStars();
        this.start();
    },

    loadHighscore() {
        this.highscore = parseInt(localStorage.getItem('crush_highscore')) || 0;
    },

    saveHighscore() {
        if (this.score > this.highscore) {
            this.highscore = this.score;
            localStorage.setItem('crush_highscore', this.highscore.toString());
        }
    },

    createBackgroundStars() {
        this.backgroundStars = [];
        for (let i = 0; i < 50; i++) {
            this.backgroundStars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                twinkleSpeed: Math.random() * 0.05 + 0.02,
                twinkleOffset: Math.random() * Math.PI * 2
            });
        }
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const padding = 15;
        const topUI = 150;
        const bottomUI = 80;

        const availableWidth = this.canvas.width - padding * 2;
        const availableHeight = this.canvas.height - topUI - bottomUI;

        this.cellSize = Math.min(
            Math.floor(availableWidth / this.gridSize),
            Math.floor(availableHeight / this.gridSize)
        );

        this.cellSize = Math.min(this.cellSize, 52);

        const gridWidth = this.cellSize * this.gridSize;
        const gridHeight = this.cellSize * this.gridSize;

        this.gridOffsetX = (this.canvas.width - gridWidth) / 2;
        this.gridOffsetY = topUI + (availableHeight - gridHeight) / 2;

        this.createBackgroundStars();
    },

    eventsSetup: false,

    setupEvents() {
        if (this.eventsSetup) return;
        this.eventsSetup = true;

        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        this.canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });

        window.addEventListener('resize', () => this.resize());
    },

    // ============================================
    // TOUCH HANDLING
    // ============================================
    handleTouchStart(e) {
        e.preventDefault();
        this.initAudio();

        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        // Check for button presses
        if (this.gameOver) {
            if (this.isInsideRestartButton(x, y)) {
                this.reset();
                return;
            }
            if (this.isInsideExitButton(x, y)) {
                this.exit();
                return;
            }
            return;
        }

        if (this.isInsideExitButton(x, y)) {
            this.exit();
            return;
        }

        // Don't allow interaction during animations
        if (this.isAnimating || this.isSwapping || this.isMatching || this.isFalling) return;

        const cell = this.getCellFromPosition(x, y);
        if (cell) {
            this.touchStartX = x;
            this.touchStartY = y;
            this.isDragging = true;
            this.draggedCell = cell;
            this.swipeProcessed = false;
            this.selected = cell;
        }
    },

    handleTouchMove(e) {
        e.preventDefault();

        if (!this.isDragging || !this.draggedCell || this.swipeProcessed) return;
        if (this.isAnimating || this.isSwapping || this.isMatching || this.isFalling) return;

        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        const dx = x - this.touchStartX;
        const dy = y - this.touchStartY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > this.cellSize * 0.25) {
            let targetRow = this.draggedCell.row;
            let targetCol = this.draggedCell.col;

            if (Math.abs(dx) > Math.abs(dy)) {
                targetCol += dx > 0 ? 1 : -1;
            } else {
                targetRow += dy > 0 ? 1 : -1;
            }

            if (targetRow >= 0 && targetRow < this.gridSize &&
                targetCol >= 0 && targetCol < this.gridSize) {
                this.swipeProcessed = true;
                this.trySwap(this.draggedCell.row, this.draggedCell.col, targetRow, targetCol);
            }

            this.isDragging = false;
            this.draggedCell = null;
        }
    },

    handleTouchEnd(e) {
        e.preventDefault();
        this.isDragging = false;
        this.draggedCell = null;
        this.swipeProcessed = false;
    },

    getCellFromPosition(x, y) {
        const col = Math.floor((x - this.gridOffsetX) / this.cellSize);
        const row = Math.floor((y - this.gridOffsetY) / this.cellSize);

        if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
            return { row, col };
        }
        return null;
    },

    isInsideRestartButton(x, y) {
        const btnX = this.canvas.width / 2;
        const btnY = this.canvas.height / 2 + 80;
        return x > btnX - 100 && x < btnX + 100 && y > btnY - 30 && y < btnY + 30;
    },

    isInsideExitButton(x, y) {
        if (this.gameOver) {
            const btnX = this.canvas.width / 2;
            const btnY = this.canvas.height / 2 + 160;
            return x > btnX - 100 && x < btnX + 100 && y > btnY - 30 && y < btnY + 30;
        }
        return x > 10 && x < 110 && y > 50 && y < 90;
    },

    // ============================================
    // GAME LOGIC
    // ============================================
    createGrid() {
        this.grid = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col] = this.createCandy(row, col, false);
            }
        }

        // Remove initial matches
        let attempts = 0;
        while (this.hasMatches() && attempts < 100) {
            for (let row = 0; row < this.gridSize; row++) {
                for (let col = 0; col < this.gridSize; col++) {
                    if (this.grid[row][col].matched) {
                        this.grid[row][col] = this.createCandy(row, col, false);
                        this.grid[row][col].matched = false;
                    }
                }
            }
            this.findMatches();
            attempts++;
        }

        // Clear all matched flags
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col].matched = false;
            }
        }
    },

    createCandy(row, col, allowCaro = true) {
        // Rare chance for Caro candy
        const isCaro = allowCaro && Math.random() < this.caroSpawnChance;
        const type = isCaro ? -1 : Math.floor(Math.random() * this.candyTypes.length);

        return {
            type: type,
            isCaro: isCaro,
            special: this.specialTypes.NONE,
            row: row,
            col: col,
            x: this.gridOffsetX + col * this.cellSize + this.cellSize / 2,
            y: this.gridOffsetY + row * this.cellSize + this.cellSize / 2,
            targetX: this.gridOffsetX + col * this.cellSize + this.cellSize / 2,
            targetY: this.gridOffsetY + row * this.cellSize + this.cellSize / 2,
            scale: 1,
            alpha: 1,
            rotation: 0,
            matched: false,
            isNew: false,
            bouncePhase: Math.random() * Math.PI * 2
        };
    },

    // Laser beam storage for animation
    laserBeams: [],

    trySwap(row1, col1, row2, col2) {
        if (this.isSwapping || this.isAnimating) return;

        const candy1 = this.grid[row1][col1];
        const candy2 = this.grid[row2][col2];

        if (!candy1 || !candy2) return;

        // Check if either tile is frozen - can't swap frozen tiles!
        if (this.frozenTiles && (this.frozenTiles[row1][col1] > 0 || this.frozenTiles[row2][col2] > 0)) {
            this.playSound('noMatch');
            // Shake animation for frozen tiles
            this.shakeFrozenTile(row1, col1);
            this.shakeFrozenTile(row2, col2);
            this.floatingTexts.push({
                text: '❄️ Eingefroren!',
                x: candy1.x,
                y: candy1.y - this.cellSize * 0.5,
                alpha: 1,
                life: 60,
                color: '#88DDFF',
                size: 16
            });
            return;
        }

        // Check if one candy is Caro - SPECIAL ABILITY!
        const caroCandy = candy1.isCaro ? candy1 : (candy2.isCaro ? candy2 : null);
        const otherCandy = candy1.isCaro ? candy2 : (candy2.isCaro ? candy1 : null);

        if (caroCandy && otherCandy && !otherCandy.isCaro) {
            // CARO SPECIAL: Swap first, then destroy all candies of that color!
            this.isSwapping = true;
            this.isAnimating = true;
            this.playSound('swap');

            // Store original positions
            const origCaroX = caroCandy.x;
            const origCaroY = caroCandy.y;
            const origOtherX = otherCandy.x;
            const origOtherY = otherCandy.y;

            // Get positions
            const caroRow = caroCandy.row;
            const caroCol = caroCandy.col;
            const otherRow = otherCandy.row;
            const otherCol = otherCandy.col;

            // Swap in grid
            this.grid[caroRow][caroCol] = otherCandy;
            this.grid[otherRow][otherCol] = caroCandy;

            // Update candy positions
            caroCandy.row = otherRow;
            caroCandy.col = otherCol;
            otherCandy.row = caroRow;
            otherCandy.col = caroCol;

            // Set targets
            caroCandy.targetX = this.gridOffsetX + otherCol * this.cellSize + this.cellSize / 2;
            caroCandy.targetY = this.gridOffsetY + otherRow * this.cellSize + this.cellSize / 2;
            otherCandy.targetX = this.gridOffsetX + caroCol * this.cellSize + this.cellSize / 2;
            otherCandy.targetY = this.gridOffsetY + caroRow * this.cellSize + this.cellSize / 2;

            // Animate swap, then trigger laser attack
            this.animateSwap(caroCandy, otherCandy, origCaroX, origCaroY, origOtherX, origOtherY, () => {
                this.triggerCaroLaserAttack(caroCandy, otherCandy);
            });
            return;
        }

        this.isSwapping = true;
        this.isAnimating = true;
        this.playSound('swap');

        // Store original positions
        const origX1 = candy1.x;
        const origY1 = candy1.y;
        const origX2 = candy2.x;
        const origY2 = candy2.y;

        // Swap in grid first
        this.grid[row1][col1] = candy2;
        this.grid[row2][col2] = candy1;

        // Update candy positions
        candy1.row = row2;
        candy1.col = col2;
        candy2.row = row1;
        candy2.col = col1;

        // Set targets
        candy1.targetX = this.gridOffsetX + col2 * this.cellSize + this.cellSize / 2;
        candy1.targetY = this.gridOffsetY + row2 * this.cellSize + this.cellSize / 2;
        candy2.targetX = this.gridOffsetX + col1 * this.cellSize + this.cellSize / 2;
        candy2.targetY = this.gridOffsetY + row1 * this.cellSize + this.cellSize / 2;

        // Animate
        this.animateSwap(candy1, candy2, origX1, origY1, origX2, origY2, () => {
            // Check for matches
            if (this.hasMatches()) {
                this.combo = 0;
                this.isSwapping = false;
                this.processMatches();
            } else {
                // Swap back - PENALTY for wrong move!
                this.playSound('noMatch');
                this.energy = Math.max(0, this.energy - 3); // Lose 3 energy for wrong move

                // Swap back in grid
                this.grid[row1][col1] = candy1;
                this.grid[row2][col2] = candy2;

                candy1.row = row1;
                candy1.col = col1;
                candy2.row = row2;
                candy2.col = col2;

                candy1.targetX = origX1;
                candy1.targetY = origY1;
                candy2.targetX = origX2;
                candy2.targetY = origY2;

                this.animateSwap(candy1, candy2, candy1.x, candy1.y, candy2.x, candy2.y, () => {
                    this.isSwapping = false;
                    this.isAnimating = false;
                    this.selected = null;
                });
            }
        });
    },

    // CARO'S SPECIAL LASER ATTACK!
    triggerCaroLaserAttack(caroCandy, targetCandy) {
        const targetType = targetCandy.type;
        const targetCandies = [];

        // Find all candies of the target color
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const c = this.grid[row][col];
                if (c && c.type === targetType && !c.isCaro) {
                    targetCandies.push({ row, col, candy: c });
                }
            }
        }

        // Play special sound
        this.playSound('caro');

        // Create laser beams from Caro to each target (limited for performance)
        this.laserBeams = [];
        const caroX = caroCandy.x;
        const caroY = caroCandy.y;
        const targetColor = this.candyTypes[targetType].color;

        // Limit laser beams to 15 max for performance
        const maxLaserBeams = 15;
        const beamTargets = targetCandies.slice(0, maxLaserBeams);

        beamTargets.forEach((target, index) => {
            this.laserBeams.push({
                startX: caroX,
                startY: caroY,
                endX: target.candy.x,
                endY: target.candy.y,
                progress: 0,
                delay: index * 20, // Faster staggered delay
                color: targetColor,
                targetRow: target.row,
                targetCol: target.col,
                hit: false
            });
        });

        // Floating text
        this.floatingTexts.push({
            text: 'CARO POWER!',
            x: caroX,
            y: caroY - this.cellSize,
            alpha: 1,
            life: 90,
            color: '#FF69B4',
            size: 28
        });

        // Animate the laser attack (optimized for performance)
        const startTime = Date.now();
        const laserDuration = 500; // Slightly faster
        const destroyDelay = 350;
        let destroyTriggered = false;

        const animateLasers = () => {
            const elapsed = Date.now() - startTime;

            // Update laser progress (batch update)
            for (let i = 0; i < this.laserBeams.length; i++) {
                const beam = this.laserBeams[i];
                const beamElapsed = Math.max(0, elapsed - beam.delay);
                beam.progress = Math.min(beamElapsed / 180, 1);

                // Create minimal particles on hit (only 1-2 per candy, not full effect)
                if (beam.progress >= 1 && !beam.hit) {
                    beam.hit = true;
                    // Simplified hit effect - just 2 particles instead of full rainbow
                    this.particles.push({
                        x: beam.endX,
                        y: beam.endY,
                        vx: (Math.random() - 0.5) * 4,
                        vy: (Math.random() - 0.5) * 4 - 2,
                        radius: 4,
                        color: beam.color,
                        alpha: 1,
                        life: 20
                    });
                }
            }

            // After delay, destroy all target candies AND Caro (only once)
            if (elapsed >= destroyDelay && !destroyTriggered) {
                destroyTriggered = true;
                targetCandies.forEach(target => {
                    const candy = this.grid[target.row][target.col];
                    if (candy && !candy.matched) {
                        candy.matched = true;
                        this.score += 50;
                    }
                });

                // Also mark Caro as matched so she disappears
                caroCandy.matched = true;
                this.score += 50;

                this.energy = Math.min(this.maxEnergy, this.energy + targetCandies.length * 3);

                if (Math.random() < 0.15 + targetCandies.length * 0.01) {
                    this.coinsEarned++;
                    this.playSound('coin');
                    this.floatingTexts.push({
                        text: '+1 Muenze!',
                        x: this.canvas.width / 2,
                        y: this.gridOffsetY - 30,
                        alpha: 1,
                        life: 90,
                        color: '#FFD700',
                        size: 26
                    });
                }
            }

            if (elapsed < laserDuration) {
                requestAnimationFrame(animateLasers);
            } else {
                this.laserBeams = [];
                this.isSwapping = false;
                this.removeMatchedCandies();
            }
        };

        animateLasers();
    },

    animateSwap(candy1, candy2, startX1, startY1, startX2, startY2, callback) {
        const duration = 150;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeOutQuad(progress);

            candy1.x = startX1 + (candy1.targetX - startX1) * eased;
            candy1.y = startY1 + (candy1.targetY - startY1) * eased;
            candy2.x = startX2 + (candy2.targetX - startX2) * eased;
            candy2.y = startY2 + (candy2.targetY - startY2) * eased;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                candy1.x = candy1.targetX;
                candy1.y = candy1.targetY;
                candy2.x = candy2.targetX;
                candy2.y = candy2.targetY;
                if (callback) callback();
            }
        };

        animate();
    },

    hasMatches() {
        this.findMatches();
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] && this.grid[row][col].matched) return true;
            }
        }
        return false;
    },

    findMatches() {
        // Reset matched flags
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col]) {
                    this.grid[row][col].matched = false;
                }
            }
        }

        const matches = [];

        // Horizontal matches
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize - 2; col++) {
                const c1 = this.grid[row][col];
                const c2 = this.grid[row][col + 1];
                const c3 = this.grid[row][col + 2];

                if (!c1 || !c2 || !c3) continue;

                // Match by type (Caro matches with Caro)
                const type1 = c1.isCaro ? -1 : c1.type;
                const type2 = c2.isCaro ? -1 : c2.type;
                const type3 = c3.isCaro ? -1 : c3.type;

                if (type1 === type2 && type2 === type3) {
                    let matchLength = 3;
                    while (col + matchLength < this.gridSize) {
                        const next = this.grid[row][col + matchLength];
                        if (next && (next.isCaro ? -1 : next.type) === type1) {
                            matchLength++;
                        } else {
                            break;
                        }
                    }

                    const match = { type: type1, cells: [], direction: 'horizontal', length: matchLength };
                    for (let i = 0; i < matchLength; i++) {
                        match.cells.push({ row, col: col + i });
                        this.grid[row][col + i].matched = true;
                    }
                    matches.push(match);
                    col += matchLength - 1;
                }
            }
        }

        // Vertical matches
        for (let col = 0; col < this.gridSize; col++) {
            for (let row = 0; row < this.gridSize - 2; row++) {
                const c1 = this.grid[row][col];
                const c2 = this.grid[row + 1][col];
                const c3 = this.grid[row + 2][col];

                if (!c1 || !c2 || !c3) continue;

                const type1 = c1.isCaro ? -1 : c1.type;
                const type2 = c2.isCaro ? -1 : c2.type;
                const type3 = c3.isCaro ? -1 : c3.type;

                if (type1 === type2 && type2 === type3) {
                    let matchLength = 3;
                    while (row + matchLength < this.gridSize) {
                        const next = this.grid[row + matchLength][col];
                        if (next && (next.isCaro ? -1 : next.type) === type1) {
                            matchLength++;
                        } else {
                            break;
                        }
                    }

                    const match = { type: type1, cells: [], direction: 'vertical', length: matchLength };
                    for (let i = 0; i < matchLength; i++) {
                        match.cells.push({ row: row + i, col });
                        this.grid[row + i][col].matched = true;
                    }
                    matches.push(match);
                    row += matchLength - 1;
                }
            }
        }

        return matches;
    },

    processMatches() {
        this.isMatching = true;
        this.isAnimating = true;

        const matches = this.findMatches();
        if (matches.length === 0) {
            this.isMatching = false;
            this.isAnimating = false;
            this.checkForPossibleMoves();
            return;
        }

        this.combo++;
        this.lastMatchTime = Date.now();

        let hasCaroMatch = false;
        let specialCreatedAt = null;

        matches.forEach(match => {
            const matchScore = match.length * 10 * this.combo;
            this.score += matchScore;

            // Check for Caro in match
            match.cells.forEach(cell => {
                if (this.grid[cell.row][cell.col].isCaro) {
                    hasCaroMatch = true;
                }
            });

            // Floating score
            const centerCell = match.cells[Math.floor(match.cells.length / 2)];
            const candy = this.grid[centerCell.row][centerCell.col];
            this.floatingTexts.push({
                text: '+' + matchScore,
                x: candy.x,
                y: candy.y,
                alpha: 1,
                life: 60,
                color: this.combo > 2 ? '#FFD700' : '#FFFFFF',
                size: this.combo > 2 ? 24 : 18
            });

            // Energy gain
            this.energy = Math.min(this.maxEnergy, this.energy + this.energyGainPerMatch * Math.min(this.combo, 5) * 0.5);

            // Create special candies
            if (match.length >= 4 && !specialCreatedAt) {
                const specialCell = match.cells[Math.floor(match.cells.length / 2)];
                const specialCandy = this.grid[specialCell.row][specialCell.col];

                if (match.length === 4) {
                    // Striped candy
                    specialCandy.special = match.direction === 'horizontal' ?
                        this.specialTypes.STRIPE_V : this.specialTypes.STRIPE_H;
                    specialCandy.matched = false;
                    specialCreatedAt = specialCell;
                    this.playSound('special');
                    this.energy = Math.min(this.maxEnergy, this.energy + this.energyGainPerSpecial);
                } else if (match.length >= 5) {
                    // Color bomb
                    specialCandy.special = this.specialTypes.COLOR_BOMB;
                    specialCandy.matched = false;
                    specialCreatedAt = specialCell;
                    this.playSound('special');
                    this.energy = Math.min(this.maxEnergy, this.energy + this.energyGainPerSpecial * 2);
                }
            }
        });

        // Check for L/T shape (wrapped candy)
        if (!specialCreatedAt) {
            for (const match of matches) {
                for (const cell of match.cells) {
                    const otherMatches = matches.filter(m =>
                        m !== match &&
                        m.cells.some(c => c.row === cell.row && c.col === cell.col)
                    );
                    if (otherMatches.length > 0) {
                        const candy = this.grid[cell.row][cell.col];
                        candy.special = this.specialTypes.WRAPPED;
                        candy.matched = false;
                        specialCreatedAt = cell;
                        this.playSound('special');
                        this.energy = Math.min(this.maxEnergy, this.energy + this.energyGainPerSpecial);
                        break;
                    }
                }
                if (specialCreatedAt) break;
            }
        }

        if (hasCaroMatch) {
            this.playSound('caro');
        } else {
            this.playSound(this.combo > 1 ? 'combo' : 'match');
        }

        // Coin chance (reduced - coins are more valuable now)
        const coinChance = 0.008 + (this.combo - 1) * 0.006 + (specialCreatedAt ? 0.04 : 0) + (hasCaroMatch ? 0.08 : 0);
        if (Math.random() < coinChance) {
            this.coinsEarned++;
            this.playSound('coin');
            this.floatingTexts.push({
                text: '+1 Muenze!',
                x: this.canvas.width / 2,
                y: this.gridOffsetY - 30,
                alpha: 1,
                life: 90,
                color: '#FFD700',
                size: 26
            });
        }

        // Thaw frozen tiles around matches
        matches.forEach(match => {
            this.thawTilesAroundMatch(match.cells);
        });

        this.removeMatchedCandies();
    },

    shakeFrozenTile(row, col) {
        const candy = this.grid[row][col];
        if (!candy) return;

        const originalX = candy.x;
        const shakeAmount = 4;
        let shakeCount = 0;

        const shake = () => {
            if (shakeCount >= 6) {
                candy.x = originalX;
                return;
            }
            candy.x = originalX + (shakeCount % 2 === 0 ? shakeAmount : -shakeAmount);
            shakeCount++;
            setTimeout(shake, 40);
        };
        shake();
    },

    removeMatchedCandies() {
        const toRemove = [];

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const candy = this.grid[row][col];
                if (candy && candy.matched) {
                    // Trigger special effects
                    if (candy.special !== this.specialTypes.NONE) {
                        this.triggerSpecialEffect(candy);
                    }
                    toRemove.push({ row, col, candy });
                    this.createMatchParticles(candy);
                }
            }
        }

        // Animate removal
        const removeStart = Date.now();
        const removeDuration = 200;

        const animateRemoval = () => {
            const elapsed = Date.now() - removeStart;
            const progress = Math.min(elapsed / removeDuration, 1);

            toRemove.forEach(({ candy }) => {
                candy.scale = 1 - progress;
                candy.alpha = 1 - progress;
                candy.rotation = progress * Math.PI * 0.5;
            });

            if (progress < 1) {
                requestAnimationFrame(animateRemoval);
            } else {
                // Remove from grid
                toRemove.forEach(({ row, col }) => {
                    this.grid[row][col] = null;
                });
                this.dropCandies();
            }
        };

        animateRemoval();
    },

    triggerSpecialEffect(candy) {
        this.playSound('explosion');

        const affected = [];

        switch (candy.special) {
            case this.specialTypes.STRIPE_H:
                for (let col = 0; col < this.gridSize; col++) {
                    // Clear frozen tiles in this row
                    if (this.frozenTiles && this.frozenTiles[candy.row][col] > 0) {
                        this.frozenTiles[candy.row][col] = 0;
                        this.playSound('thaw');
                    }
                    if (this.grid[candy.row][col] && !this.grid[candy.row][col].matched) {
                        this.grid[candy.row][col].matched = true;
                        affected.push(this.grid[candy.row][col]);
                        this.score += 20;
                    }
                }
                this.createLineEffect(candy.row, -1, true);
                break;

            case this.specialTypes.STRIPE_V:
                for (let row = 0; row < this.gridSize; row++) {
                    // Clear frozen tiles in this column
                    if (this.frozenTiles && this.frozenTiles[row][candy.col] > 0) {
                        this.frozenTiles[row][candy.col] = 0;
                        this.playSound('thaw');
                    }
                    if (this.grid[row][candy.col] && !this.grid[row][candy.col].matched) {
                        this.grid[row][candy.col].matched = true;
                        affected.push(this.grid[row][candy.col]);
                        this.score += 20;
                    }
                }
                this.createLineEffect(-1, candy.col, false);
                break;

            case this.specialTypes.WRAPPED:
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const r = candy.row + dr;
                        const c = candy.col + dc;
                        if (r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize) {
                            if (this.grid[r][c] && !this.grid[r][c].matched) {
                                this.grid[r][c].matched = true;
                                affected.push(this.grid[r][c]);
                                this.score += 30;
                            }
                        }
                    }
                }
                this.createExplosionEffect(candy.x, candy.y);
                break;

            case this.specialTypes.COLOR_BOMB:
                const targetType = Math.floor(Math.random() * this.candyTypes.length);
                for (let row = 0; row < this.gridSize; row++) {
                    for (let col = 0; col < this.gridSize; col++) {
                        const c = this.grid[row][col];
                        if (c && c.type === targetType && !c.matched) {
                            c.matched = true;
                            affected.push(c);
                            this.score += 40;
                            this.createRainbowParticles(c.x, c.y);
                        }
                    }
                }
                break;

            case this.specialTypes.CARO:
                // Clear all Caro candies with mega effect
                for (let row = 0; row < this.gridSize; row++) {
                    for (let col = 0; col < this.gridSize; col++) {
                        const c = this.grid[row][col];
                        if (c && c.isCaro && !c.matched) {
                            c.matched = true;
                            affected.push(c);
                            this.score += 100;
                            this.createRainbowParticles(c.x, c.y);
                        }
                    }
                }
                // Also clear row and column
                for (let col = 0; col < this.gridSize; col++) {
                    if (this.grid[candy.row][col] && !this.grid[candy.row][col].matched) {
                        this.grid[candy.row][col].matched = true;
                        this.score += 20;
                    }
                }
                for (let row = 0; row < this.gridSize; row++) {
                    if (this.grid[row][candy.col] && !this.grid[row][candy.col].matched) {
                        this.grid[row][candy.col].matched = true;
                        this.score += 20;
                    }
                }

                // Bonus coin for Caro special
                if (Math.random() < 0.4) {
                    this.coinsEarned++;
                    this.playSound('coin');
                }
                break;
        }

        this.energy = Math.min(this.maxEnergy, this.energy + this.energyGainPerSpecial);
    },

    createLineEffect(row, col, horizontal) {
        const count = 20;
        for (let i = 0; i < count; i++) {
            const x = horizontal ?
                this.gridOffsetX + (i / count) * this.cellSize * this.gridSize :
                this.gridOffsetX + col * this.cellSize + this.cellSize / 2;
            const y = horizontal ?
                this.gridOffsetY + row * this.cellSize + this.cellSize / 2 :
                this.gridOffsetY + (i / count) * this.cellSize * this.gridSize;

            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: 4 + Math.random() * 4,
                color: `hsl(${Math.random() * 60 + 30}, 100%, 60%)`,
                alpha: 1,
                life: 40 + Math.random() * 20
            });
        }
    },

    createExplosionEffect(x, y) {
        // Reduced particle count for performance (12 instead of 30)
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            const speed = 3 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 4 + Math.random() * 4,
                color: `hsl(${i * 30}, 100%, 60%)`,
                alpha: 1,
                life: 35 + Math.random() * 20
            });
        }
    },

    createRainbowParticles(x, y) {
        // Reduced particle count for performance (7 instead of 15)
        const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
        for (let i = 0; i < 7; i++) {
            const angle = (Math.PI * 2 / 7) * i;
            const speed = 2.5 + Math.random() * 2;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 3 + Math.random() * 3,
                color: colors[i],
                alpha: 1,
                life: 30 + Math.random() * 15,
                rainbow: true
            });
        }
    },

    createMatchParticles(candy) {
        // Reduced particle count for performance (5 instead of 10)
        const color = candy.isCaro ? '#FF69B4' : this.candyTypes[candy.type]?.color || '#FFFFFF';
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i;
            const speed = 2 + Math.random() * 2;
            this.particles.push({
                x: candy.x,
                y: candy.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 3 + Math.random() * 3,
                color: color,
                alpha: 1,
                life: 25 + Math.random() * 15
            });
        }
    },

    dropCandies() {
        this.isFalling = true;

        // Move candies down
        for (let col = 0; col < this.gridSize; col++) {
            let emptyRow = this.gridSize - 1;

            for (let row = this.gridSize - 1; row >= 0; row--) {
                if (this.grid[row][col] !== null) {
                    if (row !== emptyRow) {
                        this.grid[emptyRow][col] = this.grid[row][col];
                        this.grid[row][col] = null;

                        const candy = this.grid[emptyRow][col];
                        candy.row = emptyRow;
                        candy.targetY = this.gridOffsetY + emptyRow * this.cellSize + this.cellSize / 2;
                    }
                    emptyRow--;
                }
            }

            // Fill from top
            for (let row = emptyRow; row >= 0; row--) {
                const newCandy = this.createCandy(row, col, true);
                newCandy.y = this.gridOffsetY - (emptyRow - row + 1) * this.cellSize - this.cellSize / 2;
                newCandy.isNew = true;
                this.grid[row][col] = newCandy;
            }
        }

        // Animate falling
        const fallStart = Date.now();
        const fallDuration = 250;

        const animateFall = () => {
            const elapsed = Date.now() - fallStart;
            const progress = Math.min(elapsed / fallDuration, 1);
            const eased = this.easeOutBounce(progress);

            for (let row = 0; row < this.gridSize; row++) {
                for (let col = 0; col < this.gridSize; col++) {
                    const candy = this.grid[row][col];
                    if (candy) {
                        const dy = candy.targetY - candy.y;
                        if (Math.abs(dy) > 0.5) {
                            candy.y += dy * 0.25;
                        } else {
                            candy.y = candy.targetY;
                        }
                    }
                }
            }

            if (progress < 1) {
                requestAnimationFrame(animateFall);
            } else {
                // Snap to final positions
                for (let row = 0; row < this.gridSize; row++) {
                    for (let col = 0; col < this.gridSize; col++) {
                        const candy = this.grid[row][col];
                        if (candy) {
                            candy.y = candy.targetY;
                            candy.isNew = false;
                        }
                    }
                }

                this.isFalling = false;

                // Check for new matches
                if (this.hasMatches()) {
                    setTimeout(() => this.processMatches(), 100);
                } else {
                    this.isMatching = false;
                    this.isAnimating = false;
                    this.checkForPossibleMoves();
                }
            }
        };

        animateFall();
    },

    checkForPossibleMoves() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                // Try right
                if (col < this.gridSize - 1) {
                    this.swapTemp(row, col, row, col + 1);
                    if (this.hasMatchesQuick()) {
                        this.swapTemp(row, col, row, col + 1);
                        return true;
                    }
                    this.swapTemp(row, col, row, col + 1);
                }
                // Try down
                if (row < this.gridSize - 1) {
                    this.swapTemp(row, col, row + 1, col);
                    if (this.hasMatchesQuick()) {
                        this.swapTemp(row, col, row + 1, col);
                        return true;
                    }
                    this.swapTemp(row, col, row + 1, col);
                }
            }
        }

        this.shuffleBoard();
        return false;
    },

    swapTemp(r1, c1, r2, c2) {
        const temp = this.grid[r1][c1];
        this.grid[r1][c1] = this.grid[r2][c2];
        this.grid[r2][c2] = temp;
    },

    hasMatchesQuick() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize - 2; col++) {
                const c1 = this.grid[row][col];
                const c2 = this.grid[row][col + 1];
                const c3 = this.grid[row][col + 2];
                if (c1 && c2 && c3) {
                    const t1 = c1.isCaro ? -1 : c1.type;
                    const t2 = c2.isCaro ? -1 : c2.type;
                    const t3 = c3.isCaro ? -1 : c3.type;
                    if (t1 === t2 && t2 === t3) return true;
                }
            }
        }
        for (let col = 0; col < this.gridSize; col++) {
            for (let row = 0; row < this.gridSize - 2; row++) {
                const c1 = this.grid[row][col];
                const c2 = this.grid[row + 1][col];
                const c3 = this.grid[row + 2][col];
                if (c1 && c2 && c3) {
                    const t1 = c1.isCaro ? -1 : c1.type;
                    const t2 = c2.isCaro ? -1 : c2.type;
                    const t3 = c3.isCaro ? -1 : c3.type;
                    if (t1 === t2 && t2 === t3) return true;
                }
            }
        }
        return false;
    },

    shuffleBoard() {
        const candies = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                candies.push({ type: this.grid[row][col].type, isCaro: this.grid[row][col].isCaro });
            }
        }

        for (let i = candies.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candies[i], candies[j]] = [candies[j], candies[i]];
        }

        let idx = 0;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col].type = candies[idx].type;
                this.grid[row][col].isCaro = candies[idx].isCaro;
                this.grid[row][col].special = this.specialTypes.NONE;
                idx++;
            }
        }

        this.floatingTexts.push({
            text: 'Shuffle!',
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            alpha: 1,
            life: 60,
            color: '#FFFFFF',
            size: 32
        });
    },

    // ============================================
    // GAME LOOP
    // ============================================
    reset() {
        this.score = 0;
        this.combo = 0;
        this.energy = this.maxEnergy;
        this.gameOver = false;
        this.coinsEarned = 0;
        this.isSwapping = false;
        this.isMatching = false;
        this.isFalling = false;
        this.isAnimating = false;
        this.selected = null;
        this.animations = [];
        this.particles = [];
        this.floatingTexts = [];
        this.laserBeams = [];
        this.freezeTimer = Date.now();
        this.nextFreezeTime = 15000 + Math.random() * 5000;

        // Progressive difficulty - reset timers
        this.gameStartTime = Date.now();
        this.lastUpdateTime = Date.now();
        this.difficultyMultiplier = 1.0;
        this.energyDecayRate = this.baseEnergyDecayRate;

        this.initFrozenTiles();
        this.createGrid();
    },

    initFrozenTiles() {
        this.frozenTiles = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.frozenTiles[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.frozenTiles[row][col] = 0; // 0 = not frozen, 1-3 = ice layers
            }
        }
    },

    spawnFreezeEffect() {
        // Freeze a random row or 2x2 area
        const freezeType = Math.random();

        if (freezeType < 0.4) {
            // Freeze partial row
            const row = Math.floor(Math.random() * this.gridSize);
            const startCol = Math.floor(Math.random() * (this.gridSize - 3));
            const length = 3 + Math.floor(Math.random() * 3);
            for (let col = startCol; col < Math.min(startCol + length, this.gridSize); col++) {
                if (this.frozenTiles[row][col] < 2) {
                    this.frozenTiles[row][col] = Math.min(this.frozenTiles[row][col] + 1, 2);
                }
            }
            this.showFreezeAlert('Reihe eingefroren!');
        } else if (freezeType < 0.7) {
            // Freeze partial column
            const col = Math.floor(Math.random() * this.gridSize);
            const startRow = Math.floor(Math.random() * (this.gridSize - 3));
            const length = 3 + Math.floor(Math.random() * 3);
            for (let row = startRow; row < Math.min(startRow + length, this.gridSize); row++) {
                if (this.frozenTiles[row][col] < 2) {
                    this.frozenTiles[row][col] = Math.min(this.frozenTiles[row][col] + 1, 2);
                }
            }
            this.showFreezeAlert('Spalte eingefroren!');
        } else {
            // Freeze 2x3 area
            const row = Math.floor(Math.random() * (this.gridSize - 2));
            const col = Math.floor(Math.random() * (this.gridSize - 1));
            for (let r = row; r < row + 3; r++) {
                for (let c = col; c < col + 2; c++) {
                    if (this.frozenTiles[r][c] < 2) {
                        this.frozenTiles[r][c] = Math.min(this.frozenTiles[r][c] + 1, 2);
                    }
                }
            }
            this.showFreezeAlert('Bereich eingefroren!');
        }

        this.playSound('freeze');
        this.createFreezeParticles();
    },

    showFreezeAlert(text) {
        this.floatingTexts.push({
            text: '❄️ ' + text + ' ❄️',
            x: this.canvas.width / 2,
            y: this.gridOffsetY - 40,
            alpha: 1,
            life: 100,
            color: '#88DDFF',
            size: 22
        });
    },

    createFreezeParticles() {
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: this.gridOffsetX + Math.random() * this.cellSize * this.gridSize,
                y: this.gridOffsetY - 20,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 3 + 1,
                radius: 3 + Math.random() * 4,
                color: `hsl(${190 + Math.random() * 20}, 100%, ${70 + Math.random() * 30}%)`,
                alpha: 1,
                life: 60 + Math.random() * 40,
                snowflake: true
            });
        }
    },

    thawTilesAroundMatch(matchCells) {
        let anyThawed = false;

        matchCells.forEach(cell => {
            // Thaw the matched cell and adjacent cells
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const r = cell.row + dr;
                    const c = cell.col + dc;
                    if (r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize) {
                        if (this.frozenTiles[r][c] > 0) {
                            this.frozenTiles[r][c]--;
                            anyThawed = true;

                            const candy = this.grid[r][c];
                            if (candy) {
                                // Create ice crack/shatter particles
                                for (let i = 0; i < 8; i++) {
                                    const angle = (Math.PI * 2 / 8) * i;
                                    this.particles.push({
                                        x: candy.x,
                                        y: candy.y,
                                        vx: Math.cos(angle) * (2 + Math.random() * 2),
                                        vy: Math.sin(angle) * (2 + Math.random() * 2) - 1,
                                        radius: 3 + Math.random() * 3,
                                        color: `hsl(${190 + Math.random() * 20}, 100%, ${70 + Math.random() * 30}%)`,
                                        alpha: 1,
                                        life: 25 + Math.random() * 15
                                    });
                                }
                            }

                            if (this.frozenTiles[r][c] === 0) {
                                // Fully thawed - extra celebration
                                this.score += 10;
                                this.floatingTexts.push({
                                    text: '☀️',
                                    x: candy ? candy.x : this.gridOffsetX + c * this.cellSize + this.cellSize / 2,
                                    y: candy ? candy.y : this.gridOffsetY + r * this.cellSize + this.cellSize / 2,
                                    alpha: 1,
                                    life: 40,
                                    color: '#FFD700',
                                    size: 20
                                });
                            }
                        }
                    }
                }
            }
        });

        if (anyThawed) {
            this.playSound('thaw');
        }
    },

    start() {
        this.isRunning = true;
        this.reset();
        this.gameLoop();
    },

    stop() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    },

    exit() {
        this.saveHighscore();
        this.stop();
        if (this.onExit) {
            this.onExit(this.coinsEarned);
        }
    },

    gameLoop() {
        if (!this.isRunning) return;

        this.update();
        this.render();
        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    },

    update() {
        const currentTime = Date.now();
        const deltaTime = Math.min((currentTime - this.lastUpdateTime) / 1000, 0.1); // Cap at 100ms to prevent huge jumps
        this.lastUpdateTime = currentTime;
        this.animationTime = currentTime * 0.001;

        if (this.gameOver) return;

        // Progressive difficulty - increases over time (time-based, not FPS-based)
        const gameTimeSeconds = (currentTime - this.gameStartTime) / 1000;
        // Difficulty increases by 50% every 30 seconds, capped at 3x
        this.difficultyMultiplier = Math.min(1.0 + (gameTimeSeconds / 30) * 0.5, 3.0);
        this.energyDecayRate = this.baseEnergyDecayRate * this.difficultyMultiplier;

        // Energy decay (time-based, independent of FPS)
        if (!this.isAnimating && !this.isSwapping && !this.isMatching && !this.isFalling) {
            // Decay is per-second * deltaTime for FPS-independent behavior
            this.energy -= this.energyDecayRate * deltaTime * 60; // Normalized to 60 FPS equivalent
            if (this.energy <= 0) {
                this.energy = 0;
                this.gameOver = true;
                this.saveHighscore();
                this.playSound('gameOver');
                return;
            }
        }

        // Freeze timer - spawn ice periodically (faster as difficulty increases)
        const freezeInterval = this.nextFreezeTime / this.difficultyMultiplier;
        if (currentTime - this.freezeTimer > freezeInterval) {
            this.spawnFreezeEffect();
            this.freezeTimer = currentTime;
            this.nextFreezeTime = 12000 + Math.random() * 8000;
        }

        // Update particles (limit count for performance)
        const maxParticles = 100;
        if (this.particles.length > maxParticles) {
            this.particles = this.particles.slice(-maxParticles);
        }
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            if (p.snowflake) {
                p.y += p.vy * 0.5;
                p.vx += (Math.random() - 0.5) * 0.3;
                p.vx *= 0.98;
            } else {
                p.y += p.vy;
                p.vy += 0.12;
            }
            p.life--;
            p.alpha = Math.max(0, p.life / 50);
            p.radius *= 0.98;
            return p.life > 0 && p.alpha > 0;
        });

        // Update floating texts (limit count for performance)
        if (this.floatingTexts.length > 20) {
            this.floatingTexts = this.floatingTexts.slice(-20);
        }
        this.floatingTexts = this.floatingTexts.filter(ft => {
            ft.y -= 1.2;
            ft.life--;
            ft.alpha = Math.max(0, ft.life / 60);
            return ft.life > 0;
        });
    },

    easeOutQuad(t) {
        return t * (2 - t);
    },

    easeOutBounce(t) {
        if (t < 1 / 2.75) {
            return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
            t -= 1.5 / 2.75;
            return 7.5625 * t * t + 0.75;
        } else if (t < 2.5 / 2.75) {
            t -= 2.25 / 2.75;
            return 7.5625 * t * t + 0.9375;
        } else {
            t -= 2.625 / 2.75;
            return 7.5625 * t * t + 0.984375;
        }
    },

    // ============================================
    // RENDERING
    // ============================================
    render() {
        const ctx = this.ctx;

        this.drawBackground(ctx);
        this.drawGridBackground(ctx);
        this.drawFrozenOverlay(ctx);
        this.drawCandies(ctx);
        this.drawLaserBeams(ctx);
        this.drawParticles(ctx);
        this.drawFloatingTexts(ctx);
        this.drawUI(ctx);

        if (this.gameOver) {
            this.drawGameOver(ctx);
        }
    },

    drawLaserBeams(ctx) {
        if (!this.laserBeams || this.laserBeams.length === 0) return;

        ctx.save();
        ctx.lineCap = 'round';

        // Batch draw all laser beams (optimized - fewer state changes)
        // First pass: outer glow (all beams together)
        ctx.shadowBlur = 12;
        ctx.lineWidth = 6;
        ctx.globalAlpha = 0.5;

        for (let i = 0; i < this.laserBeams.length; i++) {
            const beam = this.laserBeams[i];
            if (beam.progress <= 0) continue;

            const currentX = beam.startX + (beam.endX - beam.startX) * beam.progress;
            const currentY = beam.startY + (beam.endY - beam.startY) * beam.progress;

            ctx.strokeStyle = beam.color;
            ctx.shadowColor = beam.color;
            ctx.beginPath();
            ctx.moveTo(beam.startX, beam.startY);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
        }

        // Second pass: white core (all beams together)
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#FFFFFF';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.9;

        for (let i = 0; i < this.laserBeams.length; i++) {
            const beam = this.laserBeams[i];
            if (beam.progress <= 0) continue;

            const currentX = beam.startX + (beam.endX - beam.startX) * beam.progress;
            const currentY = beam.startY + (beam.endY - beam.startY) * beam.progress;

            ctx.beginPath();
            ctx.moveTo(beam.startX, beam.startY);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();

            // Simple spark at tip (only if still moving)
            if (beam.progress < 1) {
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(currentX, currentY, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();

        // Draw Caro power aura at source when firing
        if (this.laserBeams.length > 0 && this.laserBeams[0].progress > 0) {
            const sourceX = this.laserBeams[0].startX;
            const sourceY = this.laserBeams[0].startY;
            const pulsePhase = (Date.now() % 200) / 200;

            ctx.save();
            ctx.globalAlpha = 0.6 - pulsePhase * 0.4;
            const auraSize = this.cellSize * 0.6 + pulsePhase * this.cellSize * 0.4;

            const auraGrad = ctx.createRadialGradient(sourceX, sourceY, 0, sourceX, sourceY, auraSize);
            auraGrad.addColorStop(0, 'rgba(255, 105, 180, 0.8)');
            auraGrad.addColorStop(0.5, 'rgba(255, 182, 193, 0.4)');
            auraGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(sourceX, sourceY, auraSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },

    drawBackground(ctx) {
        // Deep gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a0a2e');
        gradient.addColorStop(0.3, '#16213e');
        gradient.addColorStop(0.7, '#1a1a4e');
        gradient.addColorStop(1, '#0f0a3e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Animated background stars
        this.backgroundStars.forEach(star => {
            const twinkle = Math.sin(this.animationTime * star.twinkleSpeed * 10 + star.twinkleOffset) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + twinkle * 0.5})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * (0.8 + twinkle * 0.4), 0, Math.PI * 2);
            ctx.fill();
        });

        // Decorative gradient circles
        ctx.fillStyle = 'rgba(255, 100, 150, 0.08)';
        ctx.beginPath();
        ctx.arc(this.canvas.width * 0.85, this.canvas.height * 0.15, 120, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(100, 200, 255, 0.08)';
        ctx.beginPath();
        ctx.arc(this.canvas.width * 0.15, this.canvas.height * 0.85, 150, 0, Math.PI * 2);
        ctx.fill();
    },

    drawGridBackground(ctx) {
        const gridWidth = this.cellSize * this.gridSize;
        const gridHeight = this.cellSize * this.gridSize;

        // Outer glow
        ctx.shadowColor = 'rgba(100, 150, 255, 0.3)';
        ctx.shadowBlur = 30;
        ctx.fillStyle = 'rgba(20, 20, 50, 0.9)';
        this.roundRect(ctx, this.gridOffsetX - 12, this.gridOffsetY - 12, gridWidth + 24, gridHeight + 24, 18);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Grid border
        ctx.strokeStyle = 'rgba(150, 180, 255, 0.4)';
        ctx.lineWidth = 3;
        this.roundRect(ctx, this.gridOffsetX - 12, this.gridOffsetY - 12, gridWidth + 24, gridHeight + 24, 18);
        ctx.stroke();

        // Grid cells
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const x = this.gridOffsetX + col * this.cellSize;
                const y = this.gridOffsetY + row * this.cellSize;

                const isLight = (row + col) % 2 === 0;
                ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)';
                this.roundRect(ctx, x + 2, y + 2, this.cellSize - 4, this.cellSize - 4, 6);
                ctx.fill();
            }
        }

    },

    drawFrozenOverlay(ctx) {
        if (!this.frozenTiles) return;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const iceLevel = this.frozenTiles[row][col];
                if (iceLevel > 0) {
                    const x = this.gridOffsetX + col * this.cellSize;
                    const y = this.gridOffsetY + row * this.cellSize;
                    const size = this.cellSize;

                    ctx.save();

                    // Ice layer opacity based on ice level
                    const alpha = 0.3 + iceLevel * 0.2;

                    // Ice background
                    const iceGrad = ctx.createLinearGradient(x, y, x + size, y + size);
                    iceGrad.addColorStop(0, `rgba(200, 240, 255, ${alpha})`);
                    iceGrad.addColorStop(0.3, `rgba(150, 220, 255, ${alpha * 0.8})`);
                    iceGrad.addColorStop(0.7, `rgba(180, 230, 255, ${alpha * 0.9})`);
                    iceGrad.addColorStop(1, `rgba(220, 250, 255, ${alpha})`);
                    ctx.fillStyle = iceGrad;
                    this.roundRect(ctx, x + 2, y + 2, size - 4, size - 4, 6);
                    ctx.fill();

                    // Ice cracks pattern
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + iceLevel * 0.15})`;
                    ctx.lineWidth = 1;

                    // Draw frost patterns
                    const centerX = x + size / 2;
                    const centerY = y + size / 2;
                    const patternSize = size * 0.35;

                    // Snowflake-like pattern
                    for (let i = 0; i < 6; i++) {
                        const angle = (Math.PI / 3) * i;
                        ctx.beginPath();
                        ctx.moveTo(centerX, centerY);
                        ctx.lineTo(
                            centerX + Math.cos(angle) * patternSize,
                            centerY + Math.sin(angle) * patternSize
                        );
                        ctx.stroke();

                        // Small branches
                        if (iceLevel > 1) {
                            const branchDist = patternSize * 0.6;
                            const branchX = centerX + Math.cos(angle) * branchDist;
                            const branchY = centerY + Math.sin(angle) * branchDist;
                            ctx.beginPath();
                            ctx.moveTo(branchX, branchY);
                            ctx.lineTo(
                                branchX + Math.cos(angle + Math.PI / 4) * patternSize * 0.3,
                                branchY + Math.sin(angle + Math.PI / 4) * patternSize * 0.3
                            );
                            ctx.moveTo(branchX, branchY);
                            ctx.lineTo(
                                branchX + Math.cos(angle - Math.PI / 4) * patternSize * 0.3,
                                branchY + Math.sin(angle - Math.PI / 4) * patternSize * 0.3
                            );
                            ctx.stroke();
                        }
                    }

                    // Ice sparkles
                    const sparkleTime = this.animationTime * 3;
                    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(sparkleTime + row + col) * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(x + size * 0.25, y + size * 0.3, 2, 0, Math.PI * 2);
                    ctx.arc(x + size * 0.7, y + size * 0.65, 1.5, 0, Math.PI * 2);
                    ctx.fill();

                    // Ice border
                    ctx.strokeStyle = `rgba(100, 200, 255, ${0.4 + iceLevel * 0.2})`;
                    ctx.lineWidth = 2;
                    this.roundRect(ctx, x + 2, y + 2, size - 4, size - 4, 6);
                    ctx.stroke();

                    ctx.restore();
                }
            }
        }
    },

    drawCandies(ctx) {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const candy = this.grid[row][col];
                if (candy && candy.alpha > 0) {
                    this.drawCandy(ctx, candy);
                }
            }
        }
    },

    drawCandy(ctx, candy) {
        ctx.save();
        ctx.translate(candy.x, candy.y);
        ctx.scale(candy.scale, candy.scale);
        ctx.rotate(candy.rotation);
        ctx.globalAlpha = candy.alpha;

        const size = this.cellSize * 0.38;
        const bounce = Math.sin(this.animationTime * 3 + candy.bouncePhase) * 1.5;

        ctx.translate(0, bounce);

        if (candy.isCaro) {
            this.drawCaroCandy(ctx, size, candy.special);
        } else {
            this.drawRegularCandy(ctx, candy, size);
        }

        // Draw special effect overlay
        if (candy.special !== this.specialTypes.NONE && !candy.isCaro) {
            this.drawSpecialOverlay(ctx, candy.special, size);
        }

        ctx.restore();
    },

    drawCaroCandy(ctx, size, special) {
        const s = size * 1.7;

        // Subtle glow
        ctx.shadowColor = 'rgba(255, 180, 200, 0.4)';
        ctx.shadowBlur = 4;

        // ===========================================
        // HAIR - Smooth, wavy brown hair (less voluminous)
        // ===========================================

        // Back hair layer (dark brown, smooth shape)
        const hairGrad = ctx.createRadialGradient(0, -s*0.2, 0, 0, s*0.2, s*1.1);
        hairGrad.addColorStop(0, '#7B5030');
        hairGrad.addColorStop(0.5, '#5D3D25');
        hairGrad.addColorStop(1, '#4A3020');
        ctx.fillStyle = hairGrad;

        // Smooth flowing hair shape
        ctx.beginPath();
        ctx.moveTo(-s*0.55, s*0.5);
        ctx.bezierCurveTo(-s*0.7, s*0.2, -s*0.7, -s*0.2, -s*0.55, -s*0.45);
        ctx.bezierCurveTo(-s*0.4, -s*0.6, -s*0.15, -s*0.65, 0, -s*0.65);
        ctx.bezierCurveTo(s*0.15, -s*0.65, s*0.4, -s*0.6, s*0.55, -s*0.45);
        ctx.bezierCurveTo(s*0.7, -s*0.2, s*0.7, s*0.2, s*0.55, s*0.5);
        ctx.bezierCurveTo(s*0.4, s*0.6, s*0.2, s*0.55, 0, s*0.5);
        ctx.bezierCurveTo(-s*0.2, s*0.55, -s*0.4, s*0.6, -s*0.55, s*0.5);
        ctx.fill();

        // Front hair layer (lighter)
        const hairFrontGrad = ctx.createRadialGradient(0, -s*0.3, 0, 0, 0, s*0.8);
        hairFrontGrad.addColorStop(0, '#8B5A35');
        hairFrontGrad.addColorStop(0.6, '#7A4A2A');
        hairFrontGrad.addColorStop(1, '#6B4025');
        ctx.fillStyle = hairFrontGrad;

        ctx.beginPath();
        ctx.moveTo(-s*0.5, s*0.35);
        ctx.bezierCurveTo(-s*0.6, s*0.1, -s*0.58, -s*0.15, -s*0.48, -s*0.38);
        ctx.bezierCurveTo(-s*0.35, -s*0.5, -s*0.12, -s*0.55, 0, -s*0.55);
        ctx.bezierCurveTo(s*0.12, -s*0.55, s*0.35, -s*0.5, s*0.48, -s*0.38);
        ctx.bezierCurveTo(s*0.58, -s*0.15, s*0.6, s*0.1, s*0.5, s*0.35);
        ctx.bezierCurveTo(s*0.35, s*0.45, s*0.15, s*0.4, 0, s*0.38);
        ctx.bezierCurveTo(-s*0.15, s*0.4, -s*0.35, s*0.45, -s*0.5, s*0.35);
        ctx.fill();

        // Hair highlights
        ctx.fillStyle = '#A07050';
        ctx.beginPath();
        ctx.ellipse(-s*0.3, -s*0.4, s*0.12, s*0.04, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(s*0.25, -s*0.42, s*0.1, s*0.035, 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // ===========================================
        // FACE - Bigger, round face
        // ===========================================
        const faceGrad = ctx.createRadialGradient(-s*0.08, -s*0.05, 0, 0, s*0.05, s*0.48);
        faceGrad.addColorStop(0, '#FFE8DC');
        faceGrad.addColorStop(0.6, '#FFDCC8');
        faceGrad.addColorStop(1, '#F0C8B5');
        ctx.fillStyle = faceGrad;

        // Bigger round face
        ctx.beginPath();
        ctx.arc(0, s*0.05, s*0.42, 0, Math.PI * 2);
        ctx.fill();

        // ===========================================
        // EYEBROWS - Soft, brown
        // ===========================================
        ctx.strokeStyle = '#6B4530';
        ctx.lineWidth = s * 0.04;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(-s*0.26, -s*0.08);
        ctx.quadraticCurveTo(-s*0.18, -s*0.14, -s*0.1, -s*0.1);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(s*0.26, -s*0.08);
        ctx.quadraticCurveTo(s*0.18, -s*0.14, s*0.1, -s*0.1);
        ctx.stroke();

        // ===========================================
        // EYES - Smaller, natural brown (not black!)
        // ===========================================

        // Left eye white
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(-s*0.16, s*0.05, s*0.09, s*0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        // Left iris (warm brown, not black)
        const leftIris = ctx.createRadialGradient(-s*0.16, s*0.04, 0, -s*0.16, s*0.05, s*0.065);
        leftIris.addColorStop(0, '#8B6040');
        leftIris.addColorStop(0.6, '#6B4530');
        leftIris.addColorStop(1, '#5A3825');
        ctx.fillStyle = leftIris;
        ctx.beginPath();
        ctx.ellipse(-s*0.16, s*0.06, s*0.055, s*0.06, 0, 0, Math.PI * 2);
        ctx.fill();

        // Left pupil (small)
        ctx.fillStyle = '#3D2515';
        ctx.beginPath();
        ctx.arc(-s*0.16, s*0.065, s*0.025, 0, Math.PI * 2);
        ctx.fill();

        // Left eye shine
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-s*0.14, s*0.03, s*0.025, 0, Math.PI * 2);
        ctx.fill();

        // Right eye white
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(s*0.16, s*0.05, s*0.09, s*0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        // Right iris
        const rightIris = ctx.createRadialGradient(s*0.16, s*0.04, 0, s*0.16, s*0.05, s*0.065);
        rightIris.addColorStop(0, '#8B6040');
        rightIris.addColorStop(0.6, '#6B4530');
        rightIris.addColorStop(1, '#5A3825');
        ctx.fillStyle = rightIris;
        ctx.beginPath();
        ctx.ellipse(s*0.16, s*0.06, s*0.055, s*0.06, 0, 0, Math.PI * 2);
        ctx.fill();

        // Right pupil
        ctx.fillStyle = '#3D2515';
        ctx.beginPath();
        ctx.arc(s*0.16, s*0.065, s*0.025, 0, Math.PI * 2);
        ctx.fill();

        // Right eye shine
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(s*0.18, s*0.03, s*0.025, 0, Math.PI * 2);
        ctx.fill();

        // ===========================================
        // BLUSH
        // ===========================================
        ctx.fillStyle = 'rgba(255, 140, 160, 0.35)';
        ctx.beginPath();
        ctx.ellipse(-s*0.28, s*0.15, s*0.07, s*0.04, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(s*0.28, s*0.15, s*0.07, s*0.04, 0, 0, Math.PI * 2);
        ctx.fill();

        // ===========================================
        // NOSE - tiny
        // ===========================================
        ctx.fillStyle = 'rgba(180, 130, 110, 0.25)';
        ctx.beginPath();
        ctx.arc(0, s*0.14, s*0.02, 0, Math.PI * 2);
        ctx.fill();

        // ===========================================
        // MOUTH - Happy smile
        // ===========================================
        ctx.fillStyle = '#B55050';
        ctx.beginPath();
        ctx.ellipse(0, s*0.28, s*0.12, s*0.06, 0, 0.1, Math.PI - 0.1);
        ctx.fill();

        // Teeth
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(0, s*0.26, s*0.08, s*0.025, 0, 0.2, Math.PI - 0.2);
        ctx.fill();

        // Smile line
        ctx.strokeStyle = '#A04545';
        ctx.lineWidth = s * 0.018;
        ctx.beginPath();
        ctx.arc(0, s*0.22, s*0.12, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // ===========================================
        // SPECIAL EFFECTS
        // ===========================================
        if (special === this.specialTypes.CARO) {
            const auraSize = s * 1.0 + Math.sin(this.animationTime * 4) * s * 0.04;
            const auraGrad = ctx.createRadialGradient(0, 0, s * 0.4, 0, 0, auraSize);
            auraGrad.addColorStop(0, 'rgba(255, 100, 150, 0)');
            auraGrad.addColorStop(0.7, 'rgba(255, 100, 150, 0.15)');
            auraGrad.addColorStop(1, 'rgba(255, 200, 230, 0)');
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
            ctx.fill();
            this.drawSparkles(ctx, s);
        }

        this.drawMiniSparkles(ctx, s);
    },

    drawMiniSparkles(ctx, size) {
        const sparkleCount = 3;
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < sparkleCount; i++) {
            const angle = this.animationTime * 2 + i * (Math.PI * 2 / sparkleCount);
            const dist = size * 1.0 + Math.sin(this.animationTime * 3 + i) * size * 0.15;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            const sparkleSize = (Math.sin(this.animationTime * 5 + i * 2) * 0.3 + 0.7) * size * 0.1;
            this.drawStar(ctx, x, y, sparkleSize, 4);
        }
    },

    drawSparkles(ctx, size) {
        const sparklePositions = [
            { x: -size * 1.2, y: -size * 0.8 },
            { x: size * 1.3, y: -size * 0.6 },
            { x: -size * 1.1, y: size * 0.7 },
            { x: size * 1.0, y: size * 0.9 }
        ];

        sparklePositions.forEach((pos, i) => {
            const sparkleSize = (Math.sin(this.animationTime * 5 + i * 1.5) * 0.3 + 0.7) * size * 0.2;
            ctx.fillStyle = '#FFFFFF';
            this.drawStar(ctx, pos.x, pos.y, sparkleSize, 4);
        });
    },

    drawStar(ctx, x, y, size, points) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const r = i % 2 === 0 ? size : size * 0.4;
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    },

    drawRegularCandy(ctx, candy, size) {
        const candyInfo = this.candyTypes[candy.type];
        const shape = candyInfo.shape;

        // Create gradient for glossy effect
        const gradient = ctx.createRadialGradient(-size * 0.3, -size * 0.3, 0, 0, 0, size * 1.2);
        gradient.addColorStop(0, this.lightenColor(candyInfo.color, 40));
        gradient.addColorStop(0.4, candyInfo.color);
        gradient.addColorStop(0.8, candyInfo.darkColor);
        gradient.addColorStop(1, this.darkenColor(candyInfo.darkColor, 20));

        ctx.fillStyle = gradient;

        // Draw shape based on candy type
        switch (shape) {
            case 'jellybean':
                this.drawJellybean(ctx, size);
                break;
            case 'lollipop':
                this.drawLollipop(ctx, size, candyInfo.color);
                break;
            case 'lemon':
                this.drawLemon(ctx, size);
                break;
            case 'apple':
                this.drawApple(ctx, size, candyInfo.color);
                break;
            case 'blueberry':
                this.drawBlueberry(ctx, size);
                break;
            case 'grape':
                this.drawGrape(ctx, size, candyInfo.color);
                break;
            default:
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
        }

        // Glossy highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(-size * 0.25, -size * 0.35, size * 0.35, size * 0.2, -0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.ellipse(-size * 0.15, -size * 0.2, size * 0.15, size * 0.08, -0.3, 0, Math.PI * 2);
        ctx.fill();
    },

    drawJellybean(ctx, size) {
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 1.1, size * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
    },

    drawLollipop(ctx, size, color) {
        // Swirl pattern
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();

        // Swirl lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = size * 0.15;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const startAngle = i * (Math.PI * 2 / 3);
            ctx.arc(0, 0, size * (0.3 + i * 0.25), startAngle, startAngle + Math.PI);
        }
        ctx.stroke();
    },

    drawLemon(ctx, size) {
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 1.15, size * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lemon tips
        ctx.beginPath();
        ctx.ellipse(-size * 0.95, 0, size * 0.25, size * 0.15, 0, 0, Math.PI * 2);
        ctx.ellipse(size * 0.95, 0, size * 0.25, size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
    },

    drawApple(ctx, size, color) {
        // Apple body
        ctx.beginPath();
        ctx.arc(-size * 0.3, 0, size * 0.8, 0, Math.PI * 2);
        ctx.arc(size * 0.3, 0, size * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Stem
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(-size * 0.08, -size * 0.95, size * 0.16, size * 0.25);

        // Leaf
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.ellipse(size * 0.2, -size * 0.85, size * 0.25, size * 0.12, 0.5, 0, Math.PI * 2);
        ctx.fill();
    },

    drawBlueberry(ctx, size) {
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();

        // Crown
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
            ctx.beginPath();
            ctx.arc(
                Math.cos(angle) * size * 0.4,
                Math.sin(angle) * size * 0.4 - size * 0.1,
                size * 0.15, 0, Math.PI * 2
            );
            ctx.fill();
        }
    },

    drawGrape(ctx, size, color) {
        // Main grape
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.9, 0, Math.PI * 2);
        ctx.fill();

        // Smaller grapes
        const positions = [
            { x: -size * 0.6, y: -size * 0.4 },
            { x: size * 0.6, y: -size * 0.4 },
            { x: 0, y: size * 0.65 }
        ];
        positions.forEach(pos => {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size * 0.45, 0, Math.PI * 2);
            ctx.fill();
        });
    },

    drawSpecialOverlay(ctx, special, size) {
        switch (special) {
            case this.specialTypes.STRIPE_H:
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-size * 1.3, 0);
                ctx.lineTo(size * 1.3, 0);
                ctx.stroke();

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-size * 1.2, -size * 0.25);
                ctx.lineTo(size * 1.2, -size * 0.25);
                ctx.moveTo(-size * 1.2, size * 0.25);
                ctx.lineTo(size * 1.2, size * 0.25);
                ctx.stroke();
                break;

            case this.specialTypes.STRIPE_V:
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, -size * 1.3);
                ctx.lineTo(0, size * 1.3);
                ctx.stroke();

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-size * 0.25, -size * 1.2);
                ctx.lineTo(-size * 0.25, size * 1.2);
                ctx.moveTo(size * 0.25, -size * 1.2);
                ctx.lineTo(size * 0.25, size * 1.2);
                ctx.stroke();
                break;

            case this.specialTypes.WRAPPED:
                // Wrapper effect
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-size * 1.2, -size * 0.3);
                ctx.lineTo(-size * 1.4, -size * 0.6);
                ctx.moveTo(-size * 1.2, size * 0.3);
                ctx.lineTo(-size * 1.4, size * 0.6);
                ctx.moveTo(size * 1.2, -size * 0.3);
                ctx.lineTo(size * 1.4, -size * 0.6);
                ctx.moveTo(size * 1.2, size * 0.3);
                ctx.lineTo(size * 1.4, size * 0.6);
                ctx.stroke();

                // Pulsing ring
                const pulse = Math.sin(this.animationTime * 5) * 3;
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, size + 5 + pulse, 0, Math.PI * 2);
                ctx.stroke();
                break;

            case this.specialTypes.COLOR_BOMB:
                // Rainbow ring
                const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#9400D3'];
                const segments = rainbowColors.length;
                ctx.lineWidth = 4;

                for (let i = 0; i < segments; i++) {
                    ctx.strokeStyle = rainbowColors[i];
                    ctx.beginPath();
                    const startAngle = (i / segments) * Math.PI * 2 + this.animationTime * 2;
                    const endAngle = ((i + 1) / segments) * Math.PI * 2 + this.animationTime * 2;
                    ctx.arc(0, 0, size + 6, startAngle, endAngle);
                    ctx.stroke();
                }

                // Inner sparkles
                ctx.fillStyle = '#FFFFFF';
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2 + this.animationTime * 3;
                    const x = Math.cos(angle) * size * 0.5;
                    const y = Math.sin(angle) * size * 0.5;
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
        }
    },

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    },

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    },

    drawParticles(ctx) {
        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha;

            if (p.rainbow) {
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 8;
            }

            if (p.snowflake) {
                // Draw snowflake shape
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(this.animationTime * 2);
                ctx.fillStyle = p.color;
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1;

                // Draw 6-pointed snowflake
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    ctx.save();
                    ctx.rotate(angle);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(0, -p.radius * 1.5);
                    ctx.stroke();
                    // Small branches
                    ctx.beginPath();
                    ctx.moveTo(0, -p.radius * 0.8);
                    ctx.lineTo(p.radius * 0.4, -p.radius * 1.2);
                    ctx.moveTo(0, -p.radius * 0.8);
                    ctx.lineTo(-p.radius * 0.4, -p.radius * 1.2);
                    ctx.stroke();
                    ctx.restore();
                }
                ctx.restore();
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.shadowBlur = 0;
        });
        ctx.globalAlpha = 1;
    },

    drawFloatingTexts(ctx) {
        this.floatingTexts.forEach(ft => {
            ctx.globalAlpha = ft.alpha;
            ctx.fillStyle = ft.color;
            ctx.font = `bold ${ft.size || 18}px Fredoka, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetY = 2;

            ctx.fillText(ft.text, ft.x, ft.y);

            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
        });
        ctx.globalAlpha = 1;
    },

    drawUI(ctx) {
        const safeTop = 50;

        // Exit button
        ctx.fillStyle = 'rgba(255, 100, 100, 0.85)';
        this.roundRect(ctx, 10, safeTop, 100, 40, 10);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Beenden', 60, safeTop + 20);

        // Score
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 26px Fredoka, sans-serif';
        ctx.textAlign = 'right';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.fillText(this.score.toLocaleString(), this.canvas.width - 20, safeTop + 22);
        ctx.shadowBlur = 0;

        // Highscore
        ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.font = '14px Fredoka, sans-serif';
        ctx.fillText(`Best: ${this.highscore.toLocaleString()}`, this.canvas.width - 20, safeTop + 45);

        // Coins
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Fredoka, sans-serif';
        ctx.fillText(`+${this.coinsEarned}`, this.canvas.width - 20, safeTop + 68);

        // Combo
        if (this.combo > 1 && Date.now() - this.lastMatchTime < 2000) {
            const comboAlpha = Math.max(0, 1 - (Date.now() - this.lastMatchTime) / 2000);
            ctx.globalAlpha = comboAlpha;
            ctx.fillStyle = '#FF69B4';
            ctx.font = 'bold 22px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`COMBO x${this.combo}!`, this.canvas.width / 2, safeTop + 25);
            ctx.globalAlpha = 1;
        }

        // Energy bar
        const barWidth = Math.min(280, this.canvas.width - 60);
        const barHeight = 22;
        const barX = (this.canvas.width - barWidth) / 2;
        const barY = safeTop + 85;

        // Bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.roundRect(ctx, barX, barY, barWidth, barHeight, 11);
        ctx.fill();

        // Energy fill
        const energyWidth = Math.max(0, (this.energy / this.maxEnergy) * (barWidth - 4));
        let energyGradient;

        if (this.energy > 60) {
            energyGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
            energyGradient.addColorStop(0, '#4ade80');
            energyGradient.addColorStop(1, '#22c55e');
        } else if (this.energy > 30) {
            energyGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
            energyGradient.addColorStop(0, '#fbbf24');
            energyGradient.addColorStop(1, '#f59e0b');
        } else {
            energyGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
            energyGradient.addColorStop(0, '#f87171');
            energyGradient.addColorStop(1, '#ef4444');

            // Pulse effect when low
            if (Math.sin(this.animationTime * 8) > 0) {
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 10;
            }
        }

        ctx.fillStyle = energyGradient;
        this.roundRect(ctx, barX + 2, barY + 2, energyWidth, barHeight - 4, 9);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Energy text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ENERGIE', this.canvas.width / 2, barY + barHeight / 2 + 1);

        // Instructions
        if (this.score === 0 && !this.isAnimating) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '15px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Wische um Candys zu tauschen!', this.canvas.width / 2, this.canvas.height - 55);
            ctx.fillText('Finde seltene Caro-Candys!', this.canvas.width / 2, this.canvas.height - 32);
        }
    },

    drawGameOver(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#FF6B6B';
        ctx.font = 'bold 44px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(255, 107, 107, 0.5)';
        ctx.shadowBlur = 20;
        ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 80);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fff';
        ctx.font = '26px Fredoka, sans-serif';
        ctx.fillText(`Score: ${this.score.toLocaleString()}`, this.canvas.width / 2, this.canvas.height / 2 - 30);

        if (this.score >= this.highscore && this.score > 0) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 22px Fredoka, sans-serif';
            ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
            ctx.shadowBlur = 15;
            ctx.fillText('NEUER HIGHSCORE!', this.canvas.width / 2, this.canvas.height / 2 + 5);
            ctx.shadowBlur = 0;
        }

        ctx.fillStyle = '#FFD700';
        ctx.font = '22px Fredoka, sans-serif';
        ctx.fillText(`+${this.coinsEarned} Muenzen!`, this.canvas.width / 2, this.canvas.height / 2 + 40);

        // Restart button
        ctx.fillStyle = '#4caf50';
        this.roundRect(ctx, this.canvas.width / 2 - 100, this.canvas.height / 2 + 65, 200, 55, 12);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Fredoka, sans-serif';
        ctx.fillText('Nochmal!', this.canvas.width / 2, this.canvas.height / 2 + 93);

        // Exit button
        ctx.fillStyle = '#f44336';
        this.roundRect(ctx, this.canvas.width / 2 - 100, this.canvas.height / 2 + 135, 200, 55, 12);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText('Zurueck', this.canvas.width / 2, this.canvas.height / 2 + 163);
    },

    roundRect(ctx, x, y, width, height, radius) {
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
};
