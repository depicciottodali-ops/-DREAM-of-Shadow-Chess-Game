import { pieceMarkup } from "./piece-art.js";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

function isWhitePiece(symbol) {
  return symbol && symbol === symbol.toUpperCase();
}

function fileIndex(square) {
  return FILES.indexOf(square[0]);
}

function rankIndex(square) {
  return Number(square[1]) - 1;
}

function parseFenBoard(fen) {
  const boardPart = fen.split(" ")[0];
  const rows = boardPart.split("/");
  const map = {};

  rows.forEach((row, rowIndex) => {
    let file = 0;
    for (const char of row) {
      if (/\d/.test(char)) {
        file += Number(char);
      } else {
        const rank = 8 - rowIndex;
        const square = `${FILES[file]}${rank}`;
        map[square] = char;
        file += 1;
      }
    }
  });

  return map;
}

function toSquareFromEventTarget(target) {
  const squareEl = target.closest(".square");
  return squareEl ? squareEl.dataset.square : null;
}

function formatArchiveTitle(title) {
  if (!title || title === "Arcane Match") return "DREAM of Shadow Match";
  if (title.includes("Arcane")) return title.replaceAll("Arcane", "Shadow");
  return title;
}

export class ChessUI {
  constructor({ api, boardEl, moveHistoryEl, gamesListEl, statusEl, aiStatusEl, capturedByWhiteEl, capturedByBlackEl }) {
    this.api = api;
    this.boardEl = boardEl;
    this.moveHistoryEl = moveHistoryEl;
    this.gamesListEl = gamesListEl;
    this.statusEl = statusEl;
    this.aiStatusEl = aiStatusEl;
    this.capturedByWhiteEl = capturedByWhiteEl;
    this.capturedByBlackEl = capturedByBlackEl;

    this.currentGame = null;
    this.currentGameId = null;
    this.selectedArchiveGameId = null;
    this.selectedSquare = null;
    this.legalMoves = [];
    this.boardMap = {};

    this.buildBoardGrid();
    this.boardEl.addEventListener("click", (event) => this.handleBoardClick(event));
  }

  buildBoardGrid() {
    this.boardEl.innerHTML = "";
    for (let rank = 8; rank >= 1; rank -= 1) {
      for (let file = 0; file < 8; file += 1) {
        const square = `${FILES[file]}${rank}`;
        const cell = document.createElement("button");
        cell.className = `square ${(file + rank) % 2 === 0 ? "light" : "dark"}`;
        cell.dataset.square = square;
        cell.type = "button";

        const label = document.createElement("span");
        label.className = "square-label";
        label.textContent = square;
        cell.appendChild(label);

        this.boardEl.appendChild(cell);
      }
    }
  }

  async createGame(title = "DREAM of Shadow Match") {
    const game = await this.api.createGame(title, "player_vs_computer");
    this.selectedArchiveGameId = game.game.id;
    await this.loadGame(game.game.id);
  }

  async loadGame(gameId) {
    const data = await this.api.loadGame(gameId);
    this.currentGameId = gameId;
    this.selectedArchiveGameId = gameId;
    this.currentGame = data;
    this.selectedSquare = null;
    this.legalMoves = [];
    this.boardMap = parseFenBoard(data.game.current_fen);

    this.render();
  }

  async refreshGameList() {
    const data = await this.api.listGames(false);
    this.gamesListEl.innerHTML = "";

    if (!data.games.length) {
      this.gamesListEl.innerHTML = `<p class="empty-msg">No archived duels found.</p>`;
      return;
    }

    data.games.forEach((game) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = `game-item${this.selectedArchiveGameId === game.id ? " selected" : ""}`;
      const stateText = `${game.status}${game.result ? ` (${game.result})` : ""}`;
      const displayTitle = formatArchiveTitle(game.title);
      item.innerHTML = `
        <strong>#${game.id} ${displayTitle}</strong>
        <span>${stateText}</span>
      `;
      item.addEventListener("click", () => {
        this.selectedArchiveGameId = game.id;
        this.renderGameListSelection();
      });
      this.gamesListEl.appendChild(item);
    });
  }

  renderGameListSelection() {
    const allItems = [...this.gamesListEl.querySelectorAll(".game-item")];
    allItems.forEach((item) => {
      const label = item.querySelector("strong")?.textContent || "";
      const selected = this.selectedArchiveGameId && label.startsWith(`#${this.selectedArchiveGameId} `);
      item.classList.toggle("selected", Boolean(selected));
    });
  }

  async loadSelectedGame() {
    if (!this.selectedArchiveGameId) {
      throw new Error("Choose a duel from the archive first.");
    }
    await this.loadGame(this.selectedArchiveGameId);
  }

  async saveCurrentGame() {
    if (!this.currentGameId) return;
    const data = await this.api.saveGame(this.currentGameId, true);
    this.currentGame = data;
    this.renderStatus("Duel archived.");
  }

  async restartCurrentGame() {
    if (!this.currentGameId) return;
    const data = await this.api.restartGame(this.currentGameId);
    this.currentGame = data;
    this.boardMap = parseFenBoard(data.game.current_fen);
    this.selectedSquare = null;
    this.legalMoves = [];
    this.render();
  }

  render() {
    this.renderBoardPieces();
    this.renderMoveHistory();
    this.renderCapturedPieces();
    this.renderStatus();
  }

  renderBoardPieces() {
    const squares = [...this.boardEl.querySelectorAll(".square")];
    squares.forEach((sq) => {
      sq.classList.remove("selected", "target", "last-move-from", "last-move-to");
      const oldPiece = sq.querySelector(".piece-wrap");
      if (oldPiece) oldPiece.remove();

      const squareName = sq.dataset.square;
      const piece = this.boardMap[squareName];
      if (piece) {
        const pieceWrap = document.createElement("div");
        pieceWrap.className = "piece-wrap";
        pieceWrap.innerHTML = pieceMarkup(piece);
        sq.appendChild(pieceWrap);
      }

      if (this.selectedSquare === squareName) {
        sq.classList.add("selected");
      }
      if (this.legalMoves.some((move) => move.slice(2, 4) === squareName)) {
        sq.classList.add("target");
      }
    });

    const moves = this.currentGame?.moves || [];
    if (moves.length) {
      const last = moves[moves.length - 1];
      const from = last.uci.slice(0, 2);
      const to = last.uci.slice(2, 4);
      const fromEl = this.boardEl.querySelector(`.square[data-square='${from}']`);
      const toEl = this.boardEl.querySelector(`.square[data-square='${to}']`);
      if (fromEl) fromEl.classList.add("last-move-from");
      if (toEl) toEl.classList.add("last-move-to");
    }
  }

  renderMoveHistory() {
    this.moveHistoryEl.innerHTML = "";
    const moves = this.currentGame?.moves || [];
    if (!moves.length) {
      this.moveHistoryEl.innerHTML = `<li class="empty-msg">No moves yet.</li>`;
      return;
    }

    for (let i = 0; i < moves.length; i += 2) {
      const white = moves[i];
      const black = moves[i + 1];
      const li = document.createElement("li");
      li.textContent = `${white.move_number}. ${white.san}${black ? `  ${black.san}` : ""}`;
      this.moveHistoryEl.appendChild(li);
    }
  }

  renderCapturedPieces() {
    const moves = this.currentGame?.moves || [];
    const whiteCaptures = [];
    const blackCaptures = [];

    moves.forEach((move) => {
      if (!move.captured_piece) return;
      const captured = move.captured_piece;
      if (move.ply % 2 === 1) {
        whiteCaptures.push(captured);
      } else {
        blackCaptures.push(captured);
      }
    });

    this.capturedByWhiteEl.innerHTML = whiteCaptures.map((p) => `<span class="captured-piece">${pieceMarkup(p)}</span>`).join("");
    this.capturedByBlackEl.innerHTML = blackCaptures.map((p) => `<span class="captured-piece">${pieceMarkup(p)}</span>`).join("");

    if (!whiteCaptures.length) this.capturedByWhiteEl.innerHTML = `<span class="empty-msg">None</span>`;
    if (!blackCaptures.length) this.capturedByBlackEl.innerHTML = `<span class="empty-msg">None</span>`;
  }

  renderStatus(override) {
    const setAiStatus = (text) => {
      if (this.aiStatusEl) this.aiStatusEl.textContent = `AI Status: ${text}`;
    };

    if (override) {
      this.statusEl.textContent = override;
      return;
    }

    if (!this.currentGame) {
      this.statusEl.textContent = "Forge or summon a duel to begin.";
      setAiStatus("Awaiting duel");
      return;
    }

    const game = this.currentGame.game;
    const mode = game.mode || "player_vs_computer";

    if (mode === "player_vs_computer" && game.turn === "black" && game.status === "active") {
      this.statusEl.textContent = "Dark Engine is thinking...";
      setAiStatus("Computer Thinking...");
      return;
    }

    if (mode === "player_vs_computer" && game.turn === "white" && game.status === "active") {
      setAiStatus("Your Turn");
    }

    const whoseTurn = game.turn === "white" ? "White" : "Black";

    if (game.status === "checkmate") {
      this.statusEl.textContent = `Checkmate. ${game.result === "white" ? "White" : "Black"} wins.`;
      setAiStatus("Match Complete");
      return;
    }

    if (game.status === "draw") {
      this.statusEl.textContent = "Draw. The magical duel ends in balance.";
      setAiStatus("Match Complete");
      return;
    }

    if (game.status === "check") {
      this.statusEl.textContent = `Check. ${whoseTurn} to move.`;
      return;
    }

    this.statusEl.textContent = `${whoseTurn} to move.`;
  }

  async handleBoardClick(event) {
    if (!this.currentGameId || !this.currentGame) return;

    const mode = this.currentGame.game.mode || "player_vs_computer";
    if (mode === "player_vs_computer" && this.currentGame.game.turn === "black") {
      this.renderStatus("Dark Engine is making its move.");
      return;
    }

    const clickedSquare = toSquareFromEventTarget(event.target);
    if (!clickedSquare) return;

    if (this.selectedSquare && this.legalMoves.some((m) => m.slice(2, 4) === clickedSquare)) {
      await this.tryApplyMove(this.selectedSquare, clickedSquare);
      return;
    }

    const piece = this.boardMap[clickedSquare];
    if (!piece) {
      this.selectedSquare = null;
      this.legalMoves = [];
      this.renderBoardPieces();
      return;
    }

    const turn = this.currentGame.game.turn;
    if (mode === "player_vs_computer" && !isWhitePiece(piece)) {
      this.renderStatus("Black is controlled by the Dark Engine.");
      return;
    }

    const isSelectable = (turn === "white" && isWhitePiece(piece)) || (turn === "black" && !isWhitePiece(piece));

    if (!isSelectable) {
      this.renderStatus("That champion must await their turn.");
      return;
    }

    const legal = await this.api.getLegalMoves(this.currentGameId, clickedSquare);
    this.selectedSquare = clickedSquare;
    this.legalMoves = legal.moves;
    this.renderBoardPieces();
  }

  async tryApplyMove(from, to) {
    const matching = this.legalMoves.filter((m) => m.startsWith(`${from}${to}`));
    if (!matching.length) return;

    let chosenMove = matching[0];

    // Handle promotion choices when multiple UCI moves share the same from/to.
    if (matching.length > 1) {
      let choice = "q";
      try {
        choice = (window.prompt("Promote to: q, r, b, n", "q") || "q").trim().toLowerCase();
      } catch {
        choice = "q";
      }
      const picked = matching.find((m) => m.endsWith(choice));
      chosenMove = picked || matching[0];
    }

    const movingPiece = this.boardMap[from];
    this.animateMove(from, to, movingPiece);

    try {
      const updated = await this.api.makeMove(this.currentGameId, chosenMove);
      this.currentGame = updated;
      this.boardMap = parseFenBoard(updated.game.current_fen);
      this.selectedSquare = null;
      this.legalMoves = [];
      this.render();
    } catch (error) {
      this.renderStatus(error.message);
    }
  }

  animateMove(from, to, pieceSymbol) {
    if (!pieceSymbol) return;

    const fromEl = this.boardEl.querySelector(`.square[data-square='${from}']`);
    const toEl = this.boardEl.querySelector(`.square[data-square='${to}']`);
    if (!fromEl || !toEl) return;

    const boardRect = this.boardEl.getBoundingClientRect();
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    const ghost = document.createElement("div");
    ghost.className = "piece-ghost";
    ghost.innerHTML = pieceMarkup(pieceSymbol);

    const startX = fromRect.left - boardRect.left;
    const startY = fromRect.top - boardRect.top;
    const endX = toRect.left - boardRect.left;
    const endY = toRect.top - boardRect.top;

    ghost.style.transform = `translate(${startX}px, ${startY}px)`;
    this.boardEl.appendChild(ghost);

    requestAnimationFrame(() => {
      ghost.style.transform = `translate(${endX}px, ${endY}px)`;
    });

    window.setTimeout(() => {
      ghost.remove();
    }, 260);
  }
}
