/**
 * ZOMBIE SURVIVOR - Top-Down Shooter Minigame
 * Twin-stick touch controls for mobile
 *
 * GEGNERTYPEN:
 * - Basic (gruen): 3 HP, langsam, keine Muenzen
 * - Runner (lila): 2 HP, schnell, selten Muenzen (10%)
 * - Tank (rot): 6 HP, langsam, gross, oft Muenzen (50%)
 */

const MiniGame = {
    canvas: null,
    ctx: null,
    isRunning: false,
    animationFrame: null,
    coinsEarned: 0,
    onExit: null,

    // Audio context for sound effects
    audioCtx: null,

    // Game state
    player: null,
    zombies: [],
    bullets: [],
    particles: [],
    coins: [],
    score: 0,
    highscore: 0,
    gameOver: false,
    zombieSpawnTimer: 0,
    zombieSpawnInterval: 150,
    difficulty: 1,

    // Enemy type definitions
    enemyTypes: {
        basic: {
            health: 3,
            speed: 1.9,
            radius: 22,
            color: '#4a7c59',
            darkColor: '#2d4a35',
            coinChance: 0,       // No coins!
            scoreValue: 10
        },
        runner: {
            health: 2,
            speed: 3.5,
            radius: 18,
            color: '#8e44ad',
            darkColor: '#5b2c6f',
            coinChance: 0.05,    // 10% chance
            scoreValue: 20
        },
        tank: {
            health: 9,
            speed: 0.7,
            radius: 32,
            color: '#c0392b',
            darkColor: '#7b241c',
            coinChance: 0.50,    // 50% chance
            scoreValue: 50
        }
    },

    // Screen shake
    screenShake: { x: 0, y: 0, intensity: 0 },

    // Touch controls
    leftJoystick: { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0, touchId: null },
    rightJoystick: { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0, touchId: null },
    joystickRadius: 60,
    joystickDeadzone: 10,

    // Fire rate
    fireTimer: 0,
    fireRate: 8,

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
            case 'shoot': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            }
            case 'hit': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            }
            case 'kill': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            }
            case 'coin': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.setValueAtTime(1100, now + 0.1);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            }
            case 'gameOver': {
                // Descending notes
                for (let i = 0; i < 4; i++) {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(400 - i * 80, now + i * 0.15);
                    gain.gain.setValueAtTime(0.15, now + i * 0.15);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.15);
                    osc.start(now + i * 0.15);
                    osc.stop(now + i * 0.15 + 0.15);
                }
                break;
            }
            case 'tankHit': {
                // Heavy thud for tank
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(80, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            }
        }
    },

    init(canvas, onExitCallback) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onExit = onExitCallback;
        this.resize();
        this.setupEvents();
        this.initAudio();
        this.loadHighscore();
        this.start();
    },

    loadHighscore() {
        this.highscore = parseInt(localStorage.getItem('minigame_highscore')) || 0;
    },

    saveHighscore() {
        if (this.score > this.highscore) {
            this.highscore = this.score;
            localStorage.setItem('minigame_highscore', this.highscore.toString());
        }
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    eventsSetup: false,

    setupEvents() {
        if (this.eventsSetup) return;
        this.eventsSetup = true;

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        this.canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });

        // Resize
        window.addEventListener('resize', () => this.resize());
    },

    handleTouchStart(e) {
        e.preventDefault();
        this.initAudio(); // Ensure audio is ready
        const rect = this.canvas.getBoundingClientRect();

        for (let touch of e.changedTouches) {
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            // Check for button presses first
            if (this.gameOver) {
                if (this.isInsideRestartButton(x, y)) {
                    this.reset();
                    return;
                }
                if (this.isInsideExitButton(x, y)) {
                    this.exit();
                    return;
                }
            }

            // Check exit button during gameplay
            if (this.isInsideExitButton(x, y)) {
                this.exit();
                return;
            }

            // Left half = movement joystick
            if (x < this.canvas.width / 2 && !this.leftJoystick.active) {
                this.leftJoystick.active = true;
                this.leftJoystick.startX = x;
                this.leftJoystick.startY = y;
                this.leftJoystick.currentX = x;
                this.leftJoystick.currentY = y;
                this.leftJoystick.touchId = touch.identifier;
            }
            // Right half = aim/shoot joystick
            else if (x >= this.canvas.width / 2 && !this.rightJoystick.active) {
                this.rightJoystick.active = true;
                this.rightJoystick.startX = x;
                this.rightJoystick.startY = y;
                this.rightJoystick.currentX = x;
                this.rightJoystick.currentY = y;
                this.rightJoystick.touchId = touch.identifier;
            }
        }
    },

    handleTouchMove(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();

        for (let touch of e.changedTouches) {
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            if (touch.identifier === this.leftJoystick.touchId) {
                this.leftJoystick.currentX = x;
                this.leftJoystick.currentY = y;
            }
            if (touch.identifier === this.rightJoystick.touchId) {
                this.rightJoystick.currentX = x;
                this.rightJoystick.currentY = y;
            }
        }
    },

    handleTouchEnd(e) {
        e.preventDefault();

        for (let touch of e.changedTouches) {
            if (touch.identifier === this.leftJoystick.touchId) {
                this.leftJoystick.active = false;
                this.leftJoystick.touchId = null;
            }
            if (touch.identifier === this.rightJoystick.touchId) {
                this.rightJoystick.active = false;
                this.rightJoystick.touchId = null;
            }
        }
    },

    isInsideRestartButton(x, y) {
        const btnX = this.canvas.width / 2;
        const btnY = this.canvas.height / 2 + 60;
        const btnW = 200;
        const btnH = 60;
        return x > btnX - btnW/2 && x < btnX + btnW/2 && y > btnY - btnH/2 && y < btnY + btnH/2;
    },

    isInsideExitButton(x, y) {
        // During game over, the exit button is in the center
        if (this.gameOver) {
            const btnX = this.canvas.width / 2;
            const btnY = this.canvas.height / 2 + 150;
            const btnW = 200;
            const btnH = 60;
            return x > btnX - btnW/2 && x < btnX + btnW/2 && y > btnY - btnH/2 && y < btnY + btnH/2;
        }
        // During gameplay, exit button is in top left
        const btnX = 60;
        const btnY = 40;
        const btnW = 100;
        const btnH = 40;
        return x > btnX - btnW/2 && x < btnX + btnW/2 && y > btnY - btnH/2 && y < btnY + btnH/2;
    },

    getJoystickVector(joystick) {
        if (!joystick.active) return { x: 0, y: 0, magnitude: 0 };

        const dx = joystick.currentX - joystick.startX;
        const dy = joystick.currentY - joystick.startY;
        const magnitude = Math.sqrt(dx * dx + dy * dy);

        if (magnitude < this.joystickDeadzone) return { x: 0, y: 0, magnitude: 0 };

        const clampedMag = Math.min(magnitude, this.joystickRadius);
        const normalizedMag = clampedMag / this.joystickRadius;

        return {
            x: (dx / magnitude) * normalizedMag,
            y: (dy / magnitude) * normalizedMag,
            magnitude: normalizedMag
        };
    },

    reset() {
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 25,
            angle: 0,
            speed: 5
        };
        this.zombies = [];
        this.bullets = [];
        this.particles = [];
        this.coins = [];
        this.score = 0;
        this.gameOver = false;
        this.zombieSpawnTimer = 0;
        this.zombieSpawnInterval = 120;
        this.difficulty = 1;
        this.fireTimer = 0;
        this.coinsEarned = 0;
        // Reset joysticks
        this.leftJoystick = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0, touchId: null };
        this.rightJoystick = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0, touchId: null };
        this.screenShake = { x: 0, y: 0, intensity: 0 };
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
        if (this.gameOver) return;

        // Update screen shake
        if (this.screenShake.intensity > 0) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.intensity *= 0.9;
            if (this.screenShake.intensity < 0.5) this.screenShake.intensity = 0;
        }

        // Player movement (left joystick)
        const moveVec = this.getJoystickVector(this.leftJoystick);
        if (moveVec.magnitude > 0) {
            this.player.x += moveVec.x * this.player.speed;
            this.player.y += moveVec.y * this.player.speed;

            // Keep player in bounds
            this.player.x = Math.max(this.player.radius, Math.min(this.canvas.width - this.player.radius, this.player.x));
            this.player.y = Math.max(this.player.radius, Math.min(this.canvas.height - this.player.radius, this.player.y));
        }

        // Player aiming (right joystick)
        const aimVec = this.getJoystickVector(this.rightJoystick);
        if (aimVec.magnitude > 0) {
            this.player.angle = Math.atan2(aimVec.y, aimVec.x);

            // Auto-fire while aiming
            this.fireTimer++;
            if (this.fireTimer >= this.fireRate) {
                this.fireTimer = 0;
                this.spawnBullet();
                this.playSound('shoot');
            }
        }

        // Spawn zombies
        this.zombieSpawnTimer++;
        if (this.zombieSpawnTimer >= this.zombieSpawnInterval) {
            this.zombieSpawnTimer = 0;
            this.spawnEnemy();

            // Increase difficulty faster
            this.difficulty += 0.08;
            this.zombieSpawnInterval = Math.max(30, 120 - this.difficulty * 12);
        }

        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;

            // Check zombie collisions
            for (let i = this.zombies.length - 1; i >= 0; i--) {
                const zombie = this.zombies[i];
                const dx = bullet.x - zombie.x;
                const dy = bullet.y - zombie.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < zombie.radius + bullet.radius) {
                    zombie.health--;

                    // Different sounds for different enemies
                    if (zombie.type === 'tank') {
                        this.playSound('tankHit');
                        this.spawnHitParticles(bullet.x, bullet.y, zombie.color);
                    } else {
                        this.playSound('hit');
                        this.spawnHitParticles(bullet.x, bullet.y, '#00ff00');
                    }

                    this.screenShake.intensity = zombie.type === 'tank' ? 8 : 5;

                    if (zombie.health <= 0) {
                        const enemyType = this.enemyTypes[zombie.type];
                        this.score += enemyType.scoreValue;
                        this.playSound('kill');
                        this.spawnDeathParticles(zombie.x, zombie.y, zombie.color);

                        // Coin drop based on enemy type
                        if (Math.random() < enemyType.coinChance) {
                            this.coins.push({
                                x: zombie.x,
                                y: zombie.y,
                                radius: 12,
                                life: 300,
                                bobOffset: Math.random() * Math.PI * 2
                            });
                        }

                        this.zombies.splice(i, 1);
                    }
                    return false;
                }
            }

            return bullet.life > 0 &&
                bullet.x > 0 && bullet.x < this.canvas.width &&
                bullet.y > 0 && bullet.y < this.canvas.height;
        });

        // Update zombies
        this.zombies.forEach(zombie => {
            const dx = this.player.x - zombie.x;
            const dy = this.player.y - zombie.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                zombie.x += (dx / dist) * zombie.speed;
                zombie.y += (dy / dist) * zombie.speed;
            }

            // Check player collision (one-hit death)
            if (dist < this.player.radius + zombie.radius) {
                this.gameOver = true;
                this.saveHighscore();
                this.screenShake.intensity = 20;
                this.playSound('gameOver');
                this.spawnDeathParticles(this.player.x, this.player.y, '#ffdbac');
            }
        });

        // Update coins
        this.coins = this.coins.filter(coin => {
            coin.life--;

            // Check player collision
            const dx = this.player.x - coin.x;
            const dy = this.player.y - coin.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.player.radius + coin.radius) {
                this.score += 50;
                this.coinsEarned++;
                this.playSound('coin');
                this.spawnHitParticles(coin.x, coin.y, '#ffd700');
                return false;
            }

            return coin.life > 0;
        });

        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // gravity
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            return particle.life > 0;
        });
    },

    spawnBullet() {
        const speed = 12;
        this.bullets.push({
            x: this.player.x + Math.cos(this.player.angle) * this.player.radius,
            y: this.player.y + Math.sin(this.player.angle) * this.player.radius,
            vx: Math.cos(this.player.angle) * speed,
            vy: Math.sin(this.player.angle) * speed,
            radius: 5,
            life: 60
        });
    },

    spawnEnemy() {
        let x, y;
        const side = Math.floor(Math.random() * 4);

        switch (side) {
            case 0: // top
                x = Math.random() * this.canvas.width;
                y = -40;
                break;
            case 1: // right
                x = this.canvas.width + 40;
                y = Math.random() * this.canvas.height;
                break;
            case 2: // bottom
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 40;
                break;
            case 3: // left
                x = -40;
                y = Math.random() * this.canvas.height;
                break;
        }

        // Determine enemy type based on difficulty
        let type = 'basic';
        const roll = Math.random();

        if (this.difficulty >= 8) {
            // High difficulty: 50% basic, 30% runner, 20% tank
            if (roll < 0.40) type = 'tank';
            else if (roll < 0.50) type = 'runner';
            else type = 'basic';
        } 
        else if (this.difficulty >= 6) {
            // High difficulty: 50% basic, 30% runner, 20% tank
            if (roll < 0.35) type = 'tank';
            else if (roll < 0.35) type = 'runner';
            else type = 'basic';
        }
        else if (this.difficulty >= 4) {
            // Medium difficulty: 60% basic, 40% runner
            if (roll < 0.1) type = 'tank';
            else if (roll < 0.5) type = 'runner';
            else type = 'basic';
        }
        else if (this.difficulty >= 2) {
            // Medium difficulty: 60% basic, 40% runner
            if (roll < 0.4) type = 'runner';
            else type = 'basic';
        }
        // Low difficulty: only basic zombies

        const enemyDef = this.enemyTypes[type];

        this.zombies.push({
            x: x,
            y: y,
            type: type,
            radius: enemyDef.radius,
            speed: enemyDef.speed + Math.random() * this.difficulty * 0.2,
            health: enemyDef.health,
            maxHealth: enemyDef.health,
            color: enemyDef.color,
            darkColor: enemyDef.darkColor
        });
    },

    spawnHitParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 3 + Math.random() * 4,
                color: color,
                life: 20 + Math.random() * 20,
                maxLife: 40,
                alpha: 1
            });
        }
    },

    spawnDeathParticles(x, y, baseColor) {
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 5;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 4 + Math.random() * 8,
                color: baseColor || `hsl(${Math.random() * 60}, 100%, 50%)`,
                life: 40 + Math.random() * 30,
                maxLife: 70,
                alpha: 1
            });
        }
    },

    render() {
        const ctx = this.ctx;
        ctx.save();

        // Apply screen shake
        ctx.translate(this.screenShake.x, this.screenShake.y);

        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(-10, -10, this.canvas.width + 20, this.canvas.height + 20);

        // Draw grid pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        const gridSize = 50;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }

        // Draw particles
        this.particles.forEach(particle => {
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Draw coins
        this.coins.forEach(coin => {
            const bob = Math.sin(Date.now() * 0.01 + coin.bobOffset) * 3;
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(coin.x, coin.y + bob, coin.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#b8860b';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Coin symbol
            ctx.fillStyle = '#b8860b';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', coin.x, coin.y + bob);
        });

        // Draw bullets
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 10;
        this.bullets.forEach(bullet => {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.shadowBlur = 0;

        // Draw zombies (different types)
        this.zombies.forEach(zombie => {
            this.drawEnemy(ctx, zombie);
        });

        // Draw player (girl with brown hair)
        if (!this.gameOver) {
            this.drawPlayer(ctx);
        }

        // Draw joysticks
        this.drawJoystick(this.leftJoystick, 'rgba(100, 100, 255, 0.3)', 'rgba(100, 100, 255, 0.6)');
        this.drawJoystick(this.rightJoystick, 'rgba(255, 100, 100, 0.3)', 'rgba(255, 100, 100, 0.6)');

        ctx.restore();

        // Draw UI (not affected by screen shake)
        this.drawUI();
    },

    drawEnemy(ctx, zombie) {
        const type = zombie.type;

        // Body
        ctx.fillStyle = zombie.color;
        ctx.beginPath();
        ctx.arc(zombie.x, zombie.y, zombie.radius, 0, Math.PI * 2);
        ctx.fill();

        if (type === 'basic') {
            // Basic zombie - simple face
            ctx.fillStyle = zombie.darkColor;
            ctx.beginPath();
            ctx.arc(zombie.x - 6, zombie.y - 5, 4, 0, Math.PI * 2);
            ctx.arc(zombie.x + 6, zombie.y - 5, 4, 0, Math.PI * 2);
            ctx.fill();

            // Mouth
            ctx.strokeStyle = zombie.darkColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(zombie.x, zombie.y + 5, 8, 0.2, Math.PI - 0.2);
            ctx.stroke();
        } else if (type === 'runner') {
            // Runner - angular, aggressive look
            ctx.fillStyle = zombie.darkColor;

            // Slanted eyes
            ctx.beginPath();
            ctx.ellipse(zombie.x - 5, zombie.y - 4, 5, 3, -0.3, 0, Math.PI * 2);
            ctx.ellipse(zombie.x + 5, zombie.y - 4, 5, 3, 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Sharp teeth
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(zombie.x - 6, zombie.y + 4);
            ctx.lineTo(zombie.x - 3, zombie.y + 8);
            ctx.lineTo(zombie.x, zombie.y + 4);
            ctx.lineTo(zombie.x + 3, zombie.y + 8);
            ctx.lineTo(zombie.x + 6, zombie.y + 4);
            ctx.stroke();

            // Speed lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(zombie.x - zombie.radius - 5, zombie.y - 5);
            ctx.lineTo(zombie.x - zombie.radius - 15, zombie.y - 5);
            ctx.moveTo(zombie.x - zombie.radius - 5, zombie.y + 5);
            ctx.lineTo(zombie.x - zombie.radius - 12, zombie.y + 5);
            ctx.stroke();
        } else if (type === 'tank') {
            // Tank - big, armored look
            ctx.fillStyle = zombie.darkColor;

            // Heavy brow
            ctx.fillRect(zombie.x - 15, zombie.y - 12, 30, 8);

            // Small angry eyes
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(zombie.x - 8, zombie.y - 5, 4, 0, Math.PI * 2);
            ctx.arc(zombie.x + 8, zombie.y - 5, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(zombie.x - 8, zombie.y - 5, 2, 0, Math.PI * 2);
            ctx.arc(zombie.x + 8, zombie.y - 5, 2, 0, Math.PI * 2);
            ctx.fill();

            // Armor plates
            ctx.strokeStyle = zombie.darkColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(zombie.x, zombie.y, zombie.radius - 5, 0, Math.PI * 2);
            ctx.stroke();

            // Mouth/jaw
            ctx.fillStyle = zombie.darkColor;
            ctx.beginPath();
            ctx.rect(zombie.x - 12, zombie.y + 8, 24, 10);
            ctx.fill();
        }

        // Health bar
        const healthPercent = zombie.health / zombie.maxHealth;
        const barWidth = zombie.radius * 1.4;
        ctx.fillStyle = '#333';
        ctx.fillRect(zombie.x - barWidth/2, zombie.y - zombie.radius - 12, barWidth, 5);
        ctx.fillStyle = healthPercent > 0.5 ? '#4caf50' : healthPercent > 0.25 ? '#ff9800' : '#f44336';
        ctx.fillRect(zombie.x - barWidth/2, zombie.y - zombie.radius - 12, barWidth * healthPercent, 5);
    },

    drawPlayer(ctx) {
        // Body
        ctx.fillStyle = '#ffdbac';
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
        ctx.fill();

        // Hair (brown)
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y - 5, this.player.radius - 2, Math.PI, 0, false);
        ctx.fill();

        // Hair strands
        ctx.beginPath();
        ctx.arc(this.player.x - 12, this.player.y + 5, 8, 0, Math.PI * 2);
        ctx.arc(this.player.x + 12, this.player.y + 5, 8, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(this.player.x - 7, this.player.y - 2, 3, 0, Math.PI * 2);
        ctx.arc(this.player.x + 7, this.player.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Blush
        ctx.fillStyle = 'rgba(255, 150, 150, 0.4)';
        ctx.beginPath();
        ctx.ellipse(this.player.x - 10, this.player.y + 5, 5, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(this.player.x + 10, this.player.y + 5, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Direction indicator (gun)
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.player.x, this.player.y);
        ctx.lineTo(
            this.player.x + Math.cos(this.player.angle) * (this.player.radius + 15),
            this.player.y + Math.sin(this.player.angle) * (this.player.radius + 15)
        );
        ctx.stroke();
    },

    drawJoystick(joystick, baseColor, stickColor) {
        if (!joystick.active) return;

        const ctx = this.ctx;

        // Base circle
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(joystick.startX, joystick.startY, this.joystickRadius, 0, Math.PI * 2);
        ctx.fill();

        // Stick position (clamped)
        const dx = joystick.currentX - joystick.startX;
        const dy = joystick.currentY - joystick.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clampedDist = Math.min(dist, this.joystickRadius);

        let stickX = joystick.startX;
        let stickY = joystick.startY;

        if (dist > 0) {
            stickX = joystick.startX + (dx / dist) * clampedDist;
            stickY = joystick.startY + (dy / dist) * clampedDist;
        }

        // Stick
        ctx.fillStyle = stickColor;
        ctx.beginPath();
        ctx.arc(stickX, stickY, 25, 0, Math.PI * 2);
        ctx.fill();
    },

    drawUI() {
        const ctx = this.ctx;

        // Exit button (always visible)
        ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
        this.roundRect(ctx, 10, 20, 100, 40, 10);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Beenden', 60, 40);

        // Highscore
        ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.font = '16px Fredoka, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`Highscore: ${this.highscore}`, this.canvas.width - 20, 25);

        // Score
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Fredoka, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`Score: ${this.score}`, this.canvas.width - 20, 50);

        // Coins earned
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 18px Fredoka, sans-serif';
        ctx.fillText(`Muenzen: ${this.coinsEarned}`, this.canvas.width - 20, 80);

        // Difficulty indicator
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '14px Fredoka, sans-serif';
        ctx.fillText(`Welle: ${Math.floor(this.difficulty)}`, this.canvas.width - 20, 105);

        // Game over screen
        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.fillStyle = '#ff6b6b';
            ctx.font = 'bold 48px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 60);

            ctx.fillStyle = '#fff';
            ctx.font = '28px Fredoka, sans-serif';
            ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 - 10);

            ctx.fillStyle = '#ffd700';
            ctx.font = '24px Fredoka, sans-serif';
            ctx.fillText(`+${this.coinsEarned} Muenzen verdient!`, this.canvas.width / 2, this.canvas.height / 2 + 25);

            // Restart button
            ctx.fillStyle = '#4caf50';
            this.roundRect(ctx, this.canvas.width / 2 - 100, this.canvas.height / 2 + 45, 200, 60, 15);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 22px Fredoka, sans-serif';
            ctx.fillText('Nochmal!', this.canvas.width / 2, this.canvas.height / 2 + 75);

            // Exit button (larger)
            ctx.fillStyle = '#f44336';
            this.roundRect(ctx, this.canvas.width / 2 - 100, this.canvas.height / 2 + 120, 200, 60, 15);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillText('Zurueck', this.canvas.width / 2, this.canvas.height / 2 + 150);
        }

        // Instructions (first few seconds)
        if (this.score === 0 && !this.gameOver && this.zombies.length === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '18px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Links: Bewegen | Rechts: Zielen & Schiessen', this.canvas.width / 2, this.canvas.height - 80);
            ctx.fillText('Toete Gegner fuer Muenzen! (Lila & Rot droppen Muenzen)', this.canvas.width / 2, this.canvas.height - 50);
        }
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
