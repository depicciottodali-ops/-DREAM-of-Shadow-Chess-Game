# DREAM of Shadow Chess Game

> *"Step onto the Realm, Wanderer. The Dark Engine awaits."*

A **Nordic gothic fantasy chess web game** built with Python, Flask, SQLite, JavaScript, HTML, CSS, and python-chess.

The human player commands the **White** army. The computer-controlled **Black** army is called the **Dark Engine**. Each match is a **Duel**, saved games are stored in the **Archive**, and the board is the **Realm**.

---

## ✨ Features

- **Interactive chess board** rendered entirely in the browser with Unicode glyphs
- **Dark Engine AI** – prefers capture moves; otherwise chooses a random legal move
- **Legal-move highlighting** on piece selection
- **Pawn promotion** dialog
- **Captured piece tracking** for both sides
- **Move chronicle** (SAN notation) displayed in the sidebar
- **Archive** – completed or abandoned Duels are preserved in SQLite and can be replayed
- **Nordic gothic UI** – dark void palette, gold accents, serif headings

---

## 🛠 Technology Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Python 3.10+, Flask 2.3+            |
| Chess logic| python-chess                        |
| Database   | SQLite (via Python's `sqlite3`)     |
| Frontend   | Vanilla JavaScript (ES2020), HTML5  |
| Styling    | CSS3 (Custom Properties, CSS Grid)  |

---

## 🚀 Quick Start

### 1 – Clone the repository

```bash
git clone https://github.com/depicciottodali-ops/-DREAM-of-Shadow-Chess-Game.git
cd -DREAM-of-Shadow-Chess-Game
```

### 2 – Create and activate a virtual environment *(recommended)*

```bash
python -m venv venv
# macOS / Linux
source venv/bin/activate
# Windows
venv\Scripts\activate
```

### 3 – Install dependencies

```bash
pip install -r requirements.txt
```

### 4 – Run the application

```bash
python app.py
```

Open your browser at **http://127.0.0.1:5000**

---

## 📁 Project Structure

```
DREAM-of-Shadow-Chess-Game/
│
├── app.py                  # Flask application & API routes
├── requirements.txt        # Python dependencies
├── README.md
├── .gitignore
│
├── server/
│   ├── __init__.py
│   ├── database.py         # SQLite persistence layer
│   └── chess_engine.py     # Dark Engine AI logic
│
├── public/                 # Static frontend files served by Flask
│   ├── index.html          # Single-page game UI
│   ├── css/
│   │   └── style.css       # Nordic gothic theme
│   └── js/
│       └── game.js         # Board rendering & move handling
│
├── assets/
│   └── pictures/           # Image assets (future use)
│
└── data/
    └── shadow_chess.db     # SQLite database (auto-created on first run)
```

---

## 🗄 Database Design

The database (`data/shadow_chess.db`) is created automatically on first run.

### `users` table
Stub table for future authentication.

| Column       | Type    | Notes                    |
|--------------|---------|--------------------------|
| `id`         | INTEGER | Primary key              |
| `username`   | TEXT    | Unique                   |
| `created_at` | TEXT    | ISO-8601 datetime        |

### `games` table
One row per Duel.

| Column        | Type    | Notes                                          |
|---------------|---------|------------------------------------------------|
| `id`          | INTEGER | Primary key                                    |
| `player_name` | TEXT    | Human player's chosen name                     |
| `fen`         | TEXT    | Current board state (FEN string)               |
| `status`      | TEXT    | `active`, `checkmate`, `stalemate`, `draw_*`   |
| `archived`    | INTEGER | `0` = active, `1` = in the Archive             |
| `created_at`  | TEXT    | ISO-8601 datetime                              |
| `updated_at`  | TEXT    | ISO-8601 datetime                              |

### `moves` table
Every half-move (ply) belonging to a Duel.

| Column       | Type    | Notes                              |
|--------------|---------|------------------------------------|
| `id`         | INTEGER | Primary key                        |
| `game_id`    | INTEGER | FK → `games.id`                    |
| `move_number`| INTEGER | Sequential ply number              |
| `player`     | TEXT    | `white` or `black`                 |
| `move_uci`   | TEXT    | UCI notation (e.g. `e2e4`)         |
| `move_san`   | TEXT    | SAN notation (e.g. `e4`)           |
| `fen_after`  | TEXT    | Board state after the move         |
| `created_at` | TEXT    | ISO-8601 datetime                  |

---

## 🌐 API Routes

| Method | Endpoint                          | Description                          |
|--------|-----------------------------------|--------------------------------------|
| POST   | `/api/game/new`                   | Create a new Duel                    |
| GET    | `/api/games`                      | List all archived Duels              |
| GET    | `/api/games/active`               | List all active Duels                |
| GET    | `/api/game/<id>`                  | Load a specific Duel + move history  |
| POST   | `/api/game/<id>/move`             | Submit human move; engine responds   |
| POST   | `/api/game/<id>/archive`          | Send a Duel to the Archive           |

### Example: Create a new Duel

```bash
curl -X POST http://127.0.0.1:5000/api/game/new \
     -H "Content-Type: application/json" \
     -d '{"player_name": "Sigrid"}'
```

```json
{"game_id": 1, "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "player_name": "Sigrid"}
```

### Example: Make a move

```bash
curl -X POST http://127.0.0.1:5000/api/game/1/move \
     -H "Content-Type: application/json" \
     -d '{"move": "e2e4"}'
```

---

## 🤖 Dark Engine AI

The Dark Engine uses a simple priority strategy implemented in `server/chess_engine.py`:

1. **Capture preference** – all legal capture moves are collected; one is chosen at random.
2. **Random fallback** – if no captures are available, a random legal move is selected.

This is intentionally kept lightweight and beatable. Future improvements could include minimax with alpha-beta pruning, opening book lookup, or Stockfish integration.

---

## 🧠 AI-Assisted Development

> *"This project was built with AI assistance for brainstorming, UI design, database planning, SQL schema design, Python/Flask structure, chess logic integration, and documentation."*

AI assistance was used throughout the development lifecycle:

- **Brainstorming** – game concept, thematic naming (Realm, Dark Engine, Duel, Archive)
- **UI/UX design** – colour palette, layout decisions, CSS custom properties
- **Database planning** – schema design for `users`, `games`, and `moves` tables
- **Python/Flask structure** – application factory pattern, route design, error handling
- **Chess logic** – integration of python-chess for FEN parsing and move validation
- **Frontend logic** – FEN parser in JavaScript, pseudo-legal move highlighting
- **Documentation** – README structure, API reference table, setup instructions

---

## 🔮 Future Improvements

- [ ] User authentication (the `users` table is already scaffolded)
- [ ] Stronger Dark Engine using minimax / alpha-beta pruning
- [ ] Opening book integration
- [ ] Animated piece movement
- [ ] Sound effects (sword clash on capture, ambience)
- [ ] Mobile-first responsive redesign
- [ ] Draw offer & resignation buttons
- [ ] Stockfish integration as optional engine backend
- [ ] Multiplayer (two humans, real-time via WebSockets)
- [ ] Custom Nordic-illustrated piece set

---

## 📄 License

This project is released for educational and personal use.
