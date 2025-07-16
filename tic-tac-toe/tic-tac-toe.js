let board, status;
const bgMusic = document.getElementById("bgMusic");
const winSound = document.getElementById("winSound");
const drawSound = document.getElementById("drawSound");
const loseSound = document.getElementById("loseSound");

let cells = Array(9).fill("");
let currentPlayer = "X";
let isGameOver = false;
let isPaused = false;

injectGlobalOverlays();

window.addEventListener("DOMContentLoaded", () => {
  board = document.getElementById("board");
  status = document.getElementById("gameStatus");

  createBoard();
  bgMusic.volume = 0.4;
  bgMusic.play().catch(() => {
    // Retry on first user interaction
    document.body.addEventListener("click", () => {
      bgMusic.play().catch(() => {});
    }, { once: true });
  });
});

function createBoard() {
  board.innerHTML = "";
  cells.forEach((val, i) => {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.index = i;
    cell.textContent = val;
    cell.addEventListener("click", handleMove);
    board.appendChild(cell);
  });
}

function handleMove(e) {
  const index = e.target.dataset.index;
  if (cells[index] || isGameOver || isPaused || currentPlayer !== "X") return;

  makeMove(index, "X");
  if (checkGameEnd("X")) return;

  setTimeout(() => {
    if (!isPaused && !isGameOver) {
      const aiIndex = getAIMove("O", "X");
      makeMove(aiIndex, "O");
      checkGameEnd("O");
    }
  }, 400);
}

function makeMove(index, player) {
  cells[index] = player;
  const cell = board.children[index];
  cell.textContent = player;
  cell.classList.add(player === "X" ? "x-cell" : "o-cell");
}

function checkGameEnd(player) {
  const winCombo = checkWinner(player);
  if (winCombo) {
    bgMusic.pause();

    if (player === "X") {
      winSound.play();
      const playerName = sessionStorage.getItem("playerName") || "You";
      status.textContent = `🎉 Congrats ${playerName}, you win!`;
    } else {
      loseSound.play();
      status.textContent = "💀 Computer wins!";
      showGameOverOverlay();
    }

    winCombo.forEach(i => board.children[i].classList.add("winning"));
    isGameOver = true;
    updateLeaderboard("Tic Tac Toe", player === "X" ? 1 : 0);
    return true;
  }

  if (cells.every(c => c)) {
    drawSound.play();
    bgMusic.pause();
    status.textContent = "It's a draw!";
    board.classList.add("draw-state");
    isGameOver = true;
    return true;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  status.textContent = `Player ${currentPlayer}'s turn`;
  return false;
}

function checkWinner(p) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return wins.find(([a,b,c]) => cells[a] === p && cells[b] === p && cells[c] === p);
}

function getAIMove(ai, player) {
  for (let i = 0; i < cells.length; i++) {
    if (!cells[i]) {
      cells[i] = ai;
      if (checkWinner(ai)) return i;
      cells[i] = "";
    }
  }

  for (let i = 0; i < cells.length; i++) {
    if (!cells[i]) {
      cells[i] = player;
      if (checkWinner(player)) {
        cells[i] = "";
        return i;
      }
      cells[i] = "";
    }
  }

  const available = cells.map((val, i) => !val ? i : null).filter(i => i !== null);
  return available[Math.floor(Math.random() * available.length)];
}

function togglePause() {
  isPaused = !isPaused;
  togglePauseOverlay(isPaused);
  status.textContent = isPaused ? "⏸️ Game Paused" : `Player ${currentPlayer}'s turn`;
}

function restartGame() {
  bgMusic.currentTime = 0;
  bgMusic.play();
  winSound.pause(); winSound.currentTime = 0;
  loseSound.pause(); loseSound.currentTime = 0;
  drawSound.pause(); drawSound.currentTime = 0;

  cells = Array(9).fill("");
  isGameOver = false;
  isPaused = false;
  currentPlayer = "X";
  status.textContent = "Player X's turn";
  board.classList.remove("draw-state");
  resetOverlays();
  createBoard();
}

function goHome() {
  location.href = "../index.html";
}
