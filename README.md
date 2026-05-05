# DREAM of Shadow Chess Game

> *The board is a battlefield. The Realm is eternal. The Dark Engine never sleeps.*

**A Nordic gothic fantasy chess web game built with AI-assisted development using Python, Flask, SQLite, JavaScript, and python-chess. Step into the Realm — command the White army, face the Dark Engine, and forge your legend one Duel at a time.**

---

## Overview

**DREAM of Shadow Chess Game** is a browser-based, single-player dark fantasy chess game where you command the **White army** against a **computer-controlled Black army** powered by the *Dark Engine* AI. Built as a full-stack web project with a Python/Flask backend and a pure JavaScript/HTML/CSS frontend, the game runs entirely locally in your browser with no external services required.


---

## Game Concept
<img width="2634" height="1828" alt="draft 1 fantasy chess game," src="https://github.com/user-attachments/assets/86dd0645-2e22-4d3f-8cae-4bff64bffeda" />


Every game is a **Duel**. Every save is **Archived**. The board is **the Realm**.

| Term | Meaning |
|---|---|
| **Duel** | A chess match |
| **The Realm** | The chess board |
| **Archive** | Saved match storage |
| **The Dark Engine** | The computer AI opponent |
| **White Army** | The human player |
| **Black Army** | The computer opponent |

The Dark Engine is relentless. It hunts for captures first — if it can take one of your pieces, it will. If no capture is available, it chooses a random legal move. Simple, but dangerous.

The game uses **standard chess rules** enforced by the `python-chess` library on the server. Every move is validated server-side before it is applied. You always play as **White** and always move first.

---

## Visual Style

| Element | Details |
|---|---|
| **Theme** | Nordic gothic fantasy — dark stone, bronze trim, candlelit ambience |
| **Pieces** | Medieval crusader knight–inspired flat SVG silhouettes |
| **Board** | Two-tone dark squares with a bronze border ring |
| **Typography** | Cinzel / Georgia serif stack — small-caps headings, tracked labels |
| **Color palette** | See table below |
| **Icon style** | Flat, single-color — no gradients, no drop shadows, no glow |

### Color Palette

| Role | Hex |
|---|---|
| Background | `#0a0c0e` |
| Panel | `#12161a` |
| Bronze accent / borders | `#836c4f` |
| Primary text | `#e0d8c8` |
| Secondary text | `#aaa091` |
| Board dark square | `#2e383c` |
| Board light square | `#5c5950` |
| White army pieces | `#f0ece0` |
| Black army pieces | `#181818` |

### Piece Design Language
<img width="1865" height="1930" alt="draft 2 fantasy chess game," src="https://github.com/user-attachments/assets/a5b5c156-9b41-48dd-a83c-e6d001aca821" />


Each piece follows a consistent crusader silhouette template built with SVG `evenodd` fill rules to cut visor slits, cross emblems, and crown spikes directly into the shape:

| Piece | Design |
|---|---|
| **King** | Latin cross finial, bucket helm with T-visor, wide pauldrons, cross cutout on body |
| **Queen** | 5-spike crown, knight-like helm — visually distinct from King at a glance |
| **Bishop** | Tall pointed mitre with inner cross cutout, T-visor collar |
| **Knight** | Classic horse-head profile with crescent mane cutout and filled eye |
| **Rook** | 3-merlon battlement tower with cross cutout on face |
| **Pawn** | Smaller dome helmet, narrow pauldrons, cross on torso |

---

## Features

- ✅ Full legal-move chess rules via `python-chess`
- ✅ Player vs Computer — White (human) vs Black (Dark Engine)
- ✅ AI: capture-first, then random legal move
- ✅ Server-side move validation and turn enforcement
- ✅ Real-time AI status indicator (*Your Turn / Computer Thinking…*)
- ✅ Named match persistence — save and reload any number of Duels
- ✅ Move Chronicle — full move history per Duel
- ✅ Captured piece trophies for both sides
- ✅ Nordic gothic dark flat UI theme
- ✅ Unique SVG silhouettes for all 6 piece types
- ✅ Clear visual King vs Queen distinction
- ✅ Runtime photo-piece loader — PNGs in `assets/` are auto background-keyed and recolored
- ✅ SQLite persistence — no external database required
- ✅ Guest play — no account or login needed

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.10+, Flask 3.0 |
| **Chess engine** | python-chess |
| **Database** | SQLite (via Python `sqlite3`) |
| **Frontend** | Vanilla JavaScript (ES modules), HTML5, CSS3 |
| **Piece art** | Inline SVG, generated in `piece-art.js` |
| **Auth** | Optional JWT token auth (not required for guest play) |

---

## Project Structure

```
DREAM-of-Shadow-Chess-Game/
│
├── app.py                      # Flask application — routes and static file serving
├── requirements.txt            # Python dependencies (Flask, python-chess)
├── README.md                   # This file
├── .gitignore
│
├── server/
│   ├── __init__.py
│   ├── auth.py                 # JWT token helpers and password hashing
│   ├── db.py                   # SQLite connection, migration, and schema init
│   ├── game_service.py         # Chess logic, Dark Engine AI, game CRUD operations
│   └── schema.sql              # Database schema: users, games, moves
│
├── public/                     # Static front-end (served directly by Flask)
│   ├── index.html              # Single-page app shell
│   ├── css/
│   │   └── styles.css          # Full Nordic gothic fantasy theme
│   └── js/
│       ├── main.js             # App bootstrap and button wiring
│       ├── api.js              # REST API client (fetch wrapper)
│       ├── chess-ui.js         # Board rendering, click handling, game state
│       └── piece-art.js        # SVG icon generation + optional PNG asset loader
│
├── assets/                     # Optional user-supplied piece artwork
│   └── *.png                   # Auto-loaded, background-keyed, and recolored at runtime
│
├── pictures/                   # Reference designs, screenshots, drafts
│   ├── players design.png      # Full crusader piece set reference
│   └── ...
│
└── data/
    └── chess.db                # SQLite database — auto-created on first run
```

---

## Database Design

The database is created automatically at `data/chess.db` on first run using `server/schema.sql`.

### `users`
Stores local player profile information for optional authenticated play.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER | Primary key |
| `username` | TEXT | Unique |
| `password_hash` | TEXT | Bcrypt hash |
| `created_at` | TIMESTAMP | Auto |

### `games`
Stores each Duel — board state, status, archive flag, and metadata.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER | Primary key |
| `title` | TEXT | Match name |
| `fen` | TEXT | Current board position (FEN) |
| `turn` | TEXT | `white` or `black` |
| `status` | TEXT | `active`, `checkmate`, `draw`, etc. |
| `mode` | TEXT | `player_vs_computer` |
| `saved` | INTEGER | `1` = archived |
| `white_user_id` | INTEGER | FK → users |
| `black_user_id` | INTEGER | FK → users |
| `created_at` | TIMESTAMP | Auto |
| `updated_at` | TIMESTAMP | Auto |

### `moves`
Stores the full move history for every Duel.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER | Primary key |
| `game_id` | INTEGER | FK → games |
| `move_number` | INTEGER | Half-move (ply) count |
| `side` | TEXT | `white` or `black` |
| `uci` | TEXT | UCI format, e.g. `e2e4` |
| `san` | TEXT | SAN format, e.g. `e4` |
| `is_capture` | INTEGER | `1` if a piece was captured |
| `created_at` | TIMESTAMP | Auto |

---

## AI-Assisted Development Process

This project was built with AI assistance for brainstorming, UI design, database planning, SQL schema design, Python/Flask structure, chess logic integration, and documentation.

The AI-assisted workflow included:

- **Game concept design** — naming the lore terms (Duel, Realm, Archive, Dark Engine), defining the gothic fantasy visual direction
- **Backend architecture** — Flask route design, SQLite schema, python-chess integration
- **Dark Engine AI logic** — capture-first strategy with random fallback
- **Frontend UI** — gothic theme CSS, board rendering, click-to-move interaction
- **SVG piece art** — all 6 crusader silhouette icons designed and refined through iterative prompting
- **Photo-to-piece pipeline** — runtime background removal and recolor system for user-supplied PNG artwork
- **Documentation** — README structure, section content, and portfolio-ready wording

Every design decision was reviewed, directed, and tested by the project owner. The AI served as a fast implementation partner — the creative vision and requirements are entirely human-authored.

---

## How to Run Locally

### Prerequisites

- Python 3.10 or later — [python.org](https://www.python.org/downloads/)
- `pip` (bundled with Python)

### Setup
<img width="1506" height="1045" alt="draft 3 fantasy chess game," src="https://github.com/user-attachments/assets/c85ff9a1-ab9b-46d3-940a-f0e76f7e9093" />

```bash
# 1. Clone the repository
git clone https://github.com/your-username/DREAM-of-Shadow-Chess-Game.git
cd DREAM-of-Shadow-Chess-Game

# 2. Create and activate a virtual environment

# Windows PowerShell
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# macOS / Linux
python -m venv .venv
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the server
python app.py
```

### Open the Game

**[http://127.0.0.1:5000](http://127.0.0.1:5000)**

The SQLite database is created automatically at `data/chess.db` on first run. No configuration required.

---

## How to Play

| Step | Action |
|---|---|
| 1 | Click **New Duel** to start a match (optionally type a name first) |
| 2 | Click any **White piece** to select it — legal moves highlight |
| 3 | Click a **highlighted square** to move |
| 4 | The **Dark Engine** responds automatically for Black |
| 5 | Click **Archive Duel** to save your match |
| 6 | Select a saved match → click **Summon Archive** to reload it |
| 7 | Click **Reset the Realm** to restart the current board |

> You always play as **White**. The Dark Engine controls **Black** and moves immediately after your turn.

---

## API Routes

| Method | Route | Description |
|---|---|---|
| `GET` | `/` | Serve the game (index.html) |
| `GET` | `/assets/<filename>` | Serve user piece artwork |
| `POST` | `/api/auth/register` | Register a user account |
| `POST` | `/api/auth/login` | Login and receive a bearer token |
| `GET` | `/api/me` | Current authenticated user |
| `GET` | `/api/games` | List all recent/saved Duels |
| `POST` | `/api/games` | Create a new Duel |
| `GET` | `/api/games/<id>` | Load a Duel with full move history |
| `GET` | `/api/games/<id>/legal-moves?square=e2` | Legal moves for a selected square |
| `POST` | `/api/games/<id>/moves` | Submit a White move → triggers Black AI response |
| `POST` | `/api/games/<id>/save` | Archive / unsave a Duel |
| `POST` | `/api/games/<id>/restart` | Reset a Duel to starting position |

All game endpoints accept and return JSON.  
Move submission uses UCI notation (e.g. `{ "uci": "e2e4" }`).

---

## Future Improvements
<img width="1254" height="1254" alt="king" src="https://github.com/user-attachments/assets/ba39b03b-70b1-4d01-8ae9-e409d1e20dcf" /><img width="1254" height="1254" alt="queen" src="https://github.com/user-attachments/assets/d7142250-542f-4585-a359-f11e5a59b6f4" />



- [ ] AI difficulty levels — random → greedy material capture → minimax with alpha-beta pruning
- [ ] Player vs Player mode (same device, hot-seat)
- [ ] Online multiplayer via WebSocket
- [ ] Animated piece movement with smooth transitions
- [ ] Pawn promotion selection dialog
- [ ] Check / checkmate / stalemate visual and audio feedback
- [ ] Sound design — sword clashes, horn fanfares, ambient dungeon audio
- [ ] Mobile-responsive layout and touch controls
- [ ] Alternate color themes (light stone, blood crimson)
- [ ] ELO rating system with persistent leaderboard
- [ ] Export match as PGN file
- [ ] Piece hover tooltips with piece name and capture count
- [ ] Opening book display in the Move Chronicle

---

## Screenshots

| File | Contents |
|---|---|
| `pictures/players design.png` | Full crusader piece set reference (all 6 types) |
| `pictures/chess playes.png` | Alternative piece arrangement reference |
| `pictures/draft 1 fantasy chess game,.jpg` | Early UI wireframe |
| `pictures/draft 2 fantasy chess game,.jpg` | UI color study |
| `pictures/draft 3 fantasy chess game,.png` | Final layout draft |

> Drop screenshots of the live game into `pictures/` and link them here with Markdown image syntax once pushed to GitHub.

---

## Credits

| Role | Details |
|---|---|
| **Game design & concept** | Project owner |
| **AI development partner** | GitHub Copilot (Claude Sonnet) |
| **Piece artwork** | Custom AI-generated crusader chess icons (ChatGPT / DALL·E), refined and directed by project owner |
| **Chess rules engine** | [`python-chess`](https://python-chess.readthedocs.io/) by Niklas Fiekas — MIT License |
| **Web framework** | [`Flask`](https://flask.palletsprojects.com/) by Pallets Projects — BSD License |
| **Typography** | Cinzel (Google Fonts) — fallback: Georgia, serif |
| **SVG piece icons** | Original flat crusader silhouette designs for this project |

---

## Repository Description

> A Nordic gothic fantasy chess web game built with AI-assisted development — where the human commands the White army and the Dark Engine never rests. Powered by Python, Flask, SQLite, python-chess, and vanilla JavaScript.

---

*"The board is set. The shadows gather. Make your move."*

---

## Game Concept

**DREAM of Shadow Chess Game** is a single-player dark fantasy chess experience where the human player commands the **White army** against a **computer-controlled Black army**. Every match is called a *Duel*. Victories are stored in the *Archive*. The battlefield is ruled by the *Dark Engine* — an AI opponent that hunts aggressively, always seeking to capture before it maneuvers.

The game is built on standard chess rules (powered by the `python-chess` engine) while wrapping every interaction in gothic fantasy language: matches are *Duels*, saves are *Archived*, the board is *the Realm*, and the AI is *the Dark Engine*.

---

## Visual Style
<img width="1448" height="1086" alt="players design" src="https://github.com/user-attachments/assets/7e329c25-745e-4f20-875c-747638bc41fb" />


| Element | Description |
|---|---|
| **Theme** | Nordic gothic fantasy — dark stone, bronze trim, candlelit ambience |
| **Pieces** | Medieval crusader knight–inspired silhouette icons. Each piece is a flat vector shape with SVG `evenodd` fill rules cutting visor slits, cross emblems, and crown spikes directly into the silhouette |
| **Board** | Two-tone dark squares (`#2e383c` slate / `#5c5950` stone), bronze border ring |
| **Typography** | Cinzel / Georgia serif stack — small-caps panel headings, tracking-widened labels |
| **Color palette** | Near-black background `#0a0c0e`, dark panel `#12161a`, bronze accent `#836c4f`, cream text `#e0d8c8` |
| **Piece colors** | White army: warm ivory `#f0ece0` · Black army: near-black `#181818` |
| **Icon design** | Flat, single-color silhouettes — no gradients, no drop shadows on pieces |

Piece designs follow a consistent crusader template:

- **King** — Latin cross finial, bucket helm with T-visor, wide pauldrons, cross cutout on body
- **Queen** — 5-spike crown, same helm and body as King — visually distinct at a glance
- **Bishop** — Tall pointed mitre with inner cross cutout, T-visor collar
- **Knight** — Classic horse-head profile with crescent mane cutout and filled eye
- **Rook** — 3-merlon battlement tower with cross cutout on face
- **Pawn** — Smaller dome helmet, narrow pauldrons, cross on torso

Custom user-provided art can be dropped into `assets/` and is automatically loaded, background-keyed, recolored to white/black, and rendered on the board at runtime.

---

## Installation

### Prerequisites

- Python 3.10 or later — [python.org](https://www.python.org/downloads/)
- `pip` (included with Python)

### Steps

```bash
# 1. Clone or download the repository
git clone https://github.com/your-username/fantasy-chess-web.git
cd fantasy-chess-web

# 2. (Recommended) Create a virtual environment

# Windows PowerShell
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# macOS / Linux
python -m venv .venv
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt
```

---

## Running the Game Locally

```bash
python app.py
```

Open your browser and navigate to:

**[http://127.0.0.1:5000](http://127.0.0.1:5000)**

The server runs on port **5000** by default. No additional configuration is required.  
The SQLite database is created automatically at `data/chess.db` on first run.

---

## Project Structure

```
fantasy-chess-web/
│
├── app.py                      # Flask application — routes & static file serving
├── requirements.txt            # Python dependencies (Flask, python-chess)
├── README.md
│
├── server/
│   ├── auth.py                 # JWT-based authentication helpers
│   ├── db.py                   # SQLite connection & migration helpers
│   ├── game_service.py         # Chess logic, AI move generation, game CRUD
│   └── schema.sql              # Database schema (games, moves, users)
│
├── public/                     # Static front-end (served by Flask)
│   ├── index.html              # Single-page app shell
│   ├── css/
│   │   └── styles.css          # Full dark gothic theme
│   └── js/
│       ├── main.js             # App bootstrap, button wiring
│       ├── chess-ui.js         # Board rendering, click handling, game state
│       ├── api.js              # REST API client
│       └── piece-art.js        # SVG icon generation + photo asset runtime loader
│
├── assets/                     # User-supplied piece artwork (PNG/JPG)
│   └── *.png                   # Auto-loaded, background-keyed & recolored at runtime
│
├── pictures/                   # Reference designs, drafts, screenshots
│
└── data/
    └── chess.db                # SQLite database (auto-created on first run)
```

---

## Game Controls

| Action | How |
|---|---|
| **Start a new game** | Type a match name (or keep the default) → click **New Duel** |
| **Select a piece** | Click any White piece on the board |
| **Move a piece** | Click a highlighted destination square |
| **Save a match** | Click **Archive Duel** |
| **Load a saved match** | Click a match in the *Saved Matches* panel → click **Summon Archive** |
| **Restart the board** | Click **Reset the Realm** |
| **AI turn** | Triggers automatically after every White move — watch the *AI Status* indicator |

> You always play as **White**. The Dark Engine controls **Black**.

---

## Current Features

- ✅ Full legal-move chess rules via `python-chess`
- ✅ Player vs Computer mode — White (human) vs Black (AI)
- ✅ AI strategy: capture-first, otherwise random legal move
- ✅ Move validation and turn enforcement server-side
- ✅ Real-time AI status indicator (*Your Turn / Computer Thinking…*)
- ✅ Match persistence — save and reload any number of named duels
- ✅ Move Chronicle — full move history per match
- ✅ Captured piece trophies for both sides
- ✅ Nordic gothic dark flat UI theme
- ✅ Crusader-knight SVG piece icons — unique silhouettes for all 6 piece types
- ✅ Clear visual distinction between King (cross finial) and Queen (5-spike crown)
- ✅ Runtime photo-piece loader — PNGs in `assets/` are auto background-keyed and recolored
- ✅ SQLite persistence (no external database required)
- ✅ Guest play — no account needed

---

## Planned Features

- [ ] Difficulty levels for the AI (random → greedy material → minimax with alpha-beta pruning)
- [ ] Player vs Player mode on the same device
- [ ] Online multiplayer via WebSocket
- [ ] Animated piece movement with smooth transitions
- [ ] Pawn promotion selection dialog
- [ ] Check / checkmate / stalemate visual and audio cues
- [ ] Sound design — sword clashes, horn fanfares, dungeon ambience
- [ ] Mobile-responsive layout
- [ ] Alternate color themes (light stone, blood red)
- [ ] ELO rating system with match history leaderboard
- [ ] Export match as PGN file
- [ ] Piece hover tooltips with piece name and capture count

---

## Screenshots & Assets

Place reference art, screenshots, and draft designs in the `pictures/` folder.  
Custom piece artwork belongs in `assets/` — any PNG placed there is automatically loaded, background-removed, and recolored for both White and Black variants at runtime.

| File | Contents |
|---|---|
| `pictures/players design.png` | Full crusader piece set reference (all 6 types) |
| `pictures/chess playes.png` | Alternative piece arrangement reference |
| `pictures/draft 1 fantasy chess game,.jpg` | Early UI wireframe |
| `pictures/draft 2 fantasy chess game,.jpg` | UI color study |
| `pictures/draft 3 fantasy chess game,.png` | Final layout draft |
| `assets/*.png` | Active per-piece artwork rendered on the game board |

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | Login and receive a bearer token |
| `GET` | `/api/me` | Get current authenticated user |
| `GET` | `/api/games` | List all recent matches |
| `POST` | `/api/games` | Create a new match |
| `GET` | `/api/games/:id` | Fetch a match with full move history |
| `GET` | `/api/games/:id/legal-moves?square=e2` | Get legal moves for a square |
| `POST` | `/api/games/:id/moves` | Submit a move (UCI format, e.g. `e2e4`) |
| `POST` | `/api/games/:id/save` | Archive / unsave a match |
| `POST` | `/api/games/:id/restart` | Reset the match to starting position |

---

## Credits

| Role | Details |
|---|---|
| **Game design & concept** | Project owner |
| **Piece artwork** | Custom AI-generated crusader chess icons (ChatGPT / DALL·E) |
| **Chess rules engine** | [`python-chess`](https://python-chess.readthedocs.io/) by Niklas Fiekas |
| **Web framework** | [`Flask`](https://flask.palletsprojects.com/) by Pallets Projects |
| **Typography** | Cinzel (Google Fonts) — fallback: Georgia, serif |
| **Icon style** | Flat SVG crusader silhouettes — original design for this project |

---

*"The board is set. The shadows gather. Make your move."*
<img width="2018" height="1914" alt="Game D esign" src="https://github.com/user-attachments/assets/52278644-0846-4e45-b760-4531cc6a8858" />


