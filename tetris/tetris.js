injectGlobalOverlays(); // Injects pause + game-over overlays

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("nextCanvas");
const nextCtx = nextCanvas.getContext("2d");
const bgMusic = document.getElementById("bgMusic");
const gameOverSound = document.getElementById("gameOverSound");

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;
nextCanvas.width = 6 * BLOCK_SIZE;
nextCanvas.height = 6 * BLOCK_SIZE;

const COLORS = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#B388EB", "#FF8C00", "#1E90FF"];
const SHAPES = [
  [[1, 1, 1], [0, 1, 0]],
  [[1, 1], [1, 1]],
  [[0, 0, 1], [1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[1, 1, 0], [0, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
  [[1, 1, 1, 1]]
];

let board = [];
let currentPiece;
let nextPiece;
let score = 0;
let highScore = parseInt(localStorage.getItem("tetrisHighScore") || "0");
let gameInterval;
let isPaused = false;

function drawBlock(x, y, color, context = ctx) {
  context.fillStyle = color;
  context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
}

function generatePiece() {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return {
    shape,
    color,
    x: Math.floor((COLS - shape[0].length) / 2),
    y: 0
  };
}

function rotate(matrix) {
  return matrix[0].map((_, i) => matrix.map(row => row[i])).reverse();
}

function isValidMove(shape, x, y) {
  return shape.every((row, dy) =>
    row.every((cell, dx) => {
      if (!cell) return true;
      const newX = x + dx;
      const newY = y + dy;
      return (
        newX >= 0 &&
        newX < COLS &&
        newY < ROWS &&
        board[newY]?.[newX] === null
      );
    })
  );
}

function merge(shape, x, y, color) {
  shape.forEach((row, dy) => {
    row.forEach((cell, dx) => {
      if (cell) {
        board[y + dy][x + dx] = color;
      }
    });
  });
}

function clearLines() {
  let linesCleared = 0;
  board = board.filter(row => {
    if (row.every(cell => cell)) {
      linesCleared++;
      return false;
    }
    return true;
  });
  while (board.length < ROWS) {
    board.unshift(Array(COLS).fill(null));
  }
  score += linesCleared * 100;
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  board.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (cell) drawBlock(x, y, cell);
    })
  );
}

function drawPiece(piece, context = ctx) {
  piece.shape.forEach((row, dy) =>
    row.forEach((cell, dx) => {
      if (cell) drawBlock(piece.x + dx, piece.y + dy, piece.color, context);
    })
  );
}

function drawNextPiece() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  nextCtx.fillStyle = "#222";
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

  nextPiece.shape.forEach((row, dy) =>
    row.forEach((cell, dx) => {
      if (cell) {
        drawBlock(dx + 1, dy + 1, nextPiece.color, nextCtx);
      }
    })
  );
}

function drop() {
  if (isValidMove(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
    currentPiece.y++;
  } else {
    merge(currentPiece.shape, currentPiece.x, currentPiece.y, currentPiece.color);
    clearLines();
    currentPiece = nextPiece;
    nextPiece = generatePiece();
    drawNextPiece();

    if (!isValidMove(currentPiece.shape, currentPiece.x, currentPiece.y)) {
      endGame();
      return;
    }
  }
  draw();
}

function draw() {
  drawBoard();
  drawPiece(currentPiece);
  document.getElementById("score").innerText = `Score: ${score}`;
  document.getElementById("highScore").innerText = `Highest: ${highScore}`;
}

function endGame() {
  clearInterval(gameInterval);
  gameOverSound.play();
  bgMusic.pause();

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("tetrisHighScore", highScore);
  }

  showGameOverOverlay();
  updateLeaderboard("Tetris", score);
}

document.addEventListener("keydown", e => {
  if (isPaused) return;

  switch (e.key) {
    case "ArrowLeft":
    case "a":
      if (isValidMove(currentPiece.shape, currentPiece.x - 1, currentPiece.y)) currentPiece.x--;
      break;
    case "ArrowRight":
    case "d":
      if (isValidMove(currentPiece.shape, currentPiece.x + 1, currentPiece.y)) currentPiece.x++;
      break;
    case "ArrowDown":
    case "s":
      if (isValidMove(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) currentPiece.y++;
      break;
    case "ArrowUp":
    case "w":
      const rotated = rotate(currentPiece.shape);
      if (isValidMove(rotated, currentPiece.x, currentPiece.y)) currentPiece.shape = rotated;
      break;
    case " ":
      togglePause();
      break;
  }

  draw();
});

function togglePause() {
  isPaused = !isPaused;
  document.getElementById("pauseBtn").textContent = isPaused ? "▶️ Resume" : "⏸️ Pause";
  togglePauseOverlay(isPaused);
}

function startGame() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  score = 0;
  isPaused = false;
  currentPiece = generatePiece();
  nextPiece = generatePiece();
  drawNextPiece();
  draw();
  resetOverlays();
  bgMusic.currentTime = 0;
  bgMusic.volume = 0.4;
  bgMusic.play().catch(() => {});
  document.getElementById("pauseBtn").textContent = "⏸️ Pause";

  clearInterval(gameInterval);
  gameInterval = setInterval(() => {
    if (!isPaused) drop();
  }, 500);
}

function goHome() {
  location.href = '../index.html';
}

window.addEventListener("DOMContentLoaded", startGame);
