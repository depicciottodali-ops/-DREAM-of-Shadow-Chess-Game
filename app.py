from pathlib import Path
from flask import Flask, jsonify, request, send_from_directory, g

from server.auth import (
    create_token,
    hash_password,
    login_required,
    optional_auth,
    verify_password,
)
from server.db import get_db, init_app as init_db_app, init_db
from server.game_service import (
    apply_move,
    create_game,
    get_game,
    get_legal_moves_for_square,
    list_games,
    restart_game,
    set_game_saved,
)

BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"
ASSETS_DIR = BASE_DIR / "assets"


def create_app():
    app = Flask(__name__, static_folder=str(PUBLIC_DIR), static_url_path="")
    app.config["SECRET_KEY"] = "replace-this-in-production"

    init_db_app(app)

    with app.app_context():
        init_db()

    @app.before_request
    def attach_optional_user():
        optional_auth()

    @app.get("/")
    def index():
        return send_from_directory(PUBLIC_DIR, "index.html")

    @app.get("/assets/<path:filename>")
    def assets(filename):
        return send_from_directory(ASSETS_DIR, filename)

    @app.post("/api/auth/register")
    def register():
        data = request.get_json(silent=True) or {}
        username = (data.get("username") or "").strip()
        password = data.get("password") or ""

        if len(username) < 3:
            return jsonify({"error": "Username must be at least 3 characters."}), 400
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters."}), 400

        db = get_db()
        exists = db.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
        if exists:
            return jsonify({"error": "Username already exists."}), 409

        cur = db.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            (username, hash_password(password)),
        )
        db.commit()

        token = create_token(cur.lastrowid, username)
        return jsonify({"token": token, "user": {"id": cur.lastrowid, "username": username}})

    @app.post("/api/auth/login")
    def login():
        data = request.get_json(silent=True) or {}
        username = (data.get("username") or "").strip()
        password = data.get("password") or ""

        db = get_db()
        user = db.execute(
            "SELECT id, username, password_hash FROM users WHERE username = ?",
            (username,),
        ).fetchone()
        if not user or not verify_password(user["password_hash"], password):
            return jsonify({"error": "Invalid credentials."}), 401

        token = create_token(user["id"], user["username"])
        return jsonify({"token": token, "user": {"id": user["id"], "username": user["username"]}})

    @app.get("/api/me")
    @login_required
    def me():
        return jsonify(g.current_user)

    @app.get("/api/games")
    def get_games():
        mine = request.args.get("mine") == "1"
        user_id = g.current_user["user_id"] if mine and g.current_user else None
        items = list_games(current_user_id=user_id)
        return jsonify({"games": items})

    @app.post("/api/games")
    def post_game():
        data = request.get_json(silent=True) or {}
        title = (data.get("title") or "Arcane Match").strip()[:60] or "Arcane Match"
        mode = (data.get("mode") or "player_vs_computer").strip().lower()
        if mode not in {"player_vs_computer", "player_vs_player"}:
            return jsonify({"error": "Invalid mode."}), 400

        white_user_id = None
        black_user_id = None

        if g.current_user:
            white_user_id = g.current_user["user_id"]

        payload = create_game(title=title, white_user_id=white_user_id, black_user_id=black_user_id, mode=mode)
        return jsonify(payload), 201

    @app.get("/api/games/<int:game_id>")
    def get_game_by_id(game_id):
        payload = get_game(game_id)
        if not payload:
            return jsonify({"error": "Game not found."}), 404
        return jsonify(payload)

    @app.get("/api/games/<int:game_id>/legal-moves")
    def get_legal_moves(game_id):
        square = (request.args.get("square") or "").strip().lower()
        if not square:
            return jsonify({"error": "square is required"}), 400

        legal = get_legal_moves_for_square(game_id, square)
        if legal is None:
            return jsonify({"error": "Game not found."}), 404
        return jsonify({"square": square, "moves": legal})

    @app.post("/api/games/<int:game_id>/moves")
    def post_move(game_id):
        data = request.get_json(silent=True) or {}
        uci_move = (data.get("uci") or "").strip().lower()
        if not uci_move:
            return jsonify({"error": "uci is required"}), 400

        payload, status = apply_move(game_id, uci_move)
        return jsonify(payload), status

    @app.post("/api/games/<int:game_id>/save")
    def save_game(game_id):
        data = request.get_json(silent=True) or {}
        saved = bool(data.get("saved", True))
        payload = set_game_saved(game_id, saved=saved)
        if not payload:
            return jsonify({"error": "Game not found."}), 404
        return jsonify(payload)

    @app.post("/api/games/<int:game_id>/restart")
    def post_restart(game_id):
        payload = restart_game(game_id)
        if not payload:
            return jsonify({"error": "Game not found."}), 404
        return jsonify(payload)

    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"error": "Not found"}), 404

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
