import { StyleSheet, Text, View } from 'react-native';

import type { Piece as PieceType } from '@/game/types';

type Props = {
  piece: PieceType;
  size: number;
};

export function Piece({ piece, size }: Props) {
  const diameter = size * 0.78;
  const backgroundColor = piece.player === 'red' ? '#c0392b' : '#1e1e1e';
  const borderColor = piece.player === 'red' ? '#7d1f14' : '#000';
  const fontSize = diameter * 0.45;

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
        },
      ]}
    >
      {piece.kind === 'king' ? (
        <Text style={[styles.crown, { fontSize }]}>K</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crown: {
    color: '#fff',
    fontWeight: '700',
  },
});
