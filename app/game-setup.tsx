import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  formatTimer,
  TIMER_OPTIONS,
  VARIANTS,
  type GameVariant,
  type TimerOption,
  type VariantMeta,
} from '@/game/variants';

export default function GameSetupModal() {
  const router = useRouter();
  const [variant, setVariant] = useState<GameVariant>('electro');
  const [timer, setTimer] = useState<TimerOption>(null);
  const variants = Object.values(VARIANTS);

  function start() {
    router.replace({
      pathname: '/game',
      params: { variant, timer: timer === null ? 'none' : String(timer) },
    });
  }

  function close() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/index');
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>New Game</Text>
          <Text style={styles.subtitle}>Pick a variant and a clock.</Text>
        </View>
        <Pressable onPress={close} style={styles.closeBtn} accessibilityLabel="Close">
          <Ionicons name="close" size={22} color="#333" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionLabel}>VARIANT</Text>
        <View style={styles.grid}>
          {variants.map((v) => (
            <VariantCard
              key={v.id}
              meta={v}
              selected={variant === v.id}
              onPress={() => v.available && setVariant(v.id)}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>TIMER</Text>
        <View style={styles.timerRow}>
          {TIMER_OPTIONS.map((opt) => {
            const active = timer === opt;
            return (
              <Pressable
                key={String(opt)}
                onPress={() => setTimer(opt)}
                style={[styles.timerChip, active && styles.timerChipActive]}
              >
                <Text style={[styles.timerText, active && styles.timerTextActive]}>
                  {formatTimer(opt)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>Official matches are capped at 20 minutes.</Text>

        <Pressable
          onPress={start}
          style={[styles.startBtn, { backgroundColor: VARIANTS[variant].palette.accent }]}
        >
          <Text style={styles.startText}>Start Game</Text>
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
        styles.card,
        { borderColor: selected ? meta.palette.accent : '#2a2a2a' },
        disabled && styles.cardDisabled,
      ]}
    >
      <View style={[styles.swatch, { backgroundColor: meta.palette.boardDarkFrom }]}>
        <View style={[styles.swatchTile, { backgroundColor: meta.palette.boardLightTo }]} />
      </View>
      <Text style={styles.cardName}>{meta.name}</Text>
      <Text style={styles.cardTag} numberOfLines={2}>
        {meta.tagline}
      </Text>
      {disabled ? (
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>COMING SOON</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fafafa' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: { fontSize: 30, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ececec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: 20, paddingTop: 0, gap: 12 },
  sectionLabel: {
    marginTop: 12,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#777',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47.5%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 14,
    borderWidth: 2,
    gap: 8,
  },
  cardDisabled: { opacity: 0.55 },
  swatch: {
    height: 56,
    borderRadius: 8,
    padding: 6,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  swatchTile: { width: 16, height: 16, borderRadius: 3 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#111' },
  cardTag: { fontSize: 11, color: '#666', lineHeight: 14 },
  soonBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  soonText: { fontSize: 9, fontWeight: '700', color: '#666', letterSpacing: 0.6 },
  timerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timerChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d9d9d9',
  },
  timerChipActive: { backgroundColor: '#2c3e50', borderColor: '#2c3e50' },
  timerText: { fontSize: 13, fontWeight: '600', color: '#444' },
  timerTextActive: { color: '#fff' },
  hint: { fontSize: 11, color: '#888', fontStyle: 'italic' },
  startBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  startText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});
