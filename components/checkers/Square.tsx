import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Operation } from '@/game/rules';
import type { Cell } from '@/game/types';

import { Piece } from './Piece';

type Props = {
  cell: Cell;
  dark: boolean;
  size: number;
  operation: Operation | null;
  selected: boolean;
  isLegalTarget: boolean;
  onPress: () => void;
};

export function Square({
  cell,
  dark,
  size,
  operation,
  selected,
  isLegalTarget,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.square,
        { width: size, height: size },
        !dark && styles.lightSquare,
        selected && styles.selected,
      ]}
    >
      {dark ? (
        <LinearGradient
          colors={['#1b5e20', '#0b2e10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {operation ? (
        <Text style={[styles.operation, { fontSize: size * 0.5 }]}>
          {operation}
        </Text>
      ) : null}
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
    overflow: 'hidden',
  },
  lightSquare: {
    backgroundColor: '#f0d9b5',
  },
  selected: {
    borderWidth: 3,
    borderColor: '#f1c40f',
  },
  operation: {
    color: 'rgba(40, 40, 40, 0.75)',
    fontWeight: '700',
  },
  target: {
    position: 'absolute',
    backgroundColor: 'rgba(46, 204, 113, 0.7)',
  },
});
