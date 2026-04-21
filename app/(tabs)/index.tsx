import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VARIANTS, type GameVariant } from '@/game/variants';
import { supabase } from '@/lib/supabase';
import { tier } from '@/lib/tier';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ProfileCard />
        <PlayCard onPress={() => router.push('/game-setup')} />
        <LinkCard
          icon="help-circle"
          title="How to Play"
          subtitle="Learn rules, scoring, and strategy."
          onPress={() => router.push('/(tabs)/how-to-play')}
        />
        <RankingSection />
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileCard() {
  // Placeholder data until auth/profile is wired up.
  const username = 'Guest';
  const initial = username.charAt(0).toUpperCase();
  const rating = 0;
  const tierLabel = 'Unranked';
  const wins = 0;
  const losses = 0;

  return (
    <View style={styles.profileCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.profileInfo}>
        <Text style={styles.username}>{username}</Text>
        <Text style={styles.tier}>
          {tierLabel} · {rating} pts
        </Text>
        <Text style={styles.record}>
          {wins}W · {losses}L
        </Text>
      </View>
      <Pressable style={styles.profileAction}>
        <Ionicons name="chevron-forward" size={20} color="#888" />
      </Pressable>
    </View>
  );
}

function PlayCard({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.playCard}>
      <View style={styles.playCopy}>
        <Text style={styles.playEyebrow}>READY?</Text>
        <Text style={styles.playTitle}>Start a Match</Text>
        <Text style={styles.playSubtitle}>
          Pick a variant and a timer, then play.
        </Text>
      </View>
      <Pressable onPress={onPress} style={styles.playButton}>
        <Ionicons name="play" size={32} color="#fff" />
        <Text style={styles.playButtonText}>PLAY</Text>
      </Pressable>
    </View>
  );
}

function LinkCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.linkCard}>
      <View style={styles.linkIconWrap}>
        <Ionicons name={icon} size={22} color="#2c3e50" />
      </View>
      <View style={styles.linkCopy}>
        <Text style={styles.linkTitle}>{title}</Text>
        <Text style={styles.linkSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#888" />
    </Pressable>
  );
}

// --- Rankings --------------------------------------------------------------

type RankTab = 'overall' | GameVariant;

type Row = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  rating: number;
};

const RANK_TABS: { id: RankTab; label: string; accent: string }[] = [
  { id: 'overall', label: 'Overall', accent: '#2c3e50' },
  { id: 'electro', label: 'Electro', accent: VARIANTS.electro.palette.accent },
  { id: 'sci_notation', label: 'Sci-Notation', accent: VARIANTS.sci_notation.palette.accent },
  { id: 'thi', label: 'THI', accent: VARIANTS.thi.palette.accent },
  { id: 'thermo', label: 'Thermo', accent: VARIANTS.thermo.palette.accent },
];

async function fetchTop10(tab: RankTab): Promise<Row[]> {
  if (tab === 'overall') {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, rating')
      .order('rating', { ascending: false })
      .limit(10);
    if (error) throw error;
    return (data ?? []).map((p) => ({
      user_id: p.id,
      username: p.username,
      avatar_url: p.avatar_url,
      rating: p.rating,
    }));
  }

  // Per-variant: read the rating from variant_ratings, then hydrate usernames
  // from profiles in a second query (keeps typing simple, still one round-trip
  // of each).
  const { data: ratings, error } = await supabase
    .from('variant_ratings')
    .select('user_id, rating')
    .eq('variant', tab)
    .order('rating', { ascending: false })
    .limit(10);
  if (error) throw error;
  const list = ratings ?? [];
  if (list.length === 0) return [];

  const ids = list.map((r) => r.user_id);
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', ids);
  if (profErr) throw profErr;

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return list.map((r) => ({
    user_id: r.user_id,
    username: byId.get(r.user_id)?.username ?? 'unknown',
    avatar_url: byId.get(r.user_id)?.avatar_url ?? null,
    rating: r.rating,
  }));
}

function RankingSection() {
  const [tab, setTab] = useState<RankTab>('overall');
  const [rows, setRows] = useState<Row[] | null>(null); // null = loading

  useEffect(() => {
    let active = true;
    setRows(null);
    fetchTop10(tab)
      .then((r) => {
        if (active) setRows(r);
      })
      .catch(() => {
        if (active) setRows([]);
      });
    return () => {
      active = false;
    };
  }, [tab]);

  const activeAccent = RANK_TABS.find((t) => t.id === tab)?.accent ?? '#2c3e50';

  return (
    <View style={styles.rankCard}>
      <View style={styles.rankHeader}>
        <Ionicons name="trophy" size={18} color="#2c3e50" />
        <Text style={styles.rankTitle}>Rankings</Text>
        <Text style={styles.rankHint}>Top 10</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
      >
        {RANK_TABS.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[
                styles.tab,
                active && { backgroundColor: t.accent, borderColor: t.accent },
              ]}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.list}>
        {rows === null ? (
          <ActivityIndicator size="small" color="#888" style={styles.loader} />
        ) : rows.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="sparkles-outline" size={22} color="#b0b0b0" />
            <Text style={styles.emptyText}>No players yet — be the first!</Text>
          </View>
        ) : (
          rows.map((r, i) => (
            <RankRow key={r.user_id} rank={i + 1} row={r} accent={activeAccent} />
          ))
        )}
      </View>
    </View>
  );
}

function RankRow({ rank, row, accent }: { rank: number; row: Row; accent: string }) {
  return (
    <View style={styles.rankRow}>
      <View style={[styles.rankPill, rank <= 3 && { backgroundColor: accent }]}>
        <Text style={[styles.rankPillText, rank <= 3 && styles.rankPillTextLight]}>
          #{rank}
        </Text>
      </View>
      <View style={styles.rowAvatar}>
        <Text style={styles.rowAvatarText}>
          {(row.username.charAt(0) || '?').toUpperCase()}
        </Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>
          {row.username}
        </Text>
        <Text style={styles.rowTier}>{tier(row.rating)}</Text>
      </View>
      <Text style={styles.rowRating}>{row.rating.toLocaleString()}</Text>
    </View>
  );
}

// --- Styles ----------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f4f5f7' },
  scroll: { padding: 16, gap: 14, paddingBottom: 24 },

  // Profile
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2c3e50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  profileInfo: { flex: 1, gap: 2 },
  username: { fontSize: 18, fontWeight: '700', color: '#111' },
  tier: { fontSize: 13, color: '#555' },
  record: { fontSize: 12, color: '#888' },
  profileAction: { padding: 4 },

  // Play card
  playCard: {
    backgroundColor: '#2c3e50',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  playCopy: { flex: 1 },
  playEyebrow: {
    color: '#ffcc66',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  playTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  playSubtitle: { color: '#c7d0d9', fontSize: 13, marginTop: 4 },
  playButton: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#c0392b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff33',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 2,
  },

  // Link cards
  linkCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  linkIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eef1f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkCopy: { flex: 1, gap: 2 },
  linkTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  linkSubtitle: { fontSize: 12, color: '#666' },

  // Ranking card
  rankCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  rankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  rankTitle: { fontSize: 16, fontWeight: '700', color: '#111', flex: 1 },
  rankHint: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  tabRow: { gap: 8, paddingHorizontal: 2 },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    backgroundColor: '#fff',
  },
  tabLabel: { fontSize: 12, fontWeight: '600', color: '#555' },
  tabLabelActive: { color: '#fff' },

  list: { gap: 2, marginTop: 4 },
  loader: { paddingVertical: 24 },
  empty: {
    paddingVertical: 22,
    alignItems: 'center',
    gap: 6,
  },
  emptyText: { fontSize: 12, color: '#888' },

  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ececec',
  },
  rankPill: {
    minWidth: 34,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#f0f0f2',
    alignItems: 'center',
  },
  rankPillText: { fontSize: 11, fontWeight: '700', color: '#666' },
  rankPillTextLight: { color: '#fff' },
  rowAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2c3e50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowAvatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  rowInfo: { flex: 1, gap: 1 },
  rowName: { fontSize: 13, fontWeight: '600', color: '#111' },
  rowTier: { fontSize: 11, color: '#888' },
  rowRating: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    fontVariant: ['tabular-nums'],
  },
});
