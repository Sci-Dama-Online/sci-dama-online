import { Pressable, StyleSheet, View } from 'react-native';

import type { Cell } from '@/game/types';

import { Piece } from './Piece';

type Props = {
  cell: Cell;
  dark: boolean;
  size: number;
  selected: boolean;
  isLegalTarget: boolean;
  onPress: () => void;
};

export function Square({ cell, dark, size, selected, isLegalTarget, onPress }: Props) {
  const backgroundColor = dark ? '#b58863' : '#f0d9b5';

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.square,
        { width: size, height: size, backgroundColor },
        selected && styles.selected,
      ]}
    >
      {cell ? <Piece piece={cell} size={size} /> : null}
      {isLegalTarget ? (
        <View
          style={[
            styles.target,
            {
              width: size * 0.32,
              height: size * 0.32,
              borderRadius: size * 0.16,
            },
          ]}
          pointerEvents="none"
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  square: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    borderWidth: 3,
    borderColor: '#f1c40f',
  },
  target: {
    position: 'absolute',
    backgroundColor: 'rgba(46, 204, 113, 0.7)',
  },
});
