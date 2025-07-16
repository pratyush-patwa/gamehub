injectGlobalOverlays();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const bgMusic = document.getElementById('bgMusic');
const levelSound = document.getElementById('levelUpSound');
const levelOverlay = document.getElementById('levelUpOverlay');
const scoreDisplay = document.getElementById('score');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');

const box = 20;
const canvasSize = 400;

let snake = [{ x: 9 * box, y: 9 * box }];
let direction = 'RIGHT';
let food = {};
let obstacles = [];

let score = 0;
let highScore = parseInt(localStorage.getItem("snakeHighScore") || "0");
let level = 1;
let foodEaten = 0;
let speed = 220;
let gameLoop;
let isPaused = false;
let isLevelingUp = false;

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft' && direction !== 'RIGHT') direction = 'LEFT';
  else if (e.key === 'ArrowUp' && direction !== 'DOWN') direction = 'UP';
  else if (e.key === 'ArrowRight' && direction !== 'LEFT') direction = 'RIGHT';
  else if (e.key === 'ArrowDown' && direction !== 'UP') direction = 'DOWN';
  else if (e.key === ' ' || e.key.toLowerCase() === 'p') togglePause();
});

function togglePause() {
  isPaused = !isPaused;
  togglePauseOverlay(isPaused);
}

function placeFood() {
  do {
    food = {
      x: Math.floor(Math.random() * (canvasSize / box)) * box,
      y: Math.floor(Math.random() * (canvasSize / box)) * box
    };
  } while (
    snake.some(s => s.x === food.x && s.y === food.y) ||
    obstacles.some(o => o.x === food.x && o.y === food.y)
  );
}

function generateObstacles() {
  const count = Math.min(level * 2, 30);
  obstacles = [];

  while (obstacles.length < count) {
    const obs = {
      x: Math.floor(Math.random() * (canvasSize / box)) * box,
      y: Math.floor(Math.random() * (canvasSize / box)) * box
    };
    if (
      !snake.some(s => s.x === obs.x && s.y === obs.y) &&
      !(food.x === obs.x && food.y === obs.y)
    ) {
      obstacles.push(obs);
    }
  }
}

function updateLevelIfNeeded() {
  const goal = 10 + (level - 1) * 2;
  if (foodEaten >= goal && level < 20) {
    level++;
    foodEaten = 0;
    isLevelingUp = true;
    levelOverlay.style.display = "block";
    levelSound.play();
    setTimeout(() => {
      levelOverlay.style.display = "none";
      isLevelingUp = false;
      updateSpeed();
      generateObstacles();
    }, 2000);
  }
}

function updateSpeed() {
  speed = Math.max(60, 180 - level * 8);
  clearInterval(gameLoop);
  gameLoop = setInterval(draw, speed);
}

function pulseSnake() {
  canvas.classList.add("bite-effect");
  setTimeout(() => canvas.classList.remove("bite-effect"), 200);
}

function drawSnakeSegment(x, y, isHead) {
  const cx = x + box / 2;
  const cy = y + box / 2;

  const gradient = ctx.createRadialGradient(cx, cy, 4, cx, cy, box / 2);
  gradient.addColorStop(0, isHead ? '#ff00cc' : '#6BCB77');
  gradient.addColorStop(1, isHead ? '#3333ff' : '#0f0');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, box / 2 - 1, 0, Math.PI * 2);
  ctx.fill();

  if (isHead) {
    // 👁 Dynamic eyes
    ctx.fillStyle = '#fff';
    const offset = box / 4;
    let dx = 0, dy = 0;
    if (direction === 'LEFT') dx = -offset;
    else if (direction === 'RIGHT') dx = offset;
    else if (direction === 'UP') dy = -offset;
    else if (direction === 'DOWN') dy = offset;

    ctx.beginPath();
    ctx.arc(cx - dx / 2 - dy / 3, cy - dy / 2 - dx / 3, 2, 0, Math.PI * 2);
    ctx.arc(cx - dx / 2 + dy / 3, cy - dy / 2 + dx / 3, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function draw() {
  if (isPaused || isLevelingUp) return;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  snake.forEach((seg, i) => drawSnakeSegment(seg.x, seg.y, i === 0));

  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(food.x + box / 2, food.y + box / 2, box / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'orange';
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, box, box));

  let headX = snake[0].x;
  let headY = snake[0].y;

  if (direction === 'LEFT') headX -= box;
  if (direction === 'RIGHT') headX += box;
  if (direction === 'UP') headY -= box;
  if (direction === 'DOWN') headY += box;

  headX = (headX + canvasSize) % canvasSize;
  headY = (headY + canvasSize) % canvasSize;

  const newHead = { x: headX, y: headY };

  const collision =
    snake.some(s => s.x === newHead.x && s.y === newHead.y) ||
    obstacles.some(o => o.x === newHead.x && o.y === newHead.y);

  if (collision) {
    endGame();
    return;
  }

  snake.unshift(newHead);

  if (newHead.x === food.x && newHead.y === food.y) {
    score++;
    foodEaten++;
    pulseSnake();
    placeFood();
    updateLevelIfNeeded();
  } else {
    snake.pop();
  }

  updateScoreDisplay();
}

function updateScoreDisplay() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("snakeHighScore", highScore);
  }
  const goal = 10 + (level - 1) * 2;
  scoreDisplay.textContent =
    `Score: ${score} | Level: ${level} | High Score: ${highScore} | Food to next level: ${goal - foodEaten}`;
}

function endGame() {
  clearInterval(gameLoop);
  bgMusic.pause();
  finalScoreDisplay.textContent = `Your Score: ${score} | Level: ${level}`;
  gameOverScreen.classList.add('active');
}

function restartGame() {
  score = 0;
  level = 1;
  foodEaten = 0;
  speed = 220;
  direction = 'RIGHT';
  snake = [{ x: 9 * box, y: 9 * box }];
  isPaused = false;
  isLevelingUp = false;
  gameOverScreen.classList.remove('active');
  resetOverlays();
  levelOverlay.style.display = 'none';
  placeFood();
  generateObstacles();
  updateSpeed();
  bgMusic.currentTime = 0;
  bgMusic.volume = 0.4;
  bgMusic.play().catch(() => {
    // Retry on first user interaction
    document.body.addEventListener("click", () => {
      bgMusic.play().catch(() => {});
    }, { once: true });
  });
  updateScoreDisplay();
}

function goHome() {
  location.href = '../index.html';
}

window.addEventListener("DOMContentLoaded", restartGame);
