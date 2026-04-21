import type {
  BankEvent,
  Board,
  CaptureEvent,
  GameState,
  Move,
  Operation,
  Piece,
  Player,
  Pos,
  ScoreEvent,
  Scores,
} from './types';
import {
  VARIANTS,
  valueOf,
  type GameVariant,
  type TimerOption,
} from './variants';

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

// Operations are printed on the LIGHT (non-playable) squares only. Each
// variant carries its own 8-row pattern in `VARIANTS[variant].operations`.
// Light-square column indices per row:
//   Even rows (r even): light cols 0,2,4,6 → idx c/2
//   Odd rows  (r odd) : light cols 1,3,5,7 → idx (c-1)/2
export function getSquareOperation(
  variant: GameVariant,
  r: number,
  c: number,
): Operation | null {
  if (isDarkSquare(r, c)) return null;
  const row = VARIANTS[variant].operations[r];
  const idx = r % 2 === 0 ? c / 2 : (c - 1) / 2;
  return row[idx];
}

// Re-export for callers (Square.tsx etc) that want the Operation type.
export type { Operation } from './types';

export function posEquals(a: Pos | null, b: Pos | null): boolean {
  if (!a || !b) return false;
  return a[0] === b[0] && a[1] === b[1];
}

// Builds the starting position for the given variant using its chip layout
// from `game/variants.ts`. Chips sit on LIGHT squares only; red occupies rows
// 5–7 (row 7 = back), black is the 180° mirror on rows 0–2.
export function initialBoard(variant: GameVariant = 'electro'): Board {
  const board: Board = Array.from({ length: BOARD_SIZE }, () =>
    Array<null>(BOARD_SIZE).fill(null),
  );
  const chips = VARIANTS[variant].chips;
  for (const [r, c, label] of chips.red) {
    board[r][c] = { player: 'red', kind: 'man', label };
  }
  for (const [r, c, label] of chips.black) {
    board[r][c] = { player: 'black', kind: 'man', label };
  }
  return board;
}

export function initialState(
  variant: GameVariant = 'electro',
  timeLimitSeconds: TimerOption = null,
): GameState {
  const board = initialBoard(variant);
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
    scoreLog: [],
  };
}

// Applies an arithmetic operation between two numeric chip values. Division
// by zero is treated as zero (defensive — no chip has value 0 today).
function applyOp(op: Operation, a: number, b: number): number {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? 0 : a / b;
  }
}

// Delta + the intermediate values used to produce it, so the post-game
// breakdown can show the exact arithmetic a capture performed.
export type CaptureMath = {
  takerValue: number;
  takenValue: number;
  // Dama bonus applied to the operation result:
  //   1 = ordinary chip takes an ordinary chip
  //   2 = exactly one of the two is a dama
  //   4 = a dama takes another dama
  captureMultiplier: 1 | 2 | 4;
  delta: number;
};

export function computeCaptureDelta(
  variant: GameVariant,
  taker: Piece,
  taken: Piece,
  op: Operation,
): CaptureMath {
  const takerValue = valueOf(variant, taker.label);
  const takenValue = valueOf(variant, taken.label);
  const base = applyOp(op, takerValue, takenValue);
  const takerIsDama = taker.kind === 'dama';
  const takenIsDama = taken.kind === 'dama';
  let captureMultiplier: 1 | 2 | 4 = 1;
  if (takerIsDama && takenIsDama) captureMultiplier = 4;
  else if (takerIsDama || takenIsDama) captureMultiplier = 2;
  return {
    takerValue,
    takenValue,
    captureMultiplier,
    delta: base * captureMultiplier,
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

function simulateMove(board: Board, move: Move): Board {
  const b: Board = board.map((row) => row.slice());
  const [fr, fc] = move.from;
  const [tr, tc] = move.to;
  const piece = b[fr][fc];
  if (!piece) return b;
  b[fr][fc] = null;
  for (const [cr, cc] of move.captured) b[cr][cc] = null;
  b[tr][tc] = move.promoted ? { ...piece, kind: 'dama' } : piece;
  return b;
}

// When a dama captures, its flying nature gives it multiple possible landing
// squares past the enemy. If some landings enable another capture and others
// don't, the dama must pick a chain-continuing landing — it can't "dodge" a
// takable piece by stopping short or skipping past.
function filterDamaChainContinuers(
  board: Board,
  from: Pos,
  captures: Move[],
): Move[] {
  if (captures.length === 0) return captures;
  const piece = board[from[0]][from[1]];
  if (!piece || piece.kind !== 'dama') return captures;
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
  const captures = filterDamaChainContinuers(
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

// Collects the bankable chip contributions for one player — used both for
// `remainingChipValue` and for building the end-of-match BankEvent.
// A remaining dama is worth × 2 of its peso value (kWh→peso conversion via
// `valueOf` is already × 1.5 and is independent of the dama bonus).
function collectRemainingChips(
  variant: GameVariant,
  board: Board,
  player: Player,
): BankEvent['chips'] {
  const chips: BankEvent['chips'] = [];
  for (const row of board) {
    for (const cell of row) {
      if (!cell || cell.player !== player) continue;
      const baseValue = valueOf(variant, cell.label);
      const isDama = cell.kind === 'dama';
      const contribution = isDama ? baseValue * 2 : baseValue;
      chips.push({ label: cell.label, isDama, baseValue, contribution });
    }
  }
  return chips;
}

// Peso value a player's remaining chips are worth when banked at match end.
// Kept as a convenience alias over `collectRemainingChips`.
export function remainingChipValue(
  variant: GameVariant,
  board: Board,
  player: Player,
): number {
  return collectRemainingChips(variant, board, player).reduce(
    (sum, c) => sum + c.contribution,
    0,
  );
}

// Ends the match: both players' remaining chips are banked into their scores
// (converted to peso, × 1.5 for kings). Lower final score wins — idle chips
// count against you. Returns the new scores, the winner, and the two
// BankEvents that should be appended to the scoreLog.
export function endGame(
  variant: GameVariant,
  board: Board,
  scores: Scores,
): {
  scores: Scores;
  winner: Player | 'tie';
  bankEvents: [BankEvent, BankEvent];
} {
  const redChips = collectRemainingChips(variant, board, 'red');
  const blackChips = collectRemainingChips(variant, board, 'black');
  const redSubtotal = redChips.reduce((s, c) => s + c.contribution, 0);
  const blackSubtotal = blackChips.reduce((s, c) => s + c.contribution, 0);
  const red = scores.red + redSubtotal;
  const black = scores.black + blackSubtotal;

  const redBank: BankEvent = {
    kind: 'bank',
    player: 'red',
    chips: redChips,
    subtotal: redSubtotal,
    finalTotal: red,
  };
  const blackBank: BankEvent = {
    kind: 'bank',
    player: 'black',
    chips: blackChips,
    subtotal: blackSubtotal,
    finalTotal: black,
  };

  let winner: Player | 'tie';
  if (red < black) winner = 'red';
  else if (black < red) winner = 'black';
  else winner = 'tie';

  return {
    scores: { red, black },
    winner,
    bankEvents: [redBank, blackBank],
  };
}

export function applyMove(state: GameState, move: Move): GameState {
  const board: Board = state.board.map((row) => row.slice());
  const [fr, fc] = move.from;
  const [tr, tc] = move.to;
  const piece = board[fr][fc];
  if (!piece) return state;

  const scores: Scores = { ...state.scores };
  const scoreLog: ScoreEvent[] = [...state.scoreLog];

  const wasCapture = move.captured.length > 0;
  const op = getSquareOperation(state.variant, tr, tc);

  // Log each captured chip separately so multi-jump chains produce multiple
  // CaptureEvents. The pre-mutation `state.board` is the source of truth for
  // the captured piece's details.
  if (wasCapture && op) {
    for (const [cr, cc] of move.captured) {
      const taken = state.board[cr][cc];
      if (!taken) continue;
      const math = computeCaptureDelta(state.variant, piece, taken, op);
      scores[piece.player] += math.delta;
      const priorCaptureCount = scoreLog.reduce(
        (n, e) => (e.kind === 'capture' ? n + 1 : n),
        0,
      );
      const event: CaptureEvent = {
        kind: 'capture',
        moveNumber: priorCaptureCount + 1,
        player: piece.player,
        taker: {
          label: piece.label,
          isDama: piece.kind === 'dama',
          value: math.takerValue,
        },
        taken: {
          label: taken.label,
          isDama: taken.kind === 'dama',
          value: math.takenValue,
        },
        operation: op,
        captureMultiplier: math.captureMultiplier,
        delta: math.delta,
        playerTotalAfter: scores[piece.player],
      };
      scoreLog.push(event);
    }
  }

  board[fr][fc] = null;
  for (const [cr, cc] of move.captured) {
    board[cr][cc] = null;
  }
  // Tentatively land the piece unchanged. Promotion is decided AFTER we know
  // whether the capture chain continues — a man that can still capture must
  // keep chaining as a man, even if it just touched the back row.
  board[tr][tc] = piece;

  let continueChain = false;
  let nextCaptures: Move[] = [];
  if (wasCapture) {
    nextCaptures = filterDamaChainContinuers(
      board,
      [tr, tc],
      getCaptures(board, tr, tc),
    );
    if (nextCaptures.length > 0) continueChain = true;
  }

  // Promote only when the chain ends with the man actually resting on its
  // back row. Passing through the back row mid-chain does NOT promote and
  // the chain's captures stay at ordinary-chip rates (no dama bonus).
  if (!continueChain && piece.kind === 'man' && willPromote(piece, tr)) {
    board[tr][tc] = { ...piece, kind: 'dama' };
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
  let finalScores = scores;
  let finalLog = scoreLog;
  if (countPieces(board, turn) === 0 || !hasAnyMove(board, turn)) {
    const ended = endGame(state.variant, board, scores);
    finalScores = ended.scores;
    winner = ended.winner;
    finalLog = [...scoreLog, ...ended.bankEvents];
  }

  return {
    board,
    turn,
    selected,
    legalTargets,
    mustCapture,
    forcedPiece,
    winner,
    scores: finalScores,
    variant: state.variant,
    timeLimitSeconds: state.timeLimitSeconds,
    timerStartedAtMs: state.timerStartedAtMs,
    scoreLog: finalLog,
  };
}
