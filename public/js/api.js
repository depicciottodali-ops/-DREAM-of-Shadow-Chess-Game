const TOKEN_KEY = "arcane_chess_token";

export class ApiClient {
  constructor(baseUrl = "") {
    this.baseUrl = baseUrl;
  }

  get token() {
    return localStorage.getItem(TOKEN_KEY);
  }

  set token(value) {
    if (value) {
      localStorage.setItem(TOKEN_KEY, value);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  async request(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }
    return data;
  }

  register(username, password) {
    return this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  login(username, password) {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  me() {
    return this.request("/api/me");
  }

  createGame(title, mode = "player_vs_computer") {
    return this.request("/api/games", {
      method: "POST",
      body: JSON.stringify({ title, mode }),
    });
  }

  listGames(onlyMine = false) {
    const suffix = onlyMine ? "?mine=1" : "";
    return this.request(`/api/games${suffix}`);
  }

  loadGame(gameId) {
    return this.request(`/api/games/${gameId}`);
  }

  getLegalMoves(gameId, square) {
    return this.request(`/api/games/${gameId}/legal-moves?square=${square}`);
  }

  makeMove(gameId, uci) {
    return this.request(`/api/games/${gameId}/moves`, {
      method: "POST",
      body: JSON.stringify({ uci }),
    });
  }

  saveGame(gameId, saved = true) {
    return this.request(`/api/games/${gameId}/save`, {
      method: "POST",
      body: JSON.stringify({ saved }),
    });
  }

  restartGame(gameId) {
    return this.request(`/api/games/${gameId}/restart`, {
      method: "POST",
    });
  }
}
