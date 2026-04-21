import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Board } from '@/components/checkers/Board';
import {
  applyMove,
  getLegalMovesForPiece,
  initialState,
  posEquals,
  winnerByScore,
} from '@/game/rules';
import type { GameState, Move } from '@/game/types';
import {
  formatTimer,
  TIMER_OPTIONS,
  VARIANTS,
  type GameVariant,
  type TimerOption,
  type VariantMeta,
} from '@/game/variants';

function formatScore(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return rounded.toString();
}

function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const ss = (s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}

// Returns remaining seconds, or null if there's no timer or the clock hasn't started.
function remainingSeconds(state: GameState, now: number): number | null {
  if (state.timeLimitSeconds === null) return null;
  if (state.timerStartedAtMs === null) return state.timeLimitSeconds;
  const elapsed = (now - state.timerStartedAtMs) / 1000;
  return Math.max(0, state.timeLimitSeconds - elapsed);
}

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);

  if (!gameState) {
    return (
      <PreGame
        onStart={(variant, timer) => setGameState(initialState(variant, timer))}
      />
    );
  }

  return (
    <GameView
      state={gameState}
      setState={setGameState}
      onExit={() => setGameState(null)}
    />
  );
}

// --- Pre-game: pick variant + timer ----------------------------------------

type PreGameProps = {
  onStart: (variant: GameVariant, timer: TimerOption) => void;
};

function PreGame({ onStart }: PreGameProps) {
  const [variant, setVariant] = useState<GameVariant>('electro');
  const [timer, setTimer] = useState<TimerOption>(null);
  const variants = Object.values(VARIANTS);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={preStyles.scroll}>
        <View style={preStyles.header}>
          <Text style={preStyles.title}>Sci Dama</Text>
          <Text style={preStyles.subtitle}>Pick a variant and a clock.</Text>
        </View>

        <Text style={preStyles.sectionLabel}>VARIANT</Text>
        <View style={preStyles.grid}>
          {variants.map((v) => (
            <VariantCard
              key={v.id}
              meta={v}
              selected={variant === v.id}
              onPress={() => v.available && setVariant(v.id)}
            />
          ))}
        </View>

        <Text style={preStyles.sectionLabel}>TIMER</Text>
        <View style={preStyles.timerRow}>
          {TIMER_OPTIONS.map((opt) => {
            const active = timer === opt;
            return (
              <Pressable
                key={String(opt)}
                onPress={() => setTimer(opt)}
                style={[preStyles.timerChip, active && preStyles.timerChipActive]}
              >
                <Text style={[preStyles.timerText, active && preStyles.timerTextActive]}>
                  {formatTimer(opt)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={preStyles.hint}>Official matches are capped at 20 minutes.</Text>

        <Pressable
          onPress={() => onStart(variant, timer)}
          style={[preStyles.startBtn, { backgroundColor: VARIANTS[variant].palette.accent }]}
        >
          <Text style={preStyles.startText}>Start Game</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function VariantCard({
  meta,
  selected,
  onPress,
}: {
  meta: VariantMeta;
  selected: boolean;
  onPress: () => void;
}) {
  const disabled = !meta.available;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        preStyles.card,
        { borderColor: selected ? meta.palette.accent : '#2a2a2a' },
        disabled && preStyles.cardDisabled,
      ]}
    >
      <View style={[preStyles.swatch, { backgroundColor: meta.palette.boardDarkFrom }]}>
        <View style={[preStyles.swatchTile, { backgroundColor: meta.palette.boardLightTo }]} />
      </View>
      <Text style={preStyles.cardName}>{meta.name}</Text>
      <Text style={preStyles.cardTag} numberOfLines={2}>
        {meta.tagline}
      </Text>
      {disabled ? (
        <View style={preStyles.soonBadge}>
          <Text style={preStyles.soonText}>COMING SOON</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

// --- Game view (the playable board) ----------------------------------------

type GameViewProps = {
  state: GameState;
  setState: (state: GameState) => void;
  onExit: () => void;
};

function GameView({ state, setState, onExit }: GameViewProps) {
  const { width, height } = useWindowDimensions();
  const boardSize = useMemo(
    () => Math.floor(Math.min(width, height) * 0.88),
    [width, height],
  );

  // `now` ticks every 500ms so the clock display refreshes. The match state
  // itself doesn't change — we only recompute remaining seconds at render time.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const remaining = remainingSeconds(state, now);

  // Timeout: when the clock hits zero, end the match by score.
  useEffect(() => {
    if (state.winner) return;
    if (remaining === null) return;
    if (remaining > 0) return;
    setState({ ...state, winner: winnerByScore(state.scores) });
  }, [remaining, state, setState]);

  function handleSquarePress(r: number, c: number) {
    if (state.winner) return;

    if (state.selected) {
      const move = state.legalTargets.find((m) => posEquals(m.to, [r, c]));
      if (move) {
        const next = applyMove(state, move);
        // First real move starts the match clock.
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

  const turnLabel = state.turn === 'red' ? "Red's turn" : "Black's turn";
  const turnColor = state.turn === 'red' ? '#c0392b' : '#1e1e1e';
  const meta = VARIANTS[state.variant];
  const clockRunning = state.timerStartedAtMs !== null && !state.winner;
  const clockLowTime = remaining !== null && remaining <= 30 && clockRunning;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={onExit} style={styles.exitBtn}>
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
          <View style={[styles.scorePill, styles.scoreBlack, styles.scoreTopLeft]}>
            <Text style={styles.scoreLabel}>Black</Text>
            <Text style={styles.scoreValue}>{formatScore(state.scores.black)}</Text>
          </View>
          <Board state={state} size={boardSize} onSquarePress={handleSquarePress} />
          <View style={[styles.scorePill, styles.scoreRed, styles.scoreBottomRight]}>
            <Text style={styles.scoreLabel}>Red</Text>
            <Text style={styles.scoreValue}>{formatScore(state.scores.red)}</Text>
          </View>
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
              Red {formatScore(state.scores.red)} · Black {formatScore(state.scores.black)}
            </Text>
            <Pressable onPress={restart} style={styles.button}>
              <Text style={styles.buttonText}>Play again</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

// --- Styles ---------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  exitBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  exitText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  variantPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  variantPillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#e5e5e5',
  },
  timerPillLive: {
    backgroundColor: '#111',
  },
  timerPillLow: {
    backgroundColor: '#7a1c14',
  },
  timerPillIcon: {
    color: '#333',
    fontSize: 12,
  },
  timerPillIconLight: {
    color: '#fff',
  },
  timerPillText: {
    color: '#333',
    fontSize: 11,
    fontWeight: '600',
  },
  timerPillClock: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  timerPillClockIdle: {
    color: '#333',
  },
  timerPillClockLow: {
    color: '#ffd2c9',
  },
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
  bannerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  hint: {
    marginLeft: 8,
    fontSize: 12,
    color: '#555',
    fontStyle: 'italic',
  },
  boardWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreFrame: {
    paddingVertical: 36,
    position: 'relative',
  },
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
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#2c3e50',
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
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
  winnerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  winnerSub: {
    fontSize: 14,
    color: '#555',
  },
});

const preStyles = StyleSheet.create({
  scroll: {
    padding: 20,
    gap: 12,
  },
  header: {
    marginTop: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  sectionLabel: {
    marginTop: 12,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#777',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47.5%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 14,
    borderWidth: 2,
    gap: 8,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  swatch: {
    height: 56,
    borderRadius: 8,
    padding: 6,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  swatchTile: {
    width: 16,
    height: 16,
    borderRadius: 3,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  cardTag: {
    fontSize: 11,
    color: '#666',
    lineHeight: 14,
  },
  soonBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  soonText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 0.6,
  },
  timerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timerChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d9d9d9',
  },
  timerChipActive: {
    backgroundColor: '#2c3e50',
    borderColor: '#2c3e50',
  },
  timerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  timerTextActive: {
    color: '#fff',
  },
  hint: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
  },
  startBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  startText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
