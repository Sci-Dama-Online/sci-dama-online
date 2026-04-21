import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Board } from '@/components/checkers/Board';
import { ScoreBreakdown } from '@/components/score/ScoreBreakdown';
import {
  applyMove,
  endGame,
  getLegalMovesForPiece,
  initialState,
  posEquals,
} from '@/game/rules';
import type { GameState, Move, Player } from '@/game/types';
import {
  TIMER_OPTIONS,
  VARIANTS,
  type GameVariant,
  type TimerOption,
} from '@/game/variants';
import { formatScore, toFullDecimal, toSciNotation } from '@/lib/format';

function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const ss = (s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}

function remainingSeconds(state: GameState, now: number): number | null {
  if (state.timeLimitSeconds === null) return null;
  if (state.timerStartedAtMs === null) return state.timeLimitSeconds;
  const elapsed = (now - state.timerStartedAtMs) / 1000;
  return Math.max(0, state.timeLimitSeconds - elapsed);
}

function parseVariant(value: string | string[] | undefined): GameVariant {
  const v = Array.isArray(value) ? value[0] : value;
  if (v && v in VARIANTS) return v as GameVariant;
  return 'electro';
}

function parseTimer(value: string | string[] | undefined): TimerOption {
  const v = Array.isArray(value) ? value[0] : value;
  if (v === undefined || v === 'none') return null;
  const n = Number(v);
  return (TIMER_OPTIONS as readonly (number | null)[]).includes(n)
    ? (n as TimerOption)
    : null;
}

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ variant?: string; timer?: string }>();
  const initialVariant = parseVariant(params.variant);
  const initialTimer = parseTimer(params.timer);

  const [state, setState] = useState<GameState>(() =>
    initialState(initialVariant, initialTimer),
  );
  // Which score pill the player has tapped open, or null.
  const [expandedScore, setExpandedScore] = useState<Player | null>(null);
  // Post-game breakdown modal visibility.
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const { width, height } = useWindowDimensions();
  const boardSize = useMemo(
    () => Math.floor(Math.min(width, height) * 0.88),
    [width, height],
  );

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const remaining = remainingSeconds(state, now);

  useEffect(() => {
    if (state.winner) return;
    if (remaining === null) return;
    if (remaining > 0) return;
    const ended = endGame(state.variant, state.board, state.scores);
    setState({
      ...state,
      scores: ended.scores,
      winner: ended.winner,
      scoreLog: [...state.scoreLog, ...ended.bankEvents],
    });
  }, [remaining, state]);

  function handleSquarePress(r: number, c: number) {
    if (state.winner) return;

    if (state.selected) {
      const move = state.legalTargets.find((m) => posEquals(m.to, [r, c]));
      if (move) {
        const next = applyMove(state, move);
        if (next.timerStartedAtMs === null) {
          next.timerStartedAtMs = Date.now();
        }
        setState(next);
        return;
      }
    }

    if (state.forcedPiece) return;

    const cell = state.board[r][c];
    if (!cell || cell.player !== state.turn) return;

    const moves: Move[] = getLegalMovesForPiece(
      state.board,
      r,
      c,
      state.mustCapture,
    );
    if (moves.length === 0) return;

    setState({ ...state, selected: [r, c], legalTargets: moves });
  }

  function restart() {
    setState(initialState(state.variant, state.timeLimitSeconds));
  }

  function exit() {
    router.replace('/(tabs)/index');
  }

  const turnLabel = state.turn === 'red' ? "Red's turn" : "Black's turn";
  const turnColor = state.turn === 'red' ? '#c0392b' : '#1e1e1e';
  const meta = VARIANTS[state.variant];
  const clockRunning = state.timerStartedAtMs !== null && !state.winner;
  const clockLowTime = remaining !== null && remaining <= 30 && clockRunning;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={exit} style={styles.exitBtn}>
          <Text style={styles.exitText}>← Change game</Text>
        </Pressable>
        <View style={styles.badges}>
          <View style={[styles.variantPill, { backgroundColor: meta.palette.accent }]}>
            <Text style={styles.variantPillText}>{meta.name}</Text>
          </View>
          {state.timeLimitSeconds === null ? (
            <View style={styles.timerPill}>
              <Text style={styles.timerPillIcon}>∞</Text>
              <Text style={styles.timerPillText}>No timer</Text>
            </View>
          ) : (
            <View
              style={[
                styles.timerPill,
                clockRunning && styles.timerPillLive,
                clockLowTime && styles.timerPillLow,
              ]}
            >
              <Text
                style={[
                  styles.timerPillIcon,
                  clockRunning && styles.timerPillIconLight,
                ]}
              >
                ⏱
              </Text>
              <Text
                style={[
                  styles.timerPillClock,
                  !clockRunning && styles.timerPillClockIdle,
                  clockLowTime && styles.timerPillClockLow,
                ]}
              >
                {formatClock(remaining ?? state.timeLimitSeconds)}
              </Text>
              {!clockRunning ? (
                <Text style={styles.timerPillHint}>· starts on 1st move</Text>
              ) : null}
            </View>
          )}
        </View>
      </View>

      <View style={styles.banner}>
        <View style={[styles.turnDot, { backgroundColor: turnColor }]} />
        <Text style={styles.bannerText}>{turnLabel}</Text>
        {state.mustCapture && !state.winner ? (
          <Text style={styles.hint}>Capture required</Text>
        ) : null}
      </View>

      <View style={styles.boardWrap}>
        <View style={styles.scoreFrame}>
          <Pressable
            onPress={() => setExpandedScore('black')}
            style={[styles.scorePill, styles.scoreBlack, styles.scoreTopLeft]}
          >
            <Text style={styles.scoreLabel}>Black</Text>
            <Text style={styles.scoreValue} numberOfLines={1}>
              {formatScore(state.variant, state.scores.black)}
            </Text>
          </Pressable>
          <Board state={state} size={boardSize} onSquarePress={handleSquarePress} />
          <Pressable
            onPress={() => setExpandedScore('red')}
            style={[styles.scorePill, styles.scoreRed, styles.scoreBottomRight]}
          >
            <Text style={styles.scoreLabel}>Red</Text>
            <Text style={styles.scoreValue} numberOfLines={1}>
              {formatScore(state.variant, state.scores.red)}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable onPress={restart} style={styles.button}>
          <Text style={styles.buttonText}>Restart</Text>
        </Pressable>
      </View>

      {state.winner ? (
        <View style={styles.winnerOverlay} pointerEvents="box-none">
          <View style={styles.winnerCard}>
            <Text style={styles.winnerTitle}>
              {state.winner === 'tie'
                ? 'Tie game'
                : state.winner === 'red'
                  ? 'Red wins!'
                  : 'Black wins!'}
            </Text>
            <Text style={styles.winnerSub}>
              Red {formatScore(state.variant, state.scores.red)} · Black{' '}
              {formatScore(state.variant, state.scores.black)}
            </Text>
            <Text style={styles.winnerFootnote}>
              Lower score wins. Remaining chips are banked.
            </Text>
            <Pressable
              onPress={() => setBreakdownOpen(true)}
              style={styles.breakdownBtn}
            >
              <Text style={styles.breakdownBtnText}>
                See how the score was computed →
              </Text>
            </Pressable>
            <Pressable onPress={restart} style={styles.button}>
              <Text style={styles.buttonText}>Play again</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <ScoreExpandSheet
        visible={expandedScore !== null}
        player={expandedScore}
        variant={state.variant}
        scores={state.scores}
        onClose={() => setExpandedScore(null)}
      />

      <ScoreBreakdown
        visible={breakdownOpen}
        onClose={() => setBreakdownOpen(false)}
        variant={state.variant}
        scoreLog={state.scoreLog}
        scores={state.scores}
        winner={state.winner}
      />
    </SafeAreaView>
  );
}

// Tiny bottom sheet triggered by tapping a score pill. Shows the current
// score in both scientific notation and full decimal form so the player can
// see the exact number behind the compact display.
function ScoreExpandSheet({
  visible,
  player,
  variant,
  scores,
  onClose,
}: {
  visible: boolean;
  player: Player | null;
  variant: GameVariant;
  scores: GameState['scores'];
  onClose: () => void;
}) {
  const score = player ? scores[player] : 0;
  const label = player === 'red' ? 'Red' : 'Black';
  const accent = player === 'red' ? '#c0392b' : '#1e1e1e';
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheetCard} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.sheetLabel, { backgroundColor: accent }]}>
            <Text style={styles.sheetLabelText}>{label} score</Text>
          </View>
          <Text style={styles.sheetSci}>{toSciNotation(score)}</Text>
          <Text style={styles.sheetDecimal}>{toFullDecimal(score)}</Text>
          <Text style={styles.sheetHint}>
            {variant === 'sci_notation'
              ? 'Shown in the pill as scientific notation (3 sig figs).'
              : 'Shown in the pill rounded to 2 decimals.'}
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fafafa' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  exitBtn: { paddingVertical: 6, paddingHorizontal: 8 },
  exitText: { color: '#333', fontSize: 14, fontWeight: '500' },
  badges: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  variantPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  variantPillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#e5e5e5',
  },
  timerPillLive: { backgroundColor: '#111' },
  timerPillLow: { backgroundColor: '#7a1c14' },
  timerPillIcon: { color: '#333', fontSize: 12 },
  timerPillIconLight: { color: '#fff' },
  timerPillText: { color: '#333', fontSize: 11, fontWeight: '600' },
  timerPillClock: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  timerPillClockIdle: { color: '#333' },
  timerPillClockLow: { color: '#ffd2c9' },
  timerPillHint: {
    color: '#666',
    fontSize: 10,
    fontStyle: 'italic',
    marginLeft: 2,
  },
  banner: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  turnDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#333',
  },
  bannerText: { fontSize: 18, fontWeight: '600', color: '#111' },
  hint: {
    marginLeft: 8,
    fontSize: 12,
    color: '#555',
    fontStyle: 'italic',
  },
  boardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scoreFrame: { paddingVertical: 36, position: 'relative' },
  scorePill: {
    position: 'absolute',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 90,
  },
  scoreTopLeft: { top: 0, left: 0 },
  scoreBottomRight: { bottom: 0, right: 0 },
  scoreBlack: { backgroundColor: '#1e1e1e' },
  scoreRed: { backgroundColor: '#c0392b' },
  scoreLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  footer: { paddingVertical: 16, alignItems: 'center' },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#2c3e50',
    borderRadius: 6,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  winnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  winnerCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 10,
    alignItems: 'center',
    gap: 16,
    minWidth: 220,
  },
  winnerTitle: { fontSize: 22, fontWeight: '700', color: '#111' },
  winnerSub: { fontSize: 14, color: '#555' },
  winnerFootnote: { fontSize: 11, color: '#888', fontStyle: 'italic' },
  breakdownBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#eef1f5',
  },
  breakdownBtnText: {
    color: '#2c3e50',
    fontSize: 13,
    fontWeight: '600',
  },

  // Score pill tap-to-expand sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheetCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 10,
    alignItems: 'stretch',
  },
  sheetLabel: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  sheetLabelText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sheetSci: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    fontVariant: ['tabular-nums'],
  },
  sheetDecimal: {
    fontSize: 14,
    color: '#555',
    fontVariant: ['tabular-nums'],
  },
  sheetHint: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
  },
});
