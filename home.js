function submitName() {
  const name = document.getElementById("playerName").value.trim();
  if (name) {
    sessionStorage.setItem("playerName", name);
    showGameScreen(name);
  }
}

function showGameScreen(name) {
  document.getElementById("nameInputSection").style.display = "none";
  const gameButtons = document.getElementById("gameButtons");
  const greeting = document.getElementById("greeting");

  gameButtons.style.display = "block";
  greeting.textContent = `Hello, ${name}! Choose a game to begin 👇`;

  gameButtons.style.opacity = "0";
  setTimeout(() => {
    gameButtons.style.opacity = "1";
  }, 100);

  document.querySelectorAll(".game-card").forEach(card => {
    card.title = `Play as ${name}`;
  });
}

function startGame(url) {
  window.location.href = url;
}

function updateLeaderboard(game, score) {
  const name = sessionStorage.getItem("playerName") || "Anonymous";
  let leaderboard = JSON.parse(sessionStorage.getItem("leaderboard") || "{}");

  if (!leaderboard[name]) leaderboard[name] = {};
  const previous = leaderboard[name][game] || 0;

  if (score > previous) {
    leaderboard[name][game] = score;
    sessionStorage.setItem("leaderboard", JSON.stringify(leaderboard));
  }
}

function openLeaderboard() {
  const data = JSON.parse(sessionStorage.getItem("leaderboard") || "{}");
  const entries = [];

  for (const name in data) {
    for (const game in data[name]) {
      entries.push({ name, game, score: data[name][game] });
    }
  }

  const topFive = entries.sort((a, b) => b.score - a.score).slice(0, 5);

  const output = topFive.length
    ? topFive.map((e, i) => `
      <div>
        <strong>#${i + 1}</strong> 🕹️ <b>${e.game}</b> — ${e.score}<br>
        👤 ${e.name}
      </div><hr>`).join("")
    : "<p>No scores yet!</p>";

  document.getElementById("leaderboardData").innerHTML = output;
  document.getElementById("leaderboardPopup").style.display = "flex";
}

function closeLeaderboard() {
  document.getElementById("leaderboardPopup").style.display = "none";
}

function injectGlobalOverlays() {
  if (!document.getElementById("pauseOverlay")) {
    const pauseOverlay = document.createElement("div");
    pauseOverlay.id = "pauseOverlay";
    pauseOverlay.className = "game-overlay";
    pauseOverlay.textContent = "⏸️ PAUSED";

    const gameOverOverlay = document.createElement("div");
    gameOverOverlay.id = "gameOverOverlay";
    gameOverOverlay.className = "game-overlay";
    gameOverOverlay.textContent = "💀 GAME OVER";

    document.body.appendChild(pauseOverlay);
    document.body.appendChild(gameOverOverlay);
  }
}

function togglePauseOverlay(show = false) {
  const el = document.getElementById("pauseOverlay");
  if (el) el.style.display = show ? "block" : "none";
}

function showGameOverOverlay() {
  const el = document.getElementById("gameOverOverlay");
  if (el) el.style.display = "block";
}

function resetOverlays() {
  togglePauseOverlay(false);
  const el = document.getElementById("gameOverOverlay");
  if (el) el.style.display = "none";
}

window.addEventListener("DOMContentLoaded", () => {
  const savedName = sessionStorage.getItem("playerName");
  if (savedName) {
    showGameScreen(savedName);
  }
});
