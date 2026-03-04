const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d'); // This is our drawing tool

const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('start-btn');
const startScreen = document.getElementById('start-screen');

let score = 0;
let timeLeft = 30;
let gameInterval;
let isPlaying = false;

// Target properties
let target = { x: 0, y: 0, radius: 25 };

function startGame() {
    score = 0;
    timeLeft = 30;
    isPlaying = true;
    scoreDisplay.innerText = score;
    timerDisplay.innerText = timeLeft;
    startScreen.style.display = 'none';

    spawnTarget();
    drawGame(); // Start rendering

    gameInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function spawnTarget() {
    // Keep target inside the canvas borders
    const margin = target.radius;
    target.x = Math.random() * (canvas.width - margin * 2) + margin;
    target.y = Math.random() * (canvas.height - margin * 2) + margin;
}

// THE RENDERER: Clears the screen and draws the target
function drawGame() {
    if (!isPlaying) return;
    
    // Clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the new target
    ctx.beginPath();
    ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24'; // Warning yellow
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#fbbf24';
    ctx.fill();
    ctx.closePath();

    // Loop the render at 60 FPS
    requestAnimationFrame(drawGame);
}

// COLLISION DETECTION
canvas.addEventListener('mousedown', (e) => {
    if (!isPlaying) return;

    // Get exact mouse position relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Math: Calculate distance between mouse and target center
    const distance = Math.hypot(mouseX - target.x, mouseY - target.y);

    if (distance <= target.radius) {
        // Hit!
        score++;
        scoreDisplay.innerText = score;
        spawnTarget(); // Move it immediately
    }
});

function endGame() {
    isPlaying = false;
    clearInterval(gameInterval);
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Wipe the board
    startScreen.style.display = 'block';
    alert(`Session Over. Final Score: ${score}`);
}

startBtn.addEventListener('click', startGame);