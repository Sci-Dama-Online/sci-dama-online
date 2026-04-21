// Metadata for each Sci-Dama variant. Board, gameplay, and scoring math are
// shared across variants; each variant supplies its own chip layout and the
// label→value mapping used by the scoring engine. Variants without their own
// chip set yet reuse Electro's as a placeholder.

import type { CaptureResult, Operation, Piece } from './types';

export type GameVariant = 'electro' | 'sci_notation' | 'thi' | 'thermo';

export type VariantPalette = {
  boardDarkFrom: string;
  boardDarkTo: string;
  boardLightFrom: string;
  boardLightTo: string;
  accent: string;
  frame: string;
};

export type ChipPlacement = readonly [row: number, col: number, label: string];

export type VariantChips = {
  red: readonly ChipPlacement[];
  black: readonly ChipPlacement[];
};

// Operations printed on the light squares, one row per board row (8 total).
// Each row's 4 entries correspond to that row's 4 light squares read left→right.
export type BoardOperations = readonly [
  readonly Operation[],
  readonly Operation[],
  readonly Operation[],
  readonly Operation[],
  readonly Operation[],
  readonly Operation[],
  readonly Operation[],
  readonly Operation[],
];

export type VariantMeta = {
  id: GameVariant;
  name: string;
  tagline: string;
  subject: string;
  palette: VariantPalette;
  available: boolean;
  chips: VariantChips;
  operations: BoardOperations;
  // Returns the chip's peso-equivalent numeric value given its board label.
  // Used by scoring math (for variants without a custom `computeCapture`) and
  // by end-of-game banking for every variant.
  valueOf: (label: string) => number;
  // Optional: full per-variant capture-math override. Receives the two chips
  // and the landing-square operation, returns the raw taker/taken values, the
  // scored value that becomes the delta (before the dama bonus), and any
  // No-Score flag. Only THI needs this today — it has unit-matching and a
  // humidity → °F lookup that the default pipeline can't express.
  computeCapture?: (
    taker: Piece,
    taken: Piece,
    op: Operation,
  ) => CaptureResult;
};

// Default board operations shared by Electro, Sci-Notation, and Thermo.
// Repeats every 4 rows (reading the 4 light squares of each row left→right):
//   row 0 / 4 : × ÷ - +
//   row 1 / 5 : ÷ × + -
//   row 2 / 6 : - + × ÷
//   row 3 / 7 : + - ÷ ×
const DEFAULT_OPERATIONS: BoardOperations = [
  ['×', '÷', '-', '+'],
  ['÷', '×', '+', '-'],
  ['-', '+', '×', '÷'],
  ['+', '-', '÷', '×'],
  ['×', '÷', '-', '+'],
  ['÷', '×', '+', '-'],
  ['-', '+', '×', '÷'],
  ['+', '-', '÷', '×'],
];

// THI uses only + and - with a symmetric pattern mirrored across the middle:
//   rows 0, 3, 4, 7 : + - - +
//   rows 1, 2, 5, 6 : - + + -
const THI_OPERATIONS: BoardOperations = [
  ['+', '-', '-', '+'],
  ['-', '+', '+', '-'],
  ['-', '+', '+', '-'],
  ['+', '-', '-', '+'],
  ['+', '-', '-', '+'],
  ['-', '+', '+', '-'],
  ['-', '+', '+', '-'],
  ['+', '-', '-', '+'],
];

// --- Electro chip set ------------------------------------------------------

const ELECTRO_CHIPS: VariantChips = {
  red: [
    [5, 1, 'P10'],  [5, 3, '7KWH'],  [5, 5, 'P2'],    [5, 7, '5KWH'],
    [6, 0, '1KWH'], [6, 2, 'P4'],    [6, 4, '11KWH'], [6, 6, 'P8'],
    [7, 1, 'P12'],  [7, 3, '9KWH'],  [7, 5, 'P6'],    [7, 7, '3KWH'],
  ],
  black: [
    [0, 0, '3KWH'], [0, 2, 'P6'],    [0, 4, '9KWH'],  [0, 6, 'P12'],
    [1, 1, 'P8'],   [1, 3, '11KWH'], [1, 5, 'P4'],    [1, 7, '1KWH'],
    [2, 0, '5KWH'], [2, 2, 'P2'],    [2, 4, '7KWH'],  [2, 6, 'P10'],
  ],
};

function electroValueOf(label: string): number {
  if (label.startsWith('P')) return Number(label.slice(1));
  if (label.endsWith('KWH')) return Number(label.slice(0, -3)) * 1.5;
  return 0;
}

// --- Sci-Notation chip set -------------------------------------------------
// Chips display a whole number 1..12; their actual value is the decimal
// equivalent of the chip's scientific-notation form.

const SCI_NOTATION_VALUES: Readonly<Record<string, number>> = {
  '1': 1.1e-1,
  '2': 2.2e2,
  '3': 3.3e-3,
  '4': 4.4e4,
  '5': 5.5e-5,
  '6': 6.6e6,
  '7': 7.7e-7,
  '8': 8.8e8,
  '9': 9.9e-9,
  '10': 1.01e10,
  '11': 1.111e-11,
  '12': 1.212e12,
};

function sciNotationValueOf(label: string): number {
  return SCI_NOTATION_VALUES[label] ?? 0;
}

// Red arrangement (rows 5→7, front→back):
//   row 5 (front): 10   7   2   5
//   row 6:          1   4  11   8
//   row 7 (back):  12   9   6   3
// Black is the 180° mirror.
const SCI_NOTATION_CHIPS: VariantChips = {
  red: [
    [5, 1, '10'], [5, 3, '7'],  [5, 5, '2'],  [5, 7, '5'],
    [6, 0, '1'],  [6, 2, '4'],  [6, 4, '11'], [6, 6, '8'],
    [7, 1, '12'], [7, 3, '9'],  [7, 5, '6'],  [7, 7, '3'],
  ],
  black: [
    [0, 0, '3'],  [0, 2, '6'],  [0, 4, '9'],  [0, 6, '12'],
    [1, 1, '8'],  [1, 3, '11'], [1, 5, '4'],  [1, 7, '1'],
    [2, 0, '5'],  [2, 2, '2'],  [2, 4, '7'],  [2, 6, '10'],
  ],
};

// --- THI chip set ----------------------------------------------------------
// Chips are a mix of relative-humidity (%) and temperature (°F) values.
// Every chip resolves to a °F score: % chips via the THI reference table,
// °F chips using their printed value. Captures then do straight °F ± °F.

// THI reference table: relative humidity (%) → apparent temperature (°F).
const THI_HUMIDITY_TO_F: Readonly<Record<number, number>> = {
  0: 78, 5: 79, 10: 80, 15: 81, 20: 82, 25: 83, 30: 84, 35: 85, 40: 86,
  45: 87, 50: 88, 55: 89, 60: 90, 65: 91, 70: 93, 75: 95, 80: 97, 85: 99,
  90: 102, 95: 105, 100: 108,
};

function thiValueOf(label: string): number {
  if (label.endsWith('%')) {
    const pct = Number(label.slice(0, -1));
    return THI_HUMIDITY_TO_F[pct] ?? 0;
  }
  if (label.endsWith('°F')) {
    return Number(label.slice(0, -2));
  }
  return 0;
}

// THI capture math (official rule):
//   1. Both chips must share the same unit (both % or both °F). Mixed → NS.
//   2. Subtraction where minuend < subtrahend (negative result) → NS.
//   3. When both are %, look the combined humidity up in the THI table;
//      results outside 0–100 % (or missing from the table) → NS.
//   4. When both are °F, the direct sum/difference is the scored °F.
// Board ops on the THI board are only + and -, so we only need those branches.
function thiComputeCapture(
  taker: Piece,
  taken: Piece,
  op: Operation,
): CaptureResult {
  const takerIsPct = taker.label.endsWith('%');
  const takenIsPct = taken.label.endsWith('%');
  const takerValue = takerIsPct
    ? Number(taker.label.slice(0, -1))
    : Number(taker.label.slice(0, -2));
  const takenValue = takenIsPct
    ? Number(taken.label.slice(0, -1))
    : Number(taken.label.slice(0, -2));

  if (takerIsPct !== takenIsPct) {
    return {
      takerValue,
      takenValue,
      scoredValue: 0,
      isNoScore: true,
      noScoreReason: 'mixed units',
    };
  }

  const base =
    op === '+'
      ? takerValue + takenValue
      : op === '-'
        ? takerValue - takenValue
        : op === '×'
          ? takerValue * takenValue
          : takenValue === 0
            ? 0
            : takerValue / takenValue;

  if (base < 0) {
    return {
      takerValue,
      takenValue,
      scoredValue: 0,
      isNoScore: true,
      noScoreReason: 'negative result',
    };
  }

  if (takerIsPct) {
    const converted = THI_HUMIDITY_TO_F[base];
    if (converted === undefined) {
      return {
        takerValue,
        takenValue,
        scoredValue: 0,
        isNoScore: true,
        noScoreReason: 'off table',
      };
    }
    return {
      takerValue,
      takenValue,
      scoredValue: converted,
      isNoScore: false,
      noScoreReason: null,
    };
  }

  // °F + °F case — direct arithmetic, already in °F.
  return {
    takerValue,
    takenValue,
    scoredValue: base,
    isNoScore: false,
    noScoreReason: null,
  };
}

// Red arrangement (rows 5→7, front→back):
//   row 5 (front): 25%   70°F   30%    75°F
//   row 6:          80°F  35%   85°F   40%
//   row 7 (back):  45%  120°F   50%   110°F
// Black is the 180° mirror.
const THI_CHIPS: VariantChips = {
  red: [
    [5, 1, '25%'],  [5, 3, '70°F'],  [5, 5, '30%'],  [5, 7, '75°F'],
    [6, 0, '80°F'], [6, 2, '35%'],   [6, 4, '85°F'], [6, 6, '40%'],
    [7, 1, '45%'],  [7, 3, '120°F'], [7, 5, '50%'],  [7, 7, '110°F'],
  ],
  black: [
    [0, 0, '110°F'], [0, 2, '50%'],   [0, 4, '120°F'], [0, 6, '45%'],
    [1, 1, '40%'],   [1, 3, '85°F'],  [1, 5, '35%'],   [1, 7, '80°F'],
    [2, 0, '75°F'],  [2, 2, '30%'],   [2, 4, '70°F'],  [2, 6, '25%'],
  ],
};

// --- Variant registry ------------------------------------------------------

export const VARIANTS: Record<GameVariant, VariantMeta> = {
  electro: {
    id: 'electro',
    name: 'Electro Sci-Dama',
    tagline: 'Volts, currents, kilowatt-hours.',
    subject: 'Electric power consumption',
    palette: {
      boardDarkFrom: '#1b5e20',
      boardDarkTo: '#0b2e10',
      boardLightFrom: '#ffffff',
      boardLightTo: '#f0eee9',
      accent: '#2e7d32',
      frame: '#4e2e1e',
    },
    available: true,
    chips: ELECTRO_CHIPS,
    operations: DEFAULT_OPERATIONS,
    valueOf: electroValueOf,
  },
  sci_notation: {
    id: 'sci_notation',
    name: 'Dama Sci-Notation',
    tagline: 'Scientific notation battles.',
    subject: 'Scientific notation',
    palette: {
      boardDarkFrom: '#8b1a1a',
      boardDarkTo: '#3a0a0a',
      boardLightFrom: '#ffffff',
      boardLightTo: '#f0eee9',
      accent: '#c0392b',
      frame: '#4e2e1e',
    },
    available: true,
    chips: SCI_NOTATION_CHIPS,
    operations: DEFAULT_OPERATIONS,
    valueOf: sciNotationValueOf,
  },
  thi: {
    id: 'thi',
    name: 'THI Sci-Dama',
    tagline: 'Chemistry on a checkerboard.',
    subject: 'Chemistry / thermochemistry',
    palette: {
      boardDarkFrom: '#1e3a8a',
      boardDarkTo: '#0c1a3a',
      boardLightFrom: '#ffffff',
      boardLightTo: '#f0eee9',
      accent: '#3b82f6',
      frame: '#4e2e1e',
    },
    available: true,
    chips: THI_CHIPS,
    operations: THI_OPERATIONS,
    valueOf: thiValueOf,
    computeCapture: thiComputeCapture,
  },
  thermo: {
    id: 'thermo',
    name: 'Thermo Sci-Dama',
    tagline: 'Temperature scales in motion.',
    subject: 'Thermodynamics',
    palette: {
      boardDarkFrom: '#b45309',
      boardDarkTo: '#4a2007',
      boardLightFrom: '#ffffff',
      boardLightTo: '#f0eee9',
      accent: '#f59e0b',
      frame: '#4e2e1e',
    },
    available: true,
    // Placeholder: same chip set + scoring as Electro until Thermo's own rules
    // are defined.
    chips: ELECTRO_CHIPS,
    operations: DEFAULT_OPERATIONS,
    valueOf: electroValueOf,
  },
};

// Convenience: variant's chip-label → numeric value.
export function valueOf(variant: GameVariant, label: string): number {
  return VARIANTS[variant].valueOf(label);
}

// Allowed timer values in seconds. null = no timer. 20 minutes is the official max.
export const TIMER_OPTIONS = [null, 300, 600, 900, 1200] as const;
export type TimerOption = (typeof TIMER_OPTIONS)[number];

export function formatTimer(seconds: TimerOption): string {
  if (seconds === null) return 'No timer';
  return `${Math.round(seconds / 60)} min`;
}
