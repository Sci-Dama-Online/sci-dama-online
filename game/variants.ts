// Metadata for each Sci Dama variant. Board, gameplay, and scoring math are
// shared across variants; each variant supplies its own chip layout and the
// label→value mapping used by the scoring engine. Variants without their own
// chip set yet reuse Electro's as a placeholder.

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

export type VariantMeta = {
  id: GameVariant;
  name: string;
  tagline: string;
  subject: string;
  palette: VariantPalette;
  available: boolean;
  chips: VariantChips;
  // Returns the chip's peso-equivalent numeric value given its board label.
  // Used by scoring math + end-of-game banking.
  valueOf: (label: string) => number;
};

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

// --- Variant registry ------------------------------------------------------

export const VARIANTS: Record<GameVariant, VariantMeta> = {
  electro: {
    id: 'electro',
    name: 'Electro Sci Dama',
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
    valueOf: sciNotationValueOf,
  },
  thi: {
    id: 'thi',
    name: 'THI Sci Dama',
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
    // Placeholder: same chip set + scoring as Electro until THI's own rules
    // are defined. Swap `chips` and `valueOf` here when that happens.
    chips: ELECTRO_CHIPS,
    valueOf: electroValueOf,
  },
  thermo: {
    id: 'thermo',
    name: 'Thermo Sci Dama',
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
