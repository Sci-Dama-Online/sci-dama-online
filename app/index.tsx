import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Board } from '@/components/checkers/Board';
import {
  applyMove,
  getLegalMovesForPiece,
  initialState,
  posEquals,
} from '@/game/rules';
import type { GameState, Move } from '@/game/types';

function formatScore(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return rounded.toString();
}

export default function GameScreen() {
  const [state, setState] = useState<GameState>(initialState);
  const { width, height } = useWindowDimensions();
  const boardSize = useMemo(
    () => Math.floor(Math.min(width, height) * 0.88),
    [width, height],
  );

  function handleSquarePress(r: number, c: number) {
    if (state.winner) return;

    if (state.selected) {
      const move = state.legalTargets.find((m) => posEquals(m.to, [r, c]));
      if (move) {
        setState(applyMove(state, move));
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
    setState(initialState());
  }

  const turnLabel = state.turn === 'red' ? "Red's turn" : "Black's turn";
  const turnColor = state.turn === 'red' ? '#c0392b' : '#1e1e1e';

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fafafa',
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
  scoreTopLeft: {
    top: 0,
    left: 0,
  },
  scoreBottomRight: {
    bottom: 0,
    right: 0,
  },
  scoreBlack: {
    backgroundColor: '#1e1e1e',
  },
  scoreRed: {
    backgroundColor: '#c0392b',
  },
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
