import type { GameVariant, TimerOption } from './variants';

export type Player = 'red' | 'black';
// A 'man' promotes into a 'dama' (the Filipino checkers equivalent of a king).
export type PieceKind = 'man' | 'dama';

export type Piece = {
  player: Player;
  kind: PieceKind;
  label: string;
};

export type Cell = Piece | null;
export type Board = Cell[][];

export type Pos = readonly [number, number];

export type Move = {
  from: Pos;
  to: Pos;
  captured: Pos[];
  promoted: boolean;
};

export type Scores = Record<Player, number>;

export type Operation = '+' | '-' | '×' | '÷';

// Single capture event appended to `scoreLog` during `applyMove`.
// Holds everything the post-game breakdown needs to explain how this capture's
// delta was produced, in human-readable form.
export type CaptureEvent = {
  kind: 'capture';
  moveNumber: number;
  player: Player;
  taker: { label: string; isDama: boolean; value: number };
  taken: { label: string; isDama: boolean; value: number };
  operation: Operation;
  // Dama bonus multiplier applied to the operation result:
  //   1 = ordinary takes ordinary (no bonus)
  //   2 = exactly one side is a dama
  //   4 = dama takes another dama
  captureMultiplier: 1 | 2 | 4;
  delta: number;
  playerTotalAfter: number;
};

// Per-player end-of-match banking event. One per player; pushed by `endGame`.
export type BankEvent = {
  kind: 'bank';
  player: Player;
  chips: Array<{
    label: string;
    isDama: boolean;
    baseValue: number;
    contribution: number;
  }>;
  subtotal: number;
  finalTotal: number;
};

export type ScoreEvent = CaptureEvent | BankEvent;

export type GameState = {
  board: Board;
  turn: Player;
  selected: Pos | null;
  legalTargets: Move[];
  mustCapture: boolean;
  forcedPiece: Pos | null;
  winner: Player | 'tie' | null;
  scores: Scores;
  variant: GameVariant;
  timeLimitSeconds: TimerOption;
  // Unix ms when the match clock started (set on the first applied move).
  // null until a move has actually been played.
  timerStartedAtMs: number | null;
  // Append-only audit trail of scoring events, used by the post-game
  // breakdown UI so players can see how every point was computed.
  scoreLog: ScoreEvent[];
};
