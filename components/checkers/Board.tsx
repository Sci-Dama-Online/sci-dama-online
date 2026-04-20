import { StyleSheet, View } from 'react-native';

import { BOARD_SIZE, getSquareOperation, isDarkSquare, posEquals } from '@/game/rules';
import type { GameState } from '@/game/types';

import { Square } from './Square';

type Props = {
  state: GameState;
  size: number;
  onSquarePress: (r: number, c: number) => void;
};

export function Board({ state, size, onSquarePress }: Props) {
  const squareSize = size / BOARD_SIZE;

  return (
    <View style={[styles.board, { width: size, height: size }]}>
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
                onPress={() => onSquarePress(r, c)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    borderWidth: 4,
    borderColor: '#4e2e1e',
  },
  row: {
    flexDirection: 'row',
    flex: 1,
  },
});
