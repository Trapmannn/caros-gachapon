// Password check
const passwordScreen = document.getElementById('password-screen');
const pwInput = document.getElementById('pw-input');
const pwSubmit = document.getElementById('pw-submit');
const pwError = document.getElementById('pw-error');

// ============================================
// SOUND PLATZHALTER
// Lege deine Audio-Dateien hier ab und aendere die Pfade:
// ============================================
const PASSWORD_SUCCESS_SOUND = 'sounds/IchLiebeCaro.mp3';

// Sound wenn man keine Muenzen hat und auf "Muenze einwerfen" klickt
const NO_COINS_SOUND = 'sounds/broke.mp3';

// Sounds fuer jede Raritaet (werden nach der Animation abgespielt)
const RARITY_SOUNDS = {
    common: 'sounds/gewoehnlich.mp3',
    rare: 'sounds/selten.mp3',
    epic: 'sounds/episch.mp3',
    legendary: 'sounds/legendaer.mp3'
};

// Pre-load the audio
let passwordAudio = null;
let noCoinsAudio = null;
let rarityAudios = {};

try {
    passwordAudio = new Audio(PASSWORD_SUCCESS_SOUND);
    passwordAudio.volume = 1;
    passwordAudio.load();
} catch (e) {
    console.log('Passwort-Audio konnte nicht geladen werden');
}

try {
    noCoinsAudio = new Audio(NO_COINS_SOUND);
    noCoinsAudio.volume = 1;
    noCoinsAudio.load();
} catch (e) {
    console.log('Keine-Muenzen-Audio konnte nicht geladen werden');
}

// Pre-load rarity sounds
Object.keys(RARITY_SOUNDS).forEach(rarity => {
    try {
        const audio = new Audio(RARITY_SOUNDS[rarity]);
        audio.volume = 1;
        audio.preload = 'auto';
        audio.load();
        rarityAudios[rarity] = audio;
        console.log(`${rarity}-Audio geladen: ${RARITY_SOUNDS[rarity]}`);
    } catch (e) {
        console.log(`${rarity}-Audio konnte nicht geladen werden:`, e);
        rarityAudios[rarity] = null;
    }
});

function playPasswordSound() {
    if (passwordAudio) {
        passwordAudio.currentTime = 0;
        const playPromise = passwordAudio.play();
        if (playPromise !== undefined) {
            playPromise.catch((err) => {
                console.log('Passwort-Sound Fehler:', err.message);
            });
        }
    }
}

function playNoCoinsSound() {
    if (noCoinsAudio) {
        noCoinsAudio.currentTime = 0;
        const playPromise = noCoinsAudio.play();
        if (playPromise !== undefined) {
            playPromise.catch((err) => {
                console.log('Keine-Muenzen-Sound Fehler:', err.message);
            });
        }
    }
}

function playRaritySound(rarity) {
    console.log('Versuche Rarity-Sound abzuspielen:', rarity);
    const audio = rarityAudios[rarity];
    if (audio) {
        console.log('Audio gefunden fuer:', rarity);
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log(`${rarity}-Sound wird abgespielt`);
            }).catch((err) => {
                console.log(`${rarity}-Sound Fehler:`, err.message);
            });
        }
    } else {
        console.log('Kein Audio gefunden fuer:', rarity);
    }
}

function checkPassword() {
    if (pwInput.value === 'lucahdl') {
        playPasswordSound();
        passwordScreen.classList.add('hidden');
        initGame();
    } else {
        pwError.style.display = 'block';
        pwInput.value = '';
        pwInput.focus();
    }
}

pwSubmit.addEventListener('click', checkPassword);
pwInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkPassword();
});

// Game initialization
function initGame() {
    // ===== CARD COLLECTION SYSTEM =====
    // Cards are defined in js/cards.js

    // Load collected cards from localStorage
    const STORAGE_KEY = 'caros_gachapon_collection';
    let collectedCardIds = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    function saveCollection() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(collectedCardIds));
    }

    function getAvailableCards() {
        return allCards.filter(card => !collectedCardIds.includes(card.id));
    }

    function getCollectedCards() {
        return allCards.filter(card => collectedCardIds.includes(card.id));
    }

    function getCollectedCardsSorted() {
        // Sort by rarity: common first, then rare, epic, legendary
        return getCollectedCards().sort((a, b) => {
            const orderA = RARITY_CONFIG[a.rarity]?.order ?? 0;
            const orderB = RARITY_CONFIG[b.rarity]?.order ?? 0;
            return orderA - orderB;
        });
    }

    function isCardCollected(cardId) {
        return collectedCardIds.includes(cardId);
    }

    function collectCard(cardId) {
        if (!collectedCardIds.includes(cardId)) {
            collectedCardIds.push(cardId);
            saveCollection();
            updateCollectionCount();
        }
    }

    function updateCollectionCount() {
        const countEl = document.getElementById('collection-count');
        countEl.textContent = collectedCardIds.length;
    }

    // Initialize collection count
    updateCollectionCount();

    // ===== SOUND EFFECTS =====
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new AudioContext();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playSound(type) {
        if (!audioCtx) return;

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'coin') {
            // Coin insert sound - metallic clink
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1200, now);
            oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            oscillator.start(now);
            oscillator.stop(now + 0.2);

            // Second clink
            setTimeout(() => {
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(1400, audioCtx.currentTime);
                osc2.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.08);
                gain2.gain.setValueAtTime(0.2, audioCtx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
                osc2.start();
                osc2.stop(audioCtx.currentTime + 0.15);
            }, 80);
        }
        else if (type === 'turn') {
            // Knob turning - mechanical ratchet
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(150, now);
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
            oscillator.start(now);
            oscillator.stop(now + 0.8);

            // Click sounds
            for (let i = 0; i < 6; i++) {
                setTimeout(() => {
                    const click = audioCtx.createOscillator();
                    const clickGain = audioCtx.createGain();
                    click.connect(clickGain);
                    clickGain.connect(audioCtx.destination);
                    click.type = 'square';
                    click.frequency.setValueAtTime(300 + Math.random() * 100, audioCtx.currentTime);
                    clickGain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                    clickGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
                    click.start();
                    click.stop(audioCtx.currentTime + 0.05);
                }, i * 120);
            }
        }
        else if (type === 'drop') {
            // Ball drop - hollow thud
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(200, now);
            oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.15);
            gainNode.gain.setValueAtTime(0.4, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            oscillator.start(now);
            oscillator.stop(now + 0.3);
        }
        else if (type === 'open') {
            // Capsule open - pop with sparkle
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, now);
            oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            oscillator.start(now);
            oscillator.stop(now + 0.2);

            // Sparkle sounds
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const sparkle = audioCtx.createOscillator();
                    const sparkleGain = audioCtx.createGain();
                    sparkle.connect(sparkleGain);
                    sparkleGain.connect(audioCtx.destination);
                    sparkle.type = 'sine';
                    sparkle.frequency.setValueAtTime(1500 + Math.random() * 1000, audioCtx.currentTime);
                    sparkleGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                    sparkleGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                    sparkle.start();
                    sparkle.stop(audioCtx.currentTime + 0.1);
                }, i * 60);
            }
        }
        else if (type === 'reveal') {
            // Card reveal - triumphant fanfare
            const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    const note = audioCtx.createOscillator();
                    const noteGain = audioCtx.createGain();
                    note.connect(noteGain);
                    noteGain.connect(audioCtx.destination);
                    note.type = 'sine';
                    note.frequency.setValueAtTime(freq, audioCtx.currentTime);
                    noteGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
                    noteGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                    note.start();
                    note.stop(audioCtx.currentTime + 0.3);
                }, i * 100);
            });
        }
        else if (type === 'flip') {
            // Card flip - smooth swoosh sound
            // White noise filtered swoosh
            const bufferSize = audioCtx.sampleRate * 0.3;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);

            // Generate swoosh noise
            for (let i = 0; i < bufferSize; i++) {
                const t = i / bufferSize;
                // Envelope: quick attack, smooth decay
                const envelope = Math.sin(t * Math.PI) * Math.exp(-t * 3);
                data[i] = (Math.random() * 2 - 1) * envelope;
            }

            const noiseSource = audioCtx.createBufferSource();
            noiseSource.buffer = buffer;

            // Bandpass filter for swoosh character
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.exponentialRampToValueAtTime(2000, now + 0.15);
            filter.frequency.exponentialRampToValueAtTime(400, now + 0.3);
            filter.Q.value = 1;

            const swooshGain = audioCtx.createGain();
            swooshGain.gain.setValueAtTime(0.25, now);
            swooshGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

            noiseSource.connect(filter);
            filter.connect(swooshGain);
            swooshGain.connect(audioCtx.destination);

            noiseSource.start(now);
            noiseSource.stop(now + 0.3);

            // Don't use oscillator for this sound
            oscillator.start(now);
            oscillator.stop(now + 0.001);
            gainNode.gain.setValueAtTime(0, now);
        }
        else if (type === 'click') {
            // Button click - soft pop
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, now);
            oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.08);
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            oscillator.start(now);
            oscillator.stop(now + 0.1);
        }
    }

    // ===== COIN SYSTEM =====
    const COINS_STORAGE_KEY = 'caros_gachapon_coins';
    const FIRST_VISIT_KEY = 'caros_gachapon_first_visit';
    const LAST_DAILY_KEY = 'caros_gachapon_last_daily';

    function loadCoins() {
        return parseInt(localStorage.getItem(COINS_STORAGE_KEY)) || 0;
    }

    function saveCoins(amount) {
        localStorage.setItem(COINS_STORAGE_KEY, amount.toString());
    }

    function checkFirstTimeBonus() {
        if (!localStorage.getItem(FIRST_VISIT_KEY)) {
            localStorage.setItem(FIRST_VISIT_KEY, 'true');
            return true;
        }
        return false;
    }

    function checkDailyBonus() {
        const today = new Date().toDateString();
        const lastDaily = localStorage.getItem(LAST_DAILY_KEY);
        if (lastDaily !== today) {
            localStorage.setItem(LAST_DAILY_KEY, today);
            return true;
        }
        return false;
    }

    // Initialize coins with bonuses
    let coins = loadCoins();

    // First time bonus: 1 coin
    if (checkFirstTimeBonus()) {
        coins += 1;
        saveCoins(coins);
    }

    // Daily bonus: 1 coin per day
    if (checkDailyBonus()) {
        coins += 1;
        saveCoins(coins);
    }

    // Update coin display immediately on load
    document.getElementById('coin-count').textContent = coins;

    // Game state
    let isAnimating = false;
    let isShaking = false;
    let currentCard = null;
    let currentCardIsDuplicate = false;

    // Three.js setup
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const isMobile = window.innerWidth < 768;
    camera.position.set(0, 2.2, isMobile ? 7 : 6);
    camera.lookAt(0, 1.5, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x4fc3f7, 0.4);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff6b6b, 0.3);
    rimLight.position.set(0, 5, -10);
    scene.add(rimLight);

    const glowLight1 = new THREE.PointLight(0xffd93d, 0.5, 5);
    glowLight1.position.set(0, 4, 2);
    scene.add(glowLight1);

    const glowLight2 = new THREE.PointLight(0xff6b6b, 0.3, 4);
    glowLight2.position.set(-1, 1.5, 2);
    scene.add(glowLight2);

    // Materials
    const createMaterial = (color, roughness = 0.3, metalness = 0.1) => {
        return new THREE.MeshStandardMaterial({
            color: color,
            roughness: roughness,
            metalness: metalness
        });
    };

    const bodyColor = 0xfafafa;
    const accentRed = 0xe74c3c;
    const accentYellow = 0xf1c40f;
    const metalColor = 0xbdc3c7;
    const darkMetal = 0x7f8c8d;
    const goldColor = 0xf39c12;

    const bodyMaterial = createMaterial(bodyColor, 0.35, 0.05);
    const redMaterial = createMaterial(accentRed, 0.3, 0.2);
    const yellowMaterial = createMaterial(accentYellow, 0.25, 0.25);
    const metalMaterial = createMaterial(metalColor, 0.15, 0.85);
    const darkMetalMaterial = createMaterial(darkMetal, 0.2, 0.75);
    const goldMaterial = createMaterial(goldColor, 0.2, 0.65);

    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xaaddff,
        transparent: true,
        opacity: 0.3,
        roughness: 0.05,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        reflectivity: 0.9
    });

    const capsuleColors = [
        0xff6b6b, 0x4ecdc4, 0xffd93d, 0x95e1d3, 0xf38181,
        0xaa96da, 0x74b9ff, 0xffeaa7, 0x55a3ff, 0xff9ff3
    ];

    const machineGroup = new THREE.Group();

    // ===== ROUNDED BOX HELPER =====
    function createRoundedBox(width, height, depth, radius, segments) {
        const shape = new THREE.Shape();
        const eps = 0.00001;
        const r = radius - eps;

        shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true);
        shape.absarc(eps, height - r * 2, eps, Math.PI, Math.PI / 2, true);
        shape.absarc(width - r * 2, height - r * 2, eps, Math.PI / 2, 0, true);
        shape.absarc(width - r * 2, eps, eps, 0, -Math.PI / 2, true);

        const extrudeSettings = {
            depth: depth - radius * 2,
            bevelEnabled: true,
            bevelSegments: segments,
            steps: 1,
            bevelSize: radius,
            bevelThickness: radius
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.center();

        return geometry;
    }

    // ===== BASE / PLATFORM =====
    const footGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.08, 20);
    const footPositions = [[-0.7, 0.04, 0.5], [0.7, 0.04, 0.5], [-0.7, 0.04, -0.5], [0.7, 0.04, -0.5]];
    footPositions.forEach(pos => {
        const foot = new THREE.Mesh(footGeometry, darkMetalMaterial);
        foot.position.set(...pos);
        foot.castShadow = true;
        machineGroup.add(foot);
    });

    const basePlatformGeo = createRoundedBox(2, 0.15, 1.4, 0.05, 4);
    const basePlatform = new THREE.Mesh(basePlatformGeo, redMaterial);
    basePlatform.position.y = 0.15;
    basePlatform.castShadow = true;
    basePlatform.receiveShadow = true;
    machineGroup.add(basePlatform);

    // ===== MAIN BODY - Extended to wrap around globe =====
    const mainBodyGeo = createRoundedBox(1.9, 2.4, 1.3, 0.1, 6);
    const mainBody = new THREE.Mesh(mainBodyGeo, bodyMaterial);
    mainBody.position.y = 1.45;
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    machineGroup.add(mainBody);

    // ===== RED TRIM BANDS =====
    const trimGeo = createRoundedBox(2.0, 0.12, 1.4, 0.04, 4);
    const lowerTrim = new THREE.Mesh(trimGeo, redMaterial);
    lowerTrim.position.y = 0.3;
    lowerTrim.castShadow = true;
    machineGroup.add(lowerTrim);

    // ===== GLOBE HOUSING - Flush with machine body =====
    const globeBaseRingGeo = new THREE.TorusGeometry(0.95, 0.06, 16, 48);
    const globeBaseRing = new THREE.Mesh(globeBaseRingGeo, metalMaterial);
    globeBaseRing.position.y = 2.65;
    globeBaseRing.position.z = 0.0;
    globeBaseRing.rotation.x = Math.PI / 2;
    machineGroup.add(globeBaseRing);

    const decorRingGeo = new THREE.TorusGeometry(0.92, 0.03, 12, 48);
    const decorRing = new THREE.Mesh(decorRingGeo, goldMaterial);
    decorRing.position.y = 2.65;
    decorRing.position.z = 0.04;
    decorRing.rotation.x = Math.PI / 2;
    machineGroup.add(decorRing);

    // ===== GLASS DOME - Large hemisphere flush with machine =====
    const domeGeo = new THREE.SphereGeometry(0.95, 48, 48, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, glassMaterial);
    dome.position.y = 2.65;
    dome.scale.set(1, 1.1, 0.85);
    machineGroup.add(dome);

    // ===== CAPSULE BALLS INSIDE =====
    const capsuleBalls = [];
    const ballRadius = 0.15;

    const domeBaseY = 2.65;
    const domeRadius = 0.95;
    const domeScaleY = 1.1;
    const domeScaleZ = 0.85;

    function isInsideDome(x, y, z) {
        const relY = (y - domeBaseY) / domeScaleY;
        const relZ = z / domeScaleZ;
        const dist = Math.sqrt(x * x + relY * relY + relZ * relZ);
        return dist < (domeRadius - ballRadius - 0.05) && y > domeBaseY;
    }

    function generateBallPositions(count) {
        const positions = [];
        const minDist = ballRadius * 2;

        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let valid = false;
            let pos;

            while (!valid && attempts < 150) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 0.55;
                const height = domeBaseY + 0.15 + Math.random() * 0.65;

                pos = {
                    x: Math.cos(angle) * radius,
                    y: height,
                    z: Math.sin(angle) * radius * 0.6
                };

                if (!isInsideDome(pos.x, pos.y, pos.z)) {
                    attempts++;
                    continue;
                }

                valid = true;
                for (const other of positions) {
                    const dx = pos.x - other.x;
                    const dy = pos.y - other.y;
                    const dz = pos.z - other.z;
                    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                    if (dist < minDist) {
                        valid = false;
                        break;
                    }
                }
                attempts++;
            }

            if (valid) {
                positions.push(pos);
            }
        }
        return positions;
    }

    const ballPositions = generateBallPositions(10);

    ballPositions.forEach((pos, i) => {
        const ballGeo = new THREE.SphereGeometry(ballRadius, 24, 24);
        const color = capsuleColors[i % capsuleColors.length];
        const ballMat = createMaterial(color, 0.3, 0.2);
        const ball = new THREE.Mesh(ballGeo, ballMat);

        ball.position.set(pos.x, pos.y, pos.z);
        ball.userData.baseX = pos.x;
        ball.userData.baseY = pos.y;
        ball.userData.baseZ = pos.z;
        ball.userData.shakeOffset = Math.random() * Math.PI * 2;
        ball.castShadow = true;
        capsuleBalls.push(ball);
        machineGroup.add(ball);
    });

    // ===== FRONT PANEL =====
    const panelGeo = createRoundedBox(1.5, 1.1, 0.08, 0.04, 4);
    const panelMat = createMaterial(0xeeeeee, 0.45, 0.05);
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(0, 1.4, 0.62);
    machineGroup.add(panel);

    // ===== LABEL =====
    const labelBackGeo = new THREE.BoxGeometry(0.65, 0.22, 0.03);
    const labelBack = new THREE.Mesh(labelBackGeo, goldMaterial);
    labelBack.position.set(0, 1.95, 0.67);
    machineGroup.add(labelBack);

    const labelGeo = new THREE.BoxGeometry(0.58, 0.16, 0.02);
    const labelMat = createMaterial(0x1a1a2e, 0.4, 0.3);
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.position.set(0, 1.95, 0.69);
    machineGroup.add(label);

    // ===== COIN SLOT =====
    const coinHousingGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.08, 28);
    const coinHousing = new THREE.Mesh(coinHousingGeo, metalMaterial);
    coinHousing.position.set(-0.5, 1.6, 0.67);
    coinHousing.rotation.x = Math.PI / 2;
    machineGroup.add(coinHousing);

    const coinSlotGeo = new THREE.BoxGeometry(0.09, 0.02, 0.05);
    const coinSlotMat = createMaterial(0x111111, 0.9, 0.1);
    const coinSlot = new THREE.Mesh(coinSlotGeo, coinSlotMat);
    coinSlot.position.set(-0.5, 1.6, 0.72);
    machineGroup.add(coinSlot);

    const coinSlotPosition = new THREE.Vector3(-0.5, 1.1, 0.72);

    // ===== MAIN TURN KNOB =====
    const knobPlateGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.04, 28);
    const knobPlate = new THREE.Mesh(knobPlateGeo, metalMaterial);
    knobPlate.position.set(0.55, 1.6, 0.66);
    knobPlate.rotation.x = Math.PI / 2;
    machineGroup.add(knobPlate);

    const knobRingGeo = new THREE.TorusGeometry(0.17, 0.02, 12, 28);
    const knobRingMesh = new THREE.Mesh(knobRingGeo, goldMaterial);
    knobRingMesh.position.set(0.55, 1.6, 0.68);
    machineGroup.add(knobRingMesh);

    const knobGroup = new THREE.Group();
    knobGroup.position.set(0.55, 1.6, 0.71);

    const knobGeo = new THREE.CylinderGeometry(0.15, 0.16, 0.07, 28);
    const knob = new THREE.Mesh(knobGeo, yellowMaterial);
    knob.rotation.x = Math.PI / 2;
    knob.position.z = 0;
    knob.castShadow = true;
    knobGroup.add(knob);

    for (let i = 0; i < 8; i++) {
        const ridgeGeo = new THREE.BoxGeometry(0.012, 0.06, 0.025);
        const ridge = new THREE.Mesh(ridgeGeo, createMaterial(0xd4a500, 0.35, 0.35));
        const angle = (i / 8) * Math.PI * 2;
        ridge.position.set(
            Math.cos(angle) * 0.13,
            Math.sin(angle) * 0.13,
            0.02
        );
        ridge.rotation.z = angle;
        knobGroup.add(ridge);
    }

    const handleGeo = new THREE.BoxGeometry(0.24, 0.05, 0.04);
    const knobHandle = new THREE.Mesh(handleGeo, yellowMaterial);
    knobHandle.position.set(0, 0, 0.05);
    knobHandle.castShadow = true;
    knobGroup.add(knobHandle);

    const handleCapGeo = new THREE.SphereGeometry(0.03, 16, 16);
    const handleCap1 = new THREE.Mesh(handleCapGeo, yellowMaterial);
    handleCap1.position.set(-0.12, 0, 0.05);
    knobGroup.add(handleCap1);
    const handleCap2 = new THREE.Mesh(handleCapGeo, yellowMaterial);
    handleCap2.position.set(0.12, 0, 0.05);
    knobGroup.add(handleCap2);

    machineGroup.add(knobGroup);

    // ===== DISPENSER AREA =====
    const dispenserGeo = createRoundedBox(0.8, 0.5, 0.35, 0.06, 4);
    const dispenser = new THREE.Mesh(dispenserGeo, bodyMaterial);
    dispenser.position.set(0, 0.55, 0.75);
    dispenser.castShadow = true;
    machineGroup.add(dispenser);

    const dispenserTopGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.35, 20, 1, false, 0, Math.PI);
    const dispenserTop = new THREE.Mesh(dispenserTopGeo, bodyMaterial);
    dispenserTop.position.set(0, 0.8, 0.75);
    dispenserTop.rotation.z = Math.PI / 2;
    dispenserTop.rotation.y = Math.PI / 2;
    machineGroup.add(dispenserTop);

    const openingGeo = new THREE.BoxGeometry(0.55, 0.35, 0.12);
    const openingMat = createMaterial(0x0a0a15, 0.95, 0.05);
    const opening = new THREE.Mesh(openingGeo, openingMat);
    opening.position.set(0, 0.52, 0.88);
    machineGroup.add(opening);

    const framePartGeo = new THREE.BoxGeometry(0.6, 0.04, 0.04);
    const frameTop = new THREE.Mesh(framePartGeo, metalMaterial);
    frameTop.position.set(0, 0.72, 0.92);
    machineGroup.add(frameTop);
    const frameBottom = new THREE.Mesh(framePartGeo, metalMaterial);
    frameBottom.position.set(0, 0.33, 0.92);
    machineGroup.add(frameBottom);

    const frameSideGeo = new THREE.BoxGeometry(0.04, 0.35, 0.04);
    const frameLeft = new THREE.Mesh(frameSideGeo, metalMaterial);
    frameLeft.position.set(-0.28, 0.52, 0.92);
    machineGroup.add(frameLeft);
    const frameRight = new THREE.Mesh(frameSideGeo, metalMaterial);
    frameRight.position.set(0.28, 0.52, 0.92);
    machineGroup.add(frameRight);

    const flapGeo = new THREE.BoxGeometry(0.48, 0.28, 0.015);
    const flapMat = new THREE.MeshStandardMaterial({
        color: 0x3498db,
        transparent: true,
        opacity: 0.65,
        roughness: 0.08,
        metalness: 0.15
    });
    const flap = new THREE.Mesh(flapGeo, flapMat);
    flap.position.set(0, 0.38, 0.95);
    flap.rotation.x = 0.25;
    machineGroup.add(flap);

    // ===== INDICATOR LIGHTS =====
    const lightGeo = new THREE.SphereGeometry(0.035, 16, 16);

    const greenLightMat = new THREE.MeshStandardMaterial({
        color: 0x2ecc71,
        emissive: 0x2ecc71,
        emissiveIntensity: 0.9
    });
    const greenLight = new THREE.Mesh(lightGeo, greenLightMat);
    greenLight.position.set(-0.5, 1.42, 0.69);
    machineGroup.add(greenLight);

    const redLightMat = new THREE.MeshStandardMaterial({
        color: 0x555555,
        emissive: 0x000000,
        emissiveIntensity: 0
    });
    const redLight = new THREE.Mesh(lightGeo, redLightMat);
    redLight.position.set(-0.5, 1.32, 0.69);
    machineGroup.add(redLight);

    // ===== DECORATIVE SCREWS =====
    const screwHeadGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.01, 12);
    const screwPositions = [
        [-0.8, 2.1, 0.66], [0.8, 2.1, 0.66],
        [-0.8, 0.7, 0.66], [0.8, 0.7, 0.66]
    ];
    screwPositions.forEach(pos => {
        const screwHead = new THREE.Mesh(screwHeadGeo, darkMetalMaterial);
        screwHead.position.set(...pos);
        screwHead.rotation.x = Math.PI / 2;
        machineGroup.add(screwHead);
    });

    // ===== SIDE VENTS =====
    for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 4; i++) {
            const ventGeo = new THREE.BoxGeometry(0.02, 0.08, 0.5);
            const vent = new THREE.Mesh(ventGeo, createMaterial(0x888888, 0.6, 0.4));
            vent.position.set(0.96 * side, 1.0 + i * 0.14, 0);
            machineGroup.add(vent);
        }
    }

    machineGroup.position.y = -0.5;
    scene.add(machineGroup);

    // ===== CHRISTMAS DECORATIONS =====

    // Christmas tree next to machine
    const treeGroup = new THREE.Group();

    // Tree trunk
    const trunkGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.4, 8);
    const trunkMat = createMaterial(0x4a3728, 0.8, 0.1);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.2;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Tree layers (cone shapes)
    const treeMat = createMaterial(0x1a472a, 0.7, 0.1);
    const treeLayerData = [
        { y: 0.6, radius: 0.5, height: 0.6 },
        { y: 1.0, radius: 0.4, height: 0.5 },
        { y: 1.35, radius: 0.3, height: 0.45 },
        { y: 1.65, radius: 0.2, height: 0.4 }
    ];

    treeLayerData.forEach(layer => {
        const coneGeo = new THREE.ConeGeometry(layer.radius, layer.height, 8);
        const cone = new THREE.Mesh(coneGeo, treeMat);
        cone.position.y = layer.y;
        cone.castShadow = true;
        treeGroup.add(cone);
    });

    // Star on top
    const starMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.8
    });

    // Simple star using octahedron
    const starGeoTree = new THREE.OctahedronGeometry(0.1, 0);
    const starMesh = new THREE.Mesh(starGeoTree, starMat);
    starMesh.position.y = 1.95;
    starMesh.scale.set(1, 1.5, 1);
    treeGroup.add(starMesh);

    // Tree ornaments (baubles on tree)
    const treeBaubleColors = [0xff0000, 0xffd700, 0x0066cc, 0xff69b4, 0x00ff00];
    const treeBaublePositions = [
        { x: 0.25, y: 0.5, z: 0.2 },
        { x: -0.2, y: 0.7, z: 0.25 },
        { x: 0.15, y: 0.95, z: -0.2 },
        { x: -0.18, y: 1.15, z: 0.15 },
        { x: 0.12, y: 1.4, z: 0.1 },
        { x: -0.1, y: 0.6, z: -0.25 },
        { x: 0.22, y: 1.25, z: -0.1 }
    ];

    treeBaublePositions.forEach((pos, i) => {
        const baubleGeo = new THREE.SphereGeometry(0.06, 12, 12);
        const baubleMat = new THREE.MeshStandardMaterial({
            color: treeBaubleColors[i % treeBaubleColors.length],
            roughness: 0.2,
            metalness: 0.6
        });
        const bauble = new THREE.Mesh(baubleGeo, baubleMat);
        bauble.position.set(pos.x, pos.y, pos.z);
        treeGroup.add(bauble);
    });

    treeGroup.position.set(-1.5, -0.5, -0.8);
    treeGroup.scale.set(1.3, 1.3, 1.3);
    scene.add(treeGroup);

    // Christmas baubles on the gachapon machine
    const machineBaublePositions = [
        { x: -0.85, y: 2.0, z: 0.4 },
        { x: 0.85, y: 2.0, z: 0.4 },
        { x: -0.75, y: 1.0, z: 0.7 },
        { x: 0.75, y: 1.0, z: 0.7 }
    ];

    machineBaublePositions.forEach((pos, i) => {
        const baubleGeo = new THREE.SphereGeometry(0.08, 16, 16);
        const baubleMat = new THREE.MeshStandardMaterial({
            color: treeBaubleColors[i % treeBaubleColors.length],
            roughness: 0.15,
            metalness: 0.7
        });
        const bauble = new THREE.Mesh(baubleGeo, baubleMat);
        bauble.position.set(pos.x, pos.y, pos.z);
        bauble.castShadow = true;
        machineGroup.add(bauble);

        // Small hook/cap on bauble
        const capGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.03, 8);
        const capMat = createMaterial(0xc0c0c0, 0.2, 0.8);
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.set(pos.x, pos.y + 0.09, pos.z);
        machineGroup.add(cap);
    });

    // Pine garland/branches on machine
    const garlandMat = createMaterial(0x1a5c2a, 0.8, 0.1);

    // Garland around the globe base
    const garlandRingGeo = new THREE.TorusGeometry(1.0, 0.06, 8, 32);
    const garlandRing = new THREE.Mesh(garlandRingGeo, garlandMat);
    garlandRing.position.set(0, 2.65, 0);
    garlandRing.rotation.x = Math.PI / 2;
    machineGroup.add(garlandRing);

    // Small pine branch details on garland
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const branchGeo = new THREE.ConeGeometry(0.05, 0.15, 4);
        const branch = new THREE.Mesh(branchGeo, garlandMat);
        branch.position.set(
            Math.cos(angle) * 1.0,
            2.65,
            Math.sin(angle) * 1.0
        );
        branch.rotation.z = Math.PI / 2;
        branch.rotation.y = -angle;
        machineGroup.add(branch);
    }

    // Top garland on machine
    const topGarlandGeo = new THREE.TorusGeometry(0.35, 0.04, 6, 16);
    const topGarland = new THREE.Mesh(topGarlandGeo, garlandMat);
    topGarland.position.set(0, 3.7, 0);
    topGarland.rotation.x = Math.PI / 2;
    machineGroup.add(topGarland);

    // Snow on top of dome
    const snowCapGeo = new THREE.SphereGeometry(0.98, 32, 16, 0, Math.PI * 2, 0, Math.PI / 6);
    const snowMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.9,
        metalness: 0.0
    });
    const snowCap = new THREE.Mesh(snowCapGeo, snowMat);
    snowCap.position.set(0, 3.55, 0);
    snowCap.scale.set(1, 0.3, 0.85);
    machineGroup.add(snowCap);

    // Small snow patches
    const snowPatchPositions = [
        { x: 0.3, y: 3.45, z: 0.2, scale: 0.15 },
        { x: -0.25, y: 3.5, z: 0.3, scale: 0.12 },
        { x: 0.1, y: 3.52, z: -0.25, scale: 0.1 },
        { x: -0.4, y: 3.35, z: -0.1, scale: 0.13 }
    ];

    snowPatchPositions.forEach(patch => {
        const patchGeo = new THREE.SphereGeometry(patch.scale, 8, 8);
        const patchMesh = new THREE.Mesh(patchGeo, snowMat);
        patchMesh.position.set(patch.x, patch.y, patch.z);
        patchMesh.scale.y = 0.3;
        machineGroup.add(patchMesh);
    });

    // ===== SNOWFALL PARTICLE SYSTEM =====
    const snowflakes = [];
    const snowflakeCount = 150;
    const snowflakeGeo = new THREE.CircleGeometry(0.02, 6);
    const snowflakeMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });

    for (let i = 0; i < snowflakeCount; i++) {
        const snowflake = new THREE.Mesh(snowflakeGeo, snowflakeMat.clone());
        snowflake.position.set(
            (Math.random() - 0.5) * 8,
            Math.random() * 6 + 2,
            (Math.random() - 0.5) * 6
        );
        snowflake.userData = {
            speed: 0.01 + Math.random() * 0.02,
            wobbleSpeed: 0.5 + Math.random() * 1,
            wobbleAmount: 0.01 + Math.random() * 0.02,
            rotSpeed: (Math.random() - 0.5) * 0.1,
            initialX: snowflake.position.x
        };
        snowflakes.push(snowflake);
        scene.add(snowflake);
    }

    // ===== ANIMATED OBJECTS =====
    const coinGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.015, 32);
    const coinMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.15,
        metalness: 0.95
    });
    const coin = new THREE.Mesh(coinGeo, coinMat);
    coin.visible = false;
    scene.add(coin);

    // ===== DISPENSED CAPSULE =====
    const capsuleGroup = new THREE.Group();

    const topHalfGeo = new THREE.SphereGeometry(0.22, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    let currentCapsuleColor = capsuleColors[0];
    let topHalfMat = createMaterial(currentCapsuleColor, 0.25, 0.25);
    topHalfMat.side = THREE.DoubleSide;
    const topHalf = new THREE.Mesh(topHalfGeo, topHalfMat);

    const topDiscGeo = new THREE.CircleGeometry(0.22, 32);
    const topDiscMat = createMaterial(currentCapsuleColor, 0.25, 0.25);
    topDiscMat.side = THREE.DoubleSide;
    const topDisc = new THREE.Mesh(topDiscGeo, topDiscMat);
    topDisc.rotation.x = Math.PI / 2;
    topHalf.add(topDisc);

    const bottomHalfGeo = new THREE.SphereGeometry(0.22, 32, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    let bottomHalfMat = createMaterial(0xffffff, 0.3, 0.15);
    bottomHalfMat.side = THREE.DoubleSide;
    const bottomHalf = new THREE.Mesh(bottomHalfGeo, bottomHalfMat);

    const bottomDiscGeo = new THREE.CircleGeometry(0.22, 32);
    const bottomDiscMat = createMaterial(0xffffff, 0.3, 0.15);
    bottomDiscMat.side = THREE.DoubleSide;
    const bottomDisc = new THREE.Mesh(bottomDiscGeo, bottomDiscMat);
    bottomDisc.rotation.x = Math.PI / 2;
    bottomHalf.add(bottomDisc);

    capsuleGroup.add(topHalf);
    capsuleGroup.add(bottomHalf);
    capsuleGroup.visible = false;
    scene.add(capsuleGroup);

    // ===== REVEAL PARTICLES =====
    const particlesGroup = new THREE.Group();
    const particleCount = 50;
    const particles = [];

    const starShape = new THREE.Shape();
    const outerRadius = 0.03;
    const innerRadius = 0.015;
    for (let i = 0; i < 5; i++) {
        const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const innerAngle = outerAngle + Math.PI / 5;
        if (i === 0) {
            starShape.moveTo(Math.cos(outerAngle) * outerRadius, Math.sin(outerAngle) * outerRadius);
        } else {
            starShape.lineTo(Math.cos(outerAngle) * outerRadius, Math.sin(outerAngle) * outerRadius);
        }
        starShape.lineTo(Math.cos(innerAngle) * innerRadius, Math.sin(innerAngle) * innerRadius);
    }
    starShape.closePath();

    const starGeo = new THREE.ShapeGeometry(starShape);
    const circleGeo = new THREE.CircleGeometry(0.025, 16);

    for (let i = 0; i < particleCount; i++) {
        const isCircle = Math.random() > 0.5;
        const geo = isCircle ? circleGeo : starGeo;
        const color = new THREE.Color().setHSL(Math.random() * 0.15 + 0.1, 1, 0.6);
        const mat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });
        const particle = new THREE.Mesh(geo, mat);

        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.08,
                Math.random() * 0.06 + 0.02,
                (Math.random() - 0.5) * 0.08
            ),
            rotSpeed: (Math.random() - 0.5) * 0.2,
            life: 0,
            maxLife: 60 + Math.random() * 40,
            delay: i * 2
        };

        particles.push(particle);
        particlesGroup.add(particle);
    }
    particlesGroup.visible = false;
    scene.add(particlesGroup);

    // ===== ANIMATION STATE =====
    let animationPhase = 'idle';
    let animationProgress = 0;
    let knobRotation = 0;
    let particleFrame = 0;
    const animationSpeed = 0.018;

    const coinStartPos = new THREE.Vector3(-2, 1.8, 3);
    const coinTargetPos = new THREE.Vector3(-0.5, 1.1, 0.72);

    function drawRandomCard() {
        // Group all cards by rarity
        const cardsByRarity = {
            common: allCards.filter(c => c.rarity === 'common'),
            rare: allCards.filter(c => c.rarity === 'rare'),
            epic: allCards.filter(c => c.rarity === 'epic'),
            legendary: allCards.filter(c => c.rarity === 'legendary')
        };

        // Determine which rarity to draw based on probabilities
        const roll = Math.random();
        let selectedRarity;
        let cumulative = 0;

        for (const [rarity, config] of Object.entries(RARITY_CONFIG)) {
            cumulative += config.probability;
            if (roll < cumulative) {
                selectedRarity = rarity;
                break;
            }
        }

        // Get cards of that rarity
        let cardsOfRarity = cardsByRarity[selectedRarity] || [];

        // If no cards of that rarity exist, fall back to any card
        if (cardsOfRarity.length === 0) {
            cardsOfRarity = allCards;
        }

        if (cardsOfRarity.length === 0) return null;

        // Pick a random card from the selected rarity (can be duplicate)
        return cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
    }

    // DOM Elements
    const insertBtn = document.getElementById('insert-btn');
    const coinCountEl = document.getElementById('coin-count');
    const cardModal = document.getElementById('card-modal');
    const cardImage = document.getElementById('card-image');
    const cardTitle = document.getElementById('card-title');
    const cardText = document.getElementById('card-text');
    const flipCard = document.getElementById('flip-card');
    const closeCardModal = document.getElementById('close-card-modal');
    const cardLabel = document.getElementById('card-label');
    const cardRarity = document.getElementById('card-rarity');

    // Gallery elements
    const galleryBtn = document.getElementById('gallery-btn');
    const galleryModal = document.getElementById('gallery-modal');
    const galleryClose = document.getElementById('gallery-close');
    const galleryGrid = document.getElementById('gallery-grid');
    const galleryStats = document.getElementById('gallery-stats');

    // Card view modal elements
    const cardViewModal = document.getElementById('card-view-modal');
    const viewFlipCard = document.getElementById('view-flip-card');
    const viewCardImage = document.getElementById('view-card-image');
    const viewCardTitle = document.getElementById('view-card-title');
    const viewCardText = document.getElementById('view-card-text');
    const closeViewModal = document.getElementById('close-view-modal');

    // Coin info modal elements
    const coinBtn = document.getElementById('coin-btn');
    const coinInfoModal = document.getElementById('coin-info-modal');
    const closeCoinInfo = document.getElementById('close-coin-info');

    // Minigame button and container
    const minigameBtn = document.getElementById('minigame-btn');
    const minigameContainer = document.getElementById('minigame-container');
    const minigameCanvas = document.getElementById('minigame-canvas');

    // Insert coin handler
    insertBtn.addEventListener('click', handleInsert);
    insertBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleInsert();
    });

    // Audio unlock flag - only unlock once
    let audioUnlocked = false;

    // Unlock all audio on first user interaction
    function unlockAllAudio() {
        if (audioUnlocked) return;
        audioUnlocked = true;

        // Just create a silent audio context interaction - don't play the actual sounds
        Object.values(rarityAudios).forEach(audio => {
            if (audio) {
                // Preload without playing
                audio.load();
            }
        });
    }

    function handleInsert() {
        if (coins > 0 && !isAnimating && allCards.length > 0) {
            initAudio();
            unlockAllAudio();
            coins--;
            saveCoins(coins);
            coinCountEl.textContent = coins;
            currentCard = drawRandomCard();
            currentCardIsDuplicate = isCardCollected(currentCard.id);
            startAnimation();
            playSound('coin');
        } else if (coins <= 0) {
            // Play no coins sound
            playNoCoinsSound();
        } else if (allCards.length === 0) {
            alert('Keine Karten verfuegbar!');
        }
    }

    // Card modal handlers
    flipCard.addEventListener('click', () => {
        initAudio();
        flipCard.classList.toggle('flipped');
        playSound('flip');
    });

    closeCardModal.addEventListener('click', closeCardModalHandler);
    closeCardModal.addEventListener('touchend', (e) => {
        e.preventDefault();
        closeCardModalHandler();
    });

    function closeCardModalHandler() {
        initAudio();
        playSound('click');
        cardModal.classList.remove('active', 'emerging', 'revealed');
        flipCard.classList.remove('flipped');
        capsuleGroup.visible = false;
        particlesGroup.visible = false;
        cardAnimationStarted = false;
    }

    // Gallery handlers
    galleryBtn.addEventListener('click', openGallery);
    galleryBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        openGallery();
    });

    galleryClose.addEventListener('click', closeGallery);
    galleryClose.addEventListener('touchend', (e) => {
        e.preventDefault();
        closeGallery();
    });

    function openGallery() {
        initAudio();
        playSound('click');
        renderGallery();
        galleryModal.classList.add('active');
    }

    function closeGallery() {
        initAudio();
        playSound('click');
        galleryModal.classList.remove('active');
    }

    // Coin info handlers
    coinBtn.addEventListener('click', openCoinInfo);
    coinBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        openCoinInfo();
    });

    closeCoinInfo.addEventListener('click', closeCoinInfoModal);
    closeCoinInfo.addEventListener('touchend', (e) => {
        e.preventDefault();
        closeCoinInfoModal();
    });

    function openCoinInfo() {
        initAudio();
        playSound('click');
        coinInfoModal.classList.add('active');
    }

    function closeCoinInfoModal() {
        initAudio();
        playSound('click');
        coinInfoModal.classList.remove('active');
    }

    // Minigame handler
    minigameBtn.addEventListener('click', () => {
        initAudio();
        playSound('click');
        minigameContainer.classList.add('active');
        MiniGame.init(minigameCanvas, (earnedCoins) => {
            // Callback when exiting minigame
            minigameContainer.classList.remove('active');
            if (earnedCoins > 0) {
                coins += earnedCoins;
                saveCoins(coins);
                coinCountEl.textContent = coins;
            }
        });
    });

    function renderGallery() {
        const collected = getCollectedCardsSorted();
        galleryStats.textContent = `${collected.length} / ${allCards.length} Karten gesammelt`;

        galleryGrid.innerHTML = '';

        if (collected.length === 0) {
            galleryGrid.innerHTML = `
                <div class="gallery-empty">
                    <div class="gallery-empty-icon">🎰</div>
                    <p>Du hast noch keine Karten gesammelt.</p>
                    <p>Wirf eine Muenze ein!</p>
                </div>
            `;
            return;
        }

        collected.forEach((card) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'gallery-card rarity-' + card.rarity;
            cardEl.innerHTML = `
                <img src="${card.image}" alt="${card.title}">
                <span class="card-number">#${card.id}</span>
            `;
            cardEl.addEventListener('click', () => viewCard(card));
            galleryGrid.appendChild(cardEl);
        });
    }

    function viewCard(card) {
        initAudio();
        playSound('click');
        viewCardImage.src = card.image;
        viewCardTitle.textContent = card.title;
        viewCardText.textContent = card.text;
        viewFlipCard.classList.remove('flipped');

        // Set rarity class on view flip card
        viewFlipCard.classList.remove('rarity-common', 'rarity-rare', 'rarity-epic', 'rarity-legendary');
        viewFlipCard.classList.add('rarity-' + card.rarity);

        cardViewModal.classList.remove('emerging');
        cardViewModal.classList.add('active', 'revealed');
    }

    viewFlipCard.addEventListener('click', () => {
        initAudio();
        viewFlipCard.classList.toggle('flipped');
        playSound('flip');
    });

    closeViewModal.addEventListener('click', () => {
        initAudio();
        playSound('click');
        cardViewModal.classList.remove('active', 'emerging', 'revealed');
        viewFlipCard.classList.remove('flipped');
    });

    closeViewModal.addEventListener('touchend', (e) => {
        e.preventDefault();
        initAudio();
        playSound('click');
        cardViewModal.classList.remove('active', 'emerging', 'revealed');
        viewFlipCard.classList.remove('flipped');
    });

    function startAnimation() {
        isAnimating = true;
        isShaking = false;
        insertBtn.disabled = true;
        animationPhase = 'coin-insert';
        animationProgress = 0;
        knobRotation = 0;
        particleFrame = 0;
        cardAnimationStarted = false;

        capsuleGroup.visible = false;
        topHalf.position.y = 0;
        bottomHalf.position.y = 0;
        topHalf.rotation.set(0, 0, 0);
        bottomHalf.rotation.set(0, 0, 0);
        capsuleGroup.position.set(0, 0, 2);
        capsuleGroup.rotation.set(0, 0, 0);
        capsuleGroup.scale.set(1, 1, 1);

        particles.forEach(p => {
            p.material.opacity = 0;
            p.userData.life = 0;
        });
        particlesGroup.visible = false;

        currentCapsuleColor = capsuleColors[Math.floor(Math.random() * capsuleColors.length)];
        topHalf.material.color.setHex(currentCapsuleColor);
        topDisc.material.color.setHex(currentCapsuleColor);

        coin.visible = true;
        coin.position.copy(coinStartPos);
        coin.rotation.set(Math.PI / 2, 0, 0);
    }

    let cardAnimationStarted = false;

    function startCardReveal() {
        if (!currentCard || cardAnimationStarted) return;
        cardAnimationStarted = true;

        cardImage.src = currentCard.image;
        cardTitle.textContent = currentCard.title;
        cardText.textContent = currentCard.text;
        flipCard.classList.remove('flipped');

        // Set rarity class on flip card
        flipCard.classList.remove('rarity-common', 'rarity-rare', 'rarity-epic', 'rarity-legendary');
        flipCard.classList.add('rarity-' + currentCard.rarity);

        // Set label (new card or duplicate)
        if (currentCardIsDuplicate) {
            cardLabel.textContent = '★ DUPLIKAT ★';
            cardLabel.classList.add('duplicate');
        } else {
            cardLabel.textContent = '★ NEUE KARTE! ★';
            cardLabel.classList.remove('duplicate');
        }

        // Set rarity text and class
        const rarityConfig = RARITY_CONFIG[currentCard.rarity];
        cardRarity.textContent = rarityConfig ? rarityConfig.name : currentCard.rarity;
        cardRarity.classList.remove('rarity-common', 'rarity-rare', 'rarity-epic', 'rarity-legendary');
        cardRarity.classList.add('rarity-' + currentCard.rarity);

        cardModal.classList.remove('revealed');
        cardModal.classList.add('active', 'emerging');
        playSound('reveal');
    }

    function completeCardReveal() {
        if (!currentCard) return;

        collectCard(currentCard.id);

        cardModal.classList.remove('emerging');
        cardModal.classList.add('revealed');
        createSparkles();

        // Play rarity sound after animation is complete
        playRaritySound(currentCard.rarity);

        cardAnimationStarted = false;
    }

    function showCard() {
        completeCardReveal();
    }

    function createSparkles() {
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'sparkle';
                sparkle.style.left = (Math.random() * 100) + '%';
                sparkle.style.top = (Math.random() * 100) + '%';
                sparkle.style.width = (5 + Math.random() * 10) + 'px';
                sparkle.style.height = sparkle.style.width;
                cardModal.appendChild(sparkle);

                setTimeout(() => sparkle.remove(), 1000);
            }, i * 50);
        }
    }

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    function animate() {
        requestAnimationFrame(animate);

        const time = Date.now() * 0.001;

        glowLight1.intensity = 0.4 + Math.sin(time * 2) * 0.15;
        greenLight.material.emissiveIntensity = 0.7 + Math.sin(time * 3) * 0.3;

        // Animate snowfall
        snowflakes.forEach(snowflake => {
            snowflake.position.y -= snowflake.userData.speed;
            snowflake.position.x = snowflake.userData.initialX +
                Math.sin(time * snowflake.userData.wobbleSpeed) * snowflake.userData.wobbleAmount;
            snowflake.rotation.z += snowflake.userData.rotSpeed;

            // Reset snowflake when it falls below view
            if (snowflake.position.y < -1) {
                snowflake.position.y = 6 + Math.random() * 2;
                snowflake.position.x = (Math.random() - 0.5) * 8;
                snowflake.userData.initialX = snowflake.position.x;
            }
        });

        // Animate tree star rotation
        starMesh.rotation.y = time * 0.5;

        if (isShaking) {
            capsuleBalls.forEach((ball, i) => {
                const shake = Math.sin(time * 25 + ball.userData.shakeOffset) * 0.025;
                const shake2 = Math.cos(time * 20 + ball.userData.shakeOffset * 1.5) * 0.02;
                ball.position.x = ball.userData.baseX + shake;
                ball.position.z = ball.userData.baseZ + shake2;
                ball.position.y = ball.userData.baseY + Math.abs(Math.sin(time * 30 + ball.userData.shakeOffset)) * 0.015;
            });
        } else {
            capsuleBalls.forEach(ball => {
                ball.position.x = ball.userData.baseX;
                ball.position.y = ball.userData.baseY;
                ball.position.z = ball.userData.baseZ;
            });
        }

        if (animationPhase === 'coin-insert') {
            animationProgress += animationSpeed * 1.5;
            const t = easeOutCubic(Math.min(animationProgress, 1));

            coin.position.lerpVectors(coinStartPos, coinTargetPos, t);
            coin.rotation.z += 0.2;
            coin.rotation.y += 0.15;

            if (animationProgress >= 1) {
                coin.visible = false;
                animationPhase = 'knob-turn';
                animationProgress = 0;
                isShaking = true;
                playSound('turn');
            }
        }
        else if (animationPhase === 'knob-turn') {
            animationProgress += animationSpeed;

            knobRotation += 0.06;
            knobGroup.rotation.z = -knobRotation;

            machineGroup.rotation.z = Math.sin(animationProgress * Math.PI * 10) * 0.003;
            machineGroup.position.x = Math.sin(animationProgress * Math.PI * 14) * 0.004;

            if (animationProgress >= 1.2) {
                machineGroup.rotation.z = 0;
                machineGroup.position.x = 0;
                isShaking = false;
                animationPhase = 'ball-drop';
                animationProgress = 0;
                capsuleGroup.visible = true;
                capsuleGroup.position.set(0, 0.1, 1.0);
            }
        }
        else if (animationPhase === 'ball-drop') {
            animationProgress += animationSpeed * 0.4;
            const t = easeInOutQuad(Math.min(animationProgress, 1));

            const startY = 0.1;
            const endY = 0.5;
            const bounceHeight = 0.12;
            const bounce = Math.sin(animationProgress * Math.PI * 2) * bounceHeight * (1 - animationProgress);

            capsuleGroup.position.y = startY + (endY - startY) * t + Math.max(0, bounce);
            capsuleGroup.position.z = 1.0 + t * 1.5;

            capsuleGroup.rotation.x += 0.025;
            capsuleGroup.rotation.z += 0.018;

            if (animationProgress >= 1) {
                animationPhase = 'ball-settle';
                animationProgress = 0;
            }
        }
        else if (animationPhase === 'ball-settle') {
            animationProgress += animationSpeed * 0.7;

            capsuleGroup.rotation.x *= 0.92;
            capsuleGroup.rotation.z *= 0.92;

            if (animationProgress >= 0.5) {
                animationPhase = 'ball-open';
                animationProgress = 0;
                capsuleGroup.rotation.set(0, 0, 0);

                particlesGroup.visible = true;
                particlesGroup.position.copy(capsuleGroup.position);
                particleFrame = 0;
            }
        }
        else if (animationPhase === 'ball-open') {
            animationProgress += animationSpeed * 0.35;
            particleFrame++;

            const targetScale = 2.8;
            const currentScale = 1 + easeOutCubic(animationProgress) * (targetScale - 1);
            capsuleGroup.scale.set(currentScale, currentScale, currentScale);

            capsuleGroup.position.y = 0.5 + easeOutCubic(animationProgress) * 1.0;
            capsuleGroup.position.z = 2.5 + easeOutCubic(animationProgress) * 0.8;
            capsuleGroup.rotation.y = animationProgress * 0.3;

            particlesGroup.position.copy(capsuleGroup.position);

            particles.forEach(p => {
                if (particleFrame > p.userData.delay) {
                    p.userData.life++;
                    const lifeRatio = p.userData.life / p.userData.maxLife;

                    if (lifeRatio < 0.2) {
                        p.material.opacity = lifeRatio * 5;
                    } else if (lifeRatio > 0.7) {
                        p.material.opacity = (1 - lifeRatio) * 3.33;
                    } else {
                        p.material.opacity = 1;
                    }

                    p.position.add(p.userData.velocity);
                    p.userData.velocity.y -= 0.001;
                    p.rotation.z += p.userData.rotSpeed;
                }
            });

            if (animationProgress > 0.25) {
                const openProgress = (animationProgress - 0.25) / 0.75;
                const openAmount = easeOutCubic(openProgress);

                topHalf.position.y = openAmount * 0.4;
                bottomHalf.position.y = -openAmount * 0.4;

                topHalf.rotation.x = -openAmount * 0.5;
                topHalf.rotation.z = openAmount * 0.15;

                bottomHalf.rotation.x = openAmount * 0.5;
                bottomHalf.rotation.z = -openAmount * 0.15;

                if (openProgress > 0.1 && !cardAnimationStarted) {
                    startCardReveal();
                }
            }

            if (animationProgress >= 1) {
                animationPhase = 'idle';
                isAnimating = false;
                insertBtn.disabled = false;
                showCard();
            }
        }

        camera.position.x = Math.sin(time * 0.25) * 0.08;
        camera.position.y = 2.2 + Math.sin(time * 0.35) * 0.03;
        camera.lookAt(0, 1.3, 0);

        renderer.render(scene, camera);
    }

    function handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);

        if (width < 768) {
            camera.position.z = 7;
            camera.fov = 55;
        } else {
            camera.position.z = 6;
            camera.fov = 50;
        }
        camera.updateProjectionMatrix();
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
        setTimeout(handleResize, 100);
    });

    handleResize();
    requestAnimationFrame(() => {
        handleResize();
        setTimeout(handleResize, 50);
        setTimeout(handleResize, 150);
    });
    animate();

    document.addEventListener('touchmove', (e) => {
        // Allow scrolling in gallery and other modals
        if (e.target.closest('.prize-modal')) return;
        if (e.target.closest('.gallery-grid')) return;
        if (e.target.closest('.gallery-modal')) return;
        e.preventDefault();
    }, { passive: false });
}
