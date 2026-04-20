// Metadata for each Sci Dama variant. Rules for the non-electro variants are
// not yet implemented — they currently reuse Electro's board/chips/scoring with
// the variant's color palette applied to the board. Swap them in later without
// changing this module's shape.

export type GameVariant = 'electro' | 'sci_notation' | 'thi' | 'thermo';

export type VariantPalette = {
  boardDarkFrom: string;
  boardDarkTo: string;
  boardLightFrom: string;
  boardLightTo: string;
  accent: string;
  frame: string;
};

export type VariantMeta = {
  id: GameVariant;
  name: string;
  tagline: string;
  subject: string;
  palette: VariantPalette;
  available: boolean;
};

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
    available: false,
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
    available: false,
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
    available: false,
  },
};

// Allowed timer values in seconds. null = no timer. 20 minutes is the official max.
export const TIMER_OPTIONS = [null, 600, 900, 1200] as const;
export type TimerOption = (typeof TIMER_OPTIONS)[number];

export function formatTimer(seconds: TimerOption): string {
  if (seconds === null) return 'No timer';
  return `${Math.round(seconds / 60)} min`;
}
