"""
chess_engine.py – The Dark Engine AI for DREAM of Shadow Chess Game.

Strategy:
  1. Among all legal moves, prefer any that capture an opponent piece.
  2. If no capture is available, choose a random legal move.
  3. Returns the chosen move as a chess.Move object.
"""

import random
import chess


def dark_engine_move(board: chess.Board) -> chess.Move | None:
    """
    Choose the Dark Engine's next move.

    Preference order:
      1. Capture moves (chosen randomly among captures).
      2. Any legal move (chosen randomly).

    Returns None if no legal moves exist (game is over).
    """
    legal = list(board.legal_moves)
    if not legal:
        return None

    captures = [m for m in legal if board.is_capture(m)]
    if captures:
        return random.choice(captures)
    return random.choice(legal)
