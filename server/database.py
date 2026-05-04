"""
database.py – SQLite persistence layer for DREAM of Shadow Chess Game.

Tables:
  users  – registered players (stub for future auth)
  games  – one row per Duel
  moves  – every half-move (ply) belonging to a Duel
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "shadow_chess.db")


def get_connection():
    """Return a sqlite3 connection with row_factory set to Row."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """Create all tables if they do not already exist."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_connection()
    with conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                username    TEXT    NOT NULL UNIQUE,
                created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS games (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                player_name TEXT    NOT NULL DEFAULT 'Wanderer',
                fen         TEXT    NOT NULL,
                status      TEXT    NOT NULL DEFAULT 'active',
                archived    INTEGER NOT NULL DEFAULT 0,
                created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
                updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS moves (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id     INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
                move_number INTEGER NOT NULL,
                player      TEXT    NOT NULL,
                move_uci    TEXT    NOT NULL,
                move_san    TEXT    NOT NULL,
                fen_after   TEXT    NOT NULL,
                created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
            );
        """)
    conn.close()


# ---------------------------------------------------------------------------
# Game helpers
# ---------------------------------------------------------------------------

def create_game(player_name: str, fen: str) -> int:
    conn = get_connection()
    with conn:
        cur = conn.execute(
            "INSERT INTO games (player_name, fen, status) VALUES (?, ?, 'active')",
            (player_name, fen),
        )
        game_id = cur.lastrowid
    conn.close()
    return game_id


def get_game(game_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM games WHERE id = ?", (game_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def list_games(archived: bool = False):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM games WHERE archived = ? ORDER BY updated_at DESC",
        (1 if archived else 0,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def update_game_fen(game_id: int, fen: str, status: str = "active"):
    conn = get_connection()
    with conn:
        conn.execute(
            "UPDATE games SET fen = ?, status = ?, updated_at = datetime('now') WHERE id = ?",
            (fen, status, game_id),
        )
    conn.close()


def archive_game(game_id: int):
    conn = get_connection()
    with conn:
        conn.execute(
            "UPDATE games SET archived = 1, updated_at = datetime('now') WHERE id = ?",
            (game_id,),
        )
    conn.close()


# ---------------------------------------------------------------------------
# Move helpers
# ---------------------------------------------------------------------------

def save_move(game_id: int, move_number: int, player: str, move_uci: str, move_san: str, fen_after: str):
    conn = get_connection()
    with conn:
        conn.execute(
            """INSERT INTO moves (game_id, move_number, player, move_uci, move_san, fen_after)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (game_id, move_number, player, move_uci, move_san, fen_after),
        )
    conn.close()


def get_moves(game_id: int):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM moves WHERE game_id = ? ORDER BY move_number, id",
        (game_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
