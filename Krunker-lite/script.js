// --- 1. GLOBAL VARIABLES ---
let camera, scene, renderer, controls;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, canJump = false;

// Shooting & Score Mechanics
let score = 0;
const raycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0); // Center of screen for crosshair

init();
animate();

// --- 2. INITIALIZATION ---
function init() {
    // Setup Scene and Camera
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Dark sky
    scene.fog = new THREE.Fog(0x0f172a, 0, 750);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 10;

    // Add Lighting
    const light = new THREE.HemisphereLight(0xffffff, 0x444455, 0.8);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);

    // Setup Controls
    controls = new THREE.PointerLockControls(camera, document.body);
    const uiLayer = document.getElementById('ui-layer');
    const crosshair = document.getElementById('crosshair');
    const scoreboard = document.getElementById('scoreboard');

    // UI Interaction
    uiLayer.addEventListener('click', () => controls.lock());
    
    controls.addEventListener('lock', () => {
        uiLayer.style.display = 'none';
        crosshair.style.display = 'block';
        scoreboard.style.display = 'block';
    });
    
    controls.addEventListener('unlock', () => {
        uiLayer.style.display = 'flex';
        crosshair.style.display = 'none';
        scoreboard.style.display = 'none';
    });
    
    scene.add(controls.getObject());

    // Keyboard Listeners for Movement
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

    // --- 3. WORLD GENERATION ---
    // Floor
    const floorGeo = new THREE.PlaneGeometry(2000, 2000, 50, 50);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, wireframe: true });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    scene.add(floor);

    // Targets
    const boxGeo = new THREE.BoxGeometry(15, 15, 15);
    const boxMat = new THREE.MeshPhongMaterial({ color: 0xfbbf24 }); // Yellow targets
    for (let i = 0; i < 40; i++) {
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.x = Math.floor(Math.random() * 20 - 10) * 20;
        box.position.y = 10;
        box.position.z = Math.floor(Math.random() * 20 - 10) * 20;
        scene.add(box);
    }

    // Setup Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Handle Window Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// --- 4. SHOOTING MECHANIC (RAYCASTING) ---
window.addEventListener('mousedown', () => {
    if (!controls.isLocked) return;

    raycaster.setFromCamera(screenCenter, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].object.geometry.type === 'BoxGeometry') {
            scene.remove(intersects[i].object); // Destroy target
            score++; // Increment score
            document.getElementById('score-val').innerText = score; // Update UI
            break; // Stop bullet from piercing multiple targets
        }
    }
});

// --- 5. THE GAME LOOP (PHYSICS) ---
function animate() {
    requestAnimationFrame(animate);

    if (controls.isLocked) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        // Friction & Gravity
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 100.0 * delta;

        // WASD Movement Math
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        controls.getObject().position.y += (velocity.y * delta);

        // Floor Collision
        if (controls.getObject().position.y < 10) {
            velocity.y = 0;
            controls.getObject().position.y = 10;
            canJump = true;
        }
        prevTime = time;
    }
    renderer.render(scene, camera);
}