import type { Board, GameState, Move, Piece, Player, Pos, Scores } from './types';
import type { GameVariant, TimerOption } from './variants';

export const BOARD_SIZE = 8;

const DIAGONALS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

export function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

export function isDarkSquare(r: number, c: number): boolean {
  return (r + c) % 2 === 1;
}

export type Operation = '+' | '-' | '×' | '÷';

// Operations are printed on the LIGHT (non-playable) squares only.
// Pattern (row 0 → row 7, reading the 4 light squares of each row left→right):
//   ×  ÷  -  +
//   ÷  ×  +  -
//   -  +  ×  ÷
//   +  -  ÷  ×
//   (repeats for rows 4–7)
// Light-square column indices per row:
//   Even rows (r even): light cols 0,2,4,6 → idx c/2
//   Odd rows  (r odd) : light cols 1,3,5,7 → idx (c-1)/2
const OPS_PATTERN: readonly (readonly Operation[])[] = [
  ['×', '÷', '-', '+'],
  ['÷', '×', '+', '-'],
  ['-', '+', '×', '÷'],
  ['+', '-', '÷', '×'],
];

export function getSquareOperation(r: number, c: number): Operation | null {
  if (isDarkSquare(r, c)) return null;
  const row = OPS_PATTERN[r % 4];
  const idx = r % 2 === 0 ? c / 2 : (c - 1) / 2;
  return row[idx];
}

export function posEquals(a: Pos | null, b: Pos | null): boolean {
  if (!a || !b) return false;
  return a[0] === b[0] && a[1] === b[1];
}

// Electro Sci Dama starting position. Chips sit on LIGHT squares only.
// Red occupies rows 5–7; row 7 is red's back row, row 5 is the front.
// Black is the 180° rotational mirror on rows 0–2.
type Setup = ReadonlyArray<readonly [number, number, string]>;

const RED_SETUP: Setup = [
  [5, 1, 'P10'],  [5, 3, '7KWH'],  [5, 5, 'P2'],    [5, 7, '5KWH'],
  [6, 0, '1KWH'], [6, 2, 'P4'],    [6, 4, '11KWH'], [6, 6, 'P8'],
  [7, 1, 'P12'],  [7, 3, '9KWH'],  [7, 5, 'P6'],    [7, 7, '3KWH'],
];

const BLACK_SETUP: Setup = [
  [0, 0, '3KWH'], [0, 2, 'P6'],    [0, 4, '9KWH'],  [0, 6, 'P12'],
  [1, 1, 'P8'],   [1, 3, '11KWH'], [1, 5, 'P4'],    [1, 7, '1KWH'],
  [2, 0, '5KWH'], [2, 2, 'P2'],    [2, 4, '7KWH'],  [2, 6, 'P10'],
];

export function initialBoard(): Board {
  const board: Board = Array.from({ length: BOARD_SIZE }, () =>
    Array<null>(BOARD_SIZE).fill(null),
  );
  for (const [r, c, label] of RED_SETUP) {
    board[r][c] = { player: 'red', kind: 'man', label };
  }
  for (const [r, c, label] of BLACK_SETUP) {
    board[r][c] = { player: 'black', kind: 'man', label };
  }
  return board;
}

export function initialState(
  variant: GameVariant = 'electro',
  timeLimitSeconds: TimerOption = null,
): GameState {
  const board = initialBoard();
  const turn: Player = 'red';
  return {
    board,
    turn,
    selected: null,
    legalTargets: [],
    mustCapture: hasAnyCapture(board, turn),
    forcedPiece: null,
    winner: null,
    scores: { red: 0, black: 0 },
    variant,
    timeLimitSeconds,
    timerStartedAtMs: null,
  };
}

// Parses a chip label into its peso value. `P##` is already in pesos;
// `##KWH` is multiplied by 1.5 to convert from kWh to pesos.
export function labelToPeso(label: string): number {
  if (label.startsWith('P')) {
    return Number(label.slice(1));
  }
  if (label.endsWith('KWH')) {
    return Number(label.slice(0, -3)) * 1.5;
  }
  return 0;
}

// Score gained by the taker for a single capture. Applies the landing-square
// operation between taker's and taken's peso values, then a ×1.5 multiplier
// if the taker is a king.
export function scoreDelta(taker: Piece, taken: Piece, op: Operation): number {
  const takerP = labelToPeso(taker.label);
  const takenP = labelToPeso(taken.label);
  let result: number;
  switch (op) {
    case '+': result = takerP + takenP; break;
    case '-': result = takerP - takenP; break;
    case '×': result = takerP * takenP; break;
    case '÷': result = takenP === 0 ? 0 : takerP / takenP; break;
  }
  if (taker.kind === 'king') result *= 1.5;
  return result;
}

function forwardDir(player: Player): number {
  return player === 'red' ? -1 : 1;
}

function willPromote(piece: Piece, landRow: number): boolean {
  if (piece.kind !== 'man') return false;
  return (
    (piece.player === 'red' && landRow === 0) ||
    (piece.player === 'black' && landRow === BOARD_SIZE - 1)
  );
}

export function getSlides(board: Board, r: number, c: number): Move[] {
  const piece = board[r][c];
  if (!piece) return [];
  const moves: Move[] = [];
  if (piece.kind === 'man') {
    const dr = forwardDir(piece.player);
    for (const dc of [-1, 1] as const) {
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc) && board[nr][nc] === null) {
        moves.push({
          from: [r, c],
          to: [nr, nc],
          captured: [],
          promoted: willPromote(piece, nr),
        });
      }
    }
  } else {
    for (const [dr, dc] of DIAGONALS) {
      let nr = r + dr;
      let nc = c + dc;
      while (inBounds(nr, nc) && board[nr][nc] === null) {
        moves.push({
          from: [r, c],
          to: [nr, nc],
          captured: [],
          promoted: false,
        });
        nr += dr;
        nc += dc;
      }
    }
  }
  return moves;
}

export function getCaptures(board: Board, r: number, c: number): Move[] {
  const piece = board[r][c];
  if (!piece) return [];
  const moves: Move[] = [];

  if (piece.kind === 'man') {
    for (const [dr, dc] of DIAGONALS) {
      const mr = r + dr;
      const mc = c + dc;
      const lr = r + 2 * dr;
      const lc = c + 2 * dc;
      if (!inBounds(lr, lc)) continue;
      const mid = board[mr][mc];
      const landing = board[lr][lc];
      if (mid && mid.player !== piece.player && landing === null) {
        moves.push({
          from: [r, c],
          to: [lr, lc],
          captured: [[mr, mc]],
          promoted: willPromote(piece, lr),
        });
      }
    }
  } else {
    for (const [dr, dc] of DIAGONALS) {
      let nr = r + dr;
      let nc = c + dc;
      while (inBounds(nr, nc) && board[nr][nc] === null) {
        nr += dr;
        nc += dc;
      }
      if (!inBounds(nr, nc)) continue;
      const mid = board[nr][nc];
      if (!mid || mid.player === piece.player) continue;
      const capR = nr;
      const capC = nc;
      let lr = capR + dr;
      let lc = capC + dc;
      while (inBounds(lr, lc) && board[lr][lc] === null) {
        moves.push({
          from: [r, c],
          to: [lr, lc],
          captured: [[capR, capC]],
          promoted: false,
        });
        lr += dr;
        lc += dc;
      }
    }
  }

  return moves;
}

function simulateMove(board: Board, move: Move): Board {
  const b: Board = board.map((row) => row.slice());
  const [fr, fc] = move.from;
  const [tr, tc] = move.to;
  const piece = b[fr][fc];
  if (!piece) return b;
  b[fr][fc] = null;
  for (const [cr, cc] of move.captured) b[cr][cc] = null;
  b[tr][tc] = move.promoted ? { ...piece, kind: 'king' } : piece;
  return b;
}

// When a king captures, its flying nature gives it multiple possible landing
// squares past the enemy. If some landings enable another capture and others
// don't, the king must pick a chain-continuing landing — it can't "dodge" a
// takable piece by stopping short or skipping past.
function filterKingChainContinuers(
  board: Board,
  from: Pos,
  captures: Move[],
): Move[] {
  if (captures.length === 0) return captures;
  const piece = board[from[0]][from[1]];
  if (!piece || piece.kind !== 'king') return captures;
  const continuers = captures.filter((m) => {
    const next = simulateMove(board, m);
    return getCaptures(next, m.to[0], m.to[1]).length > 0;
  });
  return continuers.length > 0 ? continuers : captures;
}

export function getLegalMovesForPiece(
  board: Board,
  r: number,
  c: number,
  mustCapture: boolean,
): Move[] {
  const captures = filterKingChainContinuers(
    board,
    [r, c],
    getCaptures(board, r, c),
  );
  if (mustCapture) return captures;
  if (captures.length > 0) return captures;
  return getSlides(board, r, c);
}

export function hasAnyCapture(board: Board, player: Player): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c];
      if (p && p.player === player && getCaptures(board, r, c).length > 0) {
        return true;
      }
    }
  }
  return false;
}

export function hasAnyMove(board: Board, player: Player): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c];
      if (!p || p.player !== player) continue;
      if (getCaptures(board, r, c).length > 0) return true;
      if (getSlides(board, r, c).length > 0) return true;
    }
  }
  return false;
}

export function countPieces(board: Board, player: Player): number {
  let n = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell && cell.player === player) n++;
    }
  }
  return n;
}

function other(player: Player): Player {
  return player === 'red' ? 'black' : 'red';
}

export function applyMove(state: GameState, move: Move): GameState {
  const board: Board = state.board.map((row) => row.slice());
  const [fr, fc] = move.from;
  const [tr, tc] = move.to;
  const piece = board[fr][fc];
  if (!piece) return state;

  const scores: Scores = { ...state.scores };
  if (move.captured.length > 0) {
    const op = getSquareOperation(tr, tc);
    if (op) {
      for (const [cr, cc] of move.captured) {
        const taken = state.board[cr][cc];
        if (taken) scores[piece.player] += scoreDelta(piece, taken, op);
      }
    }
  }

  board[fr][fc] = null;
  for (const [cr, cc] of move.captured) {
    board[cr][cc] = null;
  }
  const landed: Piece = move.promoted ? { ...piece, kind: 'king' } : piece;
  board[tr][tc] = landed;

  const wasCapture = move.captured.length > 0;
  let continueChain = false;
  let nextCaptures: Move[] = [];
  if (wasCapture && !move.promoted) {
    nextCaptures = filterKingChainContinuers(
      board,
      [tr, tc],
      getCaptures(board, tr, tc),
    );
    if (nextCaptures.length > 0) continueChain = true;
  }

  let turn: Player;
  let selected: Pos | null;
  let forcedPiece: Pos | null;
  let legalTargets: Move[];

  if (continueChain) {
    turn = state.turn;
    selected = [tr, tc];
    forcedPiece = [tr, tc];
    legalTargets = nextCaptures;
  } else {
    turn = other(state.turn);
    selected = null;
    forcedPiece = null;
    legalTargets = [];
  }

  const mustCapture = hasAnyCapture(board, turn);

  let winner: Player | 'tie' | null = null;
  if (countPieces(board, turn) === 0 || !hasAnyMove(board, turn)) {
    if (scores.red < scores.black) winner = 'red';
    else if (scores.black < scores.red) winner = 'black';
    else winner = 'tie';
  }

  return {
    board,
    turn,
    selected,
    legalTargets,
    mustCapture,
    forcedPiece,
    winner,
    scores,
    variant: state.variant,
    timeLimitSeconds: state.timeLimitSeconds,
    timerStartedAtMs: state.timerStartedAtMs,
  };
}

// Pure helper: decide the winner when the match clock runs out. Mirrors the
// "lower score wins, tie on equal" rule used elsewhere.
export function winnerByScore(scores: Scores): Player | 'tie' {
  if (scores.red < scores.black) return 'red';
  if (scores.black < scores.red) return 'black';
  return 'tie';
}
