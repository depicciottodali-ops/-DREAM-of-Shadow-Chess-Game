/**
 * game.js – DREAM of Shadow Chess Game
 * Frontend logic: board rendering, move handling, API communication.
 *
 * The human player controls White.
 * The Dark Engine controls Black (handled server-side).
 */

"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// Constants & Unicode piece glyphs
// ─────────────────────────────────────────────────────────────────────────────

const PIECE_GLYPHS = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]; // top-to-bottom visual order

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

const state = {
  gameId:         null,
  fen:            null,
  status:         null,
  selectedSquare: null,   // e.g. "e2"
  legalTargets:   [],     // array of destination squares for selectedSquare
  lastMoveFrom:   null,
  lastMoveTo:     null,
  pendingPromo:   null,   // { from, to } – waiting for promotion choice
  moveLog:        [],     // [{ num, white, black }]
  capturedByWhite:[],
  capturedByBlack:[],
  playerName:     "Wanderer",
  isWhiteTurn:    true,
};

// ─────────────────────────────────────────────────────────────────────────────
// DOM references
// ─────────────────────────────────────────────────────────────────────────────

const dom = {
  board:           () => document.getElementById("board"),
  status:          () => document.getElementById("gameStatus"),
  moveLog:         () => document.getElementById("moveLog"),
  engineLastMove:  () => document.getElementById("engineLastMove"),
  capturedWhite:   () => document.getElementById("capturedByWhite"),
  capturedBlack:   () => document.getElementById("capturedByBlack"),
  archiveList:     () => document.getElementById("archiveList"),
  duelControls:    () => document.getElementById("duelControls"),
  playerName:      () => document.getElementById("playerName"),
  rankLabels:      () => document.getElementById("rankLabels"),
  fileLabels:      () => document.getElementById("fileLabels"),
  promoModal:      () => document.getElementById("promoModal"),
};

// ─────────────────────────────────────────────────────────────────────────────
// FEN parser helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse FEN piece placement into a 64-element array (index 0 = a8, 63 = h1).
 * Each cell is a piece character (e.g. 'K','q') or null.
 */
function parseFen(fen) {
  const placement = fen.split(" ")[0];
  const rows = placement.split("/");
  const board = [];
  for (const row of rows) {
    for (const ch of row) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < parseInt(ch, 10); i++) board.push(null);
      } else {
        board.push(ch);
      }
    }
  }
  return board; // length 64
}

/** Return active colour from FEN: 'w' or 'b'. */
function fenTurn(fen) {
  return fen.split(" ")[1];
}

/** Convert square name (e.g. "e4") to board index (0=a8 … 63=h1). */
function squareToIndex(sq) {
  const file = sq.charCodeAt(0) - "a".charCodeAt(0);
  const rank = 8 - parseInt(sq[1], 10);
  return rank * 8 + file;
}

/** Convert board index to square name. */
function indexToSquare(idx) {
  const file = FILES[idx % 8];
  const rank = 8 - Math.floor(idx / 8);
  return file + rank;
}

/** Return true if the piece belongs to White. */
function isWhitePiece(p) { return p && p === p.toUpperCase(); }

/** Return true if the piece belongs to Black. */
function isBlackPiece(p) { return p && p === p.toLowerCase(); }

// ─────────────────────────────────────────────────────────────────────────────
// Legal move client-side pre-check (pseudo-legal, used for highlighting only)
// Full legality is enforced server-side via python-chess.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return a list of plausible destination squares for a piece at `from`.
 * This is a simplified set used purely for UI highlighting – the server
 * validates the actual legality.
 */
function getPseudoLegalTargets(boardArr, from) {
  const idx = squareToIndex(from);
  const piece = boardArr[idx];
  if (!piece) return [];

  const targets = [];
  const fileN = idx % 8;
  const rankN = Math.floor(idx / 8);
  const white = isWhitePiece(piece);

  const add = (i) => {
    if (i < 0 || i > 63) return false;
    const t = boardArr[i];
    if (t === undefined) return false;
    if (white && isWhitePiece(t)) return false;   // can't capture own piece
    if (!white && isBlackPiece(t)) return false;
    targets.push(indexToSquare(i));
    return !t; // returns true if square was empty (can slide further)
  };

  const slide = (dr, df) => {
    for (let step = 1; step <= 7; step++) {
      const r = rankN + dr * step;
      const f = fileN + df * step;
      if (r < 0 || r > 7 || f < 0 || f > 7) break;
      const i = r * 8 + f;
      const empty = add(i);
      if (!empty) break;
    }
  };

  const p = piece.toUpperCase();

  if (p === "P") {
    const dir = white ? -1 : 1;
    const startRank = white ? 6 : 1;
    const fr = rankN + dir;
    // forward
    if (fr >= 0 && fr <= 7 && !boardArr[fr * 8 + fileN]) {
      targets.push(indexToSquare(fr * 8 + fileN));
      if (rankN === startRank && !boardArr[(fr + dir) * 8 + fileN]) {
        targets.push(indexToSquare((fr + dir) * 8 + fileN));
      }
    }
    // captures
    for (const df of [-1, 1]) {
      const ff = fileN + df;
      if (ff < 0 || ff > 7) continue;
      const ti = fr * 8 + ff;
      if (ti >= 0 && ti < 64) {
        const t = boardArr[ti];
        if (t && (white ? isBlackPiece(t) : isWhitePiece(t))) {
          targets.push(indexToSquare(ti));
        }
      }
    }
  } else if (p === "N") {
    for (const [dr, df] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      const r = rankN + dr, f = fileN + df;
      if (r < 0 || r > 7 || f < 0 || f > 7) continue;
      add(r * 8 + f);
    }
  } else if (p === "B") {
    for (const [dr, df] of [[-1,-1],[-1,1],[1,-1],[1,1]]) slide(dr, df);
  } else if (p === "R") {
    for (const [dr, df] of [[-1,0],[1,0],[0,-1],[0,1]]) slide(dr, df);
  } else if (p === "Q") {
    for (const [dr, df] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]) slide(dr, df);
  } else if (p === "K") {
    for (const [dr, df] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      const r = rankN + dr, f = fileN + df;
      if (r < 0 || r > 7 || f < 0 || f > 7) continue;
      add(r * 8 + f);
    }
    // Castling hints (simplified)
    if (white && rankN === 7 && fileN === 4) {
      if (!boardArr[63] || boardArr[63] === "R") targets.push("g1");
      if (!boardArr[56] || boardArr[56] === "R") targets.push("c1");
    }
    if (!white && rankN === 0 && fileN === 4) {
      targets.push("g8");
      targets.push("c8");
    }
  }

  return targets;
}

// ─────────────────────────────────────────────────────────────────────────────
// Board Rendering
// ─────────────────────────────────────────────────────────────────────────────

function buildBoardLabels() {
  const rankEl = dom.rankLabels();
  const fileEl = dom.fileLabels();
  rankEl.innerHTML = "";
  fileEl.innerHTML = "";

  for (const r of RANKS) {
    const span = document.createElement("span");
    span.textContent = r;
    rankEl.appendChild(span);
  }
  for (const f of FILES) {
    const span = document.createElement("span");
    span.textContent = f;
    fileEl.appendChild(span);
  }
}

function renderBoard() {
  if (!state.fen) return;

  const boardEl = dom.board();
  boardEl.innerHTML = "";
  const boardArr = parseFen(state.fen);

  for (let i = 0; i < 64; i++) {
    const sq = indexToSquare(i);
    const fileN = i % 8;
    const rankN = Math.floor(i / 8);
    const isLight = (fileN + rankN) % 2 === 0;

    const cell = document.createElement("div");
    cell.className = "square " + (isLight ? "light" : "dark");
    cell.dataset.square = sq;

    // Highlight last move
    if (sq === state.lastMoveFrom || sq === state.lastMoveTo) {
      cell.classList.add("last-move");
    }

    // Selected piece
    if (sq === state.selectedSquare) cell.classList.add("selected");

    // Legal target highlight
    if (state.legalTargets.includes(sq)) {
      cell.classList.add("legal");
      if (boardArr[i]) cell.classList.add("occupied");
    }

    // King-in-check highlight
    const piece = boardArr[i];
    if (piece) {
      // Check if king is in check (simple FEN-based heuristic)
      if ((piece === "K" && isKingInCheck(state.fen, "w")) ||
          (piece === "k" && isKingInCheck(state.fen, "b"))) {
        cell.classList.add("in-check");
      }
      const pieceEl = document.createElement("span");
      pieceEl.className = "piece";
      pieceEl.textContent = PIECE_GLYPHS[piece] || piece;
      cell.appendChild(pieceEl);
    }

    cell.addEventListener("click", onSquareClick);
    boardEl.appendChild(cell);
  }
}

/**
 * Very rough check detection: scans if the FEN's active side's king is
 * targeted. (True legality is server-validated; this is UI only.)
 */
function isKingInCheck(fen, colour) {
  // We rely on the FEN status coming back from the server;
  // simply return false here for UI purposes – we use the status string instead.
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Square click handler
// ─────────────────────────────────────────────────────────────────────────────

function onSquareClick(e) {
  if (!state.gameId) return;
  if (state.status && state.status !== "active") return;
  if (!state.isWhiteTurn) return; // block clicks during engine turn

  const sq = e.currentTarget.dataset.square;
  const boardArr = parseFen(state.fen);
  const idx = squareToIndex(sq);
  const piece = boardArr[idx];

  if (state.selectedSquare === null) {
    // Select a white piece
    if (piece && isWhitePiece(piece)) {
      state.selectedSquare = sq;
      state.legalTargets = getPseudoLegalTargets(boardArr, sq);
      renderBoard();
    }
    return;
  }

  // Already have a selected piece
  if (sq === state.selectedSquare) {
    // Deselect
    state.selectedSquare = null;
    state.legalTargets = [];
    renderBoard();
    return;
  }

  if (piece && isWhitePiece(piece)) {
    // Re-select another white piece
    state.selectedSquare = sq;
    state.legalTargets = getPseudoLegalTargets(boardArr, sq);
    renderBoard();
    return;
  }

  // Attempt move
  const from = state.selectedSquare;
  state.selectedSquare = null;
  state.legalTargets = [];

  // Check promotion
  const movingPiece = boardArr[squareToIndex(from)];
  if (movingPiece === "P" && sq[1] === "8") {
    // Pawn promotion
    state.pendingPromo = { from, to: sq };
    dom.promoModal().classList.remove("hidden");
    return;
  }

  submitMove(from + sq);
}

// ─────────────────────────────────────────────────────────────────────────────
// API calls
// ─────────────────────────────────────────────────────────────────────────────

async function apiNewGame(playerName) {
  const res = await fetch("/api/game/new", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player_name: playerName }),
  });
  return res.json();
}

async function apiMove(gameId, uci) {
  const res = await fetch(`/api/game/${gameId}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ move: uci }),
  });
  return res.json();
}

async function apiArchive(gameId) {
  const res = await fetch(`/api/game/${gameId}/archive`, {
    method: "POST",
  });
  return res.json();
}

async function apiListArchived() {
  const res = await fetch("/api/games");
  return res.json();
}

async function apiLoadDuel(gameId) {
  const res = await fetch(`/api/game/${gameId}`);
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Move submission
// ─────────────────────────────────────────────────────────────────────────────

async function submitMove(uci) {
  setStatusMessage("⏳ The Dark Engine ponders…", "status-active");
  state.isWhiteTurn = false;

  const data = await apiMove(state.gameId, uci);

  if (data.error) {
    setStatusMessage("⚠ " + data.error, "status-check");
    state.isWhiteTurn = true;
    renderBoard();
    return;
  }

  // Update last-move highlights
  state.lastMoveFrom = uci.substring(0, 2);
  state.lastMoveTo   = uci.substring(2, 4);

  // Engine move highlight (overwrites last)
  if (data.engine_move) {
    state.lastMoveFrom = data.engine_move.uci.substring(0, 2);
    state.lastMoveTo   = data.engine_move.uci.substring(2, 4);
    dom.engineLastMove().textContent =
      `Last: ${data.engine_move.san} (${data.engine_move.uci})`;
  } else {
    dom.engineLastMove().textContent = "";
  }

  state.fen = data.fen;
  state.status = data.status;

  // Append to move log
  appendMoveLog(data);

  // Update captured pieces
  updateCaptured(data.fen);

  applyStatus(data.status);

  state.isWhiteTurn = (data.status === "active");
  renderBoard();
}

// ─────────────────────────────────────────────────────────────────────────────
// Status helpers
// ─────────────────────────────────────────────────────────────────────────────

function applyStatus(status) {
  if (!status || status === "active") {
    dom.status().classList.add("hidden");
    return;
  }

  let msg = "";
  let cls = "";

  if (status === "checkmate") {
    const loser = fenTurn(state.fen) === "w" ? "White" : "the Dark Engine";
    msg = `☠ Checkmate! ${loser} falls. The Duel is over.`;
    cls = "status-checkmate";
  } else if (status.startsWith("draw")) {
    msg = "⚖ The Realm falls silent. A draw is declared.";
    cls = "status-draw";
  } else {
    msg = status;
    cls = "status-active";
  }

  setStatusMessage(msg, cls);
  dom.duelControls().classList.remove("hidden");
}

function setStatusMessage(msg, cls) {
  const el = dom.status();
  el.className = "game-status " + cls;
  el.textContent = msg;
  el.classList.remove("hidden");
}

// ─────────────────────────────────────────────────────────────────────────────
// Move Log
// ─────────────────────────────────────────────────────────────────────────────

function appendMoveLog(data) {
  const humanSan  = data.human_move?.san  || "";
  const engineSan = data.engine_move?.san || "";

  const lastRow = state.moveLog[state.moveLog.length - 1];
  const moveNum = lastRow ? lastRow.num + 1 : 1;

  state.moveLog.push({ num: moveNum, white: humanSan, black: engineSan });
  renderMoveLog();
}

function renderMoveLog() {
  const log = dom.moveLog();
  log.innerHTML = "";
  for (const entry of state.moveLog) {
    const row = document.createElement("div");
    row.className = "move-log-row";
    row.innerHTML =
      `<span class="move-num">${entry.num}.</span>` +
      `<span class="move-white">${entry.white || ""}</span>` +
      `<span class="move-black">${entry.black || ""}</span>`;
    log.appendChild(row);
  }
  log.scrollTop = log.scrollHeight;
}

// ─────────────────────────────────────────────────────────────────────────────
// Captured pieces
// ─────────────────────────────────────────────────────────────────────────────

const STARTING_PIECES = "rnbqkbnrppppppppPPPPPPPPRNBQKBNR";

function updateCaptured(fen) {
  const boardArr = parseFen(fen);
  const onBoard = boardArr.filter(Boolean).join("");

  const startCount = {};
  for (const p of STARTING_PIECES) startCount[p] = (startCount[p] || 0) + 1;
  const boardCount = {};
  for (const p of onBoard) boardCount[p] = (boardCount[p] || 0) + 1;

  const capturedByWhite = []; // black pieces captured by white
  const capturedByBlack = []; // white pieces captured by black

  for (const [p, cnt] of Object.entries(startCount)) {
    const diff = cnt - (boardCount[p] || 0);
    for (let i = 0; i < diff; i++) {
      if (isBlackPiece(p)) capturedByWhite.push(PIECE_GLYPHS[p]);
      else capturedByBlack.push(PIECE_GLYPHS[p]);
    }
  }

  dom.capturedWhite().textContent = capturedByWhite.join(" ");
  dom.capturedBlack().textContent = capturedByBlack.join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Archive panel
// ─────────────────────────────────────────────────────────────────────────────

async function showArchive() {
  const list = dom.archiveList();
  list.innerHTML = "";
  list.classList.remove("hidden");

  const games = await apiListArchived();
  if (!games.length) {
    const li = document.createElement("li");
    li.textContent = "No archived duels yet.";
    list.appendChild(li);
    return;
  }
  for (const g of games) {
    const li = document.createElement("li");
    li.textContent = `#${g.id} – ${g.player_name} (${g.status}) ${g.updated_at.substring(0,10)}`;
    li.addEventListener("click", () => loadArchivedDuel(g.id));
    list.appendChild(li);
  }
}

async function loadArchivedDuel(gameId) {
  const data = await apiLoadDuel(gameId);
  if (data.error) { alert(data.error); return; }

  const g = data.game;
  state.gameId = g.id;
  state.fen    = g.fen;
  state.status = g.status;
  state.playerName = g.player_name;
  state.moveLog = [];
  state.lastMoveFrom = null;
  state.lastMoveTo = null;
  state.isWhiteTurn = false; // archived – read only

  // Rebuild move log
  const moves = data.moves;
  const pairs = {};
  for (const m of moves) {
    if (!pairs[m.move_number]) pairs[m.move_number] = {};
    pairs[m.move_number][m.player] = m.move_san;
  }
  for (const [num, pair] of Object.entries(pairs)) {
    state.moveLog.push({ num: parseInt(num), white: pair.white || "", black: pair.black || "" });
  }

  renderBoard();
  renderMoveLog();
  updateCaptured(state.fen);
  applyStatus(g.status);
  dom.duelControls().classList.add("hidden");
  setStatusMessage(`📜 Viewing archived duel #${gameId} (${g.player_name})`, "status-active");
}

// ─────────────────────────────────────────────────────────────────────────────
// Promotion
// ─────────────────────────────────────────────────────────────────────────────

function setupPromoModal() {
  document.querySelectorAll(".btn-promo").forEach((btn) => {
    btn.addEventListener("click", () => {
      const piece = btn.dataset.piece;
      dom.promoModal().classList.add("hidden");
      if (state.pendingPromo) {
        const { from, to } = state.pendingPromo;
        state.pendingPromo = null;
        submitMove(from + to + piece);
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Event wiring
// ─────────────────────────────────────────────────────────────────────────────

function wireUI() {
  document.getElementById("btnNewGame").addEventListener("click", async () => {
    const name = dom.playerName().value.trim() || "Wanderer";
    state.playerName = name;

    const data = await apiNewGame(name);
    state.gameId   = data.game_id;
    state.fen      = data.fen;
    state.status   = "active";
    state.moveLog  = [];
    state.selectedSquare = null;
    state.legalTargets   = [];
    state.lastMoveFrom   = null;
    state.lastMoveTo     = null;
    state.isWhiteTurn    = true;
    dom.engineLastMove().textContent = "";
    dom.capturedWhite().textContent  = "";
    dom.capturedBlack().textContent  = "";
    dom.status().classList.add("hidden");
    dom.duelControls().classList.remove("hidden");
    renderMoveLog();
    renderBoard();
  });

  document.getElementById("btnShowArchive").addEventListener("click", showArchive);

  document.getElementById("btnArchiveDuel").addEventListener("click", async () => {
    if (!state.gameId) return;
    await apiArchive(state.gameId);
    setStatusMessage("📜 Duel sent to the Archive.", "status-active");
    state.isWhiteTurn = false;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────────────────────

function init() {
  buildBoardLabels();
  setupPromoModal();
  wireUI();
}

document.addEventListener("DOMContentLoaded", init);
