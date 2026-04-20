import { StyleSheet, Text, View } from 'react-native';

import type { Piece as PieceType } from '@/game/types';

type Props = {
  piece: PieceType;
  size: number;
};

export function Piece({ piece, size }: Props) {
  const diameter = size * 0.88;
  const backgroundColor = piece.player === 'red' ? '#c0392b' : '#1e1e1e';
  const isKing = piece.kind === 'king';
  const borderColor = isKing
    ? '#f1c40f'
    : piece.player === 'red'
      ? '#7d1f14'
      : '#000';
  const borderWidth = isKing ? 3 : 2;

  const len = piece.label.length;
  const fontSize = len >= 5 ? diameter * 0.22 : len === 4 ? diameter * 0.26 : diameter * 0.32;

  return (
    <View
      style={[
        styles.chip,
        {
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          backgroundColor,
          borderColor,
          borderWidth,
        },
      ]}
    >
      <Text style={[styles.label, { fontSize }]} numberOfLines={1}>
        {piece.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#fff',
    fontWeight: '700',
  },
});
