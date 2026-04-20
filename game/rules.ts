import type { Board, GameState, Move, Piece, Player, Pos } from './types';

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

export function posEquals(a: Pos | null, b: Pos | null): boolean {
  if (!a || !b) return false;
  return a[0] === b[0] && a[1] === b[1];
}

export function initialBoard(): Board {
  const board: Board = Array.from({ length: BOARD_SIZE }, () =>
    Array<null>(BOARD_SIZE).fill(null),
  );
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (isDarkSquare(r, c)) board[r][c] = { player: 'black', kind: 'man' };
    }
  }
  for (let r = 5; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (isDarkSquare(r, c)) board[r][c] = { player: 'red', kind: 'man' };
    }
  }
  return board;
}

export function initialState(): GameState {
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
  };
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

export function getLegalMovesForPiece(
  board: Board,
  r: number,
  c: number,
  mustCapture: boolean,
): Move[] {
  if (mustCapture) return getCaptures(board, r, c);
  const captures = getCaptures(board, r, c);
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
    nextCaptures = getCaptures(board, tr, tc);
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

  let winner: Player | null = null;
  if (countPieces(board, turn) === 0 || !hasAnyMove(board, turn)) {
    winner = other(turn);
  }

  return {
    board,
    turn,
    selected,
    legalTargets,
    mustCapture,
    forcedPiece,
    winner,
  };
}
