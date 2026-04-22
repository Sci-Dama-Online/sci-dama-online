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

// Explanation of why a variant rejected a capture. Presented verbatim in the
// post-game breakdown next to the "NS" badge.
export type NoScoreReason = 'mixed units' | 'negative result' | 'off table';

// Unit labels used by Thermo's bucketed scoring. Other variants leave this
// null on their capture results.
export type UnitLabel = 'g' | '°C' | 'g·°C';

// Full outcome of a single capture from the variant's perspective. Allows
// variants (notably THI and Thermo) to inject NS rules and unit-aware scoring
// without touching the generic rules engine.
export type CaptureResult = {
  takerValue: number;
  takenValue: number;
  // Final numeric value that becomes the delta (before the dama × 2 / × 4
  // bonus). For THI %+% captures this is already the °F table lookup of the
  // combined humidity; for Thermo captures this is the magnitude in the
  // scoredUnit; for other variants it's just takerValue OP takenValue.
  scoredValue: number;
  // The unit `scoredValue` carries (Thermo only). Null for variants that
  // don't use unit buckets.
  scoredUnit: UnitLabel | null;
  isNoScore: boolean;
  noScoreReason: NoScoreReason | null;
};

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
  // True when a variant's No-Score rule rejected this capture (e.g. THI mixed
  // units, negative result, or off-table result). `delta` is 0 in that case
  // and the dama bonus does not apply.
  isNoScore: boolean;
  noScoreReason: NoScoreReason | null;
  // Unit bucket this capture's delta belongs to (Thermo only). Null for
  // variants that don't use unit buckets.
  unit: UnitLabel | null;
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
