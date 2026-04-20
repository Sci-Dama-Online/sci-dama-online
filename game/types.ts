export type Player = 'red' | 'black';
export type PieceKind = 'man' | 'king';

export type Piece = {
  player: Player;
  kind: PieceKind;
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

export type GameState = {
  board: Board;
  turn: Player;
  selected: Pos | null;
  legalTargets: Move[];
  mustCapture: boolean;
  forcedPiece: Pos | null;
  winner: Player | null;
};
