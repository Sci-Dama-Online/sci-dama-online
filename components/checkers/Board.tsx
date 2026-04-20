import { StyleSheet, View } from 'react-native';

import { BOARD_SIZE, getSquareOperation, isDarkSquare, posEquals } from '@/game/rules';
import type { GameState } from '@/game/types';
import { VARIANTS } from '@/game/variants';

import { Square } from './Square';

type Props = {
  state: GameState;
  size: number;
  onSquarePress: (r: number, c: number) => void;
};

const BORDER_WIDTH = 6;

export function Board({ state, size, onSquarePress }: Props) {
  const squareSize = size / BOARD_SIZE;
  const palette = VARIANTS[state.variant].palette;

  return (
    <View style={[styles.frame, { padding: BORDER_WIDTH, backgroundColor: palette.frame }]}>
      <View style={{ width: size, height: size }}>
        {state.board.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((cell, c) => {
              const dark = isDarkSquare(r, c);
              const selected = posEquals(state.selected, [r, c]);
              const isLegalTarget = state.legalTargets.some((m) =>
                posEquals(m.to, [r, c]),
              );
              return (
                <Square
                  key={c}
                  cell={cell}
                  dark={dark}
                  size={squareSize}
                  operation={getSquareOperation(r, c)}
                  selected={selected}
                  isLegalTarget={isLegalTarget}
                  palette={palette}
                  onPress={() => onSquarePress(r, c)}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#4e2e1e',
  },
  row: {
    flexDirection: 'row',
    flex: 1,
  },
});
