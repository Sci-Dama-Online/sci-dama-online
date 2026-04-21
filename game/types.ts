import type { GameVariant, TimerOption } from './variants';

export type Player = 'red' | 'black';
export type PieceKind = 'man' | 'king';

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
};
