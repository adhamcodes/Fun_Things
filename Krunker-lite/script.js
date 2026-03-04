// --- 1. GLOBAL VARIABLES & STATE ---
let camera, scene, renderer, controls;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, canJump = false;

// Game Logic
let score = 0;
let timeLeft = 30;
let gameInterval;
let gameState = 'menu'; // 'menu', 'playing', 'gameover'
let lastFireTime = 0;
const fireRate = 200; // Milliseconds between shots

// Raycaster (Shooting)
const raycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0); 
let targets = []; // Keep track of targets so we can respawn them

// DOM Elements
const uiLayer = document.getElementById('ui-layer');
const gameOverLayer = document.getElementById('game-over-layer');
const crosshair = document.getElementById('crosshair');
const hud = document.getElementById('hud');
const scoreVal = document.getElementById('score-val');
const timerVal = document.getElementById('timer-val');
const finalScoreVal = document.getElementById('final-score');

init();
animate();

// --- 2. INITIALIZATION ---
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1c);
    scene.fog = new THREE.Fog(0x0a0f1c, 0, 500);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 10;

    const light = new THREE.HemisphereLight(0xffffff, 0x444455, 0.8);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);

    controls = new THREE.PointerLockControls(camera, document.body);
    scene.add(controls.getObject());

    // --- STATE MANAGEMENT ---
    const startOrRestartGame = () => {
        if (gameState === 'playing') return;
        resetGame();
        controls.lock(); // Traps the mouse
    };

    uiLayer.addEventListener('click', startOrRestartGame);
    gameOverLayer.addEventListener('click', startOrRestartGame);
    
    controls.addEventListener('lock', () => {
        gameState = 'playing';
        uiLayer.style.display = 'none';
        gameOverLayer.style.display = 'none';
        crosshair.style.display = 'block';
        hud.style.display = 'flex';
        
        // Start the countdown
        clearInterval(gameInterval);
        gameInterval = setInterval(updateTimer, 1000);
    });
    
    controls.addEventListener('unlock', () => {
        if (gameState === 'playing') {
            // Player pressed ESC manually
            clearInterval(gameInterval);
            uiLayer.style.display = 'flex';
            crosshair.style.display = 'none';
            hud.style.display = 'none';
            gameState = 'menu';
        }
    });

    // Keyboard Listeners
    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'KeyW': moveForward = true; break;
            case 'KeyA': moveLeft = true; break;
            case 'KeyS': moveBackward = true; break;
            case 'KeyD': moveRight = true; break;
            case 'Space': if (canJump) velocity.y += 350; canJump = false; break;
        }
    });
    document.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'KeyW': moveForward = false; break;
            case 'KeyA': moveLeft = false; break;
            case 'KeyS': moveBackward = false; break;
            case 'KeyD': moveRight = false; break;
        }
    });

    // --- WORLD GENERATION ---
    const floorGeo = new THREE.PlaneGeometry(1000, 1000, 20, 20);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, wireframe: true });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    scene.add(floor);

    spawnTargets(30);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// --- 3. GAME LOGIC ---
function spawnTargets(count) {
    const boxGeo = new THREE.BoxGeometry(12, 12, 12);
    const boxMat = new THREE.MeshPhongMaterial({ color: 0xfbbf24 });
    
    for (let i = 0; i < count; i++) {
        const box = new THREE.Mesh(boxGeo, boxMat);
        // Ensure they don't spawn exactly on the player (0,0,0)
        let x = Math.floor(Math.random() * 400 - 200);
        let z = Math.floor(Math.random() * 400 - 200);
        if (Math.abs(x) < 30) x += 50; 
        if (Math.abs(z) < 30) z += 50;

        box.position.set(x, 10, z);
        scene.add(box);
        targets.push(box);
    }
}

function resetGame() {
    score = 0;
    timeLeft = 30;
    scoreVal.innerText = score;
    timerVal.innerText = timeLeft;
    
    // Clear old targets and spawn new ones
    targets.forEach(t => scene.remove(t));
    targets = [];
    spawnTargets(30);
    
    // Reset player position
    controls.getObject().position.set(0, 10, 0);
}

function updateTimer() {
    timeLeft--;
    timerVal.innerText = timeLeft;
    if (timeLeft <= 0) {
        endSession();
    }
}

function endSession() {
    gameState = 'gameover';
    clearInterval(gameInterval);
    controls.unlock(); // Frees the mouse
    crosshair.style.display = 'none';
    hud.style.display = 'none';
    gameOverLayer.style.display = 'flex';
    finalScoreVal.innerText = score;
}

// --- 4. COMBAT MECHANICS ---
window.addEventListener('mousedown', () => {
    if (gameState !== 'playing') return;

    const now = performance.now();
    if (now - lastFireTime < fireRate) return; // WEAPON COOLDOWN LOGIC
    lastFireTime = now;

    raycaster.setFromCamera(screenCenter, camera);
    const intersects = raycaster.intersectObjects(targets);

    if (intersects.length > 0) {
        const hitObject = intersects[0].object;
        
        // Remove from scene and array
        scene.remove(hitObject);
        targets = targets.filter(t => t !== hitObject);
        
        score++;
        scoreVal.innerText = score;

        // Immediately spawn a new target somewhere else to keep the arena full
        spawnTargets(1);
    }
});

// --- 5. THE PHYSICS ENGINE ---
function animate() {
    requestAnimationFrame(animate);

    if (gameState === 'playing' && controls.isLocked) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 100.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        controls.getObject().position.y += (velocity.y * delta);

        if (controls.getObject().position.y < 10) {
            velocity.y = 0;
            controls.getObject().position.y = 10;
            canJump = true;
        }
        prevTime = time;
    } else {
        prevTime = performance.now(); // Prevents physics exploding when unpaused
    }
    renderer.render(scene, camera);
}