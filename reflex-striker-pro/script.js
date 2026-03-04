let score = 0;
let timeLeft = 30;
let gameInterval;

const arena = document.getElementById('game-arena');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('start-btn');
const startScreen = document.getElementById('start-screen');

function startGame() {
    score = 0;
    timeLeft = 30;
    scoreDisplay.innerText = score;
    timerDisplay.innerText = timeLeft;
    startScreen.style.display = 'none';

    spawnTarget();

    gameInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function spawnTarget() {
    // Remove old target if it exists
    const oldTarget = document.querySelector('.target');
    if (oldTarget) oldTarget.remove();

    const target = document.createElement('div');
    target.className = 'target';

    // Calculation logic (Python style!)
    const maxX = arena.clientWidth - 60;
    const maxY = arena.clientHeight - 60;
    
    target.style.left = Math.floor(Math.random() * maxX) + 'px';
    target.style.top = Math.floor(Math.random() * maxY) + 'px';

    target.addEventListener('click', () => {
        score++;
        scoreDisplay.innerText = score;
        spawnTarget(); // Teleport target on hit
    });

    arena.appendChild(target);
}

function endGame() {
    clearInterval(gameInterval);
    const target = document.querySelector('.target');
    if (target) target.remove();
    
    startScreen.style.display = 'flex';
    alert(`Training Complete! Final Score: ${score}`);
}

startBtn.addEventListener('click', startGame);