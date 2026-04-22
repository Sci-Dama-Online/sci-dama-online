import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { BankEvent, CaptureEvent, Player, Scores, ScoreEvent } from '@/game/types';
import { VARIANTS, type GameVariant } from '@/game/variants';
import { formatChipValue, formatScore, formatScoreWithUnit } from '@/lib/format';

type Props = {
  visible: boolean;
  onClose: () => void;
  variant: GameVariant;
  scoreLog: ScoreEvent[];
  scores: Scores;
  winner: Player | 'tie' | null;
};

export function ScoreBreakdown({
  visible,
  onClose,
  variant,
  scoreLog,
  scores,
  winner,
}: Props) {
  const redCaptures = scoreLog.filter(
    (e): e is CaptureEvent => e.kind === 'capture' && e.player === 'red',
  );
  const blackCaptures = scoreLog.filter(
    (e): e is CaptureEvent => e.kind === 'capture' && e.player === 'black',
  );
  const redBank = scoreLog.find(
    (e): e is BankEvent => e.kind === 'bank' && e.player === 'red',
  );
  const blackBank = scoreLog.find(
    (e): e is BankEvent => e.kind === 'bank' && e.player === 'black',
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Score breakdown</Text>
            <Text style={styles.subtitle}>
              Every capture, every banked chip, in order.
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={22} color="#333" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <PlayerSection
            label="Red"
            accent="#c0392b"
            isWinner={winner === 'red'}
            captures={redCaptures}
            bank={redBank}
            finalScore={scores.red}
            variant={variant}
          />
          <PlayerSection
            label="Black"
            accent="#1e1e1e"
            isWinner={winner === 'black'}
            captures={blackCaptures}
            bank={blackBank}
            finalScore={scores.black}
            variant={variant}
          />

          <View style={styles.legend}>
            <Text style={styles.legendText}>
              {`Lower final score wins. Remaining chips at the end of the match are banked into the owner's total — so idle chips count against you, and a dama (× 2) left on the board costs even more.`}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function PlayerSection({
  label,
  accent,
  isWinner,
  captures,
  bank,
  finalScore,
  variant,
}: {
  label: string;
  accent: string;
  isWinner: boolean;
  captures: CaptureEvent[];
  bank: BankEvent | undefined;
  finalScore: number;
  variant: GameVariant;
}) {
  const meta = VARIANTS[variant];
  const captureSubtotal = captures.reduce((sum, c) => sum + c.delta, 0);
  const bankSubtotal = bank?.subtotal ?? 0;

  return (
    <View style={styles.player}>
      <View style={[styles.playerHeader, { backgroundColor: accent }]}>
        <Text style={styles.playerLabel}>{label}</Text>
        <View style={styles.finalBadge}>
          <Text style={styles.finalBadgeLabel}>FINAL</Text>
          <Text style={styles.finalBadgeValue}>
            {formatScoreWithUnit(variant, finalScore)}
          </Text>
        </View>
        {isWinner ? (
          <View style={styles.winnerBadge}>
            <Ionicons name="trophy" size={12} color="#8a5a00" />
            <Text style={styles.winnerBadgeText}>WINNER</Text>
          </View>
        ) : null}
      </View>

      {meta.breakdownColumns ? (
        <ColumnBreakdown
          variant={variant}
          columns={meta.breakdownColumns}
          captures={captures}
          bank={bank}
          finalScore={finalScore}
        />
      ) : (
        <FlatBreakdown
          variant={variant}
          captures={captures}
          bank={bank}
          captureSubtotal={captureSubtotal}
          bankSubtotal={bankSubtotal}
          finalScore={finalScore}
        />
      )}
    </View>
  );
}

// --- Flat (single-column) breakdown, used by Sci-Notation ------------------

function FlatBreakdown({
  variant,
  captures,
  bank,
  captureSubtotal,
  bankSubtotal,
  finalScore,
}: {
  variant: GameVariant;
  captures: CaptureEvent[];
  bank: BankEvent | undefined;
  captureSubtotal: number;
  bankSubtotal: number;
  finalScore: number;
}) {
  return (
    <>
      <View style={styles.block}>
        <Text style={styles.blockTitle}>
          Captures {captures.length > 0 ? `(${captures.length})` : ''}
        </Text>
        {captures.length === 0 ? (
          <Text style={styles.emptyText}>No captures.</Text>
        ) : (
          captures.map((c) => (
            <CaptureRow key={`${c.player}-${c.moveNumber}`} event={c} variant={variant} />
          ))
        )}
        {captures.length > 0 ? (
          <Text style={styles.subtotalLine}>
            Captures subtotal: {formatScore(variant, captureSubtotal)}
          </Text>
        ) : null}
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>End-of-match bank</Text>
        {!bank || bank.chips.length === 0 ? (
          <Text style={styles.emptyText}>No chips remaining.</Text>
        ) : (
          <>
            {bank.chips.map((chip, i) => (
              <BankChipRow key={i} chip={chip} variant={variant} />
            ))}
            <Text style={styles.subtotalLine}>
              Bank subtotal: {formatScore(variant, bankSubtotal)}
            </Text>
          </>
        )}
      </View>

      <View style={styles.finalLine}>
        <Text style={styles.finalLineLeft}>
          {formatScore(variant, captureSubtotal)} (captures)
          {'  +  '}
          {formatScore(variant, bankSubtotal)} (bank)
        </Text>
        <Text style={styles.finalLineEq}>=</Text>
        <Text style={styles.finalLineRight}>{formatScoreWithUnit(variant, finalScore)}</Text>
      </View>
    </>
  );
}

// --- Column breakdown, used by Electro / THI / Thermo ---------------------

// Decide which breakdown column a capture event belongs to:
//   · Valid capture → prefer the result's unit (Thermo's g / °C / g·°C),
//     otherwise fall back to the taker's chip column.
//   · NS capture    → the taker's chip column ("whoever attempted the take").
function captureColumnFor(
  variant: GameVariant,
  event: CaptureEvent,
): string | null {
  const meta = VARIANTS[variant];
  if (!event.isNoScore && event.unit) return event.unit;
  return meta.chipColumn(event.taker.label);
}

function ColumnBreakdown({
  variant,
  columns,
  captures,
  bank,
  finalScore,
}: {
  variant: GameVariant;
  columns: readonly string[];
  captures: CaptureEvent[];
  bank: BankEvent | undefined;
  finalScore: number;
}) {
  const meta = VARIANTS[variant];

  // Group captures + bank rows into their respective columns.
  const colCaptures: Record<string, CaptureEvent[]> = Object.fromEntries(
    columns.map((c) => [c, [] as CaptureEvent[]]),
  );
  const colBank: Record<string, BankEvent['chips']> = Object.fromEntries(
    columns.map((c) => [c, [] as BankEvent['chips']]),
  );

  for (const ev of captures) {
    const col = captureColumnFor(variant, ev);
    if (col && col in colCaptures) colCaptures[col].push(ev);
  }
  for (const chip of bank?.chips ?? []) {
    const col = meta.chipColumn(chip.label);
    if (col && col in colBank) colBank[col].push(chip);
  }

  const columnSubtotals: Record<string, number> = Object.fromEntries(
    columns.map((col) => {
      const capSum = colCaptures[col].reduce((s, e) => s + e.delta, 0);
      const bankSum = colBank[col].reduce((s, c) => s + c.contribution, 0);
      return [col, capSum + bankSum];
    }),
  );

  return (
    <>
      {columns.map((col) => (
        <ColumnSection
          key={col}
          variant={variant}
          column={col}
          captures={colCaptures[col]}
          chips={colBank[col]}
          subtotal={columnSubtotals[col]}
        />
      ))}

      <GrandTotalRow
        variant={variant}
        columns={columns}
        columnSubtotals={columnSubtotals}
        finalScore={finalScore}
      />
    </>
  );
}

function ColumnSection({
  variant,
  column,
  captures,
  chips,
  subtotal,
}: {
  variant: GameVariant;
  column: string;
  captures: CaptureEvent[];
  chips: BankEvent['chips'];
  subtotal: number;
}) {
  const captureSum = captures.reduce((s, e) => s + e.delta, 0);
  const bankSum = chips.reduce((s, c) => s + c.contribution, 0);
  const isEmpty = captures.length === 0 && chips.length === 0;

  return (
    <View style={styles.block}>
      <View style={styles.columnHeader}>
        <Text style={styles.blockTitle}>{column.toUpperCase()} column</Text>
        <Text style={styles.columnSubtotal}>
          {formatScore(variant, subtotal)}
        </Text>
      </View>

      {isEmpty ? (
        <Text style={styles.emptyText}>No activity in this column.</Text>
      ) : (
        <>
          {captures.length > 0 ? (
            <>
              <Text style={styles.columnGroupTitle}>Captures</Text>
              {captures.map((c) => (
                <CaptureRow
                  key={`${c.player}-${c.moveNumber}`}
                  event={c}
                  variant={variant}
                />
              ))}
              <Text style={styles.subtotalLine}>
                Captures: {formatScore(variant, captureSum)}
              </Text>
            </>
          ) : null}
          {chips.length > 0 ? (
            <>
              <Text style={styles.columnGroupTitle}>Remaining chips</Text>
              {chips.map((chip, i) => (
                <BankChipRow key={i} chip={chip} variant={variant} />
              ))}
              <Text style={styles.subtotalLine}>
                Bank: {formatScore(variant, bankSum)}
              </Text>
            </>
          ) : null}
        </>
      )}
    </View>
  );
}

function GrandTotalRow({
  variant,
  columns,
  columnSubtotals,
  finalScore,
}: {
  variant: GameVariant;
  columns: readonly string[];
  columnSubtotals: Record<string, number>;
  finalScore: number;
}) {
  // Thermo's final isn't a simple sum: (g + °C) × g·°C, falling back to g + °C
  // when there's no g·°C. Every other column-based variant just sums.
  const isThermo = variant === 'thermo';
  const g = columnSubtotals['g'] ?? 0;
  const c = columnSubtotals['°C'] ?? 0;
  const gc = columnSubtotals['g·°C'] ?? 0;

  return (
    <View style={styles.finalLine}>
      <Text style={styles.finalLineLeft}>
        {isThermo ? (
          gc > 0 ? (
            <>
              ({formatScore(variant, g)}
              <Text style={styles.hint}> g</Text>
              {'  +  '}
              {formatScore(variant, c)}
              <Text style={styles.hint}> °C</Text>)
              {'  ×  '}
              {formatScore(variant, gc)}
              <Text style={styles.hint}> g·°C</Text>
            </>
          ) : (
            <>
              {formatScore(variant, g)}
              <Text style={styles.hint}> g</Text>
              {'  +  '}
              {formatScore(variant, c)}
              <Text style={styles.hint}> °C</Text>
            </>
          )
        ) : (
          columns.map((col, i) => (
            <React.Fragment key={col}>
              {i > 0 ? '  +  ' : ''}
              {formatScore(variant, columnSubtotals[col] ?? 0)}
              <Text style={styles.hint}> {col}</Text>
            </React.Fragment>
          ))
        )}
      </Text>
      <Text style={styles.finalLineEq}>=</Text>
      <Text style={styles.finalLineRight}>
        {formatScoreWithUnit(variant, finalScore)}
      </Text>
    </View>
  );
}

function CaptureRow({
  event,
  variant,
}: {
  event: CaptureEvent;
  variant: GameVariant;
}) {
  // × 2 or × 4 bonus annotation for the math line.
  let bonusHint: string | null = null;
  if (event.captureMultiplier === 4) bonusHint = 'dama × dama';
  else if (event.captureMultiplier === 2) {
    bonusHint = event.taker.isDama ? 'dama takes' : 'takes dama';
  }

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.moveNum}>#{event.moveNumber}</Text>
        <Text style={styles.rowHead}>
          {event.taker.isDama ? 'Dama ' : ''}
          {event.taker.label}
          {'  '}
          <Text style={styles.op}>{event.operation}</Text>
          {'  '}
          {event.taken.isDama ? 'Dama ' : ''}
          {event.taken.label}
        </Text>
      </View>
      <Text style={styles.rowMath}>
        {formatChipValue(variant, event.taker.value)}
        {'  '}
        <Text style={styles.op}>{event.operation}</Text>
        {'  '}
        {formatChipValue(variant, event.taken.value)}
        {event.isNoScore ? (
          <Text>
            {'  '}
            <Text style={styles.op}>=</Text>
            {'  '}
            <Text style={styles.nsBadge}>NS</Text>{' '}
            <Text style={styles.hint}>({event.noScoreReason ?? 'no score'})</Text>
          </Text>
        ) : (
          <Text>
            {event.captureMultiplier !== 1 ? (
              <Text>
                {'  '}
                <Text style={styles.op}>×</Text> {event.captureMultiplier}{' '}
                <Text style={styles.hint}>({bonusHint})</Text>
              </Text>
            ) : null}
            {'  '}
            <Text style={styles.op}>=</Text>
            {'  '}
            <Text style={styles.rowDelta}>
              {formatScore(variant, event.delta)}
              {event.unit ? ` ${event.unit}` : ''}
            </Text>
          </Text>
        )}
      </Text>
    </View>
  );
}

function BankChipRow({
  chip,
  variant,
}: {
  chip: BankEvent['chips'][number];
  variant: GameVariant;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowHead}>
        {chip.isDama ? 'Dama ' : ''}
        {chip.label}
      </Text>
      <Text style={styles.rowMath}>
        {formatChipValue(variant, chip.baseValue)}
        {chip.isDama ? (
          <Text>
            {'  '}
            <Text style={styles.op}>×</Text> 2 <Text style={styles.hint}>(dama)</Text>
          </Text>
        ) : null}
        {'  '}
        <Text style={styles.op}>=</Text>
        {'  '}
        <Text style={styles.rowDelta}>{formatChipValue(variant, chip.contribution)}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f4f5f7' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ececec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },

  player: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  playerHeader: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playerLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
    flex: 1,
  },
  finalBadge: {
    backgroundColor: '#ffffff22',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'flex-end',
  },
  finalBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffffaa',
    letterSpacing: 0.6,
  },
  finalBadgeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  winnerBadge: {
    backgroundColor: '#ffd87a',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  winnerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8a5a00',
    letterSpacing: 0.6,
  },

  block: {
    padding: 14,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ececec',
  },
  blockTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 0.8,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  columnSubtotal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2c3e50',
    fontVariant: ['tabular-nums'],
  },
  columnGroupTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  emptyText: { fontSize: 13, color: '#999', fontStyle: 'italic' },
  subtotalLine: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    marginTop: 4,
  },

  row: {
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f7f8fa',
    borderRadius: 8,
  },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  moveNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    fontVariant: ['tabular-nums'],
  },
  rowHead: { fontSize: 13, fontWeight: '600', color: '#111' },
  rowMath: {
    fontSize: 12,
    color: '#444',
    fontVariant: ['tabular-nums'],
  },
  op: { fontWeight: '700', color: '#2c3e50' },
  hint: { color: '#888', fontStyle: 'italic' },
  rowDelta: { fontWeight: '700', color: '#111' },
  nsBadge: {
    fontWeight: '800',
    color: '#b03a2e',
    letterSpacing: 0.6,
  },

  finalLine: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ececec',
    backgroundColor: '#fafbfc',
  },
  finalLineLeft: {
    flex: 1,
    fontSize: 12,
    color: '#555',
    fontVariant: ['tabular-nums'],
  },
  finalLineEq: { fontSize: 14, fontWeight: '700', color: '#2c3e50' },
  finalLineRight: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
    fontVariant: ['tabular-nums'],
  },

  legend: {
    backgroundColor: '#eef1f5',
    padding: 14,
    borderRadius: 12,
  },
  legendText: { fontSize: 12, color: '#555', lineHeight: 17 },
});
