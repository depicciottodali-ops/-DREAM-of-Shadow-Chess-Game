import { ApiClient } from "./api.js";
import { ChessUI } from "./chess-ui.js";

const api = new ApiClient("");

const ui = new ChessUI({
  api,
  boardEl: document.getElementById("board"),
  moveHistoryEl: document.getElementById("move-history"),
  gamesListEl: document.getElementById("games-list"),
  statusEl: document.getElementById("status-text"),
  aiStatusEl: document.getElementById("ai-status"),
  capturedByWhiteEl: document.getElementById("captured-by-white"),
  capturedByBlackEl: document.getElementById("captured-by-black"),
});

const newGameBtn = document.getElementById("new-game-btn");
const saveGameBtn = document.getElementById("save-game-btn");
const loadGameBtn = document.getElementById("load-game-btn");
const restartGameBtn = document.getElementById("restart-game-btn");
const refreshGamesBtn = document.getElementById("refresh-games-btn");
const matchTitleInput = document.getElementById("match-title-input");
const aiStatusEl = document.getElementById("ai-status");
const DEFAULT_TITLE = "DREAM of Shadow Match";
const MODE = "player_vs_computer";

function setAiStatus(message) {
  if (aiStatusEl) aiStatusEl.textContent = `AI Status: ${message}`;
}

newGameBtn.addEventListener("click", async () => {
  let title = (matchTitleInput?.value || "").trim() || DEFAULT_TITLE;
  try {
    // Some embedded browsers disable prompt dialogs; keep game creation working.
    const inputTitle = window.prompt("Duel title", title);
    title = (inputTitle || title).trim() || DEFAULT_TITLE;
  } catch {
    title = title || DEFAULT_TITLE;
  }
  try {
    await ui.createGame(title, MODE);
    await ui.refreshGameList();
    setAiStatus("Your Turn");
  } catch (error) {
    setAiStatus(error.message);
  }
});

saveGameBtn.addEventListener("click", async () => {
  try {
    await ui.saveCurrentGame();
    await ui.refreshGameList();
  } catch (error) {
    setAiStatus(error.message);
  }
});

loadGameBtn.addEventListener("click", async () => {
  try {
    await ui.loadSelectedGame();
    setAiStatus("Your Turn");
  } catch (error) {
    setAiStatus(error.message);
  }
});

restartGameBtn.addEventListener("click", async () => {
  try {
    await ui.restartCurrentGame();
    await ui.refreshGameList();
    setAiStatus("Your Turn");
  } catch (error) {
    setAiStatus(error.message);
  }
});

refreshGamesBtn.addEventListener("click", async () => {
  await ui.refreshGameList();
});

(async function bootstrap() {
  await ui.refreshGameList();
  setAiStatus("Your Turn");
})();
