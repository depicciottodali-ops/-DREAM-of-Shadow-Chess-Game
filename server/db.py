import sqlite3
from pathlib import Path
from flask import g

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "chess.db"
SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"


def get_db():
    if "db" not in g:
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        g.db = conn
    return g.db


def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = get_db()
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        db.executescript(f.read())

    game_columns = {row["name"] for row in db.execute("PRAGMA table_info(games)").fetchall()}
    if "mode" not in game_columns:
        db.execute("ALTER TABLE games ADD COLUMN mode TEXT NOT NULL DEFAULT 'player_vs_computer'")

    db.commit()


def init_app(app):
    app.teardown_appcontext(close_db)

    @app.cli.command("init-db")
    def init_db_command():
        init_db()
        print("Database initialized.")
