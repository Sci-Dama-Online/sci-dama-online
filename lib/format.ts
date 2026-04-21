// Number-formatting helpers for score and chip-value display.
// Variant-aware: Sci-Notation renders scores in "m.mm × 10ⁿ" form so massive
// totals fit in the UI; other variants stick to decimal with up to 2dp.

import type { GameVariant } from '@/game/variants';

const SUPERSCRIPTS: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '-': '⁻',
  '+': '',
};

function toSuperscript(n: number): string {
  return String(n)
    .split('')
    .map((ch) => SUPERSCRIPTS[ch] ?? ch)
    .join('');
}

// Returns e.g. "8.24 × 10⁸" or "−1.21 × 10¹²". 0 renders as "0".
// Uses 3 significant figures by default — tight enough for a score pill,
// precise enough to distinguish moves.
export function toSciNotation(n: number, sigFigs = 3): string {
  if (!Number.isFinite(n)) return 'n/a';
  if (n === 0) return '0';
  const sign = n < 0 ? '−' : '';
  const abs = Math.abs(n);
  const exp = Math.floor(Math.log10(abs));
  const mantissa = abs / Math.pow(10, exp);
  const mantissaStr = mantissa.toPrecision(sigFigs);
  return `${sign}${mantissaStr} × 10${toSuperscript(exp)}`;
}

// 2dp stripped of trailing zeros ("12", "12.5", "-8.25").
export function toDecimal(n: number): string {
  if (!Number.isFinite(n)) return 'n/a';
  const rounded = Math.round(n * 100) / 100;
  return rounded.toString();
}

// Full decimal with locale grouping (for the tap-to-expand sheet).
// Uses up to 12 fraction digits so tiny chips like 1.111e-11 render faithfully.
export function toFullDecimal(n: number): string {
  if (!Number.isFinite(n)) return 'n/a';
  if (n === 0) return '0';
  // Very small numbers: fall back to toFixed since toLocaleString's default
  // truncates precision aggressively on some platforms.
  const abs = Math.abs(n);
  if (abs < 1e-6) {
    return n.toFixed(14).replace(/0+$/, '').replace(/\.$/, '');
  }
  if (abs >= 1e15) {
    // Beyond safe-integer territory, fall back to sci-notation.
    return toSciNotation(n, 6);
  }
  return n.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

// Score formatting branches per variant. Sci-Notation uses sci notation;
// everyone else uses short decimal.
export function formatScore(variant: GameVariant, n: number): string {
  if (variant === 'sci_notation') return toSciNotation(n);
  return toDecimal(n);
}

// Chip value formatting — used in score breakdown rows.
export function formatChipValue(variant: GameVariant, n: number): string {
  if (variant === 'sci_notation') return toSciNotation(n);
  return toDecimal(n);
}
