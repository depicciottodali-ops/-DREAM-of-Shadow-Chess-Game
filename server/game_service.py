import chess
import random
from flask import g
from .db import get_db


def _row_to_dict(row):
    return dict(row) if row is not None else None


def _get_game(game_id):
    db = get_db()
    row = db.execute("SELECT * FROM games WHERE id = ?", (game_id,)).fetchone()
    return _row_to_dict(row)


def _get_moves(game_id):
    db = get_db()
    rows = db.execute(
        "SELECT id, ply, move_number, san, uci, captured_piece, created_at FROM moves WHERE game_id = ? ORDER BY ply ASC",
        (game_id,),
    ).fetchall()
    return [dict(r) for r in rows]


def _derive_status(board):
    if board.is_checkmate():
        winner = "black" if board.turn == chess.WHITE else "white"
        return "checkmate", winner
    if board.is_stalemate() or board.is_insufficient_material() or board.is_fifty_moves() or board.is_repetition(3):
        return "draw", "draw"
    if board.is_check():
        return "check", None
    return "active", None


def _choose_computer_move(board):
    legal_moves = list(board.legal_moves)
    if not legal_moves:
        return None

    capture_moves = [move for move in legal_moves if board.is_capture(move)]
    return random.choice(capture_moves if capture_moves else legal_moves)


def _record_move(db, game_id, board, move):
    fen_before = board.fen()
    captured_piece = board.piece_at(move.to_square)
    # En passant captures a pawn on a different square than the destination.
    if captured_piece is None and board.is_en_passant(move):
        offset = -8 if board.turn == chess.WHITE else 8
        captured_piece = board.piece_at(move.to_square + offset)
    captured_symbol = captured_piece.symbol() if captured_piece else None
    san = board.san(move)
    board.push(move)
    fen_after = board.fen()

    ply = len(board.move_stack)
    move_number = (ply + 1) // 2

    db.execute(
        """
        INSERT INTO moves (game_id, ply, move_number, san, uci, fen_before, fen_after, captured_piece)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (game_id, ply, move_number, san, move.uci(), fen_before, fen_after, captured_symbol),
    )


def create_game(title="Arcane Match", white_user_id=None, black_user_id=None, mode="player_vs_computer"):
    db = get_db()
    board = chess.Board()
    cur = db.execute(
        """
        INSERT INTO games (white_user_id, black_user_id, mode, title, status, result, current_fen, turn)
        VALUES (?, ?, ?, ?, 'active', NULL, ?, 'white')
        """,
        (white_user_id, black_user_id, mode, title, board.fen()),
    )
    db.commit()
    return get_game(cur.lastrowid)


def get_game(game_id):
    game = _get_game(game_id)
    if not game:
        return None

    board = chess.Board(game["current_fen"])
    status, result = _derive_status(board)

    # Keep status synchronized in case data was imported manually.
    if game["status"] != status or game["result"] != result:
        db = get_db()
        db.execute(
            "UPDATE games SET status = ?, result = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (status, result, game_id),
        )
        db.commit()
        game = _get_game(game_id)

    moves = _get_moves(game_id)
    return {
        "game": game,
        "moves": moves,
    }


def list_games(current_user_id=None, limit=20):
    db = get_db()
    if current_user_id:
        rows = db.execute(
            """
            SELECT *
            FROM games
            WHERE white_user_id = ? OR black_user_id = ?
            ORDER BY updated_at DESC
            LIMIT ?
            """,
            (current_user_id, current_user_id, limit),
        ).fetchall()
    else:
        rows = db.execute(
            "SELECT * FROM games ORDER BY updated_at DESC LIMIT ?",
            (limit,),
        ).fetchall()

    return [dict(r) for r in rows]


def get_legal_moves_for_square(game_id, square_name):
    game = _get_game(game_id)
    if not game:
        return None

    board = chess.Board(game["current_fen"])
    try:
        sq = chess.parse_square(square_name.lower())
    except ValueError:
        return []

    legal = [m.uci() for m in board.legal_moves if m.from_square == sq]
    return legal


def apply_move(game_id, uci_move):
    game = _get_game(game_id)
    if not game:
        return {"error": "Game not found."}, 404

    board = chess.Board(game["current_fen"])
    mode = game.get("mode") or "player_vs_computer"

    if mode == "player_vs_computer" and board.turn == chess.BLACK:
        return {"error": "Black is controlled by the computer."}, 400

    try:
        move = chess.Move.from_uci(uci_move)
    except ValueError:
        return {"error": "Invalid move format."}, 400

    if move not in board.legal_moves:
        return {"error": "Illegal move."}, 400

    db = get_db()

    _record_move(db, game_id, board, move)
    status, result = _derive_status(board)

    if mode == "player_vs_computer" and board.turn == chess.BLACK and status in {"active", "check"}:
        computer_move = _choose_computer_move(board)
        if computer_move is not None:
            _record_move(db, game_id, board, computer_move)
            status, result = _derive_status(board)

    fen_after = board.fen()
    turn = "white" if board.turn == chess.WHITE else "black"

    db.execute(
        """
        UPDATE games
        SET current_fen = ?,
            turn = ?,
            status = ?,
            result = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (fen_after, turn, status, result, game_id),
    )

    db.commit()
    return get_game(game_id), 200


def set_game_saved(game_id, saved=True):
    db = get_db()
    db.execute(
        "UPDATE games SET is_saved = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (1 if saved else 0, game_id),
    )
    db.commit()
    return get_game(game_id)


def restart_game(game_id):
    game = _get_game(game_id)
    if not game:
        return None

    db = get_db()
    board = chess.Board()

    db.execute("DELETE FROM moves WHERE game_id = ?", (game_id,))
    db.execute(
        """
        UPDATE games
        SET current_fen = ?,
            turn = 'white',
            status = 'active',
            result = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (board.fen(), game_id),
    )
    db.commit()

    return get_game(game_id)
