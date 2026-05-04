"""
app.py – DREAM of Shadow Chess Game
Flask application entry point.

Run with:  python app.py
Serves at: http://127.0.0.1:5000
"""

import os
import chess

from flask import Flask, jsonify, request, send_from_directory

from server.database import (
    init_db,
    create_game,
    get_game,
    list_games,
    update_game_fen,
    archive_game,
    save_move,
    get_moves,
)
from server.chess_engine import dark_engine_move

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

BASE_DIR = os.path.dirname(__file__)
PUBLIC_DIR = os.path.join(BASE_DIR, "public")

app = Flask(__name__, static_folder=PUBLIC_DIR, static_url_path="")

# ---------------------------------------------------------------------------
# Initialise database on startup
# ---------------------------------------------------------------------------

init_db()

# ---------------------------------------------------------------------------
# Frontend
# ---------------------------------------------------------------------------


@app.route("/")
def index():
    return send_from_directory(PUBLIC_DIR, "index.html")


# ---------------------------------------------------------------------------
# API – Duels (games)
# ---------------------------------------------------------------------------


@app.route("/api/game/new", methods=["POST"])
def new_game():
    """Create a new Duel and return its id + starting FEN."""
    data = request.get_json(silent=True) or {}
    player_name = data.get("player_name", "Wanderer")

    board = chess.Board()
    fen = board.fen()
    game_id = create_game(player_name, fen)

    return jsonify({"game_id": game_id, "fen": fen, "player_name": player_name}), 201


@app.route("/api/games", methods=["GET"])
def list_duels():
    """List all archived Duels."""
    games = list_games(archived=True)
    return jsonify(games)


@app.route("/api/games/active", methods=["GET"])
def list_active_duels():
    """List all active (non-archived) Duels."""
    games = list_games(archived=False)
    return jsonify(games)


@app.route("/api/game/<int:game_id>", methods=["GET"])
def load_duel(game_id: int):
    """Load a specific Duel by id, including its move history."""
    game = get_game(game_id)
    if not game:
        return jsonify({"error": "Duel not found"}), 404

    moves = get_moves(game_id)
    return jsonify({"game": game, "moves": moves})


@app.route("/api/game/<int:game_id>/move", methods=["POST"])
def make_move(game_id: int):
    """
    Accept the human (White) move, validate it, apply it, then let the
    Dark Engine (Black) respond.

    Request JSON: { "move": "<uci string, e.g. e2e4>" }
    """
    game = get_game(game_id)
    if not game:
        return jsonify({"error": "Duel not found"}), 404
    if game["status"] != "active":
        return jsonify({"error": "Duel is already over"}), 400

    data = request.get_json(silent=True) or {}
    uci_str = data.get("move", "").strip()
    if not uci_str:
        return jsonify({"error": "No move provided"}), 400

    board = chess.Board(game["fen"])

    # --- Validate and apply human move ---
    try:
        human_move = chess.Move.from_uci(uci_str)
    except ValueError:
        return jsonify({"error": "Invalid UCI move format"}), 400

    if human_move not in board.legal_moves:
        return jsonify({"error": "Illegal move"}), 400

    move_number = len(get_moves(game_id)) + 1
    human_san = board.san(human_move)
    board.push(human_move)
    human_fen = board.fen()

    save_move(game_id, move_number, "white", uci_str, human_san, human_fen)

    # Determine game status after human move
    status = _board_status(board)
    engine_move_info = None

    if status == "active":
        # --- Dark Engine responds ---
        engine_move = dark_engine_move(board)
        if engine_move:
            engine_san = board.san(engine_move)
            board.push(engine_move)
            engine_fen = board.fen()

            save_move(game_id, move_number, "black", engine_move.uci(), engine_san, engine_fen)
            status = _board_status(board)

            engine_move_info = {
                "uci": engine_move.uci(),
                "san": engine_san,
                "fen": engine_fen,
            }

    update_game_fen(game_id, board.fen(), status)

    return jsonify(
        {
            "human_move": {"uci": uci_str, "san": human_san, "fen": human_fen},
            "engine_move": engine_move_info,
            "fen": board.fen(),
            "status": status,
        }
    )


@app.route("/api/game/<int:game_id>/archive", methods=["POST"])
def archive_duel(game_id: int):
    """Move a Duel to the Archive."""
    game = get_game(game_id)
    if not game:
        return jsonify({"error": "Duel not found"}), 404

    archive_game(game_id)
    return jsonify({"message": "Duel archived", "game_id": game_id})


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _board_status(board: chess.Board) -> str:
    """Translate python-chess board state to a simple status string."""
    if board.is_checkmate():
        return "checkmate"
    if board.is_stalemate():
        return "stalemate"
    if board.is_insufficient_material():
        return "draw_insufficient"
    if board.is_seventyfive_moves():
        return "draw_75moves"
    if board.is_fivefold_repetition():
        return "draw_repetition"
    return "active"


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
